#!/usr/bin/env python3
"""Read-only integrity check of SecurityNoPhone's published static files."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path, PurePosixPath
from urllib.parse import quote
from urllib.request import Request, urlopen
import argparse
import hashlib
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://securitynophone.com/'
PUBLIC_DIRECTORIES = {'images', 'flags', 'js', 'includes', 'Mention legale'}
PUBLIC_ROOT_FILES = {'AGENTS.md', 'README.md', 'robots.txt', 'sitemap.xml'}


def included(name):
    path = PurePosixPath(name)
    if any(part.startswith('.') for part in path.parts):
        return False
    if path.parts[0] in PUBLIC_DIRECTORIES:
        return True
    if path.parts[0] == 'docs' and path.suffix == '.md':
        return True
    return name in PUBLIC_ROOT_FILES or (len(path.parts) == 1 and path.suffix in {'.html', '.css', '.js', '.docx'})


def check_file(item, revision):
    name, expected_hash = item
    url = SITE + quote(name, safe='/') + '?deployment-check=' + revision
    try:
        request = Request(url, headers={'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache',
                                        'User-Agent': 'SecurityNoPhone-deployment-verification/1.0'})
        digest = hashlib.sha256()
        size = 0
        with urlopen(request, timeout=30) as response:
            status = response.status
            while chunk := response.read(65536):
                size += len(chunk)
                digest.update(chunk)
        received = digest.hexdigest()
        return {'path': name, 'http_status': status, 'match': status == 200 and received == expected_hash,
                'expected_sha256': expected_hash, 'received_sha256': received, 'received_bytes': size}
    except Exception as error:
        return {'path': name, 'match': False, 'error': str(error)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inventory-only', action='store_true')
    args = parser.parse_args()
    revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    paths = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    inventory = [(name, hashlib.sha256((ROOT / name).read_bytes()).hexdigest())
                 for name in sorted(paths) if name and included(name)]
    if args.inventory_only:
        print(json.dumps({'revision': revision, 'file_count': len(inventory),
                          'paths': [name for name, _ in inventory]}, ensure_ascii=False, indent=2))
        return 0
    results = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(check_file, item, revision) for item in inventory]
        for future in as_completed(futures):
            results.append(future.result())
    results.sort(key=lambda item: item['path'])
    failures = [item for item in results if not item['match']]
    report = {'site': SITE, 'revision': revision, 'file_count': len(results),
              'matches': len(results) - len(failures), 'failures': len(failures),
              'ok': bool(results) and not failures, 'files': results,
              'limits': 'File integrity only; no mobile, payment, form-delivery, legal or hardware certification.'}
    folder = ROOT / '.release-validation'
    folder.mkdir(exist_ok=True)
    (folder / 'deployment.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: report[key] for key in ['site', 'revision', 'file_count', 'matches', 'failures', 'ok']}, indent=2))
    if failures:
        print(json.dumps(failures, ensure_ascii=False, indent=2))
    return 0 if report['ok'] else 1


if __name__ == '__main__':
    sys.exit(main())

#!/usr/bin/env python3
"""Build the printable support kit recovered from support.html before bb28226.

Requires ReportLab and DejaVu Sans. Runtime downloads are ordinary static PDF links.
The templates reflect PRODUCT_FACTS.md; fields are blank for handwritten completion.
"""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                               TableStyle, PageBreak, KeepTogether)
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'documents/support'
OUT.mkdir(parents=True, exist_ok=True)
FONT = Path('/usr/share/fonts/truetype/dejavu')
pdfmetrics.registerFont(TTFont('SNF', str(FONT / 'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('SNF-Bold', str(FONT / 'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFontFamily('SNF', normal='SNF', bold='SNF-Bold')
INK = colors.HexColor('#1d2330')
GOLD = colors.HexColor('#c5a14e')
LINE = colors.HexColor('#cbd0d8')
SOFT = colors.HexColor('#f1f4fa')
W, H = A4
CW = W - 36 * mm
BODY = ParagraphStyle('body', fontName='SNF', fontSize=9.3, leading=14,
                      textColor=INK, spaceAfter=7)
SMALL = ParagraphStyle('small', parent=BODY, fontSize=8, leading=11)
TITLE = ParagraphStyle('title', parent=BODY, fontName='SNF-Bold', fontSize=21,
                       leading=27, spaceAfter=12)
SUB = ParagraphStyle('sub', parent=BODY, fontName='SNF-Bold', fontSize=11,
                     leading=15, spaceBefore=10, spaceAfter=7)
POSTER = ParagraphStyle('poster', parent=TITLE, fontSize=28, leading=36,
                        alignment=TA_CENTER, spaceAfter=20)
CENTER = ParagraphStyle('center', parent=BODY, alignment=TA_CENTER, fontSize=12,
                        leading=19, spaceAfter=17)


def p(text, style=BODY):
    return Paragraph(text, style)


def section(title, *lines):
    return [p(title, SUB)] + [p(line) for line in lines]


def fields(labels):
    rows = [[p(label, SMALL), p('........................................................................', SMALL)]
            for label in labels]
    t = Table(rows, colWidths=[49 * mm, CW - 49 * mm])
    t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'),
                          ('BOTTOMPADDING', (0, 0), (-1, -1), 8)]))
    return t


def table(headers, rows, widths):
    data = [[p('<b>' + h + '</b>', SMALL) for h in headers]]
    data += [[p(value, SMALL) for value in row] for row in rows]
    t = Table(data, colWidths=[CW * v for v in widths], repeatRows=1)
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), SOFT),
                          ('GRID', (0, 0), (-1, -1), .5, LINE),
                          ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                          ('TOPPADDING', (0, 0), (-1, -1), 8),
                          ('BOTTOMPADDING', (0, 0), (-1, -1), 8)]))
    return t


def frame(canvas, doc):
    canvas.setTitle(doc.title)
    canvas.setAuthor('SecurityNoPhone - Rép&Web')
    canvas.setSubject('Support et formation - documents opérationnels')
    logo = ImageReader(str(ROOT / 'images/IMG_20250421_182622-removebg-preview.png'))
    iw, ih = logo.getSize()
    scale = min(33 * mm / iw, 14 * mm / ih)
    canvas.drawImage(logo, 18 * mm, H - 23 * mm, iw * scale, ih * scale, mask='auto')
    canvas.setFont('SNF-Bold', 10)
    canvas.setFillColor(INK)
    canvas.drawRightString(W - 18 * mm, H - 16 * mm, 'SUPPORT & FORMATION')
    canvas.setStrokeColor(GOLD)
    canvas.line(18 * mm, H - 28 * mm, W - 18 * mm, H - 28 * mm)
    canvas.setFont('SNF', 7)
    canvas.setFillColor(INK)
    canvas.drawString(18 * mm, 13 * mm, 'securitynophone.com | snophone.info@gmail.com | +33 7 45 20 13 10')
    canvas.drawRightString(W - 18 * mm, 8 * mm, '29/10/2026 | ' + str(doc.page))


def build(filename, title, story):
    doc = SimpleDocTemplate(str(OUT / filename), pagesize=A4, rightMargin=18 * mm,
                            leftMargin=18 * mm, topMargin=35 * mm,
                            bottomMargin=23 * mm, title=title, invariant=1)
    doc.build(story, onFirstPage=frame, onLaterPages=frame)


materials = ['Pochettes avec fenêtre', 'Pochettes sans fenêtre',
             'Aimants professionnels', 'Sacs / signalétique si prévus au devis']
build('fiche-retour-materiel.pdf', 'Fiche de retour matériel', [
    p('Fiche de retour matériel', TITLE),
    fields(['Client / événement', 'Référence de prestation', 'Date et lieu']),
    *section('Inventaire à la restitution'),
    table(['Matériel', 'Livré', 'Retourné', 'Observations'],
          [[item, '........', '........', '........................'] for item in materials],
          [.40, .14, .16, .30]),
    *section('État du matériel',
             '[  ] Bon état général   [  ] Matériel manquant   [  ] Matériel endommagé',
             'Détails : .........................................................................................................',
             '........................................................................................................................'),
    p('<b>Caution :</b> 300 € par tranche de 700 pochettes pour location et abonnement. '
      'La restitution intervient après vérification, selon les conditions du devis. '
      'Consigner les écarts avant toute décision.'),
    Spacer(1, 8 * mm), fields(['Signature client / date', 'Responsable du contrôle'])])

build('bon-livraison-retour.pdf', 'Bon de livraison et retour', [
    p('Bon de livraison et retour', TITLE),
    fields(['Client / référence', 'Lieu de prestation', 'Date de livraison', 'Retour prévu']),
    table(['Matériel / colis', 'Quantité', 'État / observations'],
          [[item, '........', '.......................................'] for item in materials],
          [.43, .14, .43]),
    *section('Retour du matériel',
             '1. Compter les pochettes et les aimants ; joindre la fiche de retour.',
             '2. Emballer le matériel et protéger les mécanismes de fermeture.',
             '3. Utiliser le transporteur, le destinataire et les délais convenus au devis.',
             '4. Conserver la preuve de dépôt et signaler les écarts au service.'),
    fields(['Transporteur / suivi', 'Adresse de retour validée']),
    p('<b>Important :</b> ce bon est une fiche d’inventaire, pas une étiquette '
      'd’affranchissement. Utiliser l’étiquette du transporteur prévue pour votre prestation.', SMALL)])

build('protocole-confidentialite.pdf', 'Protocole de confidentialité', [
    p('Protocole de confidentialité', TITLE),
    p('Modèle d’organisation à compléter avec le responsable du lieu ou de l’événement.'),
    fields(['Événement / lieu', 'Zones et période concernées', 'Responsable / point d’ouverture']),
    *section('Consignes à communiquer',
             '1. Indiquer clairement les zones où les photos et vidéos sont interdites.',
             '2. Expliquer l’utilisation des pochettes avant l’accueil des participants.',
             '3. Le participant conserve son téléphone dans la pochette verrouillée.',
             '4. Définir les exceptions et un point d’ouverture accessible aux personnes concernées.'),
    *section('Choix du modèle',
             '<b>Avec fenêtre :</b> écran tactile utilisable, appels et messages possibles ; '
             'la fenêtre floute l’image de la caméra avant.',
             '<b>Sans fenêtre :</b> pas d’accès à l’écran à travers la pochette fermée.'),
    *section('Répartition des rôles',
             'L’organisateur fixe les consignes du lieu et informe les participants et prestataires.',
             'Le responsable désigné conserve l’aimant professionnel et organise les ouvertures.',
             'La pochette fonctionne sans application ni accès au contenu du téléphone.'),
    fields(['Exceptions convenues', 'Validation organisateur / date'])])

build('notice-utilisation-rapide.pdf', 'Notice d’utilisation rapide', [
    p('Notice d’utilisation rapide', TITLE),
    p('Objectif : empêcher les photos et vidéos non autorisées tout en laissant le participant '
      'conserver son téléphone.'),
    *section('Avant l’arrivée des participants',
             '1. Choisir le modèle selon les consignes du lieu : avec ou sans accès à l’écran.',
             '2. Tester le placement du téléphone, le verrouillage et l’ouverture sur un appareil de référence.',
             '3. Désigner le responsable d’ouverture et lui confier l’aimant professionnel fourni.'),
    *section('À l’accueil',
             '1. Expliquer les consignes et le point d’ouverture au participant.',
             '2. Placer le téléphone dans la pochette choisie et fermer l’antivol.',
             '3. Vérifier la fermeture ; le participant conserve la pochette avec lui.',
             'Avec fenêtre : écran, appels et messages utilisables ; image de caméra avant floutée. '
             'Sans fenêtre : écran inaccessible tant que la pochette est fermée.'),
    *section('Ouverture et fin de prestation',
             '1. Faire ouvrir la pochette par le responsable équipé de l’aimant professionnel.',
             '2. Vérifier que le participant a récupéré son téléphone.',
             '3. Collecter et compter le matériel ; signaler tout manque ou dommage.'),
    *section('Entretien',
             'Toutes les pochettes sont en similicuir. Suivre les recommandations du fournisseur '
             'pour le nettoyage. Ne pas forcer le mécanisme de fermeture.')])

build('etiquette-contact.pdf', 'Étiquette de contact', [
    p('Votre point de contact', TITLE), Spacer(1, 10 * mm),
    p('SecurityNoPhone', POSTER),
    p('+33 7 45 20 13 10', POSTER),
    p('snophone.info@gmail.com', CENTER),
    p('Rép&amp;Web<br/>10 Grande Rue de Saint-Clair<br/>69300 Caluire-et-Cuire', CENTER),
    *section('Pour une ouverture sur place',
             'Adressez-vous au responsable désigné par l’organisateur.'),
    fields(['Responsable sur place', 'Téléphone / point d’ouverture', 'Horaires convenus']),
    Spacer(1, 7 * mm),
    p('Pour contacter le service, indiquez votre référence, le lieu et les dates de la prestation. '
      'Les horaires d’assistance sont ceux convenus au devis.')])

build('signaletique-bilingue.pdf', 'Espace sans photos et sans vidéos - FR / EN', [
    Spacer(1, 8 * mm), p('ESPACE SANS PHOTOS<br/>ET SANS VIDÉOS', POSTER),
    p('Merci de conserver votre téléphone<br/>dans sa pochette verrouillée.', CENTER),
    p('Pour une ouverture, adressez-vous<br/>au responsable désigné.', CENTER),
    Spacer(1, 12 * mm), p('NO PHOTOS<br/>NO VIDEOS', POSTER),
    p('Please keep your phone<br/>inside its locked pouch.', CENTER),
    p('To open a pouch, contact<br/>the designated organiser.', CENTER),
    Spacer(1, 7 * mm), p('Point d’ouverture / Opening point :<br/>................................................', CENTER)])

build('guide-formation-equipes.pdf', 'Guide de formation des équipes', [
    p('Guide de formation des équipes', TITLE),
    p('Déroulement indicatif à adapter au lieu, au modèle choisi et aux modalités du devis.'),
    fields(['Prestation / dates', 'Responsable d’équipe', 'Point d’ouverture']),
    *section('1. Préparer le dispositif',
             'Vérifier le stock et l’état des pochettes, les aimants et les documents prévus au devis.',
             'Identifier les zones sans photos ni vidéos, les accès et le point de sortie.',
             'Préparer la signalétique et informer les participants avant leur arrivée.'),
    *section('2. Former les personnes à l’accueil',
             'Faire un essai complet sur un téléphone de référence : positionnement, fermeture et ouverture.',
             'Expliquer les deux modèles : la fenêtre permet l’usage de l’écran et floute la caméra avant ; '
             'le modèle sans fenêtre empêche l’accès à l’écran.',
             'Confier les aimants aux personnes désignées et convenir du circuit des demandes d’ouverture.'),
    *section('3. Accueillir les participants',
             'Présenter les consignes du lieu et les exceptions prévues avec l’organisateur.',
             'Placer le téléphone dans le modèle retenu, fermer l’antivol et vérifier la fermeture.',
             'Le participant conserve son téléphone dans sa pochette. Indiquer clairement où demander une ouverture.'),
    p('<b>Phrase d’accueil possible :</b> « Les photos et vidéos ne sont pas autorisées ici. '
      'Vous gardez votre téléphone dans cette pochette. Pour toute ouverture, adressez-vous '
      'au responsable indiqué. »'),
    PageBreak(), p('Pendant et après la prestation', TITLE),
    *section('4. Accompagner les demandes',
             'Orienter les demandes d’ouverture vers le responsable équipé de l’aimant professionnel.',
             'Appliquer les exceptions convenues, notamment les besoins d’accessibilité ou d’usage médical.',
             'En cas de difficulté de fermeture, ne pas forcer le mécanisme ; faire vérifier le matériel.'),
    *section('5. Clôturer et restituer',
             'Ouvrir les pochettes et vérifier que chaque participant reprend son téléphone.',
             'Collecter, compter et contrôler les pochettes et aimants.',
             'Noter les manques ou dommages sur la fiche de retour, puis faire valider le constat.',
             'Organiser l’emballage et le retour selon le devis ; conserver les preuves utiles.'),
    *section('Checklist de fin',
             '[  ] Téléphones récupérés par les participants',
             '[  ] Pochettes comptées et état relevé',
             '[  ] Aimants et accessoires contrôlés',
             '[  ] Fiche de retour complétée',
             '[  ] Retour et transporteur conformes au devis'),
    *section('Documents à préparer',
             'Fiche de retour matériel ; bon de livraison/retour ; protocole de confidentialité ; '
             'notice rapide ; étiquette de contact ; signalétique bilingue.'),
    p('<b>Assistance :</b> snophone.info@gmail.com - +33 7 45 20 13 10. '
      'Préciser la référence, les dates et le lieu. Horaires selon le devis.')])

for pdf in sorted(OUT.glob('*.pdf')):
    print(pdf.relative_to(ROOT))

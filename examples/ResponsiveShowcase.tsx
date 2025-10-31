import React from "react";
import classNames from "classnames";
import styles from "./ResponsiveShowcase.module.css";

type Stat = {
  label: string;
  description: string;
};

const stats: Stat[] = [
  {
    label: "<24h",
    description: "Average deployment prep time confirmed during 2024 flagship events.",
  },
  {
    label: "4 langs",
    description: "Operational scripts maintained in French, English, German and Arabic.",
  },
  {
    label: "360°",
    description: "Support covering pre-event planning, on-site assistance and post-event reporting.",
  },
];

export const ResponsiveShowcase: React.FC = () => {
  return (
    <section className={styles.wrapper} aria-labelledby="responsive-showcase-title">
      <div className={styles.heroCard}>
        <p className={styles.kicker}>SecurityNoPhone</p>
        <h1 id="responsive-showcase-title" className={styles.title}>
          Confidentiality-first welcome flows for premium events and sensitive venues
        </h1>
        <p className={styles.lead}>
          Our team designs numbered pouch journeys that preserve phone access while blocking image capture. Guests
          keep their devices, and you stay in control of the content released from your venue.
        </p>
        <div className={styles.ctaGroup}>
          <a className={classNames(styles.button, styles.primaryButton)} href="/commande.html">
            Talk with a project manager
          </a>
          <a className={classNames(styles.button, styles.secondaryButton)} href="/solutions.html">
            Explore the playbooks
          </a>
        </div>
        <p className={styles.disclaimer}>
          Figures and quotes published on this page are sourced from internal 2024 deployment reports and are updated
          quarterly to keep them verifiable.
        </p>
      </div>

      <div className={styles.mediaCard}>
        <figure className={styles.videoFrame}>
          <video
            className={styles.video}
            controls
            poster="/images/IMG_20250421_182622.jpg"
            aria-label="SecurityNoPhone deployment highlights"
          >
            <track
              kind="captions"
              srcLang="en"
              src="/captions/securitynophone-demo-en.vtt"
              label="English captions"
            />
          </video>
          <figcaption className={styles.caption}>
            Excerpt from a hybrid summit roll-out: guest welcome, numbered seal handover, closing protocol and post-event
            reconciliation.
          </figcaption>
        </figure>

        <ul className={styles.stats} aria-label="Operational highlights">
          {stats.map((stat) => (
            <li key={stat.label} className={styles.statItem}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statDescription}>{stat.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default ResponsiveShowcase;

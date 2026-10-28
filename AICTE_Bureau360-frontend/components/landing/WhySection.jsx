'use client';

import React from 'react';
import styles from './landing.module.css';
import {
  EyeIcon,
  UsersIcon,
  BarChartIcon,
  ShieldIcon,
} from '../icons/Icons';

export function WhySection({ onLearnMoreTab }) {
  const pillars = [
    {
      id: 'transparency',
      title: 'Greater Transparency',
      description: 'Real-time insights across bureaus and cells.',
      icon: <EyeIcon size={20} />,
      circleClass: styles.whyIconBlue,
      tab: 'complaints',
    },
    {
      id: 'coordination',
      title: 'Better Coordination',
      description: 'Seamless collaboration and case transfers.',
      icon: <UsersIcon size={20} />,
      circleClass: styles.whyIconTeal,
      tab: 'coordination',
    },
    {
      id: 'decisions',
      title: 'Data-Driven Decisions',
      description: 'Powerful analytics and visualizations.',
      icon: <BarChartIcon size={20} />,
      circleClass: styles.whyIconSky,
      tab: 'reports',
    },
    {
      id: 'outcomes',
      title: 'Improved Outcomes',
      description: 'Faster resolution and stronger institutions.',
      icon: <ShieldIcon size={20} />,
      circleClass: styles.whyIconRose,
      tab: 'institutions',
    },
  ];

  return (
    <section id="why-bureau360" className={styles.whySection} aria-label="Why AICTE Bureau360">
      <div className={styles.whyContainer}>
        {/* Left Column: Heading & Description */}
        <div className={styles.whyIntro}>
          <h2 className={styles.whyTitle}>Why AICTE Bureau360?</h2>
          <p className={styles.whySubtitle}>
            A unified platform to bring transparency, improve coordination and ensure
            faster resolution of institution-related complaints.
          </p>
        </div>

        {/* Right Column: 4 Pillar Cards */}
        <div className={styles.whyGrid}>
          {pillars.map((item) => (
            <div
              key={item.id}
              className={styles.whyCard}
              onClick={() => onLearnMoreTab?.(item.tab)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLearnMoreTab?.(item.tab);
                }
              }}
              aria-label={`${item.title}: ${item.description}`}
            >
              <div className={`${styles.whyIconCircle} ${item.circleClass}`}>
                {item.icon}
              </div>
              <h3 className={styles.whyCardTitle}>{item.title}</h3>
              <p className={styles.whyCardText}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

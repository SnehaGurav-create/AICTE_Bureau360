import React from 'react';
import styles from './ui.module.css';

export function Badge({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
  ...props
}) {
  const variantClass = {
    critical: styles.badgeCritical,
    warning: styles.badgeWarning,
    info: styles.badgeInfo,
    success: styles.badgeSuccess,
    neutral: styles.badgeNeutral,
    overlap: styles.badgeOverlap,
  }[variant] || styles.badgeNeutral;

  return (
    <span className={`${styles.badge} ${variantClass} ${className}`} {...props}>
      {dot && <span className={styles.badgeDot} aria-hidden="true" />}
      {children}
    </span>
  );
}

import React from 'react';
import styles from './ui.module.css';

export function Card({ children, className = '', interactive = false, ...props }) {
  return (
    <div
      className={`${styles.card} ${interactive ? styles.cardInteractive : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, title, subtitle, action, className = '' }) {
  return (
    <div className={`${styles.cardHeader} ${className}`}>
      <div className={styles.cardTitleGroup}>
        {title && <h3 className={styles.cardTitle}>{title}</h3>}
        {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
        {children}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`${styles.cardContent} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`${styles.cardFooter} ${className}`} {...props}>
      {children}
    </div>
  );
}

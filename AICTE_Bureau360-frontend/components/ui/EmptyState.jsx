import React from 'react';
import styles from './ui.module.css';
import { AlertCircleIcon } from '../icons/Icons';

export function EmptyState({
  title = 'No Records Found',
  description = 'No complaint cases match your selected bureau, status, or search filters.',
  action,
  icon,
}) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIconWrapper}>
        {icon || <AlertCircleIcon size={24} />}
      </div>
      <h4 className={styles.emptyTitle}>{title}</h4>
      <p className={styles.emptyDescription}>{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export function LoadingSkeleton({ height = 20, width = '100%', style = {} }) {
  return (
    <div
      className={styles.skeleton}
      style={{ height: `${height}px`, width, ...style }}
      aria-hidden="true"
    />
  );
}

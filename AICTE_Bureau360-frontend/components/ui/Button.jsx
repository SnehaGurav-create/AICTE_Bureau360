import React from 'react';
import styles from './ui.module.css';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  icon,
  ...props
}) {
  const variantClass = {
    primary: styles.btnPrimary,
    secondary: styles.btnSecondary,
    accent: styles.btnAccent,
    outline: styles.btnOutline,
    ghost: styles.btnGhost,
    danger: styles.btnDanger,
  }[variant] || styles.btnPrimary;

  const sizeClass = {
    sm: styles.btnSm,
    md: styles.btnMd,
    lg: styles.btnLg,
  }[size] || styles.btnMd;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${styles.btn} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}

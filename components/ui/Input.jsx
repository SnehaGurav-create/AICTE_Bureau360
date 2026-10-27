import React from 'react';
import styles from './ui.module.css';

export function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  prefixIcon,
  className = '',
  disabled = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={styles.formGroup}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {prefixIcon && <span className={styles.inputPrefix}>{prefixIcon}</span>}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`${styles.input} ${prefixIcon ? styles.inputWithPrefix : ''} ${error ? styles.inputError : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
      {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
}

export function Select({
  label,
  id,
  options = [],
  value,
  onChange,
  error,
  helperText,
  className = '',
  disabled = false,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={styles.formGroup}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${styles.select} ${error ? styles.inputError : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.errorText}>{error}</span>}
      {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';

/**
 * Checks if the user prefers reduced motion.
 */
function getPrefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Custom hook to animate numeric value from start to target.
 */
export function useAnimatedCounter({
  value = 0,
  duration = 1000,
  delay = 0,
}) {
  const numericTarget = typeof value === 'number' ? value : parseFloat(value) || 0;
  const [displayValue, setDisplayValue] = useState(0);
  const currentValRef = useRef(0);
  const animFrameRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // If reduced motion is preferred or duration is 0, jump immediately to target
    if (getPrefersReducedMotion() || duration <= 0) {
      currentValRef.current = numericTarget;
      setDisplayValue(numericTarget);
      return;
    }

    const startVal = currentValRef.current;
    const endVal = numericTarget;

    // Clear any previous running animations
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    // If starting and ending are identical, ensure target is set
    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: smooth deceleration into final value
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * ease;

      currentValRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        currentValRef.current = endVal;
        setDisplayValue(endVal);
      }
    };

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        animFrameRef.current = requestAnimationFrame(animate);
      }, delay);
    } else {
      animFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [numericTarget, duration, delay]);

  return displayValue;
}

/**
 * AnimatedCounter Component
 * Animates numeric metrics smoothly from 0 to actual data value.
 */
export function AnimatedCounter({
  value = 0,
  duration = 1100,
  delay = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  formatter,
  className,
  style,
  ariaLabel,
}) {
  const animatedNumber = useAnimatedCounter({ value, duration, delay });
  const numericTarget = typeof value === 'number' ? value : parseFloat(value) || 0;

  // Format the number for display
  let formatted;
  if (typeof formatter === 'function') {
    formatted = formatter(animatedNumber, animatedNumber === numericTarget);
  } else if (decimals > 0) {
    formatted = animatedNumber.toFixed(decimals);
  } else {
    formatted = Math.round(animatedNumber).toLocaleString();
  }

  const finalAriaLabel = ariaLabel || `${prefix}${numericTarget}${suffix}`;

  return (
    <span
      className={className}
      style={style}
      aria-label={finalAriaLabel}
      title={finalAriaLabel}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export default AnimatedCounter;

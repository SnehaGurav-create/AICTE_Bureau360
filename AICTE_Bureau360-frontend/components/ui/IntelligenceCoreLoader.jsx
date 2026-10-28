'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './intelligenceCore.module.css';

const DEFAULT_STATUS_MESSAGES = [
  'Initializing Bureau360...',
  'Preparing complaint intelligence...',
  'Synchronizing case workspace...',
  'Preparing your dashboard...',
];

/**
 * AICTE Bureau360 — Intelligence Core Cinematic 3D Loader
 * SIH 2026 Problem Statement 26264
 *
 * Implements a hardware-accelerated 3D composition:
 * - Nested translucent glass facets with spatial perspective
 * - Tri-axial rotating orbital rings & gyroscopic polar ring
 * - Translucent floating interface fragments (fictional decorative data)
 * - Spatial coordinate floor grid with soft reflections
 * - Subtle camera push-in transition on dashboard entry
 * - Clean, elegant wordmark reveal with shimmering light sweep
 * - Accessible status announcer, indeterminate progress indicator & reduced-motion fallback
 */
export function IntelligenceCoreLoader({
  isLoading = true,
  onFinish,
  minDurationMs = 1800,
  messages = DEFAULT_STATUS_MESSAGES,
  showTagline = true,
}) {
  const [currentMessageIdx, setCurrentMessageIdx] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const coreRef = useRef(null);

  // Status message rotation
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setCurrentMessageIdx((prev) => (prev + 1) % messages.length);
    }, Math.max(450, Math.floor(minDurationMs / messages.length)));

    return () => clearInterval(interval);
  }, [isLoading, minDurationMs, messages]);

  // Minimum duration and camera push-in exit transition control
  useEffect(() => {
    let finishTimer = null;

    const timer = setTimeout(() => {
      // Trigger smooth camera push-in and dissolve transition
      setIsExiting(true);
      finishTimer = setTimeout(() => {
        setHasFinished(true);
        onFinish?.();
      }, 650); // Matches CSS 0.65s camera push-in transition
    }, minDurationMs);

    return () => {
      clearTimeout(timer);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [minDurationMs, onFinish]);

  // Subtle Mouse Parallax on Desktop
  const handleMouseMove = useCallback((e) => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const { innerWidth, innerHeight } = window;
    const normX = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
    const normY = (e.clientY / innerHeight - 0.5) * 2; // -1 to 1

    setMouseOffset({
      x: normX * 10, // max 10 deg tilt
      y: -normY * 10,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Ambient Floating Particle Canvas (Restrained & GPU-Friendly)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Detect reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      let width = (canvas.width = canvas.offsetWidth);
      let height = (canvas.height = canvas.offsetHeight);

      const handleResize = () => {
        if (!canvas) return;
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
      };
      window.addEventListener('resize', handleResize, { passive: true });

      // Restrained particle count: 28 on desktop, 14 on mobile
      const particleCount = width < 640 ? 14 : 28;
      const particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35 - 0.12, // gentle upward drift
        radius: Math.random() * 1.3 + 0.6,
        alpha: Math.random() * 0.5 + 0.2,
        pulseSpeed: Math.random() * 0.015 + 0.008,
        color: Math.random() > 0.88 ? '#f59e0b' : '#38bdf8', // small amber accent
      }));

      // Render loop
      const render = () => {
        ctx.clearRect(0, 0, width, height);

        // Draw subtle connective lines for near particles
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 80) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 80) * 0.1})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }

        // Update and draw particles
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          // Wrap around bounds
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          // Oscillate opacity
          p.alpha += p.pulseSpeed;
          if (p.alpha > 0.75 || p.alpha < 0.2) p.pulseSpeed = -p.pulseSpeed;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha));
          ctx.shadowBlur = 5;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        ctx.globalAlpha = 1;
        animFrameRef.current = requestAnimationFrame(render);
      };

      render();

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    } catch {
      // Graceful fallback if canvas is restricted
    }
  }, []);

  if (hasFinished) return null;

  return (
    <aside
      className={`${styles.loaderOverlay} ${isExiting ? styles.loaderOverlayExiting : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Initializing AICTE Bureau360 platform"
    >
      {/* Background Canvas & Ambient Lighting */}
      <canvas ref={canvasRef} className={styles.particleCanvas} aria-hidden="true" />
      <div className={styles.ambientGlowTop} aria-hidden="true" />
      <div className={styles.ambientGlowCenter} aria-hidden="true" />

      <div className={styles.contentContainer}>
        {/* Central 3D Intelligence Core */}
        <div className={styles.scene3D} aria-hidden="true">
          {/* Spatial Ground Perspective Grid & Floor Reflection */}
          <div className={styles.perspectiveGrid} />
          <div className={styles.groundReflection} />

          <div
            ref={coreRef}
            className={`${styles.coreAssembly} ${isExiting ? styles.coreAssemblyExiting : ''}`}
            style={{
              transform: `rotateX(${mouseOffset.y}deg) rotateY(${mouseOffset.x}deg)`,
            }}
          >
            {/* 1. Outer Concentric Orbital Ring */}
            <div className={styles.ringOuter}>
              <div className={styles.ringOuterNode} />
            </div>

            {/* 2. Middle Concentric Coordination Ring */}
            <div className={styles.ringMiddle}>
              <div className={styles.ringMiddleNode} />
            </div>

            {/* 3. Gyroscopic Polar Ring (Full 3-axis depth) */}
            <div className={styles.ringGimbal}>
              <div className={styles.ringGimbalNode} />
            </div>

            {/* 4. Inner Verification Ring */}
            <div className={styles.ringInner}>
              <div className={styles.ringInnerNode} />
            </div>

            {/* 5. Outer Faceted Geometric Glass Cage */}
            <div className={styles.outerCage}>
              <div className={`${styles.cageFace} ${styles.cageFace1}`} />
              <div className={`${styles.cageFace} ${styles.cageFace2}`} />
              <div className={`${styles.cageFace} ${styles.cageFace3}`} />
              <div className={`${styles.cageFace} ${styles.cageFace4}`} />
            </div>

            {/* 6. Central 3D Translucent Glass Crystal Nucleus */}
            <div className={styles.crystalNucleus}>
              <div className={`${styles.crystalFace} ${styles.crystalFace1}`} />
              <div className={`${styles.crystalFace} ${styles.crystalFace2}`} />
              <div className={`${styles.crystalFace} ${styles.crystalFace3}`} />
              <div className={`${styles.crystalFace} ${styles.crystalFace4}`} />
              <div className={`${styles.crystalFace} ${styles.crystalFace5}`} />
              <div className={`${styles.crystalFace} ${styles.crystalFace6}`} />
            </div>

            {/* 7. Glowing Inner Energy Core */}
            <div className={styles.energyCore} />

            {/* 8. Floating Satellite Data Nodes */}
            <div className={styles.satelliteCluster}>
              <div className={`${styles.satelliteNode} ${styles.satellite1}`} />
              <div className={`${styles.satelliteNode} ${styles.satellite2}`} />
              <div className={`${styles.satelliteNode} ${styles.satellite3}`} />
              <div className={`${styles.satelliteNode} ${styles.satellite4}`} />
            </div>
          </div>

          {/* Translucent Floating Interface Fragments (Fictional Decorative Data) */}
          <div
            className={`${styles.hudContainer} ${isExiting ? styles.hudContainerExiting : ''}`}
            style={{
              transform: `rotateX(${mouseOffset.y * 0.6}deg) rotateY(${mouseOffset.x * 0.6}deg)`,
            }}
          >
            {/* Fragment 1: Top-Left Elevated Foreground (+45px Z) */}
            <div className={`${styles.hudFragment} ${styles.hudFragment1}`}>
              <div className={styles.hudHeader}>
                <span className={styles.hudDotCyan} />
                <span className={styles.hudCode}>AICTE-PID: 1-332489</span>
              </div>
              <div className={styles.hudBody}>
                <span className={styles.hudLabel}>CASE-0891 // CORRELATING</span>
                <span className={styles.hudBadge}>TIER-1 VERIFIED</span>
              </div>
            </div>

            {/* Fragment 2: Top-Right Recessed Midground (-25px Z) */}
            <div className={`${styles.hudFragment} ${styles.hudFragment2}`}>
              <div className={styles.hudHeader}>
                <span className={styles.hudDotGreen} />
                <span className={styles.hudCode}>NODE #VC-07 // GRC-CELL</span>
              </div>
              <div className={styles.hudBody}>
                <span className={styles.hudLabel}>GRID: 28.58N · 77.16E</span>
                <span className={styles.hudBadgeMuted}>STREAM SYNCH</span>
              </div>
            </div>

            {/* Fragment 3: Bottom-Left Midground (-15px Z) */}
            <div className={`${styles.hudFragment} ${styles.hudFragment3}`}>
              <div className={styles.hudHeader}>
                <span className={styles.hudDotAmber} />
                <span className={styles.hudCode}>PID: 1-449102 // JURISDICTION</span>
              </div>
              <div className={styles.hudBody}>
                <span className={styles.hudLabel}>BUREAU: RIFD ⇄ APPROVAL</span>
                <span className={styles.hudBadgeAmber}>EVAL OVERLAP</span>
              </div>
            </div>

            {/* Fragment 4: Bottom-Right Elevated Foreground (+60px Z) */}
            <div className={`${styles.hudFragment} ${styles.hudFragment4}`}>
              <div className={styles.hudHeader}>
                <span className={styles.hudDotCyan} />
                <span className={styles.hudCode}>CASE-0884 // MULTI-BUREAU</span>
              </div>
              <div className={styles.hudBody}>
                <span className={styles.hudLabel}>CLUSTER: SCHOLARSHIPS</span>
                <span className={styles.hudBadge}>ROUTING ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sophisticated Wordmark & Identity with Elegant Reveal */}
        <div className={styles.brandGroup}>
          <div className={styles.brandSuper}>AICTE</div>
          <h1 className={styles.brandTitle}>
            BUREAU<span className={styles.brandHighlight}>360</span>
          </h1>
          {showTagline && (
            <p className={styles.tagline}>
              Connecting cases. Revealing patterns. Enabling resolution.
            </p>
          )}
        </div>

        {/* Status Line & Indeterminate Progress */}
        <div className={styles.statusContainer}>
          <div className={styles.statusTextWrapper}>
            <span className={styles.statusMessage} key={currentMessageIdx}>
              <span className={styles.statusDot} aria-hidden="true" />
              {messages[currentMessageIdx]}
            </span>
          </div>

          {/* Slim Indeterminate Progress Indicator */}
          <div className={styles.progressTrack} aria-hidden="true">
            <div className={styles.progressBarIndeterminate} />
          </div>
        </div>
      </div>
    </aside>
  );
}

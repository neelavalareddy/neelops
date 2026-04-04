"use client";

import { useCallback, useRef, useState } from "react";

export default function HeroParallaxOrb() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: py * -12, y: px * 14 });
  }, []);

  const onLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  return (
    <div
      ref={wrapRef}
      className="hero-orb-wrap"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: 900 }}
    >
      <div
        className="iris-container transition-transform duration-200 ease-out"
        style={{
          width: 340,
          height: 340,
          maxWidth: "100%",
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
        aria-hidden
      >
        <div className="iris-ring iris-ring-1" />
        <div className="iris-ring iris-ring-2" />
        <div className="iris-ring iris-ring-3" />
        <div className="iris-ring iris-ring-4" />
        <div className="iris-core" />
        <span
          style={{
            position: "absolute",
            top: "12%",
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.25em",
            color: "var(--signal)",
            opacity: 0.4,
            textTransform: "uppercase",
          }}
        >
          VERIFIED
        </span>
        <span
          style={{
            position: "absolute",
            bottom: "12%",
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.25em",
            color: "var(--signal)",
            opacity: 0.4,
            textTransform: "uppercase",
          }}
        >
          HUMAN
        </span>
      </div>
    </div>
  );
}

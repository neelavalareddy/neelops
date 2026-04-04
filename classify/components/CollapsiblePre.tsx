"use client";

import { useState } from "react";

interface Props {
  text: string;
  /** Approximate character count before showing expand control */
  collapseUnder?: number;
}

export default function CollapsiblePre({ text, collapseUnder = 600 }: Props) {
  const [open, setOpen] = useState(false);
  const needsToggle = text.length > collapseUnder;

  return (
    <div>
      <pre
        className={`text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto collapsible-pre-inner ${needsToggle && !open ? "collapsible-pre-clamp" : ""}`}
        style={{
          color: "var(--text-dim)",
          fontFamily: "var(--font-mono)",
          background: "rgba(255,255,255,0.02)",
          borderRadius: 10,
          padding: "14px",
          border: "1px solid var(--border)",
          margin: 0,
        }}
      >
        {text}
      </pre>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="collapsible-pre-toggle mt-2"
        >
          {open ? "Collapse" : "Expand full output"}
        </button>
      )}
      <style>{`
        .collapsible-pre-clamp {
          max-height: 220px;
          overflow: hidden;
          position: relative;
        }
        .collapsible-pre-clamp::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 48px;
          background: linear-gradient(transparent, rgba(5, 5, 7, 0.95));
          pointer-events: none;
        }
        .collapsible-pre-toggle {
          font-size: 11px;
          font-weight: 600;
          color: var(--signal);
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .collapsible-pre-toggle:hover {
          color: #33ff99;
        }
      `}</style>
    </div>
  );
}

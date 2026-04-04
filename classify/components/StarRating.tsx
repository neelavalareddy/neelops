"use client";

interface Props {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_PX = { sm: 14, md: 20, lg: 28 };

export default function StarRating({ value, onChange, readonly = false, size = "md" }: Props) {
  const px = SIZE_PX[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            aria-label={`${star} star`}
            style={{
              width: px + 4,
              height: px + 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: readonly ? "default" : "pointer",
              background: "none",
              border: "none",
              padding: 0,
              transition: "transform 0.12s",
            }}
            onMouseEnter={!readonly ? (e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.2)"; } : undefined}
            onMouseLeave={!readonly ? (e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; } : undefined}
          >
            <svg width={px} height={px} viewBox="0 0 16 16" fill="none">
              <polygon
                points="8,1 9.8,6.2 15.4,6.2 10.9,9.4 12.7,14.6 8,11.4 3.3,14.6 5.1,9.4 0.6,6.2 6.2,6.2"
                fill={filled ? "var(--gold)" : "none"}
                stroke={filled ? "var(--gold)" : "rgba(255,255,255,0.12)"}
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

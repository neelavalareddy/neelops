"use client";

interface Props {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZES = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };

export default function StarRating({ value, onChange, readonly = false, size = "md" }: Props) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${SIZES[size]} transition-all ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          }`}
          aria-label={`${star} star`}
        >
          <span className={value >= star ? "text-yellow-400" : "text-gray-700"}>★</span>
        </button>
      ))}
    </div>
  );
}

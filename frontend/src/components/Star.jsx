import { Star as StarIcon } from "lucide-react";

export default function Star({
  value,
  onChange,
  editable = false,
  size = "w-5 h-5",
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={!editable}
            onClick={() => editable && onChange?.(star)}
            className={`${
              filled ? "text-yellow-500" : "text-secondary/30"
            } ${editable ? "hover:text-yellow-400 cursor-pointer" : "cursor-default"}`}
          >
            <StarIcon
              className={size}
              fill={filled ? "currentColor" : "none"}
            />
          </button>
        );
      })}
    </div>
  );
}

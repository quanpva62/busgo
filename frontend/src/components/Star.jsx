export default function Star({
  value,
  onChange,
  editable = false,
  size = "text-xl",
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!editable}
          onClick={() => editable && onChange?.(star)}
          className={`material-symbols-outlined ${size} ${
            star <= value ? "text-yellow-500" : "text-secondary/30"
          } ${editable ? "hover:text-yellow-400 cursor-pointer" : "cursor-default"}`}
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          star
        </button>
      ))}
    </div>
  );
}

import { ChevronDown } from "lucide-react";

/**
 * Reusable ShowMoreButton component.
 *
 * @param {Object} props
 * @param {Function} props.onClick - Handler called when the button is clicked.
 * @param {boolean} props.hasMore - Whether more items exist to be revealed. If false, renders null.
 * @param {number} [props.remainingCount] - Optional number of remaining unrevealed items.
 * @param {string} [props.buttonText="Show More"] - Custom button text.
 * @param {string} [props.className=""] - Additional custom classes.
 */
export default function ShowMoreButton({
  onClick,
  hasMore,
  remainingCount,
  buttonText = "Show More",
  className = "",
}) {
  if (!hasMore) return null;

  return (
    <div className="flex justify-center w-full pt-4 pb-2">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer group ${className}`}
      >
        <span>
          {buttonText}
          {typeof remainingCount === "number" && remainingCount > 0
            ? ` (${remainingCount} remaining)`
            : ""}
        </span>
        <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" />
      </button>
    </div>
  );
}

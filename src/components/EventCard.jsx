import { MapPin, Bookmark } from "lucide-react";
import { CATEGORY_META } from "../utils/eventCategoryMeta";

const fmt = (dateStr) => {
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: d.toLocaleString("default", { month: "short" }).toUpperCase(),
  };
};

export default function EventCard({ event, onSave, saved, onViewDetails }) {
  const meta = CATEGORY_META[event.category] || CATEGORY_META.ALL;
  const start = fmt(event.startDate);
  const end = fmt(event.endDate);
  const image = event.imageUrls?.[0];

  return (
    <div className="flex gap-4 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
      <div className="w-32 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {image ? (
          <img src={image} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center w-12 shrink-0 text-center">
        <span className="text-xl font-bold text-gray-900 leading-none">{start.day}</span>
        <span className="text-xs text-gray-500">{start.month}</span>
        <span className="text-gray-300 my-0.5">-</span>
        <span className="text-xl font-bold text-gray-900 leading-none">{end.day}</span>
        <span className="text-xs text-gray-500">{end.month}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${meta.badge}`}>
            {meta.label}
          </span>
          <button onClick={() => onSave(event.id)} className="text-gray-300 hover:text-gray-600">
            <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
        <h3 className="font-semibold text-gray-900 mt-1 truncate">{event.title}</h3>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          <MapPin size={12} /> {event.location}, {event.region}
        </p>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
      </div>

      <div className="flex items-center">
        <button
          onClick={() => onViewDetails(event.id)}
          className="border border-emerald-700 text-emerald-800 text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-emerald-50 whitespace-nowrap"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
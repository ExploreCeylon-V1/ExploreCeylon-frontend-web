import { MapPin, Bookmark, Plus } from "lucide-react";
import { CATEGORY_META } from "../utils/eventCategoryMeta";

const fmt = (dateStr) => {
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: d.toLocaleString("default", { month: "short" }).toUpperCase(),
  };
};

export default function EventCard({ event, onSave, saved, onViewDetails, onAddToTrip }) {
  const meta = CATEGORY_META[event.category] || CATEGORY_META.ALL;
  const start = fmt(event.startDate);
  const end = fmt(event.endDate);
  const image = event.imageUrls?.[0];

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 group">
      <div className="flex gap-3 sm:contents">
        <div className="w-28 h-24 sm:w-36 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-slate-100 relative">
          {image ? (
            <img src={image} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
              🎉 Sri Lanka Event
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center w-14 shrink-0 text-center bg-emerald-50/80 border border-emerald-100/80 rounded-xl p-2">
          <span className="text-xl font-black text-emerald-900 leading-none">{start.day}</span>
          <span className="text-3xs font-extrabold text-emerald-700 uppercase tracking-wider">{start.month}</span>
          <span className="text-emerald-300 my-0.5 text-xs font-bold">-</span>
          <span className="text-xl font-black text-emerald-900 leading-none">{end.day}</span>
          <span className="text-3xs font-extrabold text-emerald-700 uppercase tracking-wider">{end.month}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <span className={`inline-block px-2.5 py-1 rounded-lg text-3xs font-extrabold tracking-wider uppercase shadow-2xs ${meta.badge}`}>
              {meta.label}
            </span>
            <button 
              onClick={() => onSave(event.id)} 
              className={`p-1.5 rounded-lg transition-colors ${saved ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"}`}
              title={saved ? "Saved to Bookmark" : "Save Event"}
            >
              <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg mt-1 group-hover:text-emerald-800 transition-colors line-clamp-1">
            {event.title}
          </h3>
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
            <MapPin size={13} className="text-emerald-700" /> {event.location}, {event.region}
          </p>
          <p className="text-xs font-medium text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-slate-100 sm:border-t-0 sm:pt-0 sm:mt-0 flex-wrap sm:flex-nowrap">
          {onAddToTrip && (
            <button
              onClick={() => onAddToTrip(event)}
              className="w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Plus size={14} className="text-emerald-700" /> Add to Trip
            </button>
          )}
          <button
            onClick={() => onViewDetails(event.id)}
            className="w-full sm:w-auto bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md whitespace-nowrap text-center"
          >
            View Event Details →
          </button>
        </div>
      </div>
    </div>
  );
}
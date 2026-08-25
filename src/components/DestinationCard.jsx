import { getDestinationCategoryMeta } from './destinationCategories';
import { formatBestMonths } from '../utils/formatMonths';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1586183189334-1f3e3d7f0c0c?auto=format&fit=crop&w=800&q=60';

const DestinationCard = ({ destination, onExplore }) => {
  const categoryMeta = getDestinationCategoryMeta(destination.category);
  const image = destination.coverImageUrl || destination.imageUrls?.[0] || PLACEHOLDER_IMAGE;
  const ratingDisplay = destination.rating != null ? destination.rating.toFixed(1) : '—';
  const bestMonthsDisplay = formatBestMonths(destination.bestMonths);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col w-full h-full group">
      <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={image}
          alt={destination.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap z-10">
          <span className="inline-flex items-center gap-1 text-3xs font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-emerald-900/90 backdrop-blur-md text-emerald-200 border border-emerald-400/30 shadow-md">
            {categoryMeta.icon} {categoryMeta.label}
          </span>
          {destination.featured && (
            <span className="inline-flex items-center gap-1 text-3xs font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-amber-500 text-white shadow-md">
              ⭐ Featured
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2 p-5">
        <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors m-0 leading-tight">
          {destination.name}
        </h3>
        <p className="text-xs font-semibold text-slate-500 m-0 flex items-center gap-1">
          📍 {destination.district}, {destination.province}
        </p>
        <p className="text-xs font-medium text-slate-600 mt-1 mb-2 leading-relaxed line-clamp-2">
          {destination.shortDescription || destination.description}
        </p>

        <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
          <span className="text-amber-400">★</span>
          <strong>{ratingDisplay}</strong>
          {destination.reviewCount != null && (
            <span className="text-slate-400 font-normal">({destination.reviewCount} reviews)</span>
          )}
        </div>

        <div className="flex justify-between flex-wrap gap-2 text-xs font-semibold text-slate-500 mb-3 pt-2 border-t border-slate-100">
          {bestMonthsDisplay && <span>📅 Best: {bestMonthsDisplay}</span>}
          {destination.entryFee && <span>💰 {destination.entryFee}</span>}
        </div>

        <button
          type="button"
          onClick={() => onExplore?.(destination)}
          className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl py-2.5 transition-all shadow-sm hover:shadow-md mt-auto"
        >
          Explore Destination →
        </button>
      </div>
    </div>
  );
};

export default DestinationCard;
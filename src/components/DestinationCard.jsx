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
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150 flex flex-col w-full h-full">
      <div className="relative w-full aspect-[4/3] bg-gray-300 overflow-hidden">
        <img
          src={image}
          alt={destination.name}
          loading="lazy"
          className="w-full h-full object-cover block"
        />
        <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-gray-800">
            {categoryMeta.icon} {categoryMeta.label}
          </span>
          {destination.featured && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-400 text-white">
              ⭐ Featured
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1.5 p-4 sm:p-[18px]">
        <h3 className="text-lg font-bold text-gray-800 m-0">{destination.name}</h3>
        <p className="text-sm text-gray-500 m-0 flex items-center gap-1">
          📍 {destination.district}, {destination.province}
        </p>
        <p className="text-sm text-gray-600 mt-1 mb-2 leading-snug line-clamp-2">
          {destination.shortDescription || destination.description}
        </p>

        <div className="flex items-center gap-1 text-sm text-gray-700 mb-2">
          <span className="text-yellow-400">★</span>
          <strong>{ratingDisplay}</strong>
          {destination.reviewCount != null && (
            <span className="text-gray-400">({destination.reviewCount})</span>
          )}
        </div>

        <div className="flex justify-between flex-wrap gap-2 text-xs text-gray-500 mb-3">
          {bestMonthsDisplay && <span>📅 Best: {bestMonthsDisplay}</span>}
          {destination.entryFee && <span>💰 {destination.entryFee}</span>}
        </div>

        <button
          type="button"
          onClick={() => onExplore?.(destination)}
          className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-sm rounded-lg py-3 transition-colors duration-150 mt-auto"
        >
          Explore →
        </button>
      </div>
    </div>
  );
};

export default DestinationCard;
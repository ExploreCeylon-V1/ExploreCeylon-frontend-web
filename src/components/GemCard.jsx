import { getCategoryMeta } from './gemCategories';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1546484959-f9a381d1330d?auto=format&fit=crop&w=800&q=60';

const GemCard = ({ gem, viewMode = 'grid', onViewDetails }) => {
  const categoryMeta = getCategoryMeta(gem.category);
  const image = gem.imageUrls?.[0] || PLACEHOLDER_IMAGE;
  const ratingDisplay = gem.rating != null ? gem.rating.toFixed(1) : '—';
  const isList = viewMode === 'list';

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150 flex ${
        isList ? 'flex-col sm:flex-row' : 'flex-col'
      }`}
    >
      {/* Image */}
      <div
        className={`relative bg-gray-300 overflow-hidden flex-shrink-0 ${
          isList ? 'w-full sm:w-72 aspect-[4/3] sm:aspect-auto' : 'w-full aspect-[4/3]'
        }`}
      >
        <img
          src={image}
          alt={gem.title}
          loading="lazy"
          className="w-full h-full object-cover block"
        />
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#2D6A4F]/90 text-white">
          <span className="text-sm leading-none">{categoryMeta.icon}</span>
          {categoryMeta.label}
        </span>
        <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-gray-800">
          <span className="text-sm leading-none">★</span>
          {ratingDisplay}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col gap-1.5 p-4 sm:p-[18px]">
        <h3 className="text-lg font-bold text-gray-800 m-0">{gem.title}</h3>
        <p className="text-sm text-gray-500 m-0 flex items-center gap-1">
          <span>📍</span>
          {gem.district}
        </p>
        <p className="text-sm text-gray-600 mt-1 mb-2 leading-snug line-clamp-2">
          {gem.description}
        </p>

        <div className="flex justify-between flex-wrap gap-2 text-xs text-gray-500 mb-3">
          <span>🕒 Best: {gem.bestTime || 'Anytime'}</span>
          <span>👥 {gem.reviewCount ?? 0} visits</span>
        </div>

        <button
          type="button"
          onClick={() => onViewDetails?.(gem)}
          className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-sm rounded-lg py-3 transition-colors duration-150 mt-auto"
        >
          View Details →
        </button>
      </div>
    </div>
  );
};

export default GemCard;
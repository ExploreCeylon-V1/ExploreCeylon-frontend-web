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
      className={`bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex group ${
        isList ? 'flex-col sm:flex-row' : 'flex-col'
      }`}
    >
      {/* Image */}
      <div
        className={`relative bg-slate-100 overflow-hidden shrink-0 ${
          isList ? 'w-full sm:w-72 aspect-[4/3] sm:aspect-auto' : 'w-full aspect-[4/3]'
        }`}
      >
        <img
          src={image}
          alt={gem.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 text-3xs font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-emerald-900/90 backdrop-blur-md text-emerald-200 border border-emerald-400/30 shadow-md">
          <span className="text-xs leading-none">{categoryMeta.icon}</span>
          {categoryMeta.label}
        </span>
        <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-md text-slate-800 shadow-md">
          <span className="text-amber-400 leading-none">★</span>
          {ratingDisplay}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col gap-2 p-5">
        <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors m-0 leading-tight">
          {gem.title}
        </h3>
        <p className="text-xs font-semibold text-slate-500 m-0 flex items-center gap-1">
          <span>📍</span>
          {gem.district}
        </p>
        <p className="text-xs font-medium text-slate-600 mt-1 mb-2 leading-relaxed line-clamp-2">
          {gem.description}
        </p>

        <div className="flex justify-between flex-wrap gap-2 text-xs font-semibold text-slate-500 mb-3 pt-2 border-t border-slate-100">
          <span>🕒 Best: {gem.bestTime || 'Anytime'}</span>
          <span>👥 {gem.reviewCount ?? 0} visits</span>
        </div>

        <button
          type="button"
          onClick={() => onViewDetails?.(gem)}
          className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl py-2.5 transition-all shadow-sm hover:shadow-md mt-auto"
        >
          View Secret Spot →
        </button>
      </div>
    </div>
  );
};

export default GemCard;
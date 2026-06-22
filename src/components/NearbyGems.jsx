import { Link } from 'react-router-dom';
import { getCategoryMeta } from './gemCategories';

/**
 * NearbyGems
 * @param {Array} gems - pre-computed nearby gems, each with a distanceKm field
 *                        (see utils/geo.js getNearbyGems)
 */
const NearbyGems = ({ gems }) => {
  if (!gems?.length) return null;

  return (
    <div className="bg-white rounded-xl p-5 sm:p-6">
      <h2 className="font-bold text-gray-800 mb-4">More Hidden Gems Nearby</h2>
      <div className="flex flex-col">
        {gems.map((gem) => {
          const categoryMeta = getCategoryMeta(gem.category);
          const ratingDisplay = gem.rating != null ? gem.rating.toFixed(1) : '—';

          return (
            <div
              key={gem.id}
              className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="font-semibold text-gray-800 text-sm">{gem.title}</p>
                <p className="text-xs text-gray-500">
                  {gem.distanceKm.toFixed(0)}km · {categoryMeta.label} ·{' '}
                  <span className="text-yellow-500">★</span> {ratingDisplay}
                </p>
              </div>
              <Link
                to={`/hidden-gems/${gem.id}`}
                className="text-xs font-semibold border border-[#2D6A4F] text-[#2D6A4F] rounded-md px-3 py-1.5 hover:bg-[#2D6A4F] hover:text-white transition-colors duration-150 whitespace-nowrap"
              >
                View
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NearbyGems;
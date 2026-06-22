const GuideMiniCard = ({ guide }) => {
  const ratingDisplay = guide.rating != null ? guide.rating.toFixed(1) : '—';

  return (
    <div className="border border-gray-100 rounded-lg p-3 flex items-center gap-3">
      <img
        src={guide.photoUrl || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=100&q=60'}
        alt={guide.fullName}
        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{guide.fullName}</p>
        <p className="text-xs text-gray-500 truncate">{guide.specialties}</p>
        <p className="text-xs text-gray-600 mt-0.5">
          <span className="text-yellow-500">★</span> {ratingDisplay}
          {guide.pricePerDay != null && ` | $${guide.pricePerDay}/day`}
        </p>
      </div>
      <a
        href={`/guides/${guide.id}`}
        className="text-xs font-semibold border border-[#2D6A4F] text-[#2D6A4F] rounded-md px-3 py-1.5 hover:bg-[#2D6A4F] hover:text-white transition-colors duration-150 whitespace-nowrap"
      >
        Book →
      </a>
    </div>
  );
};

export default GuideMiniCard;
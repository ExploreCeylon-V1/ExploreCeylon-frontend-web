const TYPE_LABELS = {
  TUKTUK: "Tuk-Tuk",
  CAR: "Car",
  VAN: "Van",
  SUV: "SUV",
  SCOOTER: "Scooter",
  BUS: "Bus",
  MINIVAN: "Minivan",
};

const TYPE_COLORS = {
  TUKTUK: "bg-amber-600",
  CAR: "bg-teal-700",
  VAN: "bg-emerald-800",
  SUV: "bg-emerald-900",
  SCOOTER: "bg-orange-600",
  BUS: "bg-teal-800",
  MINIVAN: "bg-amber-700",
};

export default function VehicleCard({ vehicle, onViewDetails, layout = "grid" }) {
  const {
    id,
    name,
    type,
    district,
    seats,
    rating,
    reviewCount,
    driverName,
    driverLanguages,
    driverIncluded,
    pricePerDay,
    available,
    imageUrls,
  } = vehicle;

  const imageUrl =
    imageUrls?.length > 0
      ? imageUrls[0]
      : `https://placehold.co/400x240/1a5c38/white?text=${encodeURIComponent(name)}`;

  const typeLabel = TYPE_LABELS[type] || type;
  const typeBg = TYPE_COLORS[type] || "bg-slate-700";

  const hasAC = ["CAR", "VAN", "MINIVAN"].includes(type);
  const has4WD = type === "SUV";

  const badges = (
    <div className="flex flex-wrap gap-1.5">
      {driverIncluded && (
        <span className="text-xs font-semibold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
          ✔ Driver Included
        </span>
      )}
      {hasAC && (
        <span className="text-xs font-semibold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
          ✔ AC
        </span>
      )}
      {has4WD && (
        <span className="text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
          ✔ 4WD
        </span>
      )}
    </div>
  );

  const availabilityBadge = (
    <span
      className={`flex items-center gap-1.5 text-3xs font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full border shrink-0 backdrop-blur-md shadow-xs ${
        available
          ? "bg-emerald-500/90 text-white border-emerald-400/40"
          : "bg-rose-500/90 text-white border-rose-400/40"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${available ? "bg-emerald-200 animate-pulse" : "bg-rose-200"}`} />
      {available ? "Available" : "Unavailable"}
    </span>
  );

  if (layout === "list") {
    return (
      <div className="flex flex-col sm:flex-row bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group shadow-sm">
        {/* Image */}
        <div className="relative w-full h-48 sm:w-64 sm:h-auto shrink-0 overflow-hidden bg-slate-100">
          <img
            src={imageUrl}
            alt={name}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.src = `https://placehold.co/400x240/1a5c38/white?text=${encodeURIComponent(name)}`;
            }}
          />
          <span
            className={`absolute top-3 left-3 ${typeBg} text-white text-3xs font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-lg shadow-md border border-white/20 z-10`}
          >
            {typeLabel}
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 gap-2.5 p-5 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors">
              {name}
            </h3>
            {availabilityBadge}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
            <span>📍 {district}</span>
            <span>👥 {seats} Seats</span>
            {rating > 0 && (
              <span className="flex items-center gap-1 text-slate-800">
                <span className="text-amber-400">★</span> {rating.toFixed(1)}{" "}
                <span className="text-slate-400">({reviewCount})</span>
              </span>
            )}
          </div>

          {driverName && (
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <span>🧑 {driverName}</span>
              {driverLanguages && <span>🗣 {driverLanguages}</span>}
            </div>
          )}

          {badges}

          <div className="flex items-center justify-between gap-3 pt-3 mt-auto border-t border-slate-100 sm:justify-end">
            <div className="flex items-baseline gap-0.5 sm:mr-auto">
              <span className="text-2xl font-black text-slate-900">${pricePerDay}</span>
              <span className="text-xs font-semibold text-slate-400">/day</span>
            </div>
            <button
              onClick={() => onViewDetails(id)}
              className="px-4 py-2.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl transition-all shadow-sm hover:shadow-md shrink-0"
            >
              View Details →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-sm">
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={name}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.src = `https://placehold.co/400x240/1a5c38/white?text=${encodeURIComponent(name)}`;
          }}
        />
        <span
          className={`absolute top-3 left-3 ${typeBg} text-white text-3xs font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-lg shadow-md border border-white/20 z-10`}
        >
          {typeLabel}
        </span>
        <span className="absolute top-3 right-3 z-10">{availabilityBadge}</span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors">
          {name}
        </h3>

        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
          <span>📍 {district}</span>
          <span>👥 {seats} Seats</span>
          {rating > 0 && (
            <span className="flex items-center gap-1 text-slate-800">
              <span className="text-amber-400">★</span> {rating.toFixed(1)}{" "}
              <span className="text-slate-400">({reviewCount})</span>
            </span>
          )}
        </div>

        {driverName && (
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <span>🧑 {driverName}</span>
            {driverLanguages && <span>🗣 {driverLanguages}</span>}
          </div>
        )}

        {badges}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-100">
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl font-black text-slate-900">${pricePerDay}</span>
            <span className="text-xs font-semibold text-slate-400">/day</span>
          </div>
          <button
            onClick={() => onViewDetails(id)}
            className="px-4 py-2.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
}

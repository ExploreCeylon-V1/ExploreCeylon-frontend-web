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
  TUKTUK: "bg-orange-500",
  CAR: "bg-blue-600",
  VAN: "bg-purple-600",
  SUV: "bg-teal-600",
  SCOOTER: "bg-red-600",
  BUS: "bg-green-600",
  MINIVAN: "bg-orange-600",
};

export default function VehicleCard({ vehicle, onBook, onViewDetails }) {
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
    airportTransfer,
    pricePerDay,
    available,
    imageUrls,
  } = vehicle;

  const imageUrl =
    imageUrls?.length > 0
      ? imageUrls[0]
      : `https://placehold.co/400x240/1a5c38/white?text=${encodeURIComponent(name)}`;

  const typeLabel = TYPE_LABELS[type] || type;
  const typeBg = TYPE_COLORS[type] || "bg-gray-500";

  const hasAC = ["CAR", "VAN", "MINIVAN"].includes(type);
  const has4WD = type === "SUV";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="object-cover w-full h-full"
          onError={(e) => {
            e.target.src = `https://placehold.co/400x240/1a5c38/white?text=${encodeURIComponent(name)}`;
          }}
        />
        <span
          className={`absolute top-3 left-3 ${typeBg} text-white text-xs font-bold px-2.5 py-1 rounded`}
        >
          {typeLabel.toUpperCase()}
        </span>
        <span
          className={`absolute top-3 right-3 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
            available
              ? "bg-green-50 text-green-700 border-green-300"
              : "bg-red-50 text-red-600 border-red-300"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${available ? "bg-green-500" : "bg-red-500"}`}
          />
          {available ? "Available" : "Unavailable"}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <h3 className="text-base font-semibold text-gray-900">{name}</h3>

        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
          <span>📍 {district}</span>
          <span>👥 {seats} seats</span>
          {rating > 0 && (
            <span>
              ⭐ {rating.toFixed(1)}{" "}
              <span className="text-xs text-gray-400">({reviewCount})</span>
            </span>
          )}
        </div>

        {driverName && (
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            <span>🧑 {driverName}</span>
            {driverLanguages && <span>🗣 {driverLanguages}</span>}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {driverIncluded && (
            <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium">
              ✔ Driver Included
            </span>
          )}
          {airportTransfer && (
            <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium">
              ✔ Airport Transfer
            </span>
          )}
          {hasAC && (
            <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium">
              ✔ AC
            </span>
          )}
          {has4WD && (
            <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium">
              ✔ 4WD
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-bold text-gray-900">
              ${pricePerDay}
            </span>
            <span className="text-sm text-gray-400">/day</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onViewDetails(id)}
              className="px-3 py-1.5 text-sm font-medium border border-green-700 text-green-700 rounded-lg hover:bg-green-700 hover:text-white transition-colors"
            >
              View Details
            </button>
            <button
              onClick={() => available && onBook(vehicle)}
              disabled={!available}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                available
                  ? "bg-green-700 text-white hover:bg-green-800"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Book →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Calendar,
  Users,
  MapPin,
  Sparkles,
  Eye,
  PenSquare,
  Trash2,
  Share2,
  DollarSign,
  Star,
  MoreVertical,
} from "lucide-react";

export default function TripsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  // Backend එකෙන් එන data සේව් කරන්න state
  const [tripsData, setTripsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Backend API එකෙන් දත්ත ලබාගැනීම (Fetch Data)
  useEffect(() => {
    const fetchMyTrips = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. LocalStorage එකෙන් 'accessToken' කියන JSON string එක ගන්නවා
        const authDataString = localStorage.getItem("accessToken");
        let token = null;

        if (authDataString) {
          try {
            // JSON string එකක් නිසා ඒක object එකක් බවට parse කරලා ඒක ඇතුළේ තියෙන සැබෑ token එක ගන්නවා
            const authData = JSON.parse(authDataString);
            token = authData.accessToken || authData.token || authData;
          } catch (e) {
            // JSON parse කරන්න බැරි වුණොත් සාමාන්‍ය string එකක් ලෙස සලකා ගන්නවා
            token = authDataString;
          }
        }

        console.log("Extracted Actual JWT Token:", token);

        const response = await fetch("/api/v1/trips/my", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch trips from server");
        }

        const data = await response.json();

        // Backend එකෙන් කෙලින්ම Array එකක් වෙනුවට object එකක් ආවොත් ආරක්ෂිත වෙන්න handle කිරීම
        setTripsData(Array.isArray(data) ? data : data.trips || []);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyTrips();
  }, []);

  // Filter Logic (Case-Insensitive)
  const filteredTrips = tripsData.filter((trip) => {
    const matchesTab =
      activeTab === "All" ||
      trip.status?.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = trip.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Dynamic status counts ගණනය කිරීම
  const getCount = (status) => {
    if (status === "All") return tripsData.length;
    return tripsData.filter(
      (t) => t.status?.toLowerCase() === status.toLowerCase(),
    ).length;
  };

  // Status වලට අදාළ colors dynamic කිරීමට helper function එකක්
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "confirmed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-800 bg-gray-50">
      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Title & Create button */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
          <button className="bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 self-start sm:self-auto shadow-sm transition-all active:scale-95">
            <Plus className="w-4 h-4" /> Create New Trip
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["All", "Draft", "Confirmed", "Completed"].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition shadow-sm ${
                  isActive
                    ? "bg-emerald-800 text-white"
                    : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {tab === "All" ? "All Trips" : tab}
                <span
                  className={`px-1.5 py-0.5 rounded text-xs ${
                    isActive
                      ? "bg-emerald-950/40 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {getCount(tab)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trips by name..."
            className="w-full py-3 pl-12 pr-4 text-gray-700 placeholder-gray-400 transition bg-white border border-gray-200 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
          />
        </div>

        {/* 1. Data Loading අවස්ථාව පෙන්වීම */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 rounded-full border-emerald-600 border-t-transparent animate-spin"></div>
            <p className="mt-4 font-medium text-gray-500">
              Loading your trips...
            </p>
          </div>
        )}

        {/* 2. Error එකක් ආවොත් පෙන්වීම */}
        {error && !isLoading && (
          <div className="p-4 text-center text-red-700 border border-red-200 bg-red-50 rounded-2xl">
            <p className="font-medium">Something went wrong: {error}</p>
          </div>
        )}

        {/* 3. සාර්ථකව දත්ත ලැබුණු පසු Cards පෙන්වීම */}
        {!isLoading &&
          !error &&
          (filteredTrips.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex flex-col justify-between p-5 transition bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md"
                >
                  <div>
                    {/* Status Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className={`border text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 capitalize ${getStatusColor(trip.status)}`}
                      >
                        {trip.status?.toLowerCase()}
                      </span>
                      <button className="p-1 text-gray-400 transition rounded-full hover:text-gray-600 hover:bg-gray-50">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="flex items-center gap-2 mb-4 text-xl font-bold text-gray-900">
                      <span>{trip.emoji || "🗺️"}</span> {trip.title}
                    </h3>

                    {/* Details */}
                    <div className="space-y-2.5 text-sm text-gray-600 mb-5">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span>{trip.dates || "Dates not set"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span>
                          {trip.duration} | 👥 {trip.travelers}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-pink-500" />
                        <span>{trip.route}</span>
                      </div>
                      {trip.tags && trip.tags.length > 0 && (
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-700">
                            {trip.tags.join(" | ")}
                          </span>
                        </div>
                      )}

                      {trip.isAiGenerated && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-purple-50 text-purple-700 text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI Generated
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar (Draft) */}
                    {trip.status?.toLowerCase() === "draft" &&
                      trip.progress && (
                        <div className="pt-4 mb-5 border-t border-gray-100">
                          <div className="flex justify-between text-xs text-gray-500 font-medium mb-1.5">
                            <span>Progress:</span>
                            <span>{trip.progress.label}</span>
                          </div>
                          <div className="w-full h-2 overflow-hidden bg-gray-100 rounded-full">
                            <div
                              className="h-full transition-all duration-500 rounded-full bg-emerald-600"
                              style={{ width: `${trip.progress.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                    {/* Budget Progress (Confirmed) */}
                    {trip.status?.toLowerCase() === "confirmed" &&
                      trip.budget && (
                        <div className="pt-4 mb-5 border-t border-gray-100">
                          <div className="flex justify-between text-xs text-gray-500 font-medium mb-1.5">
                            <span>
                              Budget:{" "}
                              <strong className="text-gray-700">
                                ${trip.budget.set} set
                              </strong>
                            </span>
                            <span>
                              ${trip.budget.spent} spent (
                              <span className="text-emerald-600">
                                {trip.budget.percentage}%
                              </span>
                              )
                            </span>
                          </div>
                          <div className="w-full h-2 overflow-hidden bg-gray-100 rounded-full">
                            <div
                              className="h-full transition-all duration-500 rounded-full bg-emerald-600"
                              style={{ width: `${trip.budget.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                    {/* Total Spent (Completed) */}
                    {trip.status?.toLowerCase() === "completed" &&
                      trip.totalSpent && (
                        <div className="pt-4 mb-4 border-t border-gray-100">
                          <p className="mb-2 text-sm font-semibold text-gray-800">
                            Total spent: ${trip.totalSpent.spent} of $
                            {trip.totalSpent.total}
                          </p>
                          {trip.reviewPrompt && (
                            <a
                              href="#"
                              className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline"
                            >
                              <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />{" "}
                              {trip.reviewPrompt}
                            </a>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Actions buttons */}
                  {trip.actions && trip.actions.length > 0 && (
                    <div
                      className={`grid ${trip.actions.length === 1 ? "grid-cols-1" : "grid-cols-3"} gap-2 pt-2 border-t border-gray-100`}
                    >
                      {trip.actions.map((action) => {
                        let icon;
                        let customStyle =
                          "border border-gray-200 hover:bg-gray-50 text-gray-700";

                        if (action === "View")
                          icon = <Eye className="w-4 h-4" />;
                        if (action === "Edit")
                          icon = <PenSquare className="w-4 h-4" />;
                        if (action === "Delete") {
                          icon = <Trash2 className="w-4 h-4" />;
                          customStyle =
                            "border border-red-100 hover:bg-red-50 text-red-600";
                        }
                        if (action === "Share")
                          icon = <Share2 className="w-4 h-4" />;
                        if (action === "Budget")
                          icon = <DollarSign className="w-4 h-4" />;

                        return (
                          <button
                            key={action}
                            className={`${customStyle} py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition active:scale-95`}
                          >
                            {icon} {action}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-white border border-gray-200 shadow-sm rounded-2xl">
              <p className="font-medium text-gray-500">
                No trips found matching your criteria.
              </p>
            </div>
          ))}
      </main>
    </div>
  );
}

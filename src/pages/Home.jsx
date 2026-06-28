// 🚨 වැදගත්: useState සහ useEffect මෙතනට අලුතින් එකතු කර ඇත
import { Link, useNavigate } from "react-router-dom";
import heroImage from "../assets/Image.png";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <div
        className="relative flex flex-col items-center justify-center w-full min-h-screen px-4 text-center bg-center bg-cover"
        style={{
          // පසුබිම් රූපය සඳහා ලokal assets හි image.jpg භාවිතා කරයි
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${heroImage})`,
        }}
      >
        {/* Top Badge - Powered by GPT-4o AI */}
        <div className="absolute top-8 bg-black/40 border border-yellow-500/30 backdrop-blur-sm text-xs text-stone-300 px-4 py-1.5 rounded-full flex items-center gap-1.5 tracking-wide">
          <span className="text-sm text-yellow-500">🤖</span>
          <span>
            Powered by{" "}
            <span className="font-semibold text-white">GPT-4o AI</span>
          </span>
          <span className="text-yellow-500">★</span>
        </div>

        {/* Main Content Container */}
        <div className="flex flex-col items-center max-w-4xl mx-auto mt-12 space-y-6">
          {/* Main Heading */}
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white md:text-8xl drop-shadow-md">
            Discover Sri Lanka
          </h1>

          {/* Sub Heading */}
          <h2 className="text-3xl font-bold tracking-wide md:text-5xl text-amber-500 drop-shadow-md">
            Like Never Before
          </h2>

          {/* Description Paragraph */}
          <p className="max-w-xl mt-2 text-sm font-medium leading-relaxed md:text-base text-stone-200">
            AI-powered travel planning with real local data. <br />
            <span className="opacity-90">
              From ancient kingdoms to hidden beaches — your perfect Sri Lanka
              trip starts here.
            </span>
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col items-center w-full gap-4 pt-6 sm:flex-row sm:w-auto">
            {/* Primary Button: Generate AI Trip */}
            <button
              onClick={() => navigate("/create-trip")}
              className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-600 text-white font-medium px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 shadow-lg text-sm md:text-base"
            >
              {/* Sparkles Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 2a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0V6H3a1 1 0 110-2h1V3a1 1 0 011-1zm12 7a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1zm-11 2.5a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75v-.01zm4-7.5a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V7zm3.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1l7-7a1 1 0 000-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Generate AI Trip — Free
            </button>

            {/* Secondary Button: Browse Destinations */}
            {/* 🚨 ඔයාගේ Route එක /destinations නම් මෙතන /destinations ම තියන්න, View All එකේ තියෙන එකත් ඒකටම ගැලපෙන්න වෙනස් කරන්න */}
            <Link
              to="/destinations"
              className="w-full sm:w-auto bg-white hover:bg-stone-100 text-emerald-900 font-semibold px-8 py-3.5 rounded-lg transition-colors duration-200 shadow-lg text-sm md:text-base border border-stone-200 text-center block"
            >
              Browse Destinations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    "AI-powered itinerary planning",
    "Local tour & vehicle booking",
    "Exclusive hidden gem recommendations",
  ];

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#0b1220] px-6 py-12 font-sans md:px-8">
      <div className="grid w-full max-w-[1160px] grid-cols-1 items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        
        {/* ── LEFT CARD ── */}
        <div className="flex flex-col gap-7 rounded-[28px] bg-[#131e2e] p-8 md:p-11">
          <div className="flex w-fit items-center gap-2.5 rounded-full border border-white/10 bg-white/5 py-1.5 pl-2 pr-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a5c3a] text-sm font-bold text-white">E</span>
            <span className="text-sm font-medium text-[#d0d8e8]">ExploreCeylon</span>
          </div>
 
          <h1 className="m-0 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-[52px]">
            Discover Sri Lanka<br />with AI-powered<br />travel planning
          </h1>
 
          <p className="m-0 max-w-[440px] text-[15px] leading-[1.65] text-[#8a9ab8]">
            Plan the perfect Sri Lanka adventure, connect with local guides, and
            explore hidden gems—all in one place.
          </p>
 
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-3.5">
            {[
              { val: "12k+", label: "Happy Travelers" },
              { val: "4.9★", label: "Average Rating" },
              { val: "500+", label: "Destinations" }
            ].map(stat => (
              <div key={stat.label} className="flex flex-row items-center gap-4 rounded-[18px] bg-[#1a2840] p-4 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
                <span className="text-[26px] font-bold leading-none text-[#1db67c]">{stat.val}</span>
                <span className="text-[12.5px] leading-tight text-[#7888a4]">{stat.label}</span>
              </div>
            ))}
          </div>
 
          {/* CTA Buttons */}
          <div className="flex items-center gap-3.5">
            {!isAuthenticated ? (
              <>
                <button className="rounded-full bg-[#1db67c] px-7 py-3 text-[14.5px] font-semibold text-white transition-transform hover:-translate-y-px hover:opacity-90" onClick={() => navigate("/login")}>
                  Sign In
                </button>
                <button className="rounded-full border border-white/15 bg-white/10 px-7 py-3 text-[14.5px] font-semibold text-[#d0d8e8] transition-colors hover:bg-white/20" onClick={() => navigate("/register")}>
                  Sign Up
                </button>
              </>
            ) : (
              <button className="rounded-full bg-[#1db67c] px-7 py-3 text-[14.5px] font-semibold text-white transition-transform hover:-translate-y-px hover:opacity-90" onClick={() => navigate("/planner")}>
                Plan a Trip →
              </button>
            )}
          </div>
        </div>
 
        {/* ── RIGHT CARD ── */}
        <div className="flex h-full flex-col justify-center gap-4 rounded-[28px] bg-[#131e2e] p-8 md:p-10">
          <h2 className="m-0 text-2xl font-bold leading-snug text-white md:text-[32px]">
            Fast, friendly bookings for Sri Lanka
          </h2>
          <p className="m-0 text-sm leading-relaxed text-[#7888a4]">
            Access curated itineraries, local support, and hidden adventures
            from one modern travel dashboard.
          </p>
          <ul className="m-0 mt-3 flex flex-col gap-3 p-0">
            {features.map((f) => (
              <li key={f} className="rounded-xl bg-[#1a2840] px-5 py-4 text-sm font-medium tracking-wide text-[#c0cce0] transition-colors hover:bg-[#1e2f4a]">
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
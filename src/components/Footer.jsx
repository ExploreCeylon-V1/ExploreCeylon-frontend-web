import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  const exploreLinks = ["Destinations", "Hotels", "Vehicles", "Tour Guides", "Hidden Gems", "Calendar"];
  const planLinks = ["AI Trip Planner", "My Trips", "Budget Tracker", "Share Trip"];
  const supportLinks = ["About Us", "Contact", "Privacy Policy", "Terms of Service", "FAQ"];

  return (
    <footer className="bg-[#0f1923] font-sans text-[#1A2035]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:px-10 lg:pt-14">
        
        {/* Brand Column */}
        <div className="md:col-span-2 lg:col-span-1">
          <div className="mb-4 flex cursor-pointer items-center gap-2.5" onClick={() => navigate("/")}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#2D6A4F]">
              <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-white">ExploreCeylon</span>
          </div>
          <p className="mb-5 max-w-xs text-sm leading-relaxed text-[#8a93a2]">
            Your AI-powered Sri Lanka travel companion.
          </p>
          <div className="flex gap-2.5">
            {/* Social Icons - Facebook, Instagram, Twitter */}
            <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a3a4a] bg-[#1e2a36] text-[#8a93a2] transition-colors hover:border-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </a>
            <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a3a4a] bg-[#1e2a36] text-[#8a93a2] transition-colors hover:border-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" /></svg>
            </a>
          </div>
        </div>

        {/* Link Columns */}
        {[
          { title: "EXPLORE", links: exploreLinks },
          { title: "PLAN", links: planLinks },
          { title: "SUPPORT", links: supportLinks },
        ].map((col) => (
          <div key={col.title} className="pt-1">
            <h4 className="mb-4 text-xs font-bold tracking-[1.1px] text-white">{col.title}</h4>
            <ul className="flex flex-col gap-3">
              {col.links.map((link) => (
                <li key={link}>
                  <button 
                    className="text-left text-sm leading-none text-[#8a93a2] transition-colors hover:text-white"
                    onClick={() => navigate(`/${link.toLowerCase().replace(/ /g, '-')}`)}
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-7 lg:px-10">
        <div className="mb-5 h-px bg-[#1e2a36]" />
        <p className="text-center text-sm text-[#5a6472]">
          © 2026 ExploreCeylon. Built with <span className="text-red-500">❤</span> for Sri Lanka tourism
        </p>
      </div>
    </footer>
  );
}
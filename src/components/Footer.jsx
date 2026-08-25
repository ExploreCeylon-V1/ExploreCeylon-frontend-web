import { useNavigate } from "react-router-dom";
import logo from "../assets/EC_Logo.png";

export default function Footer() {
  const navigate = useNavigate();

  const exploreLinks = [
    "Destinations",
    "Hotels",
    "Vehicles",
    "Tour Guides",
    "Hidden Gems",
    "Events",
  ];
  const planLinks = [
    "AI Trip Planner",
    "My Trips",
    "Budget Tracker",
    "Share Trip",
  ];
  const supportLinks = [
    "About Us",
    "Contact",
    "Privacy Policy",
    "Terms of Service",
  ];

  const linkPathOverrides = {
    Destinations: "/destinations",
    Hotels: "/hotels",
    Vehicles: "/vehicles",
    "Tour Guides": "/guides",
    "Hidden Gems": "/hidden-gems",
    Events: "/events",
    "AI Trip Planner": "/trips/new",
    "My Trips": "/my-trips",
    "Budget Tracker": "/my-trips",
    "Share Trip": "/my-trips",
    "About Us": "/about",
    Contact: "/about",
    "Privacy Policy": "/privacy",
    "Terms of Service": "/terms",
  };

  return (
    <footer className="bg-[#0f1923] font-sans text-[#1A2035]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:px-10 lg:pt-14">
        {/* Brand Column */}
        <div className="md:col-span-2 lg:col-span-1">
          <div
            className="mb-4 flex cursor-pointer items-center gap-2.5"
            onClick={() => navigate("/")}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
              <img
                src={logo}
                alt="ExploreCeylon Logo"
                className="h-8 w-8 object-contain"
              />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              ExploreCeylon
            </span>
          </div>
          <p className="mb-5 max-w-xs text-sm leading-relaxed text-[#8a93a2]">
            Your AI-powered Sri Lanka travel companion for hotels, vehicles,
            guides, events & secret gems.
          </p>
        </div>

        {/* Link Columns */}
        {[
          { title: "EXPLORE", links: exploreLinks },
          { title: "PLAN", links: planLinks },
          { title: "SUPPORT", links: supportLinks },
        ].map((col) => (
          <div key={col.title} className="pt-1">
            <h4 className="mb-4 text-xs font-bold tracking-[1.1px] text-white">
              {col.title}
            </h4>
            <ul className="flex flex-col gap-3">
              {col.links.map((link) => (
                <li key={link}>
                  <button
                    className="text-left text-sm leading-none text-[#8a93a2] transition-colors hover:text-white"
                    onClick={() =>
                      navigate(
                        linkPathOverrides[link] ||
                          `/${link.toLowerCase().replace(/ /g, "-")}`,
                      )
                    }
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
          © 2026 ExploreCeylon. Built with{" "}
          <span className="text-red-500">❤</span> for Sri Lanka tourism
        </p>
      </div>
    </footer>
  );
}

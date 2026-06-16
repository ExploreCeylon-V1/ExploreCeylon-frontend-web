import Link from "next/link";

const footerLinks = {
  EXPLORE: [
    { label: "Destinations", href: "/destinations" },
    { label: "Hotels", href: "/hotels" },
    { label: "Vehicles", href: "/vehicles" },
    { label: "Tour Guides", href: "/guides" },
    { label: "Hidden Gems", href: "/hidden-gems" },
    { label: "Calendar", href: "/calendar" },
  ],
  PLAN: [
    { label: "AI Trip Planner", href: "/planner" },
    { label: "My Trips", href: "/trips" },
    { label: "Budget Tracker", href: "/budget" },
    { label: "Share Trip", href: "/share" },
  ],
  SUPPORT: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "FAQ", href: "/faq" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-700">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2C5 2 2 5 2 8s3 6 6 6 6-3 6-6-3-6-6-6z" fill="white" opacity="0.3"/>
                  <path d="M8 2c0 0-2 3-2 6s2 6 2 6 2-3 2-6-2-6-2-6z" fill="white"/>
                </svg>
              </div>
              <span className="font-semibold text-white text-[15px]">ExploreCeylon</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Your AI-powered Sri Lanka travel companion.
            </p>
            <div className="flex gap-3">
              {["facebook", "instagram", "twitter"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-slate-800 hover:bg-gray-600"
                  aria-label={social}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                    {social === "facebook" && <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>}
                    {social === "instagram" && <><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="#0f172a"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="#0f172a" strokeWidth="2"/></>}
                    {social === "twitter" && <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-semibold text-sm mb-4 tracking-wide">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
          © 2026 ExploreCeylon. Built with ❤️ for Sri Lanka tourism
        </div>
      </div>
    </footer>
  );
}
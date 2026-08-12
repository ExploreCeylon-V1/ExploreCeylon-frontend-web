import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import dhaneshPhoto from "../assets/dhanesh2.jpeg";
import punsisiPhoto from "../assets/punsisi.jpeg";
import shehanPhoto from "../assets/shehan.jpeg";
import kaveeshaPhoto from "../assets/kaveesha.jpeg";
import nethmiPhoto from "../assets/nethmi.jpeg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faGithub } from "@fortawesome/free-brands-svg-icons";

// ── Team Members ───────────────────────────────────────────
const TEAM = [
  {
    name: "Dhanesh Lakshan",
    role: "Founder & CEO",
    quote: '"Travel is the only thing you buy that makes you richer."',
    bio: "Visionary behind ExploreCeylon. Passionate about combining technology and travel to showcase the beauty of Sri Lanka to the world.",
    photo: dhaneshPhoto,
    initials: "DL",
    color: "from-[#1a5c2a] to-[#2d7a3a]",
    social: { linkedin: "https://www.linkedin.com/in/dhanesh-ganearachchi-9a0953381/", github: "https://github.com/dhanesh-lakshan" },
  },
  {
    name: "Kaveesha Gayanjana",
    role: "Co-Founder & CTO",
    quote: '"Code is poetry written for machines."',
    bio: "Leads the technical architecture of ExploreCeylon. Expert in building scalable backend systems and AI-powered travel solutions.",
    photo: kaveeshaPhoto,
    initials: "KG",
    color: "from-blue-600 to-blue-800",
    social: { linkedin: "https://www.linkedin.com/in/kaveesha-gayanjana-5a380331a/", github: "https://github.com/bhooz" },
  },
  {
    name: "Shehan Balasooriya",
    role: "Head of Design & UX",
    quote: '"Great design is invisible — it just feels right."',
    bio: "Crafts every pixel of the ExploreCeylon experience. Believes that beautiful interfaces inspire people to explore more.",
    photo: shehanPhoto,
    initials: "SB",
    color: "from-purple-600 to-purple-800",
    social: { linkedin: "#", github: "https://github.com/ShehanBalasooriya" },
  },
  {
    name: "Nethmi Rashipaba",
    role: "Head of Operations",
    quote:
      '"Efficiency is doing things right; effectiveness is doing the right things."',
    bio: "Manages guide partnerships, vehicle networks, and ensures every traveler gets the best Sri Lankan experience possible.",
    photo: nethmiPhoto,
    initials: "NR",
    color: "from-orange-500 to-orange-700",
    social: { linkedin: "https://www.linkedin.com/in/nethmi-rashipaba-00a7b3393/", github: "https://github.com/NRash07" },
  },
  {
    name: "Punsisi Jayasinghe",
    role: "Head of Marketing",
    quote: '"Stories inspire people to see the world differently."',
    bio: "Shares the magic of Sri Lanka with travelers around the globe through compelling stories, campaigns, and community building.",
    photo: punsisiPhoto,
    initials: "PJ",
    color: "from-pink-500 to-pink-700",
    social: { linkedin: "#", github: "https://github.com/PunsisiJayasinghe" },
  },
];

// ── Company Values ──────────────────────────────────────────
const VALUES = [
  {
    icon: "🌿",
    title: "Authentic Experiences",
    desc: "We connect travelers with real, local Sri Lankan culture — not tourist traps. Every recommendation comes from people who love this island.",
  },
  {
    icon: "🤖",
    title: "Smart Technology",
    desc: "Our AI-powered trip planner learns your preferences and creates personalized itineraries that feel handcrafted, not generated.",
  },
  {
    icon: "🤝",
    title: "Community First",
    desc: "We believe tourism should benefit local communities. Every booking directly supports Sri Lankan guides, drivers, and small businesses.",
  },
  {
    icon: "🔒",
    title: "Trust & Transparency",
    desc: "Clear pricing, verified guides, secure payments, and honest reviews. No hidden fees, no surprises — just great travel experiences.",
  },
];

// ── Milestones ──────────────────────────────────────────────
const MILESTONES = [
  {
    year: "2025",
    title: "The Idea",
    desc: "ExploreCeylon was born from a simple question: why is it so hard to plan an authentic Sri Lanka trip?",
  },
  {
    year: "2026",
    title: "Building",
    desc: "Our team of five spent months talking to travelers, guides, and local businesses to understand the real problems.",
  },
  {
    year: "2026",
    title: "AI Integration",
    desc: "We integrated our LLaMA-powered trip planner, making personalized itinerary generation possible for everyone.",
  },
  {
    year: "2026",
    title: "Going Live",
    desc: "ExploreCeylon launched with 500+ destinations, verified local guides, and a growing community of travelers.",
  },
];

// ── Contact Form ────────────────────────────────────────────
function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("Please fill in all required fields.");
      return;
    }
    setSending(true);
    setError(null);
    const API_BASE =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    try {
      const res = await fetch(`${API_BASE}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to send message");
      }

      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(err?.message || "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent)
    return (
      <div className="text-center py-10">
        <div
          className="w-16 h-16 bg-green-100 rounded-full flex items-center
                      justify-center mx-auto mb-4 text-3xl"
        >
          ✅
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Message Sent!</h3>
        <p className="text-sm text-gray-500">
          We'll get back to you within 24 hours.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setForm({ name: "", email: "", subject: "", message: "" });
          }}
          className="mt-4 px-5 py-2 border border-gray-200 rounded-xl text-sm
                   text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Send Another
        </button>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="bg-red-50 border border-red-200 rounded-xl px-4 py-3
                        text-sm text-red-700"
        >
          ⚠️ {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
            Full Name *
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="John Smith"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                       outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
            Email *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="john@email.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                       outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
          Subject
        </label>
        <input
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder="How can we help?"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                     outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
          Message *
        </label>
        <textarea
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Tell us more..."
          rows={4}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                     outline-none focus:border-[#1a5c2a] focus:ring-2
                     focus:ring-green-100 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="w-full py-3 bg-[#1a5c2a] hover:bg-[#14471f] text-white
                   rounded-xl text-sm font-semibold transition-colors
                   disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {sending ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sending…
          </>
        ) : (
          "Send Message →"
        )}
      </button>
    </form>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════
export default function AboutPage() {
  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        className="relative bg-[#1a5c2a] overflow-hidden min-h-[480px]
                          flex items-center"
      >
        {/* Decorative circles */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5
                        rounded-full translate-x-48 -translate-y-48 pointer-events-none"
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 bg-white/5
                        rounded-full -translate-x-20 translate-y-20 pointer-events-none"
        />

        <div className="relative max-w-6xl mx-auto px-6 py-20 w-full">
          <div className="max-w-2xl">
            <span
              className="inline-flex items-center gap-2 bg-white/15 text-green-200
                             text-xs font-semibold px-4 py-2 rounded-full mb-6"
            >
              🇱🇰 Sri Lanka's Smart Travel Companion
            </span>
            <h1
              className="text-4xl sm:text-5xl font-bold text-white mb-5
                           leading-tight"
            >
              We're on a Mission to
              <br />
              <span className="text-green-300">
                Share the Magic of Sri Lanka
              </span>
            </h1>
            <p className="text-green-100 text-base leading-relaxed mb-8 max-w-xl">
              ExploreCeylon was built by travelers, for travelers. We combine
              local expertise with AI-powered technology to make every Sri Lanka
              journey unforgettable.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link
                to="/trips/new"
                className="px-6 py-3 bg-white text-[#1a5c2a] rounded-xl font-semibold
                           text-sm hover:bg-green-50 transition-colors shadow-sm"
              >
                ✨ Start Planning
              </Link>
              <a
                href="#contact"
                className="px-6 py-3 border border-white/30 text-white rounded-xl
                           font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                📩 Get in Touch
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {[
              { value: "500+", label: "Destinations Covered", icon: "📍" },
              { value: "12K+", label: "Happy Travelers", icon: "😊" },
              { value: "4.9★", label: "Average Rating", icon: "⭐" },
              { value: "150+", label: "Verified Local Guides", icon: "👤" },
            ].map((s) => (
              <div key={s.label} className="text-center px-6 py-2">
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-2xl font-bold text-[#1a5c2a]">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR STORY ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span
              className="text-xs font-bold text-[#1a5c2a] uppercase
                             tracking-widest mb-3 block"
            >
              Our Story
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
              We Started With One Simple Question
            </h2>
            <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
              <p>
                It was 2025 when our founder Dhanesh Lakshan sat with four
                friends and asked:{" "}
                <em>
                  "Why is it so hard for tourists to discover the real Sri
                  Lanka?"
                </em>
              </p>
              <p>
                Existing travel platforms were either too generic or didn't
                connect travelers with the authentic experiences that make Sri
                Lanka truly special — the hidden beaches, the local tea estates,
                the centuries-old temples off the beaten path.
              </p>
              <p>
                We spent months talking to travelers, local guides, and small
                business owners. The insight was clear: what Sri Lanka needed
                wasn't just another booking platform — it needed a
                <strong className="text-gray-800">
                  {" "}
                  smart travel companion
                  {" "} 
                </strong>
                 that could understand each traveler's unique preferences and
                match them with authentic local experiences.
              </p>
              <p>
                That's how{" "}
                <strong className="text-gray-800">ExploreCeylon</strong> was
                born.
              </p>
            </div>
          </div>

          {/* Milestone timeline */}
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <div key={`${m.year}-${m.title}`} className="flex gap-6 relative">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1a5c2a]
                                  flex items-center justify-center text-white text-xs
                                  font-bold z-10 shadow-sm"
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#1a5c2a]">
                        {m.year}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900">
                        {m.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT WE BELIEVE ───────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span
              className="text-xs font-bold text-[#1a5c2a] uppercase
                             tracking-widest mb-3 block"
            >
              What We Believe
            </span>
            <h2 className="text-3xl font-bold text-gray-900">
              Our Values Guide Everything We Do
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl border border-gray-200 p-6
                           shadow-sm hover:shadow-md transition-shadow flex gap-5"
              >
                <div
                  className="w-12 h-12 bg-green-50 rounded-2xl flex items-center
                                justify-center text-2xl flex-shrink-0"
                >
                  {v.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span
            className="text-xs font-bold text-[#1a5c2a] uppercase
                           tracking-widest mb-3 block"
          >
            The People
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Meet the Team Behind ExploreCeylon
          </h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Five passionate individuals who share a love for technology, travel,
            and the beautiful island of Sri Lanka.
          </p>
        </div>

        {/* Founder — large card */}
        <div
          className="bg-white rounded-3xl border border-gray-200 shadow-sm
                        overflow-hidden mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Photo */}
            <div
              className="bg-gradient-to-br from-[#1a5c2a] to-[#2d7a3a]
                            h-72 md:h-80 flex items-center justify-center relative
                            overflow-hidden"
            >
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute top-0 right-0 w-48 h-48 bg-white
                                rounded-full translate-x-16 -translate-y-16"
                />
                <div
                  className="absolute bottom-0 left-0 w-32 h-32 bg-white
                                rounded-full -translate-x-10 translate-y-10"
                />
              </div>
              {TEAM[0].photo ? (
                <img
                  src={TEAM[0].photo}
                  alt={TEAM[0].name}
                  className="w-full h-full object-cover max-h-80"
                />
              ) : (
                <div className="text-center z-10">
                  <div
                    className="w-36 h-36 rounded-full bg-white/20 border-4
                                  border-white/30 flex items-center justify-center
                                  text-white text-4xl font-bold mx-auto mb-3"
                  >
                    {TEAM[0].initials}
                  </div>
                  <p className="text-white/60 text-xs">Photo coming soon</p>
                </div>
              )}
            </div>
            {/* Info */}
            <div className="p-8 flex flex-col justify-center">
              <span
                className="inline-block text-xs font-bold text-[#1a5c2a]
                               bg-green-50 px-3 py-1 rounded-full mb-4 w-fit"
              >
                {TEAM[0].role}
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {TEAM[0].name}
              </h3>
              <p className="text-sm text-gray-400 italic mb-4">
                {TEAM[0].quote}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                {TEAM[0].bio}
              </p>
              <div className="flex gap-3">
                <a
                  href={TEAM[0].social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="flex items-center gap-1.5 text-xs font-semibold
                             text-gray-600 border border-gray-200 px-4 py-2
                             rounded-xl hover:border-[#1a5c2a] hover:text-[#1a5c2a]
                             transition-colors"
                >
                  <FontAwesomeIcon icon={faLinkedin} size="lg" />
                  <span>LinkedIn</span>
                </a>
                <a
                  href={TEAM[0].social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="flex items-center gap-1.5 text-xs font-semibold
                             text-gray-600 border border-gray-200 px-4 py-2
                             rounded-xl hover:border-[#1a5c2a] hover:text-[#1a5c2a]
                             transition-colors"
                >
                  <FontAwesomeIcon icon={faGithub} size="lg" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of team — grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {TEAM.slice(1).map((member) => (
            <div
              key={member.name}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm
                         overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Photo area */}
              <div
                className={`h-64 bg-gradient-to-br ${member.color} relative
                              flex items-center justify-center overflow-hidden`}
              >
                <div className="absolute inset-0 opacity-10">
                  <div
                    className="absolute top-0 right-0 w-32 h-32 bg-white
                                  rounded-full translate-x-10 -translate-y-10"
                  />
                </div>
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105
                               transition-transform duration-300"
                  />
                ) : (
                  <div className="text-center z-10">
                    <div
                      className="w-20 h-20 rounded-full bg-white/20 border-4
                                    border-white/30 flex items-center justify-center
                                    text-white text-2xl font-bold mx-auto mb-2"
                    >
                      {member.initials}
                    </div>
                    <p className="text-white/50 text-[10px]">
                      Photo coming soon
                    </p>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5">
                <span
                  className="text-[10px] font-bold text-[#1a5c2a] bg-green-50
                                 px-2.5 py-1 rounded-full"
                >
                  {member.role}
                </span>
                <h3 className="font-bold text-gray-900 mt-2 mb-1 text-sm">
                  {member.name}
                </h3>
                <p className="text-[11px] text-gray-400 italic mb-2 line-clamp-1">
                  {member.quote}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                  {member.bio}
                </p>
                <div className="flex gap-2 mt-4">
                  <a
                    href={member.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-[10px] font-semibold
                               border border-gray-200 py-1.5 rounded-lg text-gray-500
                               hover:border-[#1a5c2a] hover:text-[#1a5c2a] transition-colors"
                  >
                    <FontAwesomeIcon icon={faLinkedin} />
                    <span>LinkedIn</span>
                  </a>
                  <a
                    href={member.social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-[10px] font-semibold
                               border border-gray-200 py-1.5 rounded-lg text-gray-500
                               hover:border-[#1a5c2a] hover:text-[#1a5c2a] transition-colors"
                  >
                    <FontAwesomeIcon icon={faGithub} />
                    <span>GitHub</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ───────────────────────────────────────── */}
      <section id="contact" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left */}
            <div>
              <span
                className="text-xs font-bold text-[#1a5c2a] uppercase
                               tracking-widest mb-3 block"
              >
                Contact Us
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                We'd Love to
                <br />
                Hear From You
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Questions about planning your Sri Lanka trip? Want to partner
                with us? Or just want to say hello? Our team is always here.
              </p>

              <div className="space-y-5">
                {[
                  {
                    icon: "📧",
                    label: "Email Us",
                    value: "exploreceylonadmin@gmail.com",
                    href: "mailto:exploreceylonadmin@gmail.com",
                  },
                  {
                    icon: "📞",
                    label: "Call Us",
                    value: "+94 72 623 6519",
                    href: "tel:+94726236519",
                  },
                  {
                    icon: "📍",
                    label: "Find Us",
                    value: "ExploreCeylon.com",
                    href: "http://exploreceylon.me:5173",
                    external: true,
                  },
                  {
                    icon: "🕐",
                    label: "Working Hours",
                    value: "24/7",
                    href: null,
                  },
                ].map((c) => (
                  <div key={c.label} className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 bg-white border border-gray-200
                                    rounded-xl flex items-center justify-center
                                    text-lg flex-shrink-0 shadow-sm"
                    >
                      {c.icon}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-0.5">
                        {c.label}
                      </p>
                      {c.href ? (
                        <a
                          href={c.href}
                          target={c.external ? "_blank" : undefined}
                          rel={c.external ? "noopener noreferrer" : undefined}
                          className="text-sm text-[#1a5c2a] font-bold hover:underline"
                        >
                          {c.value}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-700 font-medium">
                          {c.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-1">
                Send us a Message
              </h3>
              <p className="text-xs text-gray-400 mb-5">
                We typically respond within 24 hours.
              </p>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="bg-[#1a5c2a] py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute right-0 top-0 w-80 h-80 bg-white rounded-full
                          translate-x-32 -translate-y-32"
          />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            Your Sri Lanka Adventure Awaits
          </h2>
          <p className="text-green-200 text-sm mb-8 max-w-lg mx-auto">
            Join thousands of travelers who've discovered the magic of Sri Lanka
            through ExploreCeylon's AI-powered platform.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              to="/trips/new"
              className="px-7 py-3 bg-white text-[#1a5c2a] rounded-xl font-bold
                         text-sm hover:bg-green-50 transition-colors shadow-sm"
            >
              ✨ Plan My Trip for Free
            </Link>
            <Link
              to="/guides"
              className="px-7 py-3 border border-white/30 text-white rounded-xl
                         font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              👤 Browse Local Guides
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LegalSection from "../components/LegalSection";

// TODO: replace with the real publish date before launch.
const LAST_UPDATED = "08/02/2026";
const SUPPORT_EMAIL = "exploreceylonadmin@gmail.com";

const SECTIONS = [
  {
    title: "Introduction",
    blocks: [
      {
        type: "p",
        text: "This Privacy Policy explains how ExploreCeylon collects, uses, stores, and protects your personal data when you use our Platform. We are committed to protecting your privacy in accordance with applicable data protection laws, including Sri Lanka's Personal Data Protection Act (PDPA) No. 9 of 2022.",
      },
    ],
  },
  {
    title: "Information We Collect",
    blocks: [
      { type: "subheading", text: "Information you provide directly:" },
      {
        type: "list",
        items: [
          "Name, email address, phone number",
          "Account credentials (password stored in hashed/encrypted form)",
          "Booking details (dates, preferences, traveler information)",
          "Payment information (processed via PayHere; we do not store full card numbers)",
          "Messages sent through our contact form or in-app communication",
        ],
      },
      { type: "subheading", text: "Information collected automatically:" },
      {
        type: "list",
        items: [
          "Device and browser information",
          "IP address and approximate location",
          "Usage data (pages visited, features used, session duration)",
          "Cookies and similar tracking technologies",
        ],
      },
      { type: "subheading", text: "Information from third parties:" },
      {
        type: "list",
        items: [
          "If you sign in via Google OAuth, we receive your name, email, and profile picture as permitted by your Google account settings.",
          "Hotel availability and pricing data from our RapidAPI/Booking.com integration.",
        ],
      },
    ],
  },
  {
    title: "How We Use Your Information",
    blocks: [
      { type: "p", text: "We use your information to:" },
      {
        type: "list",
        items: [
          "Create and manage your account",
          "Process bookings and payments",
          "Provide customer support and respond to inquiries",
          "Send booking confirmations, updates, and (with consent) promotional communications",
          "Improve the Platform through analytics and AI-assisted features",
          "Detect and prevent fraud, abuse, and security incidents",
          "Comply with legal obligations",
        ],
      },
    ],
  },
  {
    title: "Legal Basis for Processing",
    blocks: [
      { type: "p", text: "We process your personal data based on:" },
      {
        type: "list",
        items: [
          <>
            <strong className="text-gray-800">Contractual necessity</strong>{" "}
            — to fulfill bookings and provide services you request
          </>,
          <>
            <strong className="text-gray-800">Consent</strong> — for
            marketing communications and optional features
          </>,
          <>
            <strong className="text-gray-800">Legitimate interests</strong> —
            to improve our services and ensure platform security
          </>,
          <>
            <strong className="text-gray-800">Legal obligation</strong> —
            where required by applicable law
          </>,
        ],
      },
    ],
  },
  {
    title: "How We Share Your Information",
    blocks: [
      { type: "p", text: "We may share your data with:" },
      {
        type: "list",
        items: [
          <>
            <strong className="text-gray-800">Service providers</strong>{" "}
            (vehicle owners, guides, hotels) — only the information
            necessary to fulfill your booking
          </>,
          <>
            <strong className="text-gray-800">Payment processors</strong>{" "}
            (PayHere) — to process transactions
          </>,
          <>
            <strong className="text-gray-800">
              Cloud infrastructure providers
            </strong>{" "}
            (AWS) — for secure data storage (images, documents)
          </>,
          <>
            <strong className="text-gray-800">AI service providers</strong>{" "}
            (Groq) — anonymized or pseudonymized data used to generate
            itinerary suggestions; we do not send unnecessary personal
            identifiers to AI processing
          </>,
          <>
            <strong className="text-gray-800">Legal authorities</strong> —
            where required by law or to protect our rights and the safety of
            users
          </>,
        ],
      },
      { type: "p", text: "We do not sell your personal data to third parties." },
    ],
  },
  {
    title: "Data Storage and Security",
    blocks: [
      {
        type: "list",
        items: [
          "Your data is stored on secure servers, with images and documents stored in AWS S3 (region: ap-south-1, Mumbai).",
          "We use industry-standard security measures, including encryption in transit (HTTPS) and access controls, to protect your data.",
          "Passwords are stored using secure hashing algorithms and are never stored in plain text.",
          "While we take reasonable steps to protect your data, no method of transmission or storage is 100% secure.",
        ],
      },
    ],
  },
  {
    title: "Data Retention",
    blocks: [
      {
        type: "p",
        text: "We retain your personal data for as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your account and associated data at any time, subject to legal retention requirements (e.g., financial records).",
      },
    ],
  },
  {
    title: "Your Rights",
    blocks: [
      {
        type: "p",
        text: "Under applicable data protection law, you have the right to:",
      },
      {
        type: "list",
        items: [
          "Access the personal data we hold about you",
          "Request correction of inaccurate data",
          'Request deletion of your data ("right to be forgotten"), subject to legal exceptions',
          "Object to or restrict certain processing",
          "Withdraw consent for marketing communications at any time",
          "Request a copy of your data in a portable format",
        ],
      },
      {
        type: "p",
        text: (
          <>
            To exercise these rights, contact us at{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-semibold text-[#1a5c2a] hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </>
        ),
      },
    ],
  },
  {
    title: "Cookies",
    blocks: [
      { type: "p", text: "We use cookies and similar technologies to:" },
      {
        type: "list",
        items: [
          "Keep you signed in",
          "Remember your preferences",
          "Analyze site usage to improve the Platform",
        ],
      },
      {
        type: "p",
        text: "You can control cookie preferences through your browser settings, though disabling cookies may affect Platform functionality.",
      },
    ],
  },
  {
    title: "Children's Privacy",
    blocks: [
      {
        type: "p",
        text: "The Platform is not directed at children under 18. We do not knowingly collect personal data from children. If we become aware that we have collected data from a child without parental consent, we will delete it promptly.",
      },
    ],
  },
  {
    title: "International Data Transfers",
    blocks: [
      {
        type: "p",
        text: "Where your data is transferred outside Sri Lanka (e.g., to AWS servers or third-party service providers), we take steps to ensure appropriate safeguards are in place in accordance with applicable law.",
      },
    ],
  },
  {
    title: "Changes to This Policy",
    blocks: [
      {
        type: "p",
        text: 'We may update this Privacy Policy periodically. We will notify you of material changes via email or a notice on the Platform. The "Last updated" date at the top reflects the most recent revision.',
      },
    ],
  },
  {
    title: "Contact Us",
    blocks: [
      {
        type: "p",
        text: "If you have questions or concerns about this Privacy Policy or how your data is handled, contact us at:",
      },
      {
        type: "list",
        items: [
          <>
            <strong className="text-gray-800">Email:</strong>{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-semibold text-[#1a5c2a] hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </>,
          <>
            <strong className="text-gray-800">Address:</strong>{" "}
            {SUPPORT_EMAIL}
          </>,
        ],
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="bg-[#1a5c2a] py-14">
        <div className="max-w-6xl mx-auto px-6">
          <span className="text-xs font-bold text-green-200 uppercase tracking-widest mb-3 block">
            Legal
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-green-100 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* ── CONTENT ──────────────────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10">
            {SECTIONS.map((section, i) => (
              <LegalSection
                key={section.title}
                number={i + 1}
                title={section.title}
                blocks={section.blocks}
              />
            ))}
          </div>

          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-xs text-amber-800 leading-relaxed italic">
            Disclaimer: This is a template draft prepared for a university
            project and general guidance purposes. Before publishing this on
            a live platform handling real user data and payments, it should
            be reviewed by a qualified legal professional familiar with Sri
            Lankan data protection and consumer protection law to ensure full
            compliance.
          </div>

          <p className="mt-6 text-sm text-gray-500 text-center">
            See also our{" "}
            <Link
              to="/terms"
              className="font-semibold text-[#1a5c2a] hover:underline"
            >
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}

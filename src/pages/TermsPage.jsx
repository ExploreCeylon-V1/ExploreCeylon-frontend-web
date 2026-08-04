import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LegalSection from "../components/LegalSection";

// TODO: replace with the real publish date before launch.
const LAST_UPDATED = "08/02/2026";
const SUPPORT_EMAIL = "exploreceylonadmin@gmail.com";

const SECTIONS = [
  {
    title: "Acceptance of Terms",
    blocks: [
      {
        type: "p",
        text: 'By creating an account, browsing, or making a booking through ExploreCeylon ("the Platform", "we", "us", "our"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.',
      },
    ],
  },
  {
    title: "Description of Service",
    blocks: [
      {
        type: "p",
        text: "ExploreCeylon is a tourism platform connecting travelers with vehicle rentals, tour guides, hotels, destinations, hidden gems, and events across Sri Lanka. We facilitate bookings and payments between travelers and service providers (vehicle owners, guides, hotels) but are not ourselves the provider of transportation, accommodation, or guiding services unless explicitly stated.",
      },
    ],
  },
  {
    title: "User Accounts",
    blocks: [
      {
        type: "list",
        items: [
          "You must provide accurate, current, and complete information when registering.",
          "You are responsible for maintaining the confidentiality of your account credentials.",
          "You must be at least 18 years old, or have parental/guardian consent, to create an account and make bookings.",
          "We reserve the right to suspend or terminate accounts that violate these Terms.",
        ],
      },
    ],
  },
  {
    title: "Bookings and Payments",
    blocks: [
      {
        type: "list",
        items: [
          "All bookings are subject to availability and confirmation by the relevant service provider.",
          "Payments are processed through PayHere, a third-party payment gateway. ExploreCeylon does not store your full payment card details.",
          "A booking is confirmed only after successful payment processing and confirmation from the provider.",
          "Prices displayed are in the currency shown at checkout and may be subject to change without notice until a booking is confirmed.",
        ],
      },
    ],
  },
  {
    title: "Cancellations and Refunds",
    blocks: [
      {
        type: "list",
        items: [
          "Cancellation policies vary by service provider (vehicle owner, guide, or hotel) and will be clearly stated at the time of booking.",
          "Refunds, where applicable, will be processed to the original payment method within a reasonable timeframe, subject to the specific provider's cancellation terms.",
          "ExploreCeylon reserves the right to cancel a booking in cases of fraud, provider unavailability, or violation of these Terms, with a full refund issued in such cases.",
        ],
      },
    ],
  },
  {
    title: "User Conduct",
    blocks: [
      { type: "p", text: "You agree not to:" },
      {
        type: "list",
        items: [
          "Provide false or misleading information.",
          "Use the Platform for any unlawful purpose.",
          "Attempt to circumvent booking or payment systems.",
          "Harass, abuse, or harm other users or service providers.",
          "Scrape, reverse-engineer, or misuse the Platform's data or infrastructure.",
        ],
      },
    ],
  },
  {
    title: "Service Provider Listings",
    blocks: [
      {
        type: "list",
        items: [
          "Hotels, vehicles, guides, and other listings are provided by third parties or curated by ExploreCeylon. While we take reasonable steps to verify listings, we do not guarantee the accuracy, quality, or safety of third-party services.",
          "Reviews and ratings reflect the opinions of individual users and not the views of ExploreCeylon.",
        ],
      },
    ],
  },
  {
    title: "AI-Assisted Features",
    blocks: [
      {
        type: "p",
        text: "ExploreCeylon offers AI-powered features (such as itinerary suggestions, festival and budget guidance) to assist with trip planning. These are provided for informational purposes only and should not be relied upon as the sole basis for travel decisions. Always verify critical details (opening hours, prices, safety conditions) independently.",
      },
    ],
  },
  {
    title: "Intellectual Property",
    blocks: [
      {
        type: "p",
        text: "All content on the Platform (except user-submitted content and third-party listings) — including text, graphics, logos, and software — is the property of ExploreCeylon or its licensors and may not be reproduced without permission.",
      },
    ],
  },
  {
    title: "Limitation of Liability",
    blocks: [
      {
        type: "p",
        text: "To the fullest extent permitted by law, ExploreCeylon is not liable for:",
      },
      {
        type: "list",
        items: [
          "Indirect, incidental, or consequential damages arising from use of the Platform.",
          "Actions, omissions, or quality of service of third-party providers (vehicle owners, guides, hotels).",
          "Loss or damage resulting from circumstances beyond our reasonable control (force majeure), including natural disasters, political unrest, or public health emergencies.",
        ],
      },
    ],
  },
  {
    title: "Changes to These Terms",
    blocks: [
      {
        type: "p",
        text: "We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the revised Terms. Material changes will be communicated via email or a notice on the Platform.",
      },
    ],
  },
  {
    title: "Governing Law",
    blocks: [
      {
        type: "p",
        text: "These Terms are governed by the laws of the Democratic Socialist Republic of Sri Lanka. Any disputes shall be subject to the exclusive jurisdiction of the courts of Sri Lanka.",
      },
    ],
  },
  {
    title: "Contact",
    blocks: [
      {
        type: "p",
        text: (
          <>
            For questions about these Terms, contact us at{" "}
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
];

export default function TermsPage() {
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
            Terms of Service
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
            project and general guidance purposes. Before publishing this on a
            live platform handling real user data and payments, it should be
            reviewed by a qualified legal professional familiar with Sri Lankan
            data protection and consumer protection law to ensure full
            compliance.
          </div>

          <p className="mt-6 text-sm text-gray-500 text-center">
            See also our{" "}
            <Link
              to="/privacy"
              className="font-semibold text-[#1a5c2a] hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}

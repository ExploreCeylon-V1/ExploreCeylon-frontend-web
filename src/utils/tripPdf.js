// tripPdf.js
// Modern, professional Full Trip PDF generator for ExploreCeylon.
// Client-side generation using jsPDF with direct file download (.pdf blob).
// Incorporates Phase 1 normalized currency utilities, time-slot bucketing,
// item type classification, Unicode safety, and robust auto-pagination.

import { jsPDF } from "jspdf";
import { formatMoney, formatDualCurrency, normalizeTripBudget } from "./currencyUtils.js";

const PAGE_MARGIN = 40;
const PAGE_WIDTH = 595.28;  // A4 width in pt
const PAGE_HEIGHT = 841.89; // A4 height in pt
const CONTENT_WIDTH = PAGE_WIDTH - (PAGE_MARGIN * 2);

// ExploreCeylon Design System Palette
const COLORS = {
  primary: [20, 83, 45],        // Deep Forest Green (#14532d)
  primaryLight: [236, 253, 245],// Very Light Mint (#ecfdf5)
  secondary: [5, 150, 105],     // Emerald Green (#059669)
  accentBg: [240, 253, 244],    // Soft Mint Background (#f0fdf4)
  textDark: [31, 41, 55],       // Charcoal Body (#1f2937)
  textMuted: [107, 114, 128],   // Gray Text (#6b7280)
  textLight: [156, 163, 175],   // Light Gray (#9ca3af)
  borderLight: [229, 231, 235], // Line Border (#e5e7eb)
  cardBg: [249, 250, 251],      // Card Fill (#f9fafb)
  // Type Badges
  gem: [124, 58, 237],          // Purple (#7c3aed)
  event: [225, 29, 72],         // Rose (#e11d48)
  destination: [5, 150, 105],   // Emerald (#059669)
  transport: [37, 99, 235],     // Blue (#2563eb)
};

/**
 * Sanitize text strings for safe jsPDF rendering.
 * Replaces non-standard quotes, dashes, and unsupported control glyphs.
 */
function sanitizeText(str = "") {
  if (!str) return "";
  return String(str)
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "•")
    .trim();
}

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return sanitizeText(String(d));
  return date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function cleanItemTitle(title = "") {
  return sanitizeText(title)
    .replace(/^Hidden Gem:\s*/i, "")
    .replace(/^Festival:\s*/i, "")
    .replace(/^\[(MORNING|AFTERNOON|EVENING)\]\s*/i, "")
    .split(" - ")[0]
    .trim();
}

function classifyItem(item) {
  const typeStr = String(item.type || "").toUpperCase();
  const titleStr = String(item.title || "").toLowerCase();

  if (typeStr === "GEM" || titleStr.includes("hidden gem:")) {
    return { label: "HIDDEN GEM", color: COLORS.gem, key: "GEM" };
  }
  if (typeStr === "EVENT" || titleStr.startsWith("festival:")) {
    return { label: "EVENT", color: COLORS.event, key: "EVENT" };
  }
  if (typeStr === "GUIDE" || typeStr === "VEHICLE" || typeStr === "TRANSPORT") {
    return { label: "TRANSPORT / GUIDE", color: COLORS.transport, key: "TRANSPORT" };
  }
  return { label: "DESTINATION", color: COLORS.destination, key: "DESTINATION" };
}

function parseItemNotes(item) {
  let notes = sanitizeText(item.notes || "");
  notes = notes.replace(/^\[(MORNING|AFTERNOON|EVENING)\]\s*/i, "").trim();
  return notes;
}

/**
 * Organizes a day's items into MORNING, AFTERNOON, and EVENING slots.
 */
function bucketItemsIntoSlots(items = []) {
  const morning = [];
  const afternoon = [];
  const evening = [];
  const unslotted = [];

  items.forEach(item => {
    const text = (String(item.title || "") + " " + String(item.notes || "")).toUpperCase();
    if (text.includes("[MORNING]")) {
      morning.push(item);
    } else if (text.includes("[AFTERNOON]")) {
      afternoon.push(item);
    } else if (text.includes("[EVENING]")) {
      evening.push(item);
    } else {
      unslotted.push(item);
    }
  });

  if (morning.length === 0 && afternoon.length === 0 && evening.length === 0 && unslotted.length > 0) {
    const per = Math.ceil(unslotted.length / 3);
    unslotted.forEach((item, i) => {
      if (i < per) morning.push(item);
      else if (i < per * 2) afternoon.push(item);
      else evening.push(item);
    });
  } else if (unslotted.length > 0) {
    afternoon.push(...unslotted);
  }

  return [
    { key: "MORNING", label: "MORNING", time: "08:00 AM – 12:00 PM", items: morning },
    { key: "AFTERNOON", label: "AFTERNOON", time: "12:00 PM – 04:30 PM", items: afternoon },
    { key: "EVENING", label: "EVENING", time: "04:30 PM – 08:00 PM", items: evening },
  ];
}

/**
 * Smart cursor writer tracking vertical position 'y' and auto-paginating.
 */
function createWriter(doc) {
  let y = PAGE_MARGIN;

  function ensureSpace(needed) {
    if (y + needed > PAGE_HEIGHT - PAGE_MARGIN - 30) {
      doc.addPage();
      y = PAGE_MARGIN + 20;
      return true;
    }
    return false;
  }

  function drawLine(color = COLORS.borderLight, width = 0.75) {
    ensureSpace(12);
    doc.setDrawColor(...color);
    doc.setLineWidth(width);
    doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
    y += 10;
  }

  function drawText(text, { size = 10, style = "normal", color = COLORS.textDark, align = "left", indent = 0, lineGap = 13 } = {}) {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);

    const availableWidth = CONTENT_WIDTH - indent;
    const lines = doc.splitTextToSize(sanitizeText(text), availableWidth);
    ensureSpace(lines.length * lineGap);

    let xPos = PAGE_MARGIN + indent;
    if (align === "right") xPos = PAGE_WIDTH - PAGE_MARGIN;
    else if (align === "center") xPos = PAGE_WIDTH / 2;

    doc.text(lines, xPos, y, { align });
    y += lines.length * lineGap;
    return y;
  }

  function spacer(amount = 8) {
    ensureSpace(amount);
    y += amount;
  }

  return {
    get y() { return y; },
    set y(val) { y = val; },
    ensureSpace,
    drawLine,
    drawText,
    spacer,
  };
}

export function downloadTripPdf(trip) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = createWriter(doc);

  // ── 1. Top Decorative Brand Banner ─────────────────────
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, 14, "F");
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 14, PAGE_WIDTH, 3, "F");
  w.y = 35;

  // Header Titles
  w.drawText("EXPLORECEYLON", { size: 9, style: "bold", color: COLORS.secondary });
  w.spacer(2);
  w.drawText(trip.title || "Sri Lanka Travel Itinerary", { size: 20, style: "bold", color: COLORS.primary });
  w.spacer(4);

  // Metadata Subtitle
  const datesStr = trip.startDate && trip.endDate
    ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`
    : "Dates TBD";
  const groupStr = `${trip.groupSize || 1} Traveler${(trip.groupSize || 1) > 1 ? "s" : ""}`;
  const routeStr = (trip.fromLocation || trip.toLocation)
    ? `  ·  Route: ${sanitizeText(trip.fromLocation || "Start")} → ${sanitizeText(trip.toLocation || "End")}`
    : "";

  w.drawText(`${datesStr}   ·   ${groupStr}${routeStr}`, { size: 10, color: COLORS.textMuted });
  w.spacer(8);
  w.drawLine(COLORS.borderLight, 1);
  w.spacer(6);

  // ── 2. Trip Overview Metrics Card ───────────────────────
  const days = trip.days || [];
  const allStops = days.flatMap(d => (d.items || []).map(i => ({ ...i, region: d.region })));
  
  const destCount = allStops.filter(s => classifyItem(s).key === "DESTINATION").length;
  const gemCount  = allStops.filter(s => classifyItem(s).key === "GEM").length;
  const eventCount = allStops.filter(s => classifyItem(s).key === "EVENT").length;
  const regions = [...new Set(days.map(d => d.region).filter(Boolean))];

  // Draw Summary Box
  w.ensureSpace(55);
  doc.setFillColor(...COLORS.accentBg);
  doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 50, 6, 6, "F");
  doc.setDrawColor(...COLORS.secondary);
  doc.setLineWidth(0.5);
  doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 50, 6, 6, "S");

  // Summary Metrics Grid Text
  const statBoxY = w.y + 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  
  doc.text(`${days.length} Days`, PAGE_MARGIN + 20, statBoxY);
  doc.text(`${destCount} Destinations`, PAGE_MARGIN + 120, statBoxY);
  doc.text(`${gemCount} Hidden Gems`, PAGE_MARGIN + 270, statBoxY);
  doc.text(`${eventCount} Events`, PAGE_MARGIN + 410, statBoxY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(
    regions.length ? `Regions: ${sanitizeText(regions.join(", "))}` : "Comprehensive Sri Lanka Tour",
    PAGE_MARGIN + 20, statBoxY + 18
  );

  w.y += 62;

  // ── 3. Day-by-Day Itinerary ──────────────────────────────
  w.drawText("DAY-BY-DAY ITINERARY", { size: 12, style: "bold", color: COLORS.primary });
  w.spacer(6);

  days.forEach(day => {
    // Check space for Day Header + at least 1 item
    w.ensureSpace(70);

    const dayTitle = `Day ${day.dayNumber} — ${formatDate(day.date)}${day.region ? ` · ${sanitizeText(day.region)}` : ""}`;
    const dayCost = day.estimatedDayCost ?? (day.items || []).reduce((s, i) => s + (i.cost || 0), 0);

    // Day Header Bar
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 22, 4, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(dayTitle, PAGE_MARGIN + 10, w.y + 15);

    doc.setFontSize(9.5);
    doc.text(`Subtotal: ${formatMoney(dayCost, "USD")}`, PAGE_WIDTH - PAGE_MARGIN - 10, w.y + 15, { align: "right" });

    w.y += 28;

    if (day.theme) {
      w.drawText(`Theme: ${sanitizeText(day.theme)}`, { size: 9, style: "italic", color: COLORS.textMuted, indent: 6 });
      w.spacer(2);
    }

    // Time-Slotted Items Breakdown (Morning / Afternoon / Evening)
    const slotGroups = bucketItemsIntoSlots(day.items || []);

    slotGroups.forEach(slot => {
      if (!slot.items.length) return;

      w.ensureSpace(30);

      // Slot Section Header
      w.drawText(`• ${slot.label} (${slot.time})`, { size: 9.5, style: "bold", color: COLORS.secondary, indent: 8 });
      w.spacer(3);

      slot.items.forEach(item => {
        w.ensureSpace(24);

        const kind = classifyItem(item);
        const name = cleanItemTitle(item.title);
        const costStr = item.cost > 0 ? formatMoney(item.cost, "USD") : "Included / Free";
        const notes = parseItemNotes(item);

        // Type Badge + Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...kind.color);
        doc.text(`[${kind.label}]`, PAGE_MARGIN + 16, w.y);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(...COLORS.textDark);
        doc.text(name, PAGE_MARGIN + 100, w.y);

        // Cost Right Aligned
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.textMuted);
        doc.text(costStr, PAGE_WIDTH - PAGE_MARGIN - 10, w.y, { align: "right" });

        w.y += 12;

        if (notes) {
          w.drawText(notes, { size: 8.5, style: "italic", color: COLORS.textMuted, indent: 100, lineGap: 10 });
        }
        w.spacer(3);
      });

      w.spacer(3);
    });

    if (day.tips) {
      w.drawText(`Tip: ${sanitizeText(day.tips)}`, { size: 8.5, style: "italic", color: [180, 83, 9], indent: 16 });
      w.spacer(4);
    }

    w.spacer(6);
    w.drawLine(COLORS.borderLight, 0.5);
    w.spacer(4);
  });

  // ── 4. Overall Budget & Summary Section ─────────────────
  w.ensureSpace(90);
  w.drawText("BUDGET & COST SUMMARY", { size: 12, style: "bold", color: COLORS.primary });
  w.spacer(6);

  const totalCost = days.reduce(
    (s, d) => s + (d.estimatedDayCost ?? (d.items || []).reduce((s2, i) => s2 + (i.cost || 0), 0)),
    0
  );
  const normalized = normalizeTripBudget(totalCost, trip.budgetAmountLkr);

  // Draw Budget Summary Card Box
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 64, 6, 6, "F");
  doc.setDrawColor(...COLORS.borderLight);
  doc.setLineWidth(1);
  doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 64, 6, 6, "S");

  const bBoxY = w.y + 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...COLORS.textDark);
  doc.text("Estimated Itinerary Total:", PAGE_MARGIN + 16, bBoxY);

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text(normalized.displayEstimatedTotal, PAGE_MARGIN + 170, bBoxY);

  if (normalized.displayUserBudget) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...COLORS.textDark);
    doc.text("Your Budget Target:", PAGE_MARGIN + 16, bBoxY + 22);

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.secondary);
    doc.text(normalized.displayUserBudget, PAGE_MARGIN + 170, bBoxY + 22);
  }

  w.y += 75;

  // ── 5. Page Numbers & Footers ───────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer dividing rule
    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineWidth(0.5);
    doc.line(PAGE_MARGIN, PAGE_HEIGHT - 28, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 28);

    // Footer Text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textLight);
    doc.text(
      "ExploreCeylon · Official AI-Powered Travel Itinerary",
      PAGE_MARGIN,
      PAGE_HEIGHT - 14
    );

    doc.text(
      `Page ${i} of ${pageCount}`,
      PAGE_WIDTH - PAGE_MARGIN,
      PAGE_HEIGHT - 14,
      { align: "right" }
    );
  }

  // Trigger direct browser binary file download
  const filenameSafe = sanitizeText(trip.title || "trip")
    .replace(/[^\w\- ]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  doc.save(`${filenameSafe || "ExploreCeylon_Trip"}.pdf`);
}

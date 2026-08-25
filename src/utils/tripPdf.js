// tripPdf.js
// Premium Sri Lankan Travel Itinerary PDF Generator for ExploreCeylon.
// Client-side generation using jsPDF with direct file download (.pdf blob).
// Features an ultra-clean luxury brochure layout, editorial typography,
// route visualization, lightweight time slots, type badges, Hidden Gem highlights,
// travel tip callouts, Unicode safety, and smart auto-pagination.
// NOTE: Budget summary section removed completely as per specification.

import { jsPDF } from "jspdf";
import { formatMoney } from "./currencyUtils.js";

const PAGE_MARGIN = 40;
const PAGE_WIDTH = 595.28;  // A4 width in pt
const PAGE_HEIGHT = 841.89; // A4 height in pt
const CONTENT_WIDTH = PAGE_WIDTH - (PAGE_MARGIN * 2);

// ExploreCeylon Refined Luxury Palette
const COLORS = {
  primary: [20, 83, 45],          // Deep Forest Green (#14532d)
  primaryDark: [15, 60, 32],      // Darker Forest (#0f3c20)
  secondary: [5, 150, 105],       // Emerald Green (#059669)
  sandBg: [254, 248, 238],        // Warm Sand / Cream (#fef8ee)
  sandBorder: [253, 230, 138],    // Warm Amber Border (#fde68a)
  cardBg: [250, 252, 250],        // Soft Off-White (#fafcfa)
  mintBg: [240, 253, 244],        // Soft Mint Accent (#f0fdf4)
  textDark: [17, 24, 39],         // Charcoal Body (#111827)
  textMuted: [107, 114, 128],     // Gray Text (#6b7280)
  textLight: [156, 163, 175],     // Light Gray (#9ca3af)
  borderLight: [229, 231, 235],   // Line Border (#e5e7eb)
  
  // Category Accents
  gemText: [124, 58, 237],        // Purple (#7c3aed)
  gemBg: [245, 243, 255],         // Soft Purple (#f5f3ff)
  gemBorder: [221, 214, 254],     // Purple Border (#ddd6fe)

  eventText: [225, 29, 72],       // Rose (#e11d48)
  eventBg: [255, 241, 242],       // Soft Rose (#fff1f2)
  eventBorder: [254, 205, 211],   // Rose Border (#fecdd3)

  transportText: [37, 99, 235],   // Blue (#2563eb)
  transportBg: [239, 246, 255],   // Soft Blue (#eff6ff)
  transportBorder: [191, 219, 254],// Blue Border (#bfdbfe)

  destText: [5, 150, 105],        // Emerald (#059669)
  destBg: [236, 253, 245],        // Soft Mint (#ecfdf5)
  destBorder: [167, 243, 208],    // Emerald Border (#a7f3d0)
};

/**
 * Sanitize text strings for safe jsPDF rendering.
 * Replaces non-standard quotes, dashes, bullets, and unsupported control glyphs.
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

function formatTripTitle(title = "") {
  let cleaned = sanitizeText(title)
    .replace(/\s+Trip$/i, "")
    .trim();
  if (!cleaned) return "Sri Lanka Travel Itinerary";

  // Capitalize title if all lowercase
  if (cleaned === cleaned.toLowerCase()) {
    cleaned = cleaned.replace(/\b\w/g, l => l.toUpperCase());
  }
  return cleaned;
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
    return {
      label: "✦ HIDDEN GEM",
      textColor: COLORS.gemText,
      bgColor: COLORS.gemBg,
      borderColor: COLORS.gemBorder,
      key: "GEM",
    };
  }
  if (typeStr === "EVENT" || titleStr.startsWith("festival:")) {
    return {
      label: "EVENT",
      textColor: COLORS.eventText,
      bgColor: COLORS.eventBg,
      borderColor: COLORS.eventBorder,
      key: "EVENT",
    };
  }
  if (typeStr === "GUIDE" || typeStr === "VEHICLE" || typeStr === "TRANSPORT") {
    return {
      label: "TRANSPORT / GUIDE",
      textColor: COLORS.transportText,
      bgColor: COLORS.transportBg,
      borderColor: COLORS.transportBorder,
      key: "TRANSPORT",
    };
  }
  return {
    label: "DESTINATION",
    textColor: COLORS.destText,
    bgColor: COLORS.destBg,
    borderColor: COLORS.destBorder,
    key: "DESTINATION",
  };
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
    { key: "MORNING", label: "MORNING", time: "08:00 AM — 12:00 PM", items: morning },
    { key: "AFTERNOON", label: "AFTERNOON", time: "12:00 PM — 04:30 PM", items: afternoon },
    { key: "EVENING", label: "EVENING", time: "04:30 PM — 08:00 PM", items: evening },
  ];
}

/**
 * Smart cursor writer tracking vertical position 'y' and auto-paginating.
 */
function createWriter(doc) {
  let y = PAGE_MARGIN;

  function ensureSpace(needed) {
    if (y + needed > PAGE_HEIGHT - PAGE_MARGIN - 35) {
      doc.addPage();
      drawTopPageAccent(doc);
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

function drawTopPageAccent(doc) {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, 8, "F");
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 8, PAGE_WIDTH, 2.5, "F");
}

function drawRouteArrow(doc, x1, y, x2, color = COLORS.secondary) {
  doc.setDrawColor(...color);
  doc.setLineWidth(1);
  doc.line(x1, y, x2 - 8, y);

  doc.setFillColor(...color);
  doc.triangle(x2 - 8, y - 3, x2 - 8, y + 3, x2, y, "F");
}

export function downloadTripPdf(trip) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = createWriter(doc);

  // ── 1. Editorial Cover & Brand Header ───────────────────
  drawTopPageAccent(doc);
  w.y = 30;

  // Brand Badge
  w.drawText("EXPLORECEYLON", { size: 9, style: "bold", color: COLORS.secondary });
  w.drawText("AI-POWERED TRAVEL PLANNING", { size: 7.5, style: "bold", color: COLORS.textMuted });
  w.spacer(6);

  // Large Trip Title
  const formattedTitle = formatTripTitle(trip.title);
  w.drawText(formattedTitle, { size: 22, style: "bold", color: COLORS.primary });
  w.drawText("Trip Itinerary", { size: 12, style: "italic", color: COLORS.textMuted });
  w.spacer(8);

  // Subtitle Metadata Row
  const datesStr = trip.startDate && trip.endDate
    ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`
    : "Dates TBD";
  const groupStr = `${trip.groupSize || 1} Traveler${(trip.groupSize || 1) > 1 ? "s" : ""}`;
  const styleStr = trip.travelStyle ? `  ·  ${sanitizeText(trip.travelStyle)}` : "";

  w.drawText(`${datesStr}   ·   ${groupStr}${styleStr}`, { size: 9.5, color: COLORS.textMuted });
  w.spacer(10);

  // Clean Route Visual Banner (No corrupted unicode arrows)
  const fromLoc = sanitizeText(trip.fromLocation || "Origin");
  const toLoc   = sanitizeText(trip.toLocation || "Destination");

  w.ensureSpace(40);
  doc.setFillColor(...COLORS.sandBg);
  doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 34, 5, 5, "F");
  doc.setDrawColor(...COLORS.sandBorder);
  doc.setLineWidth(0.5);
  doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 34, 5, 5, "S");

  // Route Origin Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text(fromLoc.toUpperCase(), PAGE_MARGIN + 16, w.y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("START", PAGE_MARGIN + 16, w.y + 26);

  // Center Arrow Line
  const arrowX1 = PAGE_MARGIN + 120;
  const arrowX2 = PAGE_WIDTH - PAGE_MARGIN - 120;
  drawRouteArrow(doc, arrowX1, w.y + 18, arrowX2, COLORS.secondary);

  // Route Destination Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text(toLoc.toUpperCase(), PAGE_WIDTH - PAGE_MARGIN - 16, w.y + 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("DESTINATION", PAGE_WIDTH - PAGE_MARGIN - 16, w.y + 26, { align: "right" });

  w.y += 46;
  w.drawLine(COLORS.borderLight, 0.75);
  w.spacer(6);

  // ── 2. Trip Overview (4 Stat Cards Grid) ─────────────────
  const days = trip.days || [];
  const allStops = days.flatMap(d => (d.items || []).map(i => ({ ...i, region: d.region })));
  
  const destCount  = allStops.filter(s => classifyItem(s).key === "DESTINATION").length;
  const gemCount   = allStops.filter(s => classifyItem(s).key === "GEM").length;
  const eventCount = allStops.filter(s => classifyItem(s).key === "EVENT").length;
  const regions    = [...new Set(days.map(d => d.region).filter(Boolean))];

  w.drawText("TRIP OVERVIEW", { size: 10.5, style: "bold", color: COLORS.primary });
  w.spacer(6);

  w.ensureSpace(45);
  const cardWidth = (CONTENT_WIDTH - 24) / 4;
  const stats = [
    { label: "DAYS", val: String(days.length).padStart(2, "0") },
    { label: "DESTINATIONS", val: String(destCount).padStart(2, "0") },
    { label: "HIDDEN GEMS", val: String(gemCount).padStart(2, "0") },
    { label: "EVENTS", val: String(eventCount).padStart(2, "0") },
  ];

  stats.forEach((st, idx) => {
    const cardX = PAGE_MARGIN + idx * (cardWidth + 8);
    
    doc.setFillColor(...COLORS.cardBg);
    doc.roundedRect(cardX, w.y, cardWidth, 38, 4, 4, "F");
    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineWidth(0.5);
    doc.roundedRect(cardX, w.y, cardWidth, 38, 4, 4, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...COLORS.primary);
    doc.text(st.val, cardX + 12, w.y + 20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(st.label, cardX + 12, w.y + 31);
  });

  w.y += 46;

  if (regions.length > 0) {
    w.drawText(`REGION: ${sanitizeText(regions.join("  ·  "))}`, { size: 8.5, style: "bold", color: COLORS.textMuted, indent: 2 });
    w.spacer(6);
  }

  w.drawLine(COLORS.borderLight, 0.75);
  w.spacer(8);

  // ── 3. Day-by-Day Itinerary ──────────────────────────────
  w.drawText("DAY-BY-DAY ITINERARY", { size: 11.5, style: "bold", color: COLORS.primary });
  w.spacer(8);

  days.forEach((day, dIdx) => {
    // Check space for Day Header + theme + first item
    w.ensureSpace(80);

    const dayNumStr = `DAY ${String(day.dayNumber || dIdx + 1).padStart(2, "0")}`;
    const dayDateStr = formatDate(day.date);
    const dayRegionStr = day.region ? sanitizeText(day.region).toUpperCase() : "";
    const dayCost = day.estimatedDayCost ?? (day.items || []).reduce((s, i) => s + (i.cost || 0), 0);

    // Premium Day Header Accent
    doc.setFillColor(...COLORS.primary);
    doc.rect(PAGE_MARGIN, w.y, 4, 22, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.primary);
    doc.text(dayNumStr, PAGE_MARGIN + 12, w.y + 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.textDark);
    const dateRegionText = `${dayDateStr}${dayRegionStr ? `  ·  ${dayRegionStr}` : ""}`;
    doc.text(dateRegionText, PAGE_MARGIN + 78, w.y + 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.primary);
    doc.text(`Subtotal: ${formatMoney(dayCost, "USD")}`, PAGE_WIDTH - PAGE_MARGIN, w.y + 16, { align: "right" });

    w.y += 26;

    // Day Theme (rendered only if not repetitive "Day 1: Region")
    const themeClean = sanitizeText(day.theme || "");
    const isRepetitiveTheme = /^Day\s+\d+:\s*/i.test(themeClean);
    if (day.theme && !isRepetitiveTheme) {
      w.drawText(themeClean, { size: 9, style: "italic", color: COLORS.textMuted, indent: 12 });
      w.spacer(4);
    }

    // Time Slot Breakdown (Morning, Afternoon, Evening)
    const slotGroups = bucketItemsIntoSlots(day.items || []);

    slotGroups.forEach(slot => {
      if (!slot.items.length) return;

      w.ensureSpace(32);

      // Lightweight Time Slot Heading with Dot Indicator
      doc.setFillColor(...COLORS.secondary);
      doc.circle(PAGE_MARGIN + 12, w.y + 4, 2.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.primary);
      doc.text(slot.label, PAGE_MARGIN + 20, w.y + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.textMuted);
      doc.text(`—  ${slot.time}`, PAGE_MARGIN + 82, w.y + 7);

      doc.setDrawColor(...COLORS.borderLight);
      doc.setLineWidth(0.5);
      doc.line(PAGE_MARGIN + 190, w.y + 5, PAGE_WIDTH - PAGE_MARGIN, w.y + 5);

      w.y += 18;

      slot.items.forEach(item => {
        const kind = classifyItem(item);
        const name = cleanItemTitle(item.title);
        const costStr = item.cost > 0 ? formatMoney(item.cost, "USD") : "INCLUDED · FREE";
        const notes = parseItemNotes(item);

        // Estimate wrapped lines for title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        const titleLines = doc.splitTextToSize(name, CONTENT_WIDTH - 170);
        const itemHeight = Math.max(32, 20 + titleLines.length * 12 + (notes ? 12 : 0));

        w.ensureSpace(itemHeight + 6);

        // Item Card Fill
        doc.setFillColor(...kind.bgColor);
        doc.roundedRect(PAGE_MARGIN + 8, w.y, CONTENT_WIDTH - 16, itemHeight, 4, 4, "F");

        // Left Category Accent Line
        doc.setFillColor(...kind.textColor);
        doc.rect(PAGE_MARGIN + 8, w.y, 3, itemHeight, "F");

        // Border stroke
        doc.setDrawColor(...kind.borderColor);
        doc.setLineWidth(0.5);
        doc.roundedRect(PAGE_MARGIN + 8, w.y, CONTENT_WIDTH - 16, itemHeight, 4, 4, "S");

        const cardTopY = w.y + 13;

        // Type Badge Pill Text
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...kind.textColor);
        doc.text(kind.label, PAGE_MARGIN + 18, cardTopY);

        // Title (wrapped)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.textDark);
        doc.text(titleLines, PAGE_MARGIN + 120, cardTopY);

        // Cost (Right aligned)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        if (item.cost > 0) {
          doc.setTextColor(...COLORS.primary);
          doc.text(costStr, PAGE_WIDTH - PAGE_MARGIN - 18, cardTopY, { align: "right" });
        } else {
          doc.setTextColor(...COLORS.secondary);
          doc.text("INCLUDED · FREE", PAGE_WIDTH - PAGE_MARGIN - 18, cardTopY, { align: "right" });
        }

        const notesY = cardTopY + (titleLines.length * 12) + 1;

        if (notes) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8.5);
          doc.setTextColor(...COLORS.textMuted);
          const noteLines = doc.splitTextToSize(notes, CONTENT_WIDTH - 150);
          doc.text(noteLines, PAGE_MARGIN + 120, notesY);
        }

        w.y += itemHeight + 6;
      });

      w.spacer(4);
    });

    // Travel Tip Editorial Callout Box (Omit generic pipeline system tips)
    const isSystemPipelineTip = /Optimized via ExploreCeylon|13-Phase Pipeline|AI travel planning pipeline/i.test(day.tips || "");
    if (day.tips && !isSystemPipelineTip) {
      w.ensureSpace(32);

      doc.setFillColor(...COLORS.sandBg);
      doc.roundedRect(PAGE_MARGIN + 4, w.y, CONTENT_WIDTH - 8, 26, 4, 4, "F");
      doc.setDrawColor(...COLORS.sandBorder);
      doc.setLineWidth(0.5);
      doc.roundedRect(PAGE_MARGIN + 4, w.y, CONTENT_WIDTH - 8, 26, 4, 4, "S");

      doc.setFillColor(217, 119, 6);
      doc.circle(PAGE_MARGIN + 16, w.y + 13, 2.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9);
      doc.text("TRAVEL TIP", PAGE_MARGIN + 24, w.y + 16);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.textDark);
      const tipText = sanitizeText(day.tips).replace(/^Tip:\s*/i, "");
      const tipLines = doc.splitTextToSize(tipText, CONTENT_WIDTH - 110);
      doc.text(tipLines, PAGE_MARGIN + 85, w.y + 16);

      w.y += 32;
    }

    w.spacer(6);
    w.drawLine(COLORS.borderLight, 0.5);
    w.spacer(6);
  });

  // ── 4. Page Numbers & Footers (Budget Section Completely Omitted) ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer dividing rule
    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineWidth(0.5);
    doc.line(PAGE_MARGIN, PAGE_HEIGHT - 28, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 28);

    // Minimal Footer Text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textLight);
    doc.text(
      "ExploreCeylon · AI-Powered Sri Lankan Travel Itinerary",
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

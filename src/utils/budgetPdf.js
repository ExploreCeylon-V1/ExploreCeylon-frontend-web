// budgetPdf.js
// Premium Travel Budget & Expense Report Generator for ExploreCeylon.
// Client-side generation using jsPDF with direct binary file download (.pdf blob).
// Features an ultra-clean luxury dashboard design, editorial typography,
// sanitized category labels (no corrupted Unicode emoji glyphs),
// 4 financial stat cards, budget health indicator, category spending progress bars,
// daily spending mini chart, expense timeline list, and dynamic pagination.

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
  sandBg: [254, 248, 238],        // Warm Sand / Ivory (#fef8ee)
  sandBorder: [253, 230, 138],    // Warm Amber Border (#fde68a)
  cardBg: [250, 252, 250],        // Soft Off-White Card (#fafcfa)
  mintBg: [240, 253, 244],        // Soft Mint Accent (#f0fdf4)
  accentBg: [240, 253, 244],      // Soft Mint Accent (#f0fdf4)
  textDark: [17, 24, 39],         // Charcoal Body (#111827)
  textMuted: [107, 114, 128],     // Gray Text (#6b7280)
  textLight: [156, 163, 175],     // Light Gray (#9ca3af)
  borderLight: [229, 231, 235],   // Line Border (#e5e7eb)
  trackGray: [229, 231, 235],     // Progress Track (#e5e7eb)

  // Status Health Colors
  onTrackText: [22, 101, 52],     // Green (#166534)
  onTrackBg: [220, 252, 231],     // Soft Green (#dcfce7)
  warningText: [180, 83, 9],      // Amber (#b45309)
  warningBg: [254, 243, 199],     // Soft Amber (#fef3c7)
  overText: [185, 28, 28],        // Red (#b91c1c)
  overBg: [254, 226, 226],        // Soft Red (#fee2e2)
};

// Category Badges & Clean Color Themes
const CAT_THEMES = {
  HOTEL:     { label: "HOTELS",     color: [30, 58, 95],   bg: [239, 246, 255] },
  VEHICLE:   { label: "VEHICLES",   color: [180, 83, 9],   bg: [254, 243, 199] },
  GUIDE:     { label: "GUIDES",     color: [124, 58, 237], bg: [245, 243, 255] },
  ACTIVITY:  { label: "ACTIVITIES", color: [5, 150, 105],  bg: [236, 253, 245] },
  FOOD:      { label: "FOOD",       color: [225, 29, 72],  bg: [255, 241, 242] },
  TRANSPORT: { label: "TRANSPORT",  color: [37, 99, 235],  bg: [239, 246, 255] },
  OTHER:     { label: "GENERAL",    color: [107, 114, 128],bg: [243, 244, 246] },
};

/**
 * Sanitize text strings for safe jsPDF rendering.
 * Strips unsupported Unicode emoji glyphs that corrupt built-in helvetica text rendering.
 */
function sanitizeText(str = "") {
  if (!str) return "";
  return String(str)
    // Strip non-printable emoji blocks that break helvetica fonts
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "•")
    .replace(/[^\x00-\x7F]/g, char => {
      const code = char.charCodeAt(0);
      if (code >= 0x0D80 && code <= 0x0DFF) return char; // Sinhala range
      if (code >= 0x0B80 && code <= 0x0BFF) return char; // Tamil range
      if (code >= 0x00A0 && code <= 0x024F) return char; // Latin accents
      return "";
    })
    .trim();
}

function formatReportTitle(title = "") {
  let cleaned = sanitizeText(title)
    .replace(/\s+Trip$/i, "")
    .trim();
  if (!cleaned) return "Sri Lanka Travel Trip";

  if (cleaned === cleaned.toLowerCase()) {
    cleaned = cleaned.replace(/\b\w/g, l => l.toUpperCase());
  }
  return cleaned;
}

function formatDate(d) {
  if (!d) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const date = new Date(d);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      });
    }
  }
  return sanitizeText(String(d));
}

function getCategoryTheme(catKey = "", label = "") {
  const upperKey = String(catKey || "").toUpperCase();
  if (CAT_THEMES[upperKey]) return CAT_THEMES[upperKey];
  
  const upperLabel = String(label || "").toUpperCase();
  if (upperLabel.includes("HOTEL")) return CAT_THEMES.HOTEL;
  if (upperLabel.includes("VEHICLE")) return CAT_THEMES.VEHICLE;
  if (upperLabel.includes("GUIDE")) return CAT_THEMES.GUIDE;
  if (upperLabel.includes("ACTIV")) return CAT_THEMES.ACTIVITY;
  if (upperLabel.includes("FOOD")) return CAT_THEMES.FOOD;
  if (upperLabel.includes("TRANS")) return CAT_THEMES.TRANSPORT;
  return CAT_THEMES.OTHER;
}

function drawTopPageAccent(doc) {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, 8, "F");
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 8, PAGE_WIDTH, 2.5, "F");
}

function drawProgressBar(doc, x, y, width, height, percent, fillColor, trackColor = COLORS.trackGray) {
  doc.setFillColor(...trackColor);
  doc.roundedRect(x, y, width, height, height / 2, height / 2, "F");

  const pct = Math.min(100, Math.max(0, percent));
  if (pct > 0) {
    const fillW = Math.max(height, (width * pct) / 100);
    doc.setFillColor(...fillColor);
    doc.roundedRect(x, y, fillW, height, height / 2, height / 2, "F");
  }
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

export function downloadBudgetPdf(data) {
  const {
    trip,
    tripTitle = "Sri Lanka Travel Trip",
    totalBudget = 0,
    totalSpent = 0,
    remaining = 0,
    dailyAvg = 0,
    level = "ON_TRACK",
    pctUsed = 0,
    perCategory = [],
    daily = [],
    unscheduledSpend = 0,
    expenses = [],
    tripDays = 1,
  } = data;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = createWriter(doc);

  // ── 1. Editorial Branding & Header ─────────────────────
  drawTopPageAccent(doc);
  w.y = 30;

  w.drawText("EXPLORECEYLON", { size: 9, style: "bold", color: COLORS.secondary });
  w.drawText("TRAVEL BUDGET & EXPENSE REPORT", { size: 7.5, style: "bold", color: COLORS.textMuted });
  w.spacer(6);

  const formattedTitle = formatReportTitle(tripTitle);
  w.drawText(formattedTitle, { size: 22, style: "bold", color: COLORS.primary });
  w.spacer(6);

  const datesStr = trip?.startDate && trip?.endDate
    ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`
    : "Dates TBD";
  const groupStr = trip?.groupSize ? `  ·  ${trip.groupSize} Traveler${trip.groupSize > 1 ? "s" : ""}` : "";
  const genDateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  w.drawText(`${datesStr}${groupStr}   ·   Report Date: ${genDateStr}`, { size: 9.5, color: COLORS.textMuted });
  w.spacer(10);
  w.drawLine(COLORS.borderLight, 0.75);
  w.spacer(8);

  // ── 2. Financial Overview Cards (4 Metric Cards) ────────
  w.drawText("FINANCIAL OVERVIEW", { size: 10.5, style: "bold", color: COLORS.primary });
  w.spacer(6);

  w.ensureSpace(50);
  const cardWidth = (CONTENT_WIDTH - 24) / 4;
  const remColor = remaining < 0 ? COLORS.overText : COLORS.primary;

  const summaryCards = [
    { label: "TOTAL BUDGET", val: formatMoney(totalBudget, "USD"), sub: "Target" },
    { label: "SPENT", val: formatMoney(totalSpent, "USD"), sub: `${pctUsed.toFixed(1)}% Used` },
    { label: "REMAINING", val: formatMoney(remaining, "USD"), sub: remaining < 0 ? "Over Budget" : "Available", valColor: remColor },
    { label: "DAILY AVERAGE", val: formatMoney(dailyAvg, "USD"), sub: "per day" },
  ];

  summaryCards.forEach((c, idx) => {
    const cardX = PAGE_MARGIN + idx * (cardWidth + 8);
    
    doc.setFillColor(...COLORS.cardBg);
    doc.roundedRect(cardX, w.y, cardWidth, 42, 4, 4, "F");
    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineWidth(0.5);
    doc.roundedRect(cardX, w.y, cardWidth, 42, 4, 4, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(c.label, cardX + 10, w.y + 13);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...(c.valColor || COLORS.primary));
    doc.text(c.val, cardX + 10, w.y + 27);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(c.sub, cardX + 10, w.y + 37);
  });

  w.y += 48;

  // ── 3. Budget Health Component ──────────────────────────
  w.ensureSpace(38);

  const healthBadge = level === "OVER"
    ? { text: "OVER BUDGET", bg: COLORS.overBg, color: COLORS.overText, barColor: COLORS.overText }
    : level === "WARNING"
      ? { text: "WARNING (≥80% SPENT)", bg: COLORS.warningBg, color: COLORS.warningText, barColor: COLORS.warningText }
      : { text: "ON TRACK", bg: COLORS.onTrackBg, color: COLORS.onTrackText, barColor: COLORS.secondary };

  doc.setFillColor(...COLORS.sandBg);
  doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 34, 5, 5, "F");
  doc.setDrawColor(...COLORS.sandBorder);
  doc.setLineWidth(0.5);
  doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 34, 5, 5, "S");

  // Health Title & Status Pill
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text(`BUDGET HEALTH  ·  ${pctUsed.toFixed(1)}% of budget spent`, PAGE_MARGIN + 12, w.y + 14);

  // Status Badge Pill Right
  doc.setFillColor(...healthBadge.bg);
  doc.roundedRect(PAGE_WIDTH - PAGE_MARGIN - 110, w.y + 5, 98, 14, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...healthBadge.color);
  doc.text(healthBadge.text, PAGE_WIDTH - PAGE_MARGIN - 61, w.y + 15, { align: "center" });

  // Health Bar
  drawProgressBar(doc, PAGE_MARGIN + 12, w.y + 22, CONTENT_WIDTH - 24, 6, pctUsed, healthBadge.barColor);

  w.y += 42;
  w.drawLine(COLORS.borderLight, 0.75);
  w.spacer(6);

  // ── 4. Spending by Category Dashboard ───────────────────
  w.drawText("SPENDING BY CATEGORY", { size: 10.5, style: "bold", color: COLORS.primary });
  w.spacer(6);

  const validCategories = perCategory.filter(c => c.budget > 0 || c.spent > 0);

  if (validCategories.length === 0) {
    w.drawText("No category allocations or expenses logged.", { size: 8.5, style: "italic", color: COLORS.textMuted, indent: 4 });
  } else {
    validCategories.forEach(c => {
      w.ensureSpace(26);

      const theme = getCategoryTheme(c.key, c.label);
      const cleanLabel = sanitizeText(c.label || theme.label).toUpperCase();
      const cPct = c.budget > 0 ? (c.spent / c.budget) * 100 : 0;
      const isOver = c.spent > c.budget && c.budget > 0;
      const barColor = isOver ? COLORS.overText : COLORS.secondary;

      // Category Pill Badge
      doc.setFillColor(...theme.bg);
      doc.roundedRect(PAGE_MARGIN + 4, w.y, 80, 15, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...theme.color);
      doc.text(cleanLabel, PAGE_MARGIN + 44, w.y + 11, { align: "center" });

      // Financial Text: $Spent / $Budget
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textDark);
      const spentStr = formatMoney(c.spent, "USD");
      const budgetStr = c.budget > 0 ? formatMoney(c.budget, "USD") : "No budget set";
      doc.text(`${spentStr} / ${budgetStr}`, PAGE_MARGIN + 95, w.y + 11);

      // Percentage Right
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      if (isOver) doc.setTextColor(...COLORS.overText);
      else doc.setTextColor(...COLORS.textMuted);
      doc.text(`${cPct.toFixed(0)}%`, PAGE_WIDTH - PAGE_MARGIN - 4, w.y + 11, { align: "right" });

      // Category Progress Bar
      drawProgressBar(doc, PAGE_MARGIN + 95, w.y + 16, CONTENT_WIDTH - 145, 5, cPct, barColor);

      w.y += 24;
    });
  }

  // Category Total Summary Bar
  w.ensureSpace(24);
  doc.setFillColor(...COLORS.accentBg);
  doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 22, 4, 4, "F");
  doc.setDrawColor(...COLORS.secondary);
  doc.setLineWidth(0.5);
  doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 22, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.primary);
  doc.text(
    `TOTAL CATEGORY SUMMARY: ${formatMoney(totalBudget, "USD")} Budget   ·   ${formatMoney(totalSpent, "USD")} Spent   ·   ${formatMoney(remaining, "USD")} Remaining`,
    PAGE_MARGIN + 12, w.y + 14
  );

  w.y += 30;
  w.drawLine(COLORS.borderLight, 0.75);
  w.spacer(6);

  // ── 5. Daily Spending Breakdown Visual Mini Chart ───────
  w.drawText("DAILY SPENDING BREAKDOWN", { size: 10.5, style: "bold", color: COLORS.primary });
  w.spacer(6);

  const scheduledDaily = daily.slice(0, tripDays);
  const maxDaily = Math.max(...scheduledDaily, unscheduledSpend, 1);

  scheduledDaily.forEach((v, i) => {
    w.ensureSpace(20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.textDark);
    doc.text(`DAY ${i + 1}`, PAGE_MARGIN + 4, w.y + 11);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.primary);
    doc.text(formatMoney(v, "USD"), PAGE_MARGIN + 55, w.y + 11);

    // Dynamic Chart Bar relative to maxDaily
    const barPct = (v / maxDaily) * 100;
    drawProgressBar(doc, PAGE_MARGIN + 120, w.y + 4, CONTENT_WIDTH - 124, 7, barPct, COLORS.secondary);

    w.y += 18;
  });

  // Dedicated Unscheduled Row
  if (unscheduledSpend > 0) {
    w.ensureSpace(20);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9);
    doc.text("UNSCHEDULED", PAGE_MARGIN + 4, w.y + 11);

    doc.setFont("helvetica", "bold");
    doc.text(formatMoney(unscheduledSpend, "USD"), PAGE_MARGIN + 75, w.y + 11);

    const barPct = (unscheduledSpend / maxDaily) * 100;
    drawProgressBar(doc, PAGE_MARGIN + 140, w.y + 4, CONTENT_WIDTH - 144, 7, barPct, [217, 119, 6]);

    w.y += 18;
  }

  // Reconciled Total Spending Summary Bar
  w.ensureSpace(22);
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 20, 4, 4, "F");
  doc.setDrawColor(...COLORS.borderLight);
  doc.setLineWidth(0.5);
  doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 20, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.primary);
  doc.text(`TOTAL RECONCILED DAILY SPENDING: ${formatMoney(totalSpent, "USD")}`, PAGE_MARGIN + 12, w.y + 13);

  w.y += 28;
  w.drawLine(COLORS.borderLight, 0.75);
  w.spacer(6);

  // ── 6. All Expenses Details Timeline ────────────────────
  w.drawText(`EXPENSE DETAILS (${expenses.length} Items)`, { size: 10.5, style: "bold", color: COLORS.primary });
  w.spacer(6);

  const sortedExpenses = [...expenses].sort((a, b) =>
    String(a.date || "").localeCompare(String(b.date || "")));

  if (sortedExpenses.length === 0) {
    w.drawText("No individual expenses logged.", { size: 8.5, style: "italic", color: COLORS.textMuted, indent: 4 });
  } else {
    sortedExpenses.forEach(e => {
      const titleClean = sanitizeText(e.title);
      const noteClean = sanitizeText(e.note);
      const dateStr = formatDate(e.date);
      const theme = getCategoryTheme(e.category);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      const titleLines = doc.splitTextToSize(titleClean, CONTENT_WIDTH - 180);
      const cardHeight = Math.max(26, 16 + titleLines.length * 11 + (noteClean ? 11 : 0));

      w.ensureSpace(cardHeight + 4);

      // Timeline Card Container
      doc.setFillColor(...COLORS.cardBg);
      doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, cardHeight, 4, 4, "F");

      // Left Theme Accent Bar
      doc.setFillColor(...theme.color);
      doc.rect(PAGE_MARGIN, w.y, 3, cardHeight, "F");

      doc.setDrawColor(...COLORS.borderLight);
      doc.setLineWidth(0.5);
      doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, cardHeight, 4, 4, "S");

      const cardTopY = w.y + 12;

      // Date
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textMuted);
      doc.text(dateStr.toUpperCase(), PAGE_MARGIN + 12, cardTopY);

      // Category Pill
      doc.setFillColor(...theme.bg);
      doc.roundedRect(PAGE_MARGIN + 75, cardTopY - 9, 60, 12, 2.5, 2.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...theme.color);
      doc.text(theme.label, PAGE_MARGIN + 105, cardTopY - 1, { align: "center" });

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.textDark);
      doc.text(titleLines, PAGE_MARGIN + 145, cardTopY);

      // AUTO Tag
      if (e.auto) {
        const autoX = PAGE_MARGIN + 145 + doc.getTextWidth(titleLines[0]) + 6;
        doc.setFillColor(219, 234, 254);
        doc.roundedRect(autoX, cardTopY - 9, 28, 11, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(29, 78, 216);
        doc.text("AUTO", autoX + 14, cardTopY - 1, { align: "center" });
      }

      // Notes
      if (noteClean) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.textMuted);
        const notesY = cardTopY + (titleLines.length * 11);
        doc.text(noteClean, PAGE_MARGIN + 145, notesY);
      }

      // Amount Right Aligned
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.primary);
      doc.text(formatMoney(e.amount, "USD"), PAGE_WIDTH - PAGE_MARGIN - 12, cardTopY, { align: "right" });

      w.y += cardHeight + 4;
    });
  }

  // Final Total Summary Card
  w.ensureSpace(24);
  doc.setFillColor(...COLORS.accentBg);
  doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 22, 4, 4, "F");
  doc.setDrawColor(...COLORS.secondary);
  doc.setLineWidth(0.5);
  doc.roundedRect(PAGE_MARGIN, w.y, CONTENT_WIDTH, 22, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.primary);
  doc.text(
    `TOTAL RECORDED EXPENSES: ${formatMoney(totalSpent, "USD")} (${expenses.length} expenses logged)`,
    PAGE_MARGIN + 12, w.y + 14
  );

  w.y += 30;

  // ── 7. Minimal Footer & Page Numbers ───────────────────
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
      "ExploreCeylon · Travel Budget & Expense Report",
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
  const filenameSafe = sanitizeText(tripTitle || "budget_report")
    .replace(/[^\w\- ]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  doc.save(`${filenameSafe || "ExploreCeylon_Budget"}_Report.pdf`);
}

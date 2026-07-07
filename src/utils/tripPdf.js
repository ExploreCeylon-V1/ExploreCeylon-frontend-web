// tripPdf.js
// Builds and downloads a structured, text-based PDF of a full trip
// itinerary (overview + day-by-day plan + budget breakdown). Generated
// client-side with jsPDF — no server round-trip, no DOM screenshotting.

import { jsPDF } from "jspdf";

const PAGE_MARGIN = 40;
const LINE_HEIGHT = 14;

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function cleanItemTitle(title = "") {
  return title
    .replace(/^Hidden Gem:\s*/i, "")
    .replace(/^Festival:\s*/i, "")
    .split(" - ")[0]
    .trim();
}

function classifyItem(item) {
  if (item.type === "GEM") return "Hidden Gem";
  if (item.title?.startsWith("Festival:")) return "Event";
  return "Destination";
}

// Writer that tracks the vertical cursor and auto-paginates when content
// would overflow the page — every text/line-drawing call goes through
// this instead of touching doc.text() directly with a raw y value.
function createWriter(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  function ensureSpace(needed) {
    if (y + needed > pageHeight - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  }

  function text(str, { size = 10, style = "normal", color = [40, 40, 40], gap = LINE_HEIGHT, indent = 0 } = {}) {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(str, contentWidth - indent);
    ensureSpace(lines.length * gap);
    doc.text(lines, PAGE_MARGIN + indent, y);
    y += lines.length * gap;
    return y;
  }

  function spacer(amount = 8) {
    y += amount;
  }

  function rule(color = [225, 228, 224]) {
    ensureSpace(10);
    doc.setDrawColor(...color);
    doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
    y += 10;
  }

  return { text, spacer, rule, ensureSpace, get y() { return y; }, contentWidth, pageWidth };
}

export function downloadTripPdf(trip) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = createWriter(doc);

  // ── Header ─────────────────────────────────────────────
  w.text(trip.title || "My Trip", { size: 20, style: "bold", color: [30, 60, 45] });
  w.text(
    `${formatDate(trip.startDate)} — ${formatDate(trip.endDate)}   ·   ${trip.groupSize || 1} traveler${trip.groupSize > 1 ? "s" : ""}`,
    { size: 10.5, color: [110, 118, 112] }
  );
  if (trip.fromLocation || trip.toLocation) {
    w.text(
      `Route: ${trip.fromLocation || "—"}  →  ${trip.toLocation || "—"}`,
      { size: 10.5, color: [110, 118, 112] }
    );
  }
  w.spacer(6);
  w.rule();
  w.spacer(6);

  // ── Trip overview ──────────────────────────────────────
  const days = trip.days || [];
  const allStops = days.flatMap(day =>
    (day.items || []).map(item => ({ ...item, dayNumber: day.dayNumber, date: day.date, region: day.region }))
  );
  const destCount = allStops.filter(s => classifyItem(s) === "Destination").length;
  const gemCount = allStops.filter(s => classifyItem(s) === "Hidden Gem").length;
  const eventCount = allStops.filter(s => classifyItem(s) === "Event").length;
  const regions = [...new Set(days.map(d => d.region).filter(Boolean))];

  w.text("Trip Overview", { size: 13, style: "bold", color: [30, 60, 45] });
  w.spacer(2);
  const summary = `This ${days.length}-day journey ${trip.fromLocation && trip.toLocation
    ? `takes you from ${trip.fromLocation} to ${trip.toLocation}` : "explores Sri Lanka"}`
    + (regions.length ? `, passing through ${regions.join(", ")}` : "") + ". "
    + [
        destCount > 0 && `${destCount} destination${destCount > 1 ? "s" : ""}`,
        gemCount > 0 && `${gemCount} hidden gem${gemCount > 1 ? "s" : ""}`,
        eventCount > 0 && `${eventCount} event${eventCount > 1 ? "s" : ""}`,
      ].filter(Boolean).join(", ");
  w.text(summary, { size: 10, color: [70, 78, 72] });
  w.spacer(10);

  // ── Day-by-day plan ────────────────────────────────────
  w.text("Day-by-Day Plan", { size: 13, style: "bold", color: [30, 60, 45] });
  w.spacer(4);

  days.forEach(day => {
    w.ensureSpace(30);
    w.rule([235, 237, 233]);
    w.text(
      `Day ${day.dayNumber} — ${formatDate(day.date)}${day.region ? `  ·  ${day.region}` : ""}`,
      { size: 11.5, style: "bold", color: [20, 30, 22] }
    );
    if (day.theme) {
      w.text(day.theme, { size: 9.5, style: "italic", color: [130, 138, 132] });
    }
    w.spacer(3);

    (day.items || []).forEach(item => {
      const kind = classifyItem(item);
      const name = cleanItemTitle(item.title);
      const cost = item.cost > 0 ? `$${item.cost.toFixed(2)}` : "Free";
      w.text(`•  ${name}   (${kind} — ${cost})`, { size: 10, color: [50, 58, 52], indent: 8 });
      if (item.notes) {
        w.text(item.notes, { size: 8.5, style: "italic", color: [140, 146, 140], indent: 18, gap: 11 });
      }
    });

    if (day.tips) {
      w.spacer(2);
      w.text(`Tip: ${day.tips}`, { size: 9, style: "italic", color: [150, 120, 40], indent: 8 });
    }

    const dayCost = (day.items || []).reduce((s, i) => s + (i.cost || 0), 0);
    w.spacer(2);
    w.text(`Day total: $${dayCost.toFixed(2)}`, { size: 9.5, style: "bold", color: [30, 60, 45], indent: 8 });
    w.spacer(8);
  });

  // ── Budget summary ─────────────────────────────────────
  w.spacer(6);
  w.rule();
  w.text("Budget Summary", { size: 13, style: "bold", color: [30, 60, 45] });
  w.spacer(4);

  const totalCost = days.reduce((s, d) => s + (d.estimatedDayCost ?? (d.items || []).reduce((s2, i) => s2 + (i.cost || 0), 0)), 0);
  days.forEach(day => {
    const dayCost = day.estimatedDayCost ?? (day.items || []).reduce((s, i) => s + (i.cost || 0), 0);
    w.text(`Day ${day.dayNumber} (${day.region || "—"}):   $${dayCost.toFixed(2)}`, { size: 9.5, color: [70, 78, 72], indent: 8 });
  });
  w.spacer(4);
  w.text(`Estimated Total: $${totalCost.toFixed(2)}`, { size: 11.5, style: "bold", color: [20, 30, 22] });
  if (trip.budgetAmountLkr) {
    w.text(`Your Budget: LKR ${trip.budgetAmountLkr.toLocaleString()}`, { size: 10, color: [70, 78, 72] });
  }

  // ── Footer (page numbers) ───────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(170, 175, 170);
    doc.text(
      `ExploreCeylon  ·  Page ${i} of ${pageCount}`,
      w.pageWidth / 2,
      doc.internal.pageSize.getHeight() - 18,
      { align: "center" }
    );
  }

  const filenameSafe = (trip.title || "trip").replace(/[^\w\- ]/g, "").trim().replace(/\s+/g, "_");
  doc.save(`${filenameSafe || "trip"}.pdf`);
}

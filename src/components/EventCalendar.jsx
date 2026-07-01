import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toKey = (y, m, d) => {
  const dt = new Date(y, m, d);
  return dt.toISOString().slice(0, 10);
};

export default function EventCalendar({
  viewDate,
  setViewDate,
  selectedDate,
  setSelectedDate,
  eventDates, // Set<"YYYY-MM-DD">
}) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const cells = [];

    // Prev month filler
    for (let i = firstDay - 1; i >= 0; i--)
      cells.push({ day: daysInPrev - i, current: false });

    // Current month
    for (let d = 1; d <= daysInMonth; d++)
      cells.push({ day: d, current: true });

    // Next month filler
    while (cells.length % 7 !== 0)
      cells.push({ day: cells.length - firstDay - daysInMonth + 1, current: false });

    return cells;
  }, [year, month]);

  const today = new Date();
  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const isSelected = (d) =>
    selectedDate &&
    d === selectedDate.getDate() &&
    month === selectedDate.getMonth() &&
    year === selectedDate.getFullYear();

  const changeMonth = (delta) => setViewDate(new Date(year, month + delta, 1));

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-gray-900">
          {viewDate.toLocaleString("default", { month: "long" })} {year}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2 select-none">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
        {days.map((cell, idx) => {
          if (!cell.current) {
            return (
              <div key={idx} className="h-9 flex items-center justify-center text-gray-300 text-sm">
                {cell.day}
              </div>
            );
          }

          const key = toKey(year, month, cell.day);
          const hasEvent = eventDates.has(key);
          const selected = isSelected(cell.day);
          const todayCell = isToday(cell.day);

          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(new Date(year, month, cell.day))}
              className={`relative h-9 w-9 mx-auto flex items-center justify-center rounded-full text-sm
                transition-colors duration-100
                ${selected
                  ? "bg-emerald-800 text-white font-semibold"
                  : todayCell
                  ? "ring-2 ring-emerald-700 text-emerald-800 font-semibold hover:bg-emerald-50"
                  : hasEvent
                  ? "text-emerald-800 font-medium hover:bg-emerald-50"
                  : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {cell.day}
              {/* Event dot — hide if selected (bg covers it) */}
              {hasEvent && !selected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
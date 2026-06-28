import { useState, useRef, useEffect } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isInRange(date, start, end) {
  if (!start || !end || !date) return false;
  const d = date.getTime();
  const s = start.getTime();
  const e = end.getTime();
  return d > Math.min(s, e) && d < Math.max(s, e);
}

function formatDate(date) {
  if (!date) return "Select";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function CalendarMonth({ year, month, startDate, endDate, hoverDate, onDayClick, onDayHover }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const effectiveEnd = endDate || hoverDate;

  return (
    <div className="flex-1 min-w-0">
      <p className="text-center font-semibold text-gray-800 mb-3">
        {MONTHS[month]} {year}
      </p>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className={`text-center text-xs font-medium py-1 ${d === "Sun" || d === "Sat" ? "text-blue-500" : "text-gray-500"}`}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;

          const isPast = date < today;
          const isStart = isSameDay(date, startDate);
          const isEnd = isSameDay(date, endDate);
          const isHover = isSameDay(date, hoverDate) && !endDate;
          const inRange = isInRange(date, startDate, effectiveEnd);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          let dayClass = "relative flex items-center justify-center h-9 text-sm cursor-pointer select-none transition-colors ";

          if (isPast) {
            dayClass += "text-gray-300 cursor-not-allowed ";
          } else if (isStart || isEnd) {
            dayClass += "text-white font-semibold z-10 ";
          } else if (isHover) {
            dayClass += "text-white font-semibold z-10 ";
          } else if (inRange) {
            dayClass += isWeekend ? "text-blue-600 " : "text-gray-700 ";
          } else {
            dayClass += isWeekend ? "text-blue-500 hover:bg-green-50 " : "text-gray-700 hover:bg-green-50 ";
          }

          const isRangeStart = (isStart && effectiveEnd && date < effectiveEnd) ||
            (isEnd && startDate && date < startDate);
          const isRangeEnd = (isEnd && startDate) ||
            (isHover && startDate && hoverDate > startDate);

          return (
            <div
              key={date.toISOString()}
              className="relative"
              onClick={() => !isPast && onDayClick(date)}
              onMouseEnter={() => !isPast && onDayHover(date)}
            >
              {/* range bg strip */}
              {inRange && (
                <div className="absolute inset-y-1 inset-x-0 bg-green-100" />
              )}
              {isRangeStart && (
                <div className="absolute inset-y-1 left-1/2 right-0 bg-green-100" />
              )}
              {isRangeEnd && !isStart && (
                <div className="absolute inset-y-1 left-0 right-1/2 bg-green-100" />
              )}

              {/* dot circle */}
              <div className={`${dayClass} relative z-10`}>
                {(isStart || isEnd || isHover) && !isPast && (
                  <div className="absolute inset-1 rounded-full bg-green-700" />
                )}
                <span className="relative z-10">{date.getDate()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangePicker({ value, onChange, placeholder = "Select dates" }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("date"); // "date" | "flexible"
  const [startDate, setStartDate] = useState(value?.start || null);
  const [endDate, setEndDate] = useState(value?.end || null);
  const [hoverDate, setHoverDate] = useState(null);
  const [leftMonth, setLeftMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const wrapperRef = useRef(null);

  const rightMonth = leftMonth.month === 11
    ? { year: leftMonth.year + 1, month: 0 }
    : { year: leftMonth.year, month: leftMonth.month + 1 };

  useEffect(() => {
    const handleClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleDayClick = (date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  const handleConfirm = () => {
    onChange?.({ start: startDate, end: endDate });
    setOpen(false);
  };

  const handlePrevMonth = () => {
    setLeftMonth((m) =>
      m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }
    );
  };

  const handleNextMonth = () => {
    setLeftMonth((m) =>
      m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }
    );
  };

  const displayValue = () => {
    if (mode === "flexible") return "I'm flexible";
    if (startDate && endDate) return `${formatDate(startDate)} → ${formatDate(endDate)}`;
    if (startDate) return `${formatDate(startDate)} – Select end`;
    return placeholder;
  };

  const nights = startDate && endDate
    ? Math.round(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="flex items-center gap-1 text-xs font-medium text-green-700 mb-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Date / Duration
      </label>

      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full px-3 py-2.5 text-sm border rounded-xl text-left transition-all focus:outline-none ${
          open ? "ring-2 ring-green-400 border-transparent" : "border-gray-200 hover:border-green-300"
        } ${startDate ? "text-gray-800" : "text-gray-400"}`}
      >
        {displayValue()}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
          style={{ width: "600px", left: "50%", transform: "translateX(-50%)" }}>

          {/* Mode Toggle */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setMode("date")}
                className="px-5 py-1.5 rounded-full text-sm font-medium bg-blue-500 text-white shadow-sm"
              >
                Date
              </button>
            </div>
          </div>

          {/* Dual Calendar */}
          <div className="px-5 pb-2">
            <div className="flex items-start gap-4">
              {/* Prev arrow */}
              <button
                onClick={handlePrevMonth}
                className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <CalendarMonth
                year={leftMonth.year}
                month={leftMonth.month}
                startDate={startDate}
                endDate={endDate}
                hoverDate={hoverDate}
                onDayClick={handleDayClick}
                onDayHover={setHoverDate}
              />

              <div className="w-px bg-gray-100 self-stretch mx-1" />

              <CalendarMonth
                year={rightMonth.year}
                month={rightMonth.month}
                startDate={startDate}
                endDate={endDate}
                hoverDate={hoverDate}
                onDayClick={handleDayClick}
                onDayHover={setHoverDate}
              />

              {/* Next arrow */}
              <button
                onClick={handleNextMonth}
                className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              {startDate && endDate
                ? `${formatDate(startDate)} – ${formatDate(endDate)} (${nights} night${nights !== 1 ? "s" : ""})`
                : startDate
                ? `${formatDate(startDate)} – select end date`
                : "Select start date"}
            </span>
            <button
              onClick={handleConfirm}
              disabled={!startDate}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
                startDate
                  ? "bg-green-700 text-white hover:bg-green-800"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import {
  CalendarDays,
  Bookmark,
  Sparkles,
  Landmark,
  PawPrint,
  Waves,
  UtensilsCrossed,
  PartyPopper,
  CloudRain,
} from "lucide-react";

// Maps backend Event.EventCategory enum -> UI label, icon, color classes
export const CATEGORY_META = {
  ALL: { label: "All Events", icon: CalendarDays, badge: "bg-emerald-700 text-white" },
  BOOKMARKS: { label: "Bookmarks", icon: Bookmark, badge: "bg-amber-500 text-slate-950 font-extrabold" },
  FESTIVAL: { label: "Festival", icon: Sparkles, badge: "bg-pink-100 text-pink-700" },
  RELIGIOUS: { label: "Religious", icon: Landmark, badge: "bg-amber-100 text-amber-700" },
  WILDLIFE: { label: "Wildlife", icon: PawPrint, badge: "bg-lime-100 text-lime-700" },
  SURF: { label: "Surf", icon: Waves, badge: "bg-sky-100 text-sky-700" },
  FOOD: { label: "Food", icon: UtensilsCrossed, badge: "bg-orange-100 text-orange-700" },
  ENTERTAINMENT: { label: "Entertainment", icon: PartyPopper, badge: "bg-purple-100 text-purple-700" },
  MONSOON: { label: "Monsoon", icon: CloudRain, badge: "bg-blue-100 text-blue-700" },
};

export const CATEGORY_LIST = Object.keys(CATEGORY_META).filter((k) => k !== "ALL");

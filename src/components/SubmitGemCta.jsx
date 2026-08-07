import { Link } from 'react-router-dom';

const SubmitGemCta = () => (
  <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 rounded-2xl p-6 text-center text-white shadow-md relative overflow-hidden">
    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
    <h2 className="text-white font-extrabold text-lg mb-1 relative z-10">Know a hidden spot?</h2>
    <p className="text-emerald-100/90 text-xs font-medium mb-4 relative z-10">
      Share secret waterfalls, secluded beaches & local spots with the community
    </p>
    <Link
      to="/hidden-gems/submit"
      className="inline-block w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl py-3 shadow-md hover:shadow-lg transition-all relative z-10"
    >
      ✨ Submit Your Hidden Gem
    </Link>
  </div>
);

export default SubmitGemCta;
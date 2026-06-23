import { Link } from 'react-router-dom';

const SubmitGemCta = () => (
  <div className="bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] rounded-xl p-6 text-center">
    <h2 className="text-white font-bold text-lg mb-1">Know a hidden spot?</h2>
    <p className="text-white/90 text-sm mb-4">
      Share it with the community
    </p>
    <Link
      to="/hidden-gems/submit"
      className="block bg-white text-[#2D6A4F] font-semibold text-sm rounded-lg py-3 hover:bg-gray-50 transition-colors duration-150"
    >
      ✨ Submit Your Hidden Gem
    </Link>
  </div>
);

export default SubmitGemCta;
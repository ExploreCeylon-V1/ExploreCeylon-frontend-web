import { useRef } from 'react';
import DestinationCard from './DestinationCard';

const SCROLL_AMOUNT = 320; // 300px card width + 20px gap (gap-5)

const FeaturedCarousel = ({ destinations, onExplore }) => {
  const scrollRef = useRef(null);

  const scrollBy = (direction) => {
    scrollRef.current?.scrollBy({
      left: direction * SCROLL_AMOUNT,
      behavior: 'smooth',
    });
  };

  if (!destinations?.length) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
          ⭐ Featured Destinations
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {destinations.map((destination) => (
          <div
            key={destination.id}
            className="flex-shrink-0 w-[300px] min-w-[300px] max-w-[300px]"
          >
            <DestinationCard destination={destination} onExplore={onExplore} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedCarousel;
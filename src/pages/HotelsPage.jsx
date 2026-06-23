import React, { useState } from 'react';

// ============================================================================
// 1. REUSABLE HOTEL CARD COMPONENT
// ============================================================================
function HotelCard({ hotel, nightsCount }) {
  // එක් රාත්‍රියක මිල සහ මුළු රැයවල් ගණන අනුව මුළු මුදල ගණනය කිරීම
  const calculatedTotalPrice = hotel.pricePerNight * nightsCount;

  return (
    <div className="flex flex-col w-full mb-4 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm md:flex-row rounded-2xl hover:shadow-md">
      
      {/* Left Side: Image Section */}
      <div className="relative w-full h-48 bg-gray-100 md:w-72 md:h-auto shrink-0">
        <img 
          src={hotel.imageUrl} 
          alt={hotel.name}
          className="object-cover w-full h-full"
        />
        {/* Badges Container */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[90%]">
          {hotel.isLocalPick && (
            <span className="bg-[#115e3b] text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center shadow-sm">
              ★ LOCAL PICK
            </span>
          )}
          {hotel.customBadge && (
            <span className="bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm">
              {hotel.customBadge}
            </span>
          )}
        </div>
      </div>

      {/* Middle Section: Content Area */}
      <div className="flex flex-col justify-between flex-1 p-5">
        <div>
          {/* Title & Stars */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{hotel.name}</h3>
              <div className="flex items-center text-amber-400 text-xs mt-1 space-x-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>{i < hotel.stars ? '★' : '☆'}</span>
                ))}
                <span className="ml-1 text-xs font-medium text-gray-400">{hotel.stars} stars</span>
              </div>
            </div>
          </div>

          {/* Rating Row */}
          <div className="flex items-center mt-3 space-x-2">
            <span className="bg-[#115e3b] text-white font-bold text-xs px-2 py-0.5 rounded-md">
              {hotel.ratingScore}
            </span>
            <span className="text-sm font-bold text-gray-800">{hotel.ratingText}</span>
            <span className="text-xs font-medium text-gray-400">({hotel.reviewsCount} reviews)</span>
          </div>

          {/* Amenities Pills */}
          <div className="flex flex-wrap gap-1.5 mt-4">
            {hotel.amenities.map((amenity, index) => (
              <span key={index} className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-200/50">
                {amenity}
              </span>
            ))}
            {hotel.moreAmenitiesCount > 0 && (
              <span className="bg-gray-50 text-gray-400 text-xs font-medium px-2.5 py-1 rounded-md">
                +{hotel.moreAmenitiesCount} more
              </span>
            )}
          </div>

          {/* Description */}
          <p className="mt-3 text-xs font-medium leading-relaxed text-gray-500 line-clamp-2">
            {hotel.description}
          </p>
        </div>

        {/* Location & Cancellation Details */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-4 text-xs font-semibold border-t border-gray-50">
          <div className="flex items-center text-gray-400">
            <span className="mr-1">📍</span>
            <span>{hotel.distanceFromCenter} from city center</span>
          </div>
          {hotel.freeCancellationUntil ? (
            <div className="flex items-center text-emerald-600">
              <span className="mr-1">✓</span>
              <span>Free cancellation until {hotel.freeCancellationUntil}</span>
            </div>
          ) : (
            <div className="flex items-center text-rose-500">
              <span className="mr-1">✕</span>
              <span>Non-refundable</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Pricing & Actions */}
      <div className="flex flex-row items-center justify-between w-full p-5 border-t border-gray-100 md:w-48 md:border-t-0 md:border-l md:flex-col md:justify-center shrink-0 bg-gray-50/50 md:bg-white">
        <div className="w-full text-left md:text-right md:mb-5">
          <div className="flex items-baseline md:justify-end">
            <span className="text-2xl font-black text-gray-900">${hotel.pricePerNight}</span>
            <span className="ml-1 text-xs font-medium text-gray-400">/night</span>
          </div>
          <div className="text-xs font-bold text-gray-700 mt-0.5">
            ${calculatedTotalPrice} total
          </div>
          <div className="text-[10px] text-gray-400 font-medium">({nightsCount} {nightsCount === 1 ? 'night' : 'nights'})</div>
        </div>

        <div className="flex w-auto gap-2 md:flex-col md:w-full shrink-0">
          <button className="px-4 py-2 text-xs font-bold transition-colors border border-emerald-700 text-emerald-800 hover:bg-emerald-50 rounded-xl whitespace-nowrap">
            View Details →
          </button>
          <button className="bg-[#115e3b] hover:bg-[#0c4a2e] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors whitespace-nowrap shadow-sm">
            Book Now ↗
          </button>
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// 2. MAIN HOTELS PAGE COMPONENT
// ============================================================================
export default function HotelsPage() {
  // --- React Search Bar States ---
  const [location, setLocation] = useState('Colombo, Sri Lanka');
  const [checkIn, setCheckIn] = useState('2026-06-17'); // Image 3 එකට අනුව default අගය වෙනස් කරන ලදි
  const [checkOut, setCheckOut] = useState('2026-06-19'); // Image 3 එකට අනුව default අගය වෙනස් කරන ලදි
  const [adults, setAdults] = useState('1 Adult'); // Image 3 එකට අනුව default අගය වෙනස් කරන ලදි
  const [rooms, setRooms] = useState('1 Room');
  const [currency, setCurrency] = useState('USD');

  // --- React Sidebar Filter States ---
  const [maxPrice, setMaxPrice] = useState(500);
  const [stars, setStars] = useState({ 5: true, 4: true, 3: false, 2: false, 1: false });
  const [guestRating, setGuestRating] = useState('8+');
  const [propertyTypes, setPropertyTypes] = useState({ Hotel: true, Resort: true, 'Boutique Hotel': false, Guesthouse: false, Villa: false });
  const [amenities, setAmenities] = useState({ 'Swimming Pool': false, 'WiFi (Free)': false, 'Air Conditioning': true, Restaurant: false, 'Airport Transfer': false, 'Breakfast Included': false, Parking: false });
  const [localPicksOnly, setLocalPicksOnly] = useState(false);

  // --- View & Sort States ---
  const [viewType, setViewType] = useState('List');
  const [sortBy, setSortBy] = useState('Best Match');

  // --- DYNAMIC CALCULATION FOR NIGHTS COUNT ---
  const calculateNights = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const differenceInTime = endDate.getTime() - startDate.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    return differenceInDays > 0 ? differenceInDays : 1;
  };

  const nightsCount = calculateNights(checkIn, checkOut);

  // --- DYNAMIC DATE FORMATTING FOR TEXT (e.g., "Jun 17 – Jun 19") ---
  const formatDateText = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // --- HOTELS SAMPLE DATA ARRAY ---
  const hotelsData = [
    {
      id: 1,
      name: 'Cinnamon Grand Colombo',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop',
      stars: 5,
      ratingScore: '9.2',
      ratingText: 'Superb',
      reviewsCount: '1,247',
      amenities: ['Free WiFi', 'Pool', 'Restaurant', 'Spa', 'Gym'],
      moreAmenitiesCount: 2,
      description: 'Iconic 5-star hotel on Galle Face Green with stunning Indian Ocean views. Panoramic vistas from every room, world-class dining, and unparalleled service in the heart of...',
      distanceFromCenter: '1.2km',
      freeCancellationUntil: 'Jun 1',
      pricePerNight: 120,
      isLocalPick: true,
      customBadge: null
    },
    {
      id: 2,
      name: 'Taj Samudra Colombo',
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&auto=format&fit=crop',
      stars: 5,
      ratingScore: '9',
      ratingText: 'Superb',
      reviewsCount: '892',
      amenities: ['Free WiFi', 'Pool', 'Restaurant', 'Bar', 'Beachfront'],
      moreAmenitiesCount: 0,
      description: 'Beachfront luxury on Colombo\'s famous Galle Face promenade. Sprawling views of the Indian Ocean, elegant rooms and the legendary Taj hospitality.',
      distanceFromCenter: '0.8km',
      freeCancellationUntil: 'Jun 2',
      pricePerNight: 95,
      isLocalPick: false,
      customBadge: 'Beachfront'
    },
    {
      id: 3,
      name: 'Hilton Colombo',
      imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=600&auto=format&fit=crop',
      stars: 5,
      ratingScore: '8.8',
      ratingText: 'Excellent',
      reviewsCount: '1,104',
      amenities: ['Free WiFi', 'Pool', 'Gym', 'Restaurant', 'Business Center'],
      moreAmenitiesCount: 1,
      description: 'Centrally located 5-star hotel with modern rooms and direct access to the city\'s best shopping and dining districts.',
      distanceFromCenter: '0.3km',
      freeCancellationUntil: null,
      pricePerNight: 110,
      isLocalPick: false,
      customBadge: null
    },
    {
      id: 4,
      name: 'Galadari Hotel',
      imageUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=600&auto=format&fit=crop',
      stars: 4,
      ratingScore: '8.5',
      ratingText: 'Excellent',
      reviewsCount: '678',
      amenities: ['Free WiFi', 'Pool', 'Restaurant', 'Parking', 'Lakeside'],
      moreAmenitiesCount: 0,
      description: 'Classic 4-star hotel overlooking the serene Beira Lake. Comfortable rooms, great value, and a tranquil lakeside setting in the heart of Colombo.',
      distanceFromCenter: '0.7km',
      freeCancellationUntil: 'Jun 3',
      pricePerNight: 75,
      isLocalPick: true,
      customBadge: 'Best Value'
    },
    {
      id: 5,
      name: 'Marino Beach Colombo',
      imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=600&auto=format&fit=crop',
      stars: 4,
      ratingScore: '8.3',
      ratingText: 'Very Good',
      reviewsCount: '453',
      amenities: ['Free WiFi', 'Pool', 'Ocean Views', 'Restaurant', 'Air Conditioning'],
      moreAmenitiesCount: 0,
      description: 'Stylish 4-star hotel on Marine Drive with stunning ocean views from every room. Modern amenities at an excellent price point.',
      distanceFromCenter: '2.1km',
      freeCancellationUntil: 'Jun 4',
      pricePerNight: 65,
      isLocalPick: false,
      customBadge: 'Ocean Views'
    }
  ];

  // Search trigger handler
  const handleSearch = () => {
    alert(`Searching for hotels in ${location}\nDates: ${checkIn} to ${checkOut}\nGuests: ${adults} | ${rooms}\nCurrency: ${currency}`);
  };

  // Filter submit handler
  const handleApplyFilters = () => {
    alert(`Filters Applied!\nMax Price: $${maxPrice}\nGuest Rating: ${guestRating}`);
  };

  // --- RE-WRITTEN CLEAR ALL FUNCTION TO RESET BOTH WINDOWS ---
  const handleClearAll = () => {
    // 1. ඉහළ සර්ච් බාර් එක (Top Search Bar) reset කිරීම
    setLocation('Colombo, Sri Lanka');
    setCheckIn('2026-06-17');       // image_354f01.png එකේ පෙන්වන දින
    setCheckOut('2026-06-19');      // image_354f01.png එකේ පෙන්වන දින
    setRooms('1 Room');
    setAdults('1 Adult');           // image_354f01.png එකේ පෙන්වන ගණන
    setCurrency('USD');

    // 2. සයිඩ්බාර් ෆිල්ටර්ස් (Sidebar Filters) reset කිරීම
    setMaxPrice(500);
    setStars({ 5: false, 4: false, 3: false, 2: false, 1: false });
    setGuestRating('');
    setPropertyTypes({ Hotel: false, Resort: false, 'Boutique Hotel': false, Guesthouse: false, Villa: false });
    setAmenities({ 'Swimming Pool': false, 'WiFi (Free)': false, 'Air Conditioning': false, Restaurant: false, 'Airport Transfer': false, 'Breakfast Included': false, Parking: false });
    setLocalPicksOnly(false);
  };

  return (
    <div className="w-full min-h-screen pb-12 font-sans bg-gray-100">
      
      {/* Hero Section */}
      <div className="bg-[#1a2b49] pt-16 pb-28 px-4 text-center">
        <h1 className="mb-3 text-4xl font-bold text-white">
          Find Your Perfect Stay in Sri Lanka
        </h1>
        <h2 className="text-xl text-blue-300">
          Best rates from top Sri Lanka hotels
        </h2>
      </div>

      {/* Search Container Wrapper */}
      <div className="relative z-10 max-w-6xl px-4 mx-auto -mt-16">
        <div className="p-6 mb-8 bg-white shadow-xl rounded-2xl">
          
          {/* Main Search Grid */}
          <div className="grid items-center grid-cols-1 gap-3 md:grid-cols-12">
            
            {/* Location Input */}
            <div className="flex items-center p-3 transition-colors bg-white border border-gray-200 md:col-span-3 rounded-xl focus-within:border-emerald-600">
              <svg className="w-5 h-5 mr-2 text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input 
                type="text" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-sm font-medium text-gray-700 bg-transparent outline-none"
                placeholder="Where are you going?"
              />
            </div>

            {/* Check-in Date Input */}
            <div className="flex items-center p-3 transition-colors bg-white border border-gray-200 md:col-span-2 rounded-xl focus-within:border-emerald-600">
              <input 
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer"
              />
            </div>

            {/* Check-out Date Input */}
            <div className="flex items-center p-3 transition-colors bg-white border border-gray-200 md:col-span-2 rounded-xl focus-within:border-emerald-600">
              <input 
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer"
              />
            </div>

            {/* Rooms Dropdown */}
            <div className="relative flex items-center p-3 transition-colors bg-white border border-gray-200 md:col-span-1.5 rounded-xl focus-within:border-emerald-600">
              <svg className="w-5 h-5 mr-2 text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <select 
                value={rooms} 
                onChange={(e) => setRooms(e.target.value)}
                className="w-full pr-4 text-sm font-medium text-gray-700 bg-transparent outline-none appearance-none cursor-pointer"
              >
                <option value="1 Room">1 R</option>
                <option value="2 Rooms">2 R</option>
                <option value="3 Rooms">3 R</option>
              </select>
              <span className="absolute text-[10px] text-gray-400 pointer-events-none right-2">▼</span>
            </div>

            {/* Guests Dropdown */}
            <div className="relative flex items-center p-3 transition-colors bg-white border border-gray-200 md:col-span-2 rounded-xl focus-within:border-emerald-600">
              <svg className="w-5 h-5 mr-2 text-gray-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <select 
                value={adults} 
                onChange={(e) => setAdults(e.target.value)}
                className="w-full pr-4 text-sm font-medium text-gray-700 bg-transparent outline-none appearance-none cursor-pointer"
              >
                <option value="1 Adult">1 Adult</option>
                <option value="2 Adults">2 Adults</option>
                <option value="3 Adults">3 Adults</option>
                <option value="4 Adults">4 Adults</option>
              </select>
              <span className="absolute text-xs text-gray-400 pointer-events-none right-3">▼</span>
            </div>

            {/* Search Button */}
            <div className="md:col-span-1.5">
              <button 
                onClick={handleSearch}
                className="w-full bg-[#115e3b] hover:bg-[#0c4a2e] text-white p-3 rounded-xl flex items-center justify-center transition-colors shadow-md font-bold text-sm"
              >
                <svg className="w-4 h-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </button>
            </div>

          </div>

          {/* Divider Line */}
          <hr className="my-4 border-gray-100" />

          {/* Currency Selector Section */}
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-gray-400">Currency:</span>
            <div className="flex overflow-hidden bg-white border border-gray-200 rounded-lg">
              {['USD', 'LKR', 'EUR', 'GBP'].map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1 font-medium text-xs transition-colors ${
                    currency === curr 
                      ? 'bg-[#115e3b] text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Layout Grid Layout for Sidebar & Content Area */}
        <div className="grid items-start grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* --- SIDEBAR FILTERS PANEL --- */}
          <div className="w-full max-w-sm p-6 mx-auto bg-white shadow-md lg:col-span-4 rounded-2xl lg:mx-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2 text-lg font-bold text-gray-800">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <span>Filter Results</span>
              </div>
              {/* ලින්ක් 1: Sidebar එක මුදුනේ ඇති Clear All බටන් එක */}
              <button 
                onClick={handleClearAll}
                className="text-sm font-semibold transition-colors text-emerald-600 hover:text-emerald-800"
              >
                Clear All
              </button>
            </div>

            {/* Price Per Night Component */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-bold text-gray-800">Price per Night</h3>
              <input 
                type="range" 
                min="0" 
                max="500" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-700" 
              />
              <div className="flex items-center justify-between mt-2 text-xs font-medium text-gray-400">
                <span>$0</span>
                <span className="text-sm font-bold text-gray-800">Max: ${maxPrice}</span>
                <span>$500</span>
              </div>
            </div>

            {/* Star Rating Component */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-bold text-gray-800">Star Rating</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((starCount) => (
                  <label key={starCount} className="flex items-center cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={stars[starCount] || false}
                      onChange={(e) => setStars({ ...stars, [starCount]: e.target.checked })}
                      className="w-4 h-4 mr-3 border-gray-400 rounded cursor-pointer text-emerald-700 focus:ring-emerald-600 accent-emerald-700"
                    />
                    <div className="flex items-center mr-2 space-x-1 text-xs text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < starCount ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {starCount} Stars
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Guest Rating Component */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-bold text-gray-800">Guest Rating</h3>
              <div className="space-y-2">
                {[
                  { id: '9+', label: 'Superb (9+)', icon: '😍' },
                  { id: '8+', label: 'Very Good (8+)', icon: '😊' },
                  { id: '7+', label: 'Good (7+)', icon: '🙂' }
                ].map((rating) => (
                  <button
                    key={rating.id}
                    type="button"
                    onClick={() => setGuestRating(rating.id)}
                    className={`w-full flex items-center px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      guestRating === rating.id
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800'
                        : 'border-gray-100 hover:border-gray-200 text-gray-700 bg-white'
                    }`}
                  >
                    <span className="mr-2 text-base">{rating.icon}</span>
                    {rating.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Property Type Component */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-bold text-gray-800">Property Type</h3>
              <div className="space-y-2">
                {Object.keys(propertyTypes).map((type) => (
                  <label key={type} className="flex items-center cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={propertyTypes[type] || false}
                      onChange={(e) => setPropertyTypes({ ...propertyTypes, [type]: e.target.checked })}
                      className="w-4 h-4 mr-3 border-gray-400 rounded cursor-pointer text-emerald-700 focus:ring-emerald-600 accent-emerald-700"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amenities Component */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-bold text-gray-800">Amenities</h3>
              <div className="space-y-2">
                {Object.keys(amenities).map((amenity) => (
                  <label key={amenity} className="flex items-center cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={amenities[amenity] || false}
                      onChange={(e) => setAmenities({ ...amenities, [amenity]: e.target.checked })}
                      className="w-4 h-4 mr-3 border-gray-400 rounded cursor-pointer text-emerald-700 focus:ring-emerald-600 accent-emerald-700"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {amenity}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="my-5 border-gray-100" />

            {/* Local Picks Toggle Option */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center space-x-1 text-sm font-bold text-gray-800">
                  <span className="text-sm text-amber-500">☆</span>
                  <span>Show Local Picks Only</span>
                </div>
                <p className="text-[11px] text-gray-400 font-medium">Recommended by ExploreCeylon</p>
              </div>
              <button 
                type="button"
                onClick={() => setLocalPicksOnly(!localPicksOnly)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                  localPicksOnly ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  localPicksOnly ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Apply Filters Button */}
            <button
              type="button"
              onClick={handleApplyFilters}
              className="w-full bg-[#115e3b] hover:bg-[#0c4a2e] text-white text-sm font-bold py-3.5 rounded-xl transition-colors shadow-md text-center"
            >
              Apply Filters
            </button>

          </div>

          {/* Right Side: Main Hotel List Content Area */}
          <div className="w-full space-y-6 lg:col-span-8">
            
            {/* Header Control Row */}
            <div className="flex flex-col w-full pt-2 pb-5 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
              
              {/* Left Side: Title, Sub-details & Filter Badges */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Showing {hotelsData.length} hotels in Colombo
                  </h2>
                  <p className="text-sm font-medium text-gray-500 mt-0.5">
                    {formatDateText(checkIn)} – {formatDateText(checkOut)} • {nightsCount} {nightsCount === 1 ? 'night' : 'nights'} • {adults.toLowerCase()}
                  </p>
                </div>
                
                {/* Active Filter Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium">
                    <span>★ 4+ Stars</span>
                    <button className="ml-1.5 font-bold hover:text-emerald-900 focus:outline-none text-xs">✕</button>
                  </div>
                  {/* ලින්ක් 2: මැද බලාගත හැකි සක්‍රීය (active) ෆිල්ටර්ස් අසල ඇති Clear all බටන් එක */}
                  <button 
                    onClick={handleClearAll}
                    className="ml-1 font-semibold text-gray-500 transition-colors hover:text-gray-800"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {/* Right Side: List/Map Controls & Sort Selector */}
              <div className="flex items-center self-start mt-4 space-x-4 sm:mt-0 sm:self-center">
                
                {/* List / Map Toggle Buttons */}
                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm text-sm font-medium text-gray-600">
                  <button 
                    onClick={() => setViewType('List')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
                      viewType === 'List' ? 'bg-gray-100 text-gray-900 font-bold' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs">☰</span>
                    <span>List</span>
                  </button>
                  <button 
                    onClick={() => setViewType('Map')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
                      viewType === 'Map' ? 'bg-gray-100 text-gray-900 font-bold' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs">🗺️</span>
                    <span>Map</span>
                  </button>
                </div>

                {/* Sort Dropdown Selector */}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium text-gray-400 whitespace-nowrap">Sort:</span>
                  <div className="relative border border-gray-200 rounded-xl bg-white px-3 py-2 shadow-sm font-semibold text-gray-800 min-w-[120px]">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full pr-5 text-xs bg-transparent outline-none appearance-none cursor-pointer"
                    >
                      <option value="Best Match">Best Match</option>
                      <option value="Price: Low to High">Price: Low to High</option>
                      <option value="Price: High to Low">Price: High to Low</option>
                      <option value="Top Rated">Top Rated</option>
                    </select>
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none">▼</span>
                  </div>
                </div>

              </div>
            </div>

            {/* DYNAMIC HOTEL CARDS CONTAINER */}
            <div className="flex flex-col w-full gap-4">
              {hotelsData.map((hotelItem) => (
                <HotelCard key={hotelItem.id} hotel={hotelItem} nightsCount={nightsCount} />
              ))}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
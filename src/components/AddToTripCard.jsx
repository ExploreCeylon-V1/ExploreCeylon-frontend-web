import { useState, useEffect } from 'react';
import tripsService from '../services/Tripsservice';
import { getToken } from '../utils/authStorage';

/**
 * AddToTripCard
 * Lets a logged-in traveler add an item (gem, destination, etc.) to one
 * of their trips' days. Uses real endpoints: GET /trips/my, GET /trips/{id},
 * POST .../items
 *
 * @param {Object} item - the gem or destination object being added
 * @param {string} itemType - TripDayItem.ItemType value, e.g. 'GEM' | 'ACTIVITY'
 * @param {string} title - display title for the trip item (defaults to item.title or item.name)
 * @param {string} heading - card heading text, e.g. "Add to Your Trip" or "Plan a Visit to X"
 */
const AddToTripCard = ({ item, itemType = 'GEM', title, heading = 'Add to Your Trip' }) => {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedDayId, setSelectedDayId] = useState('');

  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingTripDetail, setLoadingTripDetail] = useState(false);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

  const isLoggedIn = Boolean(getToken());

  const fetchTrips = async () => {
    try {
      setLoadingTrips(true);
      const data = await tripsService.getMyTrips();
      setTrips(data || []);
      if (data?.length) setSelectedTripId(String(data[0].id));
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const fetchTripDetail = async (tripId) => {
    try {
      setLoadingTripDetail(true);
      const data = await tripsService.getTripById(tripId);
      setSelectedTrip(data);
      if (data?.days?.length) setSelectedDayId(String(data.days[0].id));
    } catch (err) {
      console.error('Failed to load trip detail:', err);
    } finally {
      setLoadingTripDetail(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchTrips sets loading state synchronously before its await; intentional fetch-on-mount pattern. The else branch resets the same flag for logged-out visitors.
    if (isLoggedIn) fetchTrips();
    else setLoadingTrips(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchTripDetail sets loading state synchronously before its await; intentional fetch-on-selection pattern. The else branch clears dependent selection state.
    if (selectedTripId) fetchTripDetail(selectedTripId);
    else {
      setSelectedTrip(null);
      setSelectedDayId('');
    }
  }, [selectedTripId]);

  const handleAddToTrip = async () => {
    if (!selectedTripId || !selectedDayId) return;

    try {
      setAdding(true);
      setFeedback(null);

      await tripsService.addItemToDay(selectedTripId, selectedDayId, {
        type: itemType,
        referenceId: String(item.id),
        title: title || item.title || item.name,
        cost: 0,
        currency: 'LKR',
        notes: item.district,
      });

      setFeedback({ type: 'success', message: 'Added to your trip!' });
    } catch (err) {
      console.error('Failed to add to trip:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not add to trip.',
      });
    } finally {
      setAdding(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-xl p-5 sm:p-6">
        <h2 className="font-bold text-gray-800 mb-3">Add to Your Trip</h2>
        <p className="text-sm text-gray-600">
          Please{' '}
          <a href="/login" className="text-[#2D6A4F] font-semibold underline">
            log in
          </a>{' '}
          to add this to a trip.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 sm:p-6">
      <h2 className="font-bold text-gray-800 mb-4">{heading}</h2>

      {loadingTrips && (
        <p className="text-sm text-gray-500">Loading your trips...</p>
      )}

      {!loadingTrips && trips.length === 0 && (
        <p className="text-sm text-gray-500">
          You don't have any trips yet.{' '}
          <a href="/trips/new" className="text-[#2D6A4F] font-semibold underline">
            Create one
          </a>
          .
        </p>
      )}

      {!loadingTrips && trips.length > 0 && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            🗺️ Select Trip
          </label>
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-4 cursor-pointer"
          >
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.title}
                {trip.status === 'DRAFT' ? ' (Draft)' : ''}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Day
          </label>
          <select
            value={selectedDayId}
            onChange={(e) => setSelectedDayId(e.target.value)}
            disabled={loadingTripDetail || !selectedTrip?.days?.length}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-4 cursor-pointer disabled:opacity-60"
          >
            {loadingTripDetail && <option>Loading days...</option>}
            {!loadingTripDetail && !selectedTrip?.days?.length && (
              <option>No days added to this trip yet</option>
            )}
            {!loadingTripDetail &&
              selectedTrip?.days?.map((day) => (
                <option key={day.id} value={day.id}>
                  Day {day.dayNumber}
                  {day.region ? ` — ${day.region}` : ''}
                </option>
              ))}
          </select>

          {feedback && (
            <p
              className={`text-sm mb-3 ${
                feedback.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {feedback.message}
            </p>
          )}

          <button
            type="button"
            onClick={handleAddToTrip}
            disabled={adding || !selectedDayId || loadingTripDetail}
            className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-60 text-white font-semibold text-sm rounded-lg py-3 transition-colors duration-150"
          >
            {adding ? 'Adding...' : '+ Add to Trip'}
          </button>
        </>
      )}
    </div>
  );
};

export default AddToTripCard;
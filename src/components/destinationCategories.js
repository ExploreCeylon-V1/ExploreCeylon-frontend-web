// Maps to Destination.DestinationCategory enum values exactly
export const DESTINATION_CATEGORIES = [
  { value: 'BEACH', label: 'Beach', icon: '🏖️' },
  { value: 'CULTURAL', label: 'Cultural', icon: '🏛️' },
  { value: 'WILDLIFE', label: 'Wildlife', icon: '🐘' },
  { value: 'HILL', label: 'Hill', icon: '⛰️' },
  { value: 'SURF', label: 'Surf', icon: '🏄' },
  { value: 'ADVENTURE', label: 'Adventure', icon: '🧭' },
  { value: 'HERITAGE', label: 'Heritage', icon: '🏯' },
  { value: 'RELIGIOUS', label: 'Religious', icon: '🙏' },
  { value: 'CITY', label: 'City', icon: '🏙️' },
];

export const getDestinationCategoryMeta = (categoryValue) =>
  DESTINATION_CATEGORIES.find((c) => c.value === categoryValue) || {
    value: categoryValue,
    label: categoryValue,
    icon: '📍',
  };
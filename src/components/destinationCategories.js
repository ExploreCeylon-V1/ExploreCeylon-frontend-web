// Maps to Destination.DestinationCategory enum values exactly
export const DESTINATION_CATEGORIES = [
  { value: 'ADVENTURE',        label: 'Adventure',          icon: '🏔️' },
  { value: 'CULTURE_HERITAGE', label: 'Culture & Heritage', icon: '🏛️' },
  { value: 'RELIGIOUS',        label: 'Religious',          icon: '🛕' },
  { value: 'WILDLIFE_NATURE',  label: 'Wildlife & Nature',  icon: '🦁' },
  { value: 'BEACH_COAST',      label: 'Beach & Coast',      icon: '🏖️' },
  { value: 'HILL_COUNTRY',     label: 'Hill Country',       icon: '⛰️' },
  { value: 'SCENIC_VIEWS',     label: 'Scenic Views',       icon: '🌄' },
  { value: 'CITY_URBAN',       label: 'City & Urban',       icon: '🏙️' },
];

export const getDestinationCategoryMeta = (categoryValue) =>
  DESTINATION_CATEGORIES.find((c) => c.value === categoryValue) || {
    value: categoryValue,
    label: categoryValue,
    icon: '📍',
  };
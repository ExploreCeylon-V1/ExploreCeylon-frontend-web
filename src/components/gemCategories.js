// Maps to HiddenGem.GemCategory enum values exactly (BEACH, WATERFALL, RUINS, VIEWPOINT, VILLAGE, CAFE, TEMPLE)
export const GEM_CATEGORIES = [
  { value: 'BEACH', label: 'Beach', icon: '🏖️' },
  { value: 'WATERFALL', label: 'Waterfall', icon: '💧' },
  { value: 'RUINS', label: 'Ruins', icon: '🏛️' },
  { value: 'VIEWPOINT', label: 'Viewpoint', icon: '🧭' },
  { value: 'VILLAGE', label: 'Village', icon: '🏘️' },
  { value: 'CAFE', label: 'Cafe', icon: '☕' },
  { value: 'TEMPLE', label: 'Temple', icon: '🛕' },
];

export const getCategoryMeta = (categoryValue) =>
  GEM_CATEGORIES.find((c) => c.value === categoryValue) || {
    value: categoryValue,
    label: categoryValue,
    icon: '📍',
  };
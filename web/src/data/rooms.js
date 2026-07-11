// Sample rooms in the shared schema — these stand in for RoomPlan scans.
// Coordinates in meters, origin top-left, y grows downward (screen convention).

export const CATEGORIES = {
  bed: { label: 'Bed', color: '#7c9885' },
  wardrobe: { label: 'Wardrobe', color: '#a08463' },
  desk: { label: 'Desk', color: '#6b7fa3' },
  chair: { label: 'Chair', color: '#8fa3c4' },
  nightstand: { label: 'Nightstand', color: '#b59a7a' },
  sofa: { label: 'Sofa', color: '#9d7f94' },
  coffee_table: { label: 'Coffee table', color: '#c0a98e' },
  tv_stand: { label: 'TV stand', color: '#708090' },
  bookshelf: { label: 'Bookshelf', color: '#8d7b6c' },
  dresser: { label: 'Dresser', color: '#a58f78' },
  table: { label: 'Table', color: '#b3a186' },
  plant: { label: 'Plant', color: '#7fa07a' },
  rug: { label: 'Rug', color: '#c9b8a8' },
}

const bedroom = {
  id: 'bedroom-01',
  name: 'Bedroom · 4.2 × 3.5 m',
  purpose: 'bedroom',
  room: {
    boundary: [[0, 0], [4.2, 0], [4.2, 3.5], [0, 3.5]],
  },
  openings: [
    { id: 'door_1', type: 'door', position: [0.85, 3.5], width: 0.9 },
    { id: 'win_1', type: 'window', position: [2.1, 0], width: 1.4 },
    { id: 'win_2', type: 'window', position: [4.2, 1.4], width: 1.1 },
  ],
  furniture: [
    { id: 'bed_1', category: 'bed', label: 'Bed', position: [2.2, 1.35], width: 1.6, depth: 2.0, rotation: 90, movable: true },
    { id: 'ns_1', category: 'nightstand', label: 'Nightstand', position: [3.5, 0.8], width: 0.45, depth: 0.4, rotation: 0, movable: true },
    { id: 'wr_1', category: 'wardrobe', label: 'Wardrobe', position: [0.35, 1.1], width: 1.6, depth: 0.65, rotation: 90, movable: true },
    { id: 'desk_1', category: 'desk', label: 'Desk', position: [3.4, 3.1], width: 1.3, depth: 0.65, rotation: 180, movable: true },
    { id: 'chair_1', category: 'chair', label: 'Desk chair', position: [3.4, 2.4], width: 0.5, depth: 0.5, rotation: 0, movable: true },
    { id: 'dr_1', category: 'dresser', label: 'Dresser', position: [1.8, 3.15], width: 1.0, depth: 0.5, rotation: 180, movable: true },
  ],
}

const office = {
  id: 'office-01',
  name: 'Home office · 3.6 × 3.0 m',
  purpose: 'office',
  room: {
    boundary: [[0, 0], [3.6, 0], [3.6, 3.0], [0, 3.0]],
  },
  openings: [
    { id: 'door_1', type: 'door', position: [3.0, 3.0], width: 0.85 },
    { id: 'win_1', type: 'window', position: [1.8, 0], width: 1.8 },
  ],
  furniture: [
    { id: 'desk_1', category: 'desk', label: 'Desk', position: [1.8, 1.6], width: 1.5, depth: 0.75, rotation: 0, movable: true },
    { id: 'chair_1', category: 'chair', label: 'Office chair', position: [1.8, 2.4], width: 0.55, depth: 0.55, rotation: 180, movable: true },
    { id: 'bs_1', category: 'bookshelf', label: 'Bookshelf', position: [0.2, 1.5], width: 1.8, depth: 0.35, rotation: 90, movable: true },
    { id: 'bs_2', category: 'bookshelf', label: 'Bookshelf 2', position: [0.2, 2.7], width: 0.9, depth: 0.35, rotation: 90, movable: true },
    { id: 'sofa_1', category: 'sofa', label: 'Reading sofa', position: [2.9, 1.0], width: 1.4, depth: 0.8, rotation: 90, movable: true },
    { id: 'plant_1', category: 'plant', label: 'Plant', position: [3.35, 2.3], width: 0.4, depth: 0.4, rotation: 0, movable: true },
  ],
}

const living = {
  id: 'living-room-01',
  name: 'Living room · L-shape',
  purpose: 'living_room',
  room: {
    boundary: [[0, 0], [5.2, 0], [5.2, 3.0], [3.4, 3.0], [3.4, 4.4], [0, 4.4]],
  },
  openings: [
    { id: 'door_1', type: 'door', position: [0.75, 4.4], width: 0.95 },
    { id: 'win_1', type: 'window', position: [2.0, 0], width: 1.8 },
    { id: 'win_2', type: 'window', position: [5.2, 1.5], width: 1.3 },
  ],
  furniture: [
    { id: 'sofa_1', category: 'sofa', label: 'Sofa', position: [2.4, 2.3], width: 2.2, depth: 0.95, rotation: 180, movable: true },
    { id: 'tv_1', category: 'tv_stand', label: 'TV stand', position: [2.5, 0.3], width: 1.6, depth: 0.45, rotation: 0, movable: true },
    { id: 'ct_1', category: 'coffee_table', label: 'Coffee table', position: [2.4, 1.35], width: 1.1, depth: 0.6, rotation: 0, movable: true },
    { id: 'bs_1', category: 'bookshelf', label: 'Bookshelf', position: [4.95, 2.4], width: 1.0, depth: 0.35, rotation: 270, movable: true },
    { id: 'table_1', category: 'table', label: 'Side table', position: [0.5, 2.6], width: 0.7, depth: 0.7, rotation: 0, movable: true },
    { id: 'plant_1', category: 'plant', label: 'Plant', position: [4.8, 0.4], width: 0.45, depth: 0.45, rotation: 0, movable: true },
    { id: 'ch_1', category: 'chair', label: 'Armchair', position: [0.7, 1.4], width: 0.85, depth: 0.85, rotation: 90, movable: true },
  ],
}

export const SAMPLE_ROOMS = [bedroom, office, living]

export const DEFAULT_ITEM_SIZES = {
  bed: [1.6, 2.0], wardrobe: [1.2, 0.6], desk: [1.3, 0.65], chair: [0.5, 0.5],
  nightstand: [0.45, 0.4], sofa: [1.9, 0.9], coffee_table: [1.0, 0.6],
  tv_stand: [1.4, 0.45], bookshelf: [0.9, 0.35], dresser: [1.0, 0.5],
  table: [1.2, 0.8], plant: [0.4, 0.4], rug: [2.0, 1.4],
}

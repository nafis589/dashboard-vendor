export interface TogoRegion {
  id: string;
  name: string;
  capital: string;
}

export const TOGO_REGIONS: TogoRegion[] = [
  { id: 'maritime', name: 'Maritime', capital: 'Lomé' },
  { id: 'plateaux', name: 'Plateaux', capital: 'Atakpamé' },
  { id: 'centrale', name: 'Centrale', capital: 'Sokodé' },
  { id: 'kara', name: 'Kara', capital: 'Kara' },
  { id: 'savanes', name: 'Savanes', capital: 'Dapaong' },
];

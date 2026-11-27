// Partner brands, in the order the old forward.md listed them. Logos were copied from
// that site into public/brands/ (see scripts/legacy-assets.txt).
// Product groups used by the filter on the Brands page. Assigned from what each brand
// sells in Moldovan shops (2026-11); confirm with Forward before launch.
export const categories = ['pantry', 'canned', 'frozen', 'dairy', 'drinks', 'snacks'] as const;
export type Category = (typeof categories)[number];

export const brands: { name: string; logo: string; category: Category }[] = [
  { name: 'National', logo: 'brands/national.png' , category: 'canned' },
  { name: 'Bonduelle', logo: 'brands/bonduelle.png' , category: 'canned' },
  { name: 'Gold Drop', logo: 'brands/golddrop.png' , category: 'pantry' },
  { name: 'Farm Frites', logo: 'brands/farmfrites.png' , category: 'frozen' },
  { name: 'Silk', logo: 'brands/silk.png' , category: 'dairy' },
  { name: 'Riso Scotti', logo: 'brands/scotti.png' , category: 'pantry' },
  { name: 'Figo', logo: 'brands/figo.png' , category: 'drinks' },
  { name: 'Tedi', logo: 'brands/tedi.png' , category: 'drinks' },
  { name: 'Băneasa', logo: 'brands/baneasa.jpg' , category: 'pantry' },
  { name: 'Sadu', logo: 'brands/sadu.png' , category: 'canned' },
  { name: 'Kamis', logo: 'brands/kamis.png' , category: 'pantry' },
  { name: 'Dr. Oetker', logo: 'brands/droetker.gif' , category: 'pantry' },
  { name: 'Oleina', logo: 'brands/oleina.png' , category: 'pantry' },
  { name: 'Tymbark', logo: 'brands/tymbark.png' , category: 'drinks' },
  { name: 'Hochland', logo: 'brands/hochland.png' , category: 'dairy' },
  { name: 'Limo', logo: 'brands/limo.png' , category: 'frozen' },
  { name: 'Scandia Food', logo: 'brands/scandiafood.png' , category: 'canned' },
  { name: 'Yasno Solnyshko', logo: 'brands/yasnosolnyshko.png' , category: 'pantry' },
  { name: 'Croco', logo: 'brands/croco.png' , category: 'snacks' },
  { name: 'Aladushkin', logo: 'brands/aladushkin.png' , category: 'pantry' },
  { name: 'Algida', logo: 'brands/algida.png' , category: 'frozen' },
  { name: 'Lux Menu', logo: 'brands/luxmenu.png' , category: 'canned' },
];

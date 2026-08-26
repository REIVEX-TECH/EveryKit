/**
 * The 118 elements, with standard atomic weights.
 *
 * Vendored so nothing is fetched at runtime. The masses are the IUPAC standard
 * atomic weights (the "conventional" single values, 2021 revision, as published
 * by the IUPAC Commission on Isotopic Abundances and Atomic Weights and mirrored
 * on PubChem's periodic table). For the elements with no stable isotope, the
 * value is the mass number of the most stable or best-known isotope, which is
 * the usual convention and is marked `estimated: true` so the tools can say so
 * rather than implying a measured weight.
 *
 * Four significant figures is enough for a school or undergraduate molar mass;
 * anyone needing more should use a full isotopic reference.
 */

export type ElementCategory =
  | "alkali metal"
  | "alkaline earth metal"
  | "transition metal"
  | "post-transition metal"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble gas"
  | "lanthanide"
  | "actinide";

export type Element = {
  z: number;
  symbol: string;
  name: string;
  mass: number;
  category: ElementCategory;
  group: number | null;
  period: number;
  estimated?: boolean;
};

// [z, symbol, name, mass, category, group, period, estimated?]
type Row = [number, string, string, number, ElementCategory, number | null, number, boolean?];

const ROWS: Row[] = [
  [1, "H", "Hydrogen", 1.008, "nonmetal", 1, 1],
  [2, "He", "Helium", 4.0026, "noble gas", 18, 1],
  [3, "Li", "Lithium", 6.94, "alkali metal", 1, 2],
  [4, "Be", "Beryllium", 9.0122, "alkaline earth metal", 2, 2],
  [5, "B", "Boron", 10.81, "metalloid", 13, 2],
  [6, "C", "Carbon", 12.011, "nonmetal", 14, 2],
  [7, "N", "Nitrogen", 14.007, "nonmetal", 15, 2],
  [8, "O", "Oxygen", 15.999, "nonmetal", 16, 2],
  [9, "F", "Fluorine", 18.998, "halogen", 17, 2],
  [10, "Ne", "Neon", 20.18, "noble gas", 18, 2],
  [11, "Na", "Sodium", 22.99, "alkali metal", 1, 3],
  [12, "Mg", "Magnesium", 24.305, "alkaline earth metal", 2, 3],
  [13, "Al", "Aluminium", 26.982, "post-transition metal", 13, 3],
  [14, "Si", "Silicon", 28.085, "metalloid", 14, 3],
  [15, "P", "Phosphorus", 30.974, "nonmetal", 15, 3],
  [16, "S", "Sulfur", 32.06, "nonmetal", 16, 3],
  [17, "Cl", "Chlorine", 35.45, "halogen", 17, 3],
  [18, "Ar", "Argon", 39.95, "noble gas", 18, 3],
  [19, "K", "Potassium", 39.098, "alkali metal", 1, 4],
  [20, "Ca", "Calcium", 40.078, "alkaline earth metal", 2, 4],
  [21, "Sc", "Scandium", 44.956, "transition metal", 3, 4],
  [22, "Ti", "Titanium", 47.867, "transition metal", 4, 4],
  [23, "V", "Vanadium", 50.942, "transition metal", 5, 4],
  [24, "Cr", "Chromium", 51.996, "transition metal", 6, 4],
  [25, "Mn", "Manganese", 54.938, "transition metal", 7, 4],
  [26, "Fe", "Iron", 55.845, "transition metal", 8, 4],
  [27, "Co", "Cobalt", 58.933, "transition metal", 9, 4],
  [28, "Ni", "Nickel", 58.693, "transition metal", 10, 4],
  [29, "Cu", "Copper", 63.546, "transition metal", 11, 4],
  [30, "Zn", "Zinc", 65.38, "transition metal", 12, 4],
  [31, "Ga", "Gallium", 69.723, "post-transition metal", 13, 4],
  [32, "Ge", "Germanium", 72.63, "metalloid", 14, 4],
  [33, "As", "Arsenic", 74.922, "metalloid", 15, 4],
  [34, "Se", "Selenium", 78.971, "nonmetal", 16, 4],
  [35, "Br", "Bromine", 79.904, "halogen", 17, 4],
  [36, "Kr", "Krypton", 83.798, "noble gas", 18, 4],
  [37, "Rb", "Rubidium", 85.468, "alkali metal", 1, 5],
  [38, "Sr", "Strontium", 87.62, "alkaline earth metal", 2, 5],
  [39, "Y", "Yttrium", 88.906, "transition metal", 3, 5],
  [40, "Zr", "Zirconium", 91.224, "transition metal", 4, 5],
  [41, "Nb", "Niobium", 92.906, "transition metal", 5, 5],
  [42, "Mo", "Molybdenum", 95.95, "transition metal", 6, 5],
  [43, "Tc", "Technetium", 98, "transition metal", 7, 5, true],
  [44, "Ru", "Ruthenium", 101.07, "transition metal", 8, 5],
  [45, "Rh", "Rhodium", 102.91, "transition metal", 9, 5],
  [46, "Pd", "Palladium", 106.42, "transition metal", 10, 5],
  [47, "Ag", "Silver", 107.87, "transition metal", 11, 5],
  [48, "Cd", "Cadmium", 112.41, "transition metal", 12, 5],
  [49, "In", "Indium", 114.82, "post-transition metal", 13, 5],
  [50, "Sn", "Tin", 118.71, "post-transition metal", 14, 5],
  [51, "Sb", "Antimony", 121.76, "metalloid", 15, 5],
  [52, "Te", "Tellurium", 127.6, "metalloid", 16, 5],
  [53, "I", "Iodine", 126.9, "halogen", 17, 5],
  [54, "Xe", "Xenon", 131.29, "noble gas", 18, 5],
  [55, "Cs", "Caesium", 132.91, "alkali metal", 1, 6],
  [56, "Ba", "Barium", 137.33, "alkaline earth metal", 2, 6],
  [57, "La", "Lanthanum", 138.91, "lanthanide", null, 6],
  [58, "Ce", "Cerium", 140.12, "lanthanide", null, 6],
  [59, "Pr", "Praseodymium", 140.91, "lanthanide", null, 6],
  [60, "Nd", "Neodymium", 144.24, "lanthanide", null, 6],
  [61, "Pm", "Promethium", 145, "lanthanide", null, 6, true],
  [62, "Sm", "Samarium", 150.36, "lanthanide", null, 6],
  [63, "Eu", "Europium", 151.96, "lanthanide", null, 6],
  [64, "Gd", "Gadolinium", 157.25, "lanthanide", null, 6],
  [65, "Tb", "Terbium", 158.93, "lanthanide", null, 6],
  [66, "Dy", "Dysprosium", 162.5, "lanthanide", null, 6],
  [67, "Ho", "Holmium", 164.93, "lanthanide", null, 6],
  [68, "Er", "Erbium", 167.26, "lanthanide", null, 6],
  [69, "Tm", "Thulium", 168.93, "lanthanide", null, 6],
  [70, "Yb", "Ytterbium", 173.05, "lanthanide", null, 6],
  [71, "Lu", "Lutetium", 174.97, "lanthanide", 3, 6],
  [72, "Hf", "Hafnium", 178.49, "transition metal", 4, 6],
  [73, "Ta", "Tantalum", 180.95, "transition metal", 5, 6],
  [74, "W", "Tungsten", 183.84, "transition metal", 6, 6],
  [75, "Re", "Rhenium", 186.21, "transition metal", 7, 6],
  [76, "Os", "Osmium", 190.23, "transition metal", 8, 6],
  [77, "Ir", "Iridium", 192.22, "transition metal", 9, 6],
  [78, "Pt", "Platinum", 195.08, "transition metal", 10, 6],
  [79, "Au", "Gold", 196.97, "transition metal", 11, 6],
  [80, "Hg", "Mercury", 200.59, "transition metal", 12, 6],
  [81, "Tl", "Thallium", 204.38, "post-transition metal", 13, 6],
  [82, "Pb", "Lead", 207.2, "post-transition metal", 14, 6],
  [83, "Bi", "Bismuth", 208.98, "post-transition metal", 15, 6],
  [84, "Po", "Polonium", 209, "post-transition metal", 16, 6, true],
  [85, "At", "Astatine", 210, "halogen", 17, 6, true],
  [86, "Rn", "Radon", 222, "noble gas", 18, 6, true],
  [87, "Fr", "Francium", 223, "alkali metal", 1, 7, true],
  [88, "Ra", "Radium", 226, "alkaline earth metal", 2, 7, true],
  [89, "Ac", "Actinium", 227, "actinide", null, 7, true],
  [90, "Th", "Thorium", 232.04, "actinide", null, 7],
  [91, "Pa", "Protactinium", 231.04, "actinide", null, 7],
  [92, "U", "Uranium", 238.03, "actinide", null, 7],
  [93, "Np", "Neptunium", 237, "actinide", null, 7, true],
  [94, "Pu", "Plutonium", 244, "actinide", null, 7, true],
  [95, "Am", "Americium", 243, "actinide", null, 7, true],
  [96, "Cm", "Curium", 247, "actinide", null, 7, true],
  [97, "Bk", "Berkelium", 247, "actinide", null, 7, true],
  [98, "Cf", "Californium", 251, "actinide", null, 7, true],
  [99, "Es", "Einsteinium", 252, "actinide", null, 7, true],
  [100, "Fm", "Fermium", 257, "actinide", null, 7, true],
  [101, "Md", "Mendelevium", 258, "actinide", null, 7, true],
  [102, "No", "Nobelium", 259, "actinide", null, 7, true],
  [103, "Lr", "Lawrencium", 266, "actinide", 3, 7, true],
  [104, "Rf", "Rutherfordium", 267, "transition metal", 4, 7, true],
  [105, "Db", "Dubnium", 268, "transition metal", 5, 7, true],
  [106, "Sg", "Seaborgium", 269, "transition metal", 6, 7, true],
  [107, "Bh", "Bohrium", 270, "transition metal", 7, 7, true],
  [108, "Hs", "Hassium", 269, "transition metal", 8, 7, true],
  [109, "Mt", "Meitnerium", 278, "transition metal", 9, 7, true],
  [110, "Ds", "Darmstadtium", 281, "transition metal", 10, 7, true],
  [111, "Rg", "Roentgenium", 282, "transition metal", 11, 7, true],
  [112, "Cn", "Copernicium", 285, "transition metal", 12, 7, true],
  [113, "Nh", "Nihonium", 286, "post-transition metal", 13, 7, true],
  [114, "Fl", "Flerovium", 289, "post-transition metal", 14, 7, true],
  [115, "Mc", "Moscovium", 290, "post-transition metal", 15, 7, true],
  [116, "Lv", "Livermorium", 293, "post-transition metal", 16, 7, true],
  [117, "Ts", "Tennessine", 294, "halogen", 17, 7, true],
  [118, "Og", "Oganesson", 294, "noble gas", 18, 7, true],
];

export const elements: Element[] = ROWS.map(([z, symbol, name, mass, category, group, period, estimated]) => ({
  z,
  symbol,
  name,
  mass,
  category,
  group,
  period,
  ...(estimated ? { estimated: true } : {}),
}));

const bySymbol = new Map(elements.map((e) => [e.symbol, e]));

/** Look up an element by its exact, case-sensitive symbol (Co is cobalt, not CO). */
export function elementBySymbol(symbol: string): Element | undefined {
  return bySymbol.get(symbol);
}

/**
 * A flat tint per category, kept clear of purple and violet per the brand
 * rules, and light enough that the near-black symbol on top stays well above
 * the 4.5:1 contrast the tiles need. No neon, no gradient.
 */
export const CATEGORY_TINT: Record<ElementCategory, string> = {
  "alkali metal": "#f3c9a6",
  "alkaline earth metal": "#f5e0a3",
  "transition metal": "#bfe0f2",
  "post-transition metal": "#c7e6cf",
  metalloid: "#a9ddd2",
  nonmetal: "#bcd6f5",
  halogen: "#dcecb0",
  "noble gas": "#f4c6d5",
  lanthanide: "#cdd9ec",
  actinide: "#e0d4bd",
};

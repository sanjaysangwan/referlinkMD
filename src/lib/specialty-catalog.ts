/** ABMS-inspired specialty catalog. Logos/names are system-managed; seeded into DB. */

export type SpecialtySeed = {
  id: string;
  name: string;
  sortOrder: number;
  subspecialties: Array<{ id: string; name: string; sortOrder: number }>;
};

function sid(n: number): string {
  return `c1000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function subid(n: number): string {
  return `c2000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

/** Stable IDs used by seed for demo physicians. */
export const SPECIALTY_IDS = {
  cardiology: sid(1),
  orthopedicSurgery: sid(4),
  ep: subid(1),
  handSurgery: subid(40),
} as const;

export const SPECIALTY_CATALOG: SpecialtySeed[] = [
  {
    id: sid(1),
    name: "Cardiology",
    sortOrder: 10,
    subspecialties: [
      { id: subid(1), name: "Electrophysiology", sortOrder: 1 },
      { id: subid(2), name: "Interventional Cardiology", sortOrder: 2 },
      { id: subid(3), name: "Heart Failure", sortOrder: 3 },
      { id: subid(4), name: "Advanced Heart Failure & Transplant", sortOrder: 4 },
      { id: subid(5), name: "Adult Congenital Heart Disease", sortOrder: 5 },
    ],
  },
  {
    id: sid(2),
    name: "Otolaryngology (ENT)",
    sortOrder: 20,
    subspecialties: [
      { id: subid(20), name: "Otology / Neurotology", sortOrder: 1 },
      { id: subid(21), name: "Rhinology", sortOrder: 2 },
      { id: subid(22), name: "Head & Neck Oncology", sortOrder: 3 },
      { id: subid(23), name: "Laryngology", sortOrder: 4 },
      { id: subid(24), name: "Pediatric Otolaryngology", sortOrder: 5 },
    ],
  },
  {
    id: sid(3),
    name: "Ophthalmology",
    sortOrder: 30,
    subspecialties: [
      { id: subid(30), name: "Retina", sortOrder: 1 },
      { id: subid(31), name: "Cornea", sortOrder: 2 },
      { id: subid(32), name: "Glaucoma", sortOrder: 3 },
      { id: subid(33), name: "Oculoplastics", sortOrder: 4 },
      { id: subid(34), name: "Pediatric Ophthalmology", sortOrder: 5 },
    ],
  },
  {
    id: sid(4),
    name: "Orthopedic Surgery",
    sortOrder: 40,
    subspecialties: [
      { id: subid(40), name: "Hand Surgery", sortOrder: 1 },
      { id: subid(41), name: "Shoulder & Elbow", sortOrder: 2 },
      { id: subid(42), name: "Foot & Ankle", sortOrder: 3 },
      { id: subid(43), name: "Spine", sortOrder: 4 },
      { id: subid(44), name: "Sports Medicine", sortOrder: 5 },
      { id: subid(45), name: "Adult Reconstruction / Joint Replacement", sortOrder: 6 },
      { id: subid(46), name: "Trauma", sortOrder: 7 },
    ],
  },
  {
    id: sid(5),
    name: "Internal Medicine",
    sortOrder: 50,
    subspecialties: [
      { id: subid(50), name: "Hospital Medicine", sortOrder: 1 },
      { id: subid(51), name: "Geriatric Medicine", sortOrder: 2 },
    ],
  },
  {
    id: sid(6),
    name: "Neurology",
    sortOrder: 60,
    subspecialties: [
      { id: subid(60), name: "Epilepsy", sortOrder: 1 },
      { id: subid(61), name: "Stroke / Vascular Neurology", sortOrder: 2 },
      { id: subid(62), name: "Movement Disorders", sortOrder: 3 },
      { id: subid(63), name: "Neuromuscular Medicine", sortOrder: 4 },
    ],
  },
  {
    id: sid(7),
    name: "General Surgery",
    sortOrder: 70,
    subspecialties: [
      { id: subid(70), name: "Trauma / Critical Care", sortOrder: 1 },
      { id: subid(71), name: "Surgical Oncology", sortOrder: 2 },
      { id: subid(72), name: "Colorectal Surgery", sortOrder: 3 },
      { id: subid(73), name: "Minimally Invasive / Bariatric", sortOrder: 4 },
    ],
  },
  {
    id: sid(8),
    name: "Urology",
    sortOrder: 80,
    subspecialties: [
      { id: subid(80), name: "Urologic Oncology", sortOrder: 1 },
      { id: subid(81), name: "Female Pelvic Medicine", sortOrder: 2 },
      { id: subid(82), name: "Pediatric Urology", sortOrder: 3 },
    ],
  },
  {
    id: sid(9),
    name: "Dermatology",
    sortOrder: 90,
    subspecialties: [
      { id: subid(90), name: "Mohs Surgery", sortOrder: 1 },
      { id: subid(91), name: "Pediatric Dermatology", sortOrder: 2 },
      { id: subid(92), name: "Dermatopathology", sortOrder: 3 },
    ],
  },
  {
    id: sid(10),
    name: "Gastroenterology",
    sortOrder: 100,
    subspecialties: [
      { id: subid(100), name: "Hepatology", sortOrder: 1 },
      { id: subid(101), name: "Advanced Endoscopy", sortOrder: 2 },
      { id: subid(102), name: "Inflammatory Bowel Disease", sortOrder: 3 },
    ],
  },
  {
    id: sid(11),
    name: "Pulmonology",
    sortOrder: 110,
    subspecialties: [
      { id: subid(110), name: "Critical Care Medicine", sortOrder: 1 },
      { id: subid(111), name: "Interventional Pulmonology", sortOrder: 2 },
      { id: subid(112), name: "Sleep Medicine", sortOrder: 3 },
    ],
  },
  {
    id: sid(12),
    name: "Endocrinology",
    sortOrder: 120,
    subspecialties: [
      { id: subid(120), name: "Diabetes", sortOrder: 1 },
      { id: subid(121), name: "Thyroid / Parathyroid", sortOrder: 2 },
    ],
  },
  {
    id: sid(13),
    name: "Nephrology",
    sortOrder: 130,
    subspecialties: [
      { id: subid(130), name: "Transplant Nephrology", sortOrder: 1 },
      { id: subid(131), name: "Interventional Nephrology", sortOrder: 2 },
    ],
  },
  {
    id: sid(14),
    name: "Infectious Disease",
    sortOrder: 140,
    subspecialties: [
      { id: subid(140), name: "HIV Medicine", sortOrder: 1 },
      { id: subid(141), name: "Transplant Infectious Disease", sortOrder: 2 },
    ],
  },
  {
    id: sid(15),
    name: "Hematology / Oncology",
    sortOrder: 150,
    subspecialties: [
      { id: subid(150), name: "Medical Oncology", sortOrder: 1 },
      { id: subid(151), name: "Hematology", sortOrder: 2 },
      { id: subid(152), name: "Bone Marrow Transplant", sortOrder: 3 },
    ],
  },
  {
    id: sid(16),
    name: "Rheumatology",
    sortOrder: 160,
    subspecialties: [],
  },
  {
    id: sid(17),
    name: "Psychiatry",
    sortOrder: 170,
    subspecialties: [
      { id: subid(170), name: "Child & Adolescent Psychiatry", sortOrder: 1 },
      { id: subid(171), name: "Geriatric Psychiatry", sortOrder: 2 },
      { id: subid(172), name: "Addiction Psychiatry", sortOrder: 3 },
    ],
  },
  {
    id: sid(18),
    name: "Pediatrics",
    sortOrder: 180,
    subspecialties: [
      { id: subid(180), name: "Neonatology", sortOrder: 1 },
      { id: subid(181), name: "Pediatric Cardiology", sortOrder: 2 },
      { id: subid(182), name: "Pediatric Critical Care", sortOrder: 3 },
    ],
  },
  {
    id: sid(19),
    name: "Family Medicine",
    sortOrder: 190,
    subspecialties: [
      { id: subid(190), name: "Sports Medicine", sortOrder: 1 },
      { id: subid(191), name: "Geriatric Medicine", sortOrder: 2 },
    ],
  },
  {
    id: sid(20),
    name: "Emergency Medicine",
    sortOrder: 200,
    subspecialties: [
      { id: subid(200), name: "Pediatric Emergency Medicine", sortOrder: 1 },
      { id: subid(201), name: "Critical Care", sortOrder: 2 },
    ],
  },
  {
    id: sid(21),
    name: "Radiology",
    sortOrder: 210,
    subspecialties: [
      { id: subid(210), name: "Interventional Radiology", sortOrder: 1 },
      { id: subid(211), name: "Neuroradiology", sortOrder: 2 },
      { id: subid(212), name: "Musculoskeletal Radiology", sortOrder: 3 },
    ],
  },
  {
    id: sid(22),
    name: "Anesthesiology",
    sortOrder: 220,
    subspecialties: [
      { id: subid(220), name: "Pain Medicine", sortOrder: 1 },
      { id: subid(221), name: "Cardiac Anesthesiology", sortOrder: 2 },
      { id: subid(222), name: "Pediatric Anesthesiology", sortOrder: 3 },
    ],
  },
  {
    id: sid(23),
    name: "Pathology",
    sortOrder: 230,
    subspecialties: [
      { id: subid(230), name: "Molecular Pathology", sortOrder: 1 },
      { id: subid(231), name: "Cytopathology", sortOrder: 2 },
    ],
  },
  {
    id: sid(24),
    name: "Physical Medicine & Rehabilitation",
    sortOrder: 240,
    subspecialties: [
      { id: subid(240), name: "Sports Medicine", sortOrder: 1 },
      { id: subid(241), name: "Pain Medicine", sortOrder: 2 },
      { id: subid(242), name: "Spinal Cord Injury", sortOrder: 3 },
    ],
  },
  {
    id: sid(25),
    name: "Plastic Surgery",
    sortOrder: 250,
    subspecialties: [
      { id: subid(250), name: "Hand Surgery", sortOrder: 1 },
      { id: subid(251), name: "Craniofacial Surgery", sortOrder: 2 },
    ],
  },
  {
    id: sid(26),
    name: "Neurosurgery",
    sortOrder: 260,
    subspecialties: [
      { id: subid(260), name: "Spine", sortOrder: 1 },
      { id: subid(261), name: "Cerebrovascular", sortOrder: 2 },
      { id: subid(262), name: "Pediatric Neurosurgery", sortOrder: 3 },
    ],
  },
  {
    id: sid(27),
    name: "Vascular Surgery",
    sortOrder: 270,
    subspecialties: [],
  },
  {
    id: sid(28),
    name: "Obstetrics & Gynecology",
    sortOrder: 280,
    subspecialties: [
      { id: subid(280), name: "Maternal-Fetal Medicine", sortOrder: 1 },
      { id: subid(281), name: "Gynecologic Oncology", sortOrder: 2 },
      { id: subid(282), name: "Reproductive Endocrinology", sortOrder: 3 },
      { id: subid(283), name: "Urogynecology", sortOrder: 4 },
    ],
  },
];

export function physicianSpecialtyLabel(input: {
  specialtyName?: string | null;
  subspecialtyName?: string | null;
}): string | null {
  const sub = input.subspecialtyName?.trim();
  if (sub) return sub;
  const spec = input.specialtyName?.trim();
  return spec || null;
}

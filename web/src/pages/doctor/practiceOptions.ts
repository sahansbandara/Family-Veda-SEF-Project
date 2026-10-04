// Owner: S4 · Familial Risk & Clinical Approval — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Option lists and string helpers for the doctor practice profile. Mirrors
// mobile/lib/models/practice_options.dart. The API stores languages and consultation modes as
// plain strings, so the selectors parse and re-join them here; nothing in the contract changes.
import type { SearchableOption } from '../../components/shared/SearchableSelect'

// The same lists doctor registration uses. Choosing a specialty or a clinic here is a
// self-declaration: it does not verify a qualification or an affiliation.
export const SPECIALIZATIONS: SearchableOption[] = [
  { value: 'General Practice / Family Medicine', label: 'General Practice / Family Medicine' },
  { value: 'Internal Medicine', label: 'Internal Medicine' },
  { value: 'Paediatrics', label: 'Paediatrics' },
  { value: 'Cardiology', label: 'Cardiology' },
  { value: 'Dermatology', label: 'Dermatology' },
  { value: 'Endocrinology & Diabetology', label: 'Endocrinology & Diabetology' },
  { value: 'Gastroenterology', label: 'Gastroenterology' },
  { value: 'Neurology', label: 'Neurology' },
  { value: 'Obstetrics & Gynaecology', label: 'Obstetrics & Gynaecology' },
  { value: 'Oncology', label: 'Oncology' },
  { value: 'Ophthalmology', label: 'Ophthalmology' },
  { value: 'Orthopaedic Surgery', label: 'Orthopaedic Surgery' },
  { value: 'Otolaryngology (ENT)', label: 'Otolaryngology (ENT)' },
  { value: 'Psychiatry', label: 'Psychiatry' },
  { value: 'Pulmonology / Respiratory Medicine', label: 'Pulmonology / Respiratory Medicine' },
  { value: 'General Surgery', label: 'General Surgery' },
  { value: 'Emergency Medicine', label: 'Emergency Medicine' },
  { value: 'Nephrology', label: 'Nephrology' },
  { value: 'Rheumatology', label: 'Rheumatology' },
  { value: 'Other Specialization', label: 'Other Specialization' },
]

export const HOSPITAL_OPTIONS: SearchableOption[] = [
  // National & Teaching Hospitals
  { value: 'National Hospital of Sri Lanka (NHSL) - Colombo', label: 'National Hospital of Sri Lanka (NHSL) - Colombo', group: 'National & Teaching Hospitals' },
  { value: 'National Hospital Kandy', label: 'National Hospital Kandy', group: 'National & Teaching Hospitals' },
  { value: 'Colombo South Teaching Hospital (Kalubowila)', label: 'Colombo South Teaching Hospital (Kalubowila)', group: 'National & Teaching Hospitals' },
  { value: 'Colombo North Teaching Hospital (Ragama)', label: 'Colombo North Teaching Hospital (Ragama)', group: 'National & Teaching Hospitals' },
  { value: 'Sri Jayewardenepura General Hospital', label: 'Sri Jayewardenepura General Hospital', group: 'National & Teaching Hospitals' },
  { value: 'Lady Ridgeway Hospital for Children (LRH)', label: 'Lady Ridgeway Hospital for Children (LRH)', group: 'National & Teaching Hospitals' },
  { value: 'Castle Street Hospital for Women (CSHW)', label: 'Castle Street Hospital for Women (CSHW)', group: 'National & Teaching Hospitals' },
  { value: 'De Soysa Hospital for Women (DMH)', label: 'De Soysa Hospital for Women (DMH)', group: 'National & Teaching Hospitals' },
  { value: 'Apeksha Hospital (National Cancer Institute) - Maharagama', label: 'Apeksha Hospital (National Cancer Institute) - Maharagama', group: 'National & Teaching Hospitals' },
  { value: 'National Institute of Mental Health (NIMH) - Angoda', label: 'National Institute of Mental Health (NIMH) - Angoda', group: 'National & Teaching Hospitals' },
  { value: 'Teaching Hospital Karapitiya (Galle)', label: 'Teaching Hospital Karapitiya (Galle)', group: 'National & Teaching Hospitals' },
  { value: 'Teaching Hospital Peradeniya', label: 'Teaching Hospital Peradeniya', group: 'National & Teaching Hospitals' },
  { value: 'Teaching Hospital Jaffna', label: 'Teaching Hospital Jaffna', group: 'National & Teaching Hospitals' },
  { value: 'Teaching Hospital Batticaloa', label: 'Teaching Hospital Batticaloa', group: 'National & Teaching Hospitals' },
  { value: 'Teaching Hospital Anuradhapura', label: 'Teaching Hospital Anuradhapura', group: 'National & Teaching Hospitals' },
  { value: 'Teaching Hospital Kurunegala', label: 'Teaching Hospital Kurunegala', group: 'National & Teaching Hospitals' },
  { value: 'Teaching Hospital Ratnapura', label: 'Teaching Hospital Ratnapura', group: 'National & Teaching Hospitals' },
  { value: 'Teaching Hospital Badulla', label: 'Teaching Hospital Badulla', group: 'National & Teaching Hospitals' },

  // General & District Hospitals
  { value: 'District General Hospital Negombo', label: 'District General Hospital Negombo', group: 'General & District Hospitals' },
  { value: 'District General Hospital Gampaha', label: 'District General Hospital Gampaha', group: 'General & District Hospitals' },
  { value: 'District General Hospital Kalutara', label: 'District General Hospital Kalutara', group: 'General & District Hospitals' },
  { value: 'District General Hospital Matara', label: 'District General Hospital Matara', group: 'General & District Hospitals' },
  { value: 'District General Hospital Hambantota', label: 'District General Hospital Hambantota', group: 'General & District Hospitals' },
  { value: 'District General Hospital Chilaw', label: 'District General Hospital Chilaw', group: 'General & District Hospitals' },
  { value: 'District General Hospital Trincomalee', label: 'District General Hospital Trincomalee', group: 'General & District Hospitals' },
  { value: 'District General Hospital Polonnaruwa', label: 'District General Hospital Polonnaruwa', group: 'General & District Hospitals' },
  { value: 'District General Hospital Monaragala', label: 'District General Hospital Monaragala', group: 'General & District Hospitals' },
  { value: 'District General Hospital Nuwara Eliya', label: 'District General Hospital Nuwara Eliya', group: 'General & District Hospitals' },
  { value: 'District General Hospital Kegalle', label: 'District General Hospital Kegalle', group: 'General & District Hospitals' },
  { value: 'District General Hospital Vavuniya', label: 'District General Hospital Vavuniya', group: 'General & District Hospitals' },

  // Major Private Hospitals
  { value: 'Lanka Hospitals - Colombo', label: 'Lanka Hospitals - Colombo', group: 'Major Private Hospitals' },
  { value: 'Asiri Central Hospital - Colombo', label: 'Asiri Central Hospital - Colombo', group: 'Major Private Hospitals' },
  { value: 'Asiri Surgical Hospital - Colombo', label: 'Asiri Surgical Hospital - Colombo', group: 'Major Private Hospitals' },
  { value: 'Asiri Hospital Kandy / Galle / Matara', label: 'Asiri Hospital Kandy / Galle / Matara', group: 'Major Private Hospitals' },
  { value: 'Nawaloka Hospital - Colombo / Negombo', label: 'Nawaloka Hospital - Colombo / Negombo', group: 'Major Private Hospitals' },
  { value: 'Durdans Hospital - Colombo', label: 'Durdans Hospital - Colombo', group: 'Major Private Hospitals' },
  { value: 'Hemas Hospital - Wattala / Thalawathugoda', label: 'Hemas Hospital - Wattala / Thalawathugoda', group: 'Major Private Hospitals' },
  { value: 'Kings Hospital - Colombo', label: 'Kings Hospital - Colombo', group: 'Major Private Hospitals' },
  { value: 'Ninewells Hospital - Colombo', label: 'Ninewells Hospital - Colombo', group: 'Major Private Hospitals' },
  { value: 'Melsta Hospitals - Ragama', label: 'Melsta Hospitals - Ragama', group: 'Major Private Hospitals' },
  { value: 'Golden Key Eye & ENT Hospital', label: 'Golden Key Eye & ENT Hospital', group: 'Major Private Hospitals' },
  { value: 'MediHelp Hospitals & Clinics', label: 'MediHelp Hospitals & Clinics', group: 'Major Private Hospitals' },
  { value: 'Pannipitiya Private Hospital', label: 'Pannipitiya Private Hospital', group: 'Major Private Hospitals' },

  // Primary Care, Clinics & Practices
  { value: 'Primary Medical Care Unit (PMCU)', label: 'Primary Medical Care Unit (PMCU)', group: 'Primary Care, Clinics & Practices' },
  { value: 'Divisional Hospital / MOH Clinic', label: 'Divisional Hospital / MOH Clinic', group: 'Primary Care, Clinics & Practices' },
  { value: 'Family Practice / Private Medical Clinic', label: 'Family Practice / Private Medical Clinic', group: 'Primary Care, Clinics & Practices' },
  { value: 'Other Registered Hospital / Clinic', label: 'Other Registered Hospital / Clinic', group: 'Primary Care, Clinics & Practices' },
]

export const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna',
  'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala',
  'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
] as const

// Main towns per district: a starting list, not a full gazetteer. Anything missing is typed in.
const CITIES: Record<string, string[]> = {
  Ampara: ['Ampara', 'Akkaraipattu', 'Kalmunai', 'Sainthamaruthu', 'Pottuvil', 'Dehiattakandiya', 'Uhana'],
  Anuradhapura: ['Anuradhapura', 'Kekirawa', 'Medawachchiya', 'Mihintale', 'Eppawala', 'Galenbindunuwewa', 'Thambuttegama'],
  Badulla: ['Badulla', 'Bandarawela', 'Haputale', 'Ella', 'Welimada', 'Mahiyanganaya', 'Passara', 'Diyatalawa'],
  Batticaloa: ['Batticaloa', 'Kattankudy', 'Eravur', 'Valaichchenai', 'Kaluwanchikudy'],
  Colombo: ['Colombo', 'Dehiwala-Mount Lavinia', 'Moratuwa', 'Sri Jayawardenepura Kotte', 'Maharagama', 'Nugegoda', 'Kesbewa', 'Piliyandala', 'Homagama', 'Kaduwela', 'Battaramulla', 'Kolonnawa', 'Avissawella', 'Padukka'],
  Galle: ['Galle', 'Ambalangoda', 'Hikkaduwa', 'Elpitiya', 'Bentota', 'Baddegama', 'Karapitiya'],
  Gampaha: ['Gampaha', 'Negombo', 'Wattala', 'Ja-Ela', 'Kadawatha', 'Kiribathgoda', 'Kelaniya', 'Ragama', 'Minuwangoda', 'Divulapitiya', 'Nittambuwa', 'Veyangoda', 'Katunayake', 'Mirigama'],
  Hambantota: ['Hambantota', 'Tangalle', 'Tissamaharama', 'Ambalantota', 'Beliatta', 'Weeraketiya'],
  Jaffna: ['Jaffna', 'Chavakachcheri', 'Point Pedro', 'Nallur', 'Kopay', 'Tellippalai'],
  Kalutara: ['Kalutara', 'Panadura', 'Horana', 'Beruwala', 'Aluthgama', 'Matugama', 'Bandaragama', 'Wadduwa'],
  Kandy: ['Kandy', 'Peradeniya', 'Katugastota', 'Gampola', 'Nawalapitiya', 'Kundasale', 'Akurana', 'Digana', 'Pilimatalawa'],
  Kegalle: ['Kegalle', 'Mawanella', 'Warakapola', 'Rambukkana', 'Ruwanwella', 'Yatiyantota', 'Deraniyagala'],
  Kilinochchi: ['Kilinochchi', 'Paranthan', 'Pallai', 'Poonakary'],
  Kurunegala: ['Kurunegala', 'Kuliyapitiya', 'Narammala', 'Wariyapola', 'Pannala', 'Polgahawela', 'Nikaweratiya', 'Maho', 'Alawwa'],
  Mannar: ['Mannar', 'Murunkan', 'Madhu', 'Pesalai'],
  Matale: ['Matale', 'Dambulla', 'Sigiriya', 'Galewela', 'Ukuwela', 'Rattota', 'Naula'],
  Matara: ['Matara', 'Weligama', 'Akuressa', 'Dikwella', 'Hakmana', 'Kamburupitiya', 'Deniyaya'],
  Monaragala: ['Monaragala', 'Wellawaya', 'Bibile', 'Buttala', 'Kataragama', 'Siyambalanduwa'],
  Mullaitivu: ['Mullaitivu', 'Puthukkudiyiruppu', 'Oddusuddan', 'Mankulam'],
  'Nuwara Eliya': ['Nuwara Eliya', 'Hatton', 'Talawakele', 'Ginigathhena', 'Nanu Oya', 'Maskeliya', 'Ragala'],
  Polonnaruwa: ['Polonnaruwa', 'Kaduruwela', 'Hingurakgoda', 'Medirigiriya', 'Welikanda'],
  Puttalam: ['Puttalam', 'Chilaw', 'Wennappuwa', 'Marawila', 'Dankotuwa', 'Nattandiya', 'Kalpitiya', 'Anamaduwa'],
  Ratnapura: ['Ratnapura', 'Embilipitiya', 'Balangoda', 'Pelmadulla', 'Kuruwita', 'Eheliyagoda', 'Kahawatta'],
  Trincomalee: ['Trincomalee', 'Kinniya', 'Kantale', 'Mutur', 'Nilaveli'],
  Vavuniya: ['Vavuniya', 'Cheddikulam', 'Nedunkeni', 'Omanthai'],
}
export const citiesFor = (district: string): string[] => CITIES[district] ?? []

export const LANGUAGES = ['Sinhala', 'English', 'Tamil']

// Only modes a family can actually book are offered. Appointments are in-person today; add
// video or phone here when the booking flow supports them.
export const CONSULTATION_MODES = ['In-person']
export const MODE_ALIASES: Record<string, string> = { inperson: 'In-person', 'in person': 'In-person' }

export const SLOT_MINUTES = [15, 20, 30, 45, 60]

/**
 * Splits a stored "Sinhala, English" string into its choices. Known options come back in their
 * canonical spelling; anything else is kept as written, so an older value is never dropped silently.
 */
export function parseChoices(stored: string | null | undefined, known: string[], aliases: Record<string, string> = {}): string[] {
  const choices: string[] = []
  for (const raw of (stored ?? '').split(/[,;/]/)) {
    const text = raw.trim()
    if (!text) continue
    const key = text.toLowerCase()
    const choice = known.find((option) => option.toLowerCase() === key) ?? aliases[key] ?? text
    if (!choices.includes(choice)) choices.push(choice)
  }
  return choices
}

export const joinChoices = (choices: string[]): string | null => choices.join(', ') || null

const PHONE = /^(?:0|\+94)\d{9}$/

/** Null when the number is empty (the field is optional) or a Sri Lankan mobile or landline number. */
export function phoneProblem(value: string): string | null {
  const digits = value.replace(/[\s()-]/g, '')
  return !digits || PHONE.test(digits) ? null : 'Enter a Sri Lankan phone number, e.g. 0112345678 or +94771234567.'
}

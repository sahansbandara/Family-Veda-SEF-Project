// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Option lists and string helpers for the doctor practice profile. Mirrors
// web/src/pages/doctor/practiceOptions.ts — keep the two in step. The API stores languages and
// consultation modes as plain strings, so the selectors parse and re-join them here.

/// One selectable value, with the group it is listed under (if any).
typedef PracticeOption = ({String value, String? group});

List<PracticeOption> _plain(List<String> values) => [
  for (final value in values) (value: value, group: null),
];

// The same lists doctor registration uses. Choosing a specialty or a clinic is a
// self-declaration: it does not verify a qualification or an affiliation.
final specialtyOptions = _plain(const [
  'General Practice / Family Medicine',
  'Internal Medicine',
  'Paediatrics',
  'Cardiology',
  'Dermatology',
  'Endocrinology & Diabetology',
  'Gastroenterology',
  'Neurology',
  'Obstetrics & Gynaecology',
  'Oncology',
  'Ophthalmology',
  'Orthopaedic Surgery',
  'Otolaryngology (ENT)',
  'Psychiatry',
  'Pulmonology / Respiratory Medicine',
  'General Surgery',
  'Emergency Medicine',
  'Nephrology',
  'Rheumatology',
  'Other Specialization',
]);

const List<PracticeOption> clinicOptions = [
  (
    value: 'National Hospital of Sri Lanka (NHSL) - Colombo',
    group: 'National & Teaching Hospitals',
  ),
  (value: 'National Hospital Kandy', group: 'National & Teaching Hospitals'),
  (
    value: 'Colombo South Teaching Hospital (Kalubowila)',
    group: 'National & Teaching Hospitals',
  ),
  (
    value: 'Colombo North Teaching Hospital (Ragama)',
    group: 'National & Teaching Hospitals',
  ),
  (
    value: 'Sri Jayewardenepura General Hospital',
    group: 'National & Teaching Hospitals',
  ),
  (
    value: 'Lady Ridgeway Hospital for Children (LRH)',
    group: 'National & Teaching Hospitals',
  ),
  (
    value: 'Castle Street Hospital for Women (CSHW)',
    group: 'National & Teaching Hospitals',
  ),
  (
    value: 'De Soysa Hospital for Women (DMH)',
    group: 'National & Teaching Hospitals',
  ),
  (
    value: 'Apeksha Hospital (National Cancer Institute) - Maharagama',
    group: 'National & Teaching Hospitals',
  ),
  (
    value: 'National Institute of Mental Health (NIMH) - Angoda',
    group: 'National & Teaching Hospitals',
  ),
  (
    value: 'Teaching Hospital Karapitiya (Galle)',
    group: 'National & Teaching Hospitals',
  ),
  (
    value: 'Teaching Hospital Peradeniya',
    group: 'National & Teaching Hospitals',
  ),
  (value: 'Teaching Hospital Jaffna', group: 'National & Teaching Hospitals'),
  (
    value: 'Teaching Hospital Batticaloa',
    group: 'National & Teaching Hospitals',
  ),
  (
    value: 'Teaching Hospital Anuradhapura',
    group: 'National & Teaching Hospitals',
  ),
  (
    value: 'Teaching Hospital Kurunegala',
    group: 'National & Teaching Hospitals',
  ),
  (
    value: 'Teaching Hospital Ratnapura',
    group: 'National & Teaching Hospitals',
  ),
  (value: 'Teaching Hospital Badulla', group: 'National & Teaching Hospitals'),
  (
    value: 'District General Hospital Negombo',
    group: 'General & District Hospitals',
  ),
  (
    value: 'District General Hospital Gampaha',
    group: 'General & District Hospitals',
  ),
  (
    value: 'District General Hospital Kalutara',
    group: 'General & District Hospitals',
  ),
  (
    value: 'District General Hospital Matara',
    group: 'General & District Hospitals',
  ),
  (
    value: 'District General Hospital Hambantota',
    group: 'General & District Hospitals',
  ),
  (
    value: 'District General Hospital Chilaw',
    group: 'General & District Hospitals',
  ),
  (
    value: 'District General Hospital Trincomalee',
    group: 'General & District Hospitals',
  ),
  (
    value: 'District General Hospital Polonnaruwa',
    group: 'General & District Hospitals',
  ),
  (
    value: 'District General Hospital Monaragala',
    group: 'General & District Hospitals',
  ),
  (
    value: 'District General Hospital Nuwara Eliya',
    group: 'General & District Hospitals',
  ),
  (
    value: 'District General Hospital Kegalle',
    group: 'General & District Hospitals',
  ),
  (
    value: 'District General Hospital Vavuniya',
    group: 'General & District Hospitals',
  ),
  (value: 'Lanka Hospitals - Colombo', group: 'Major Private Hospitals'),
  (value: 'Asiri Central Hospital - Colombo', group: 'Major Private Hospitals'),
  (
    value: 'Asiri Surgical Hospital - Colombo',
    group: 'Major Private Hospitals',
  ),
  (
    value: 'Asiri Hospital Kandy / Galle / Matara',
    group: 'Major Private Hospitals',
  ),
  (
    value: 'Nawaloka Hospital - Colombo / Negombo',
    group: 'Major Private Hospitals',
  ),
  (value: 'Durdans Hospital - Colombo', group: 'Major Private Hospitals'),
  (
    value: 'Hemas Hospital - Wattala / Thalawathugoda',
    group: 'Major Private Hospitals',
  ),
  (value: 'Kings Hospital - Colombo', group: 'Major Private Hospitals'),
  (value: 'Ninewells Hospital - Colombo', group: 'Major Private Hospitals'),
  (value: 'Melsta Hospitals - Ragama', group: 'Major Private Hospitals'),
  (value: 'Golden Key Eye & ENT Hospital', group: 'Major Private Hospitals'),
  (value: 'MediHelp Hospitals & Clinics', group: 'Major Private Hospitals'),
  (value: 'Pannipitiya Private Hospital', group: 'Major Private Hospitals'),
  (
    value: 'Primary Medical Care Unit (PMCU)',
    group: 'Primary Care, Clinics & Practices',
  ),
  (
    value: 'Divisional Hospital / MOH Clinic',
    group: 'Primary Care, Clinics & Practices',
  ),
  (
    value: 'Family Practice / Private Medical Clinic',
    group: 'Primary Care, Clinics & Practices',
  ),
  (
    value: 'Other Registered Hospital / Clinic',
    group: 'Primary Care, Clinics & Practices',
  ),
];

const districts = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
];
final districtOptions = _plain(districts);

// Main towns per district: a starting list, not a full gazetteer. Anything missing is typed in.
const _cities = <String, List<String>>{
  'Ampara': [
    'Ampara',
    'Akkaraipattu',
    'Kalmunai',
    'Sainthamaruthu',
    'Pottuvil',
    'Dehiattakandiya',
    'Uhana',
  ],
  'Anuradhapura': [
    'Anuradhapura',
    'Kekirawa',
    'Medawachchiya',
    'Mihintale',
    'Eppawala',
    'Galenbindunuwewa',
    'Thambuttegama',
  ],
  'Badulla': [
    'Badulla',
    'Bandarawela',
    'Haputale',
    'Ella',
    'Welimada',
    'Mahiyanganaya',
    'Passara',
    'Diyatalawa',
  ],
  'Batticaloa': [
    'Batticaloa',
    'Kattankudy',
    'Eravur',
    'Valaichchenai',
    'Kaluwanchikudy',
  ],
  'Colombo': [
    'Colombo',
    'Dehiwala-Mount Lavinia',
    'Moratuwa',
    'Sri Jayawardenepura Kotte',
    'Maharagama',
    'Nugegoda',
    'Kesbewa',
    'Piliyandala',
    'Homagama',
    'Kaduwela',
    'Battaramulla',
    'Kolonnawa',
    'Avissawella',
    'Padukka',
  ],
  'Galle': [
    'Galle',
    'Ambalangoda',
    'Hikkaduwa',
    'Elpitiya',
    'Bentota',
    'Baddegama',
    'Karapitiya',
  ],
  'Gampaha': [
    'Gampaha',
    'Negombo',
    'Wattala',
    'Ja-Ela',
    'Kadawatha',
    'Kiribathgoda',
    'Kelaniya',
    'Ragama',
    'Minuwangoda',
    'Divulapitiya',
    'Nittambuwa',
    'Veyangoda',
    'Katunayake',
    'Mirigama',
  ],
  'Hambantota': [
    'Hambantota',
    'Tangalle',
    'Tissamaharama',
    'Ambalantota',
    'Beliatta',
    'Weeraketiya',
  ],
  'Jaffna': [
    'Jaffna',
    'Chavakachcheri',
    'Point Pedro',
    'Nallur',
    'Kopay',
    'Tellippalai',
  ],
  'Kalutara': [
    'Kalutara',
    'Panadura',
    'Horana',
    'Beruwala',
    'Aluthgama',
    'Matugama',
    'Bandaragama',
    'Wadduwa',
  ],
  'Kandy': [
    'Kandy',
    'Peradeniya',
    'Katugastota',
    'Gampola',
    'Nawalapitiya',
    'Kundasale',
    'Akurana',
    'Digana',
    'Pilimatalawa',
  ],
  'Kegalle': [
    'Kegalle',
    'Mawanella',
    'Warakapola',
    'Rambukkana',
    'Ruwanwella',
    'Yatiyantota',
    'Deraniyagala',
  ],
  'Kilinochchi': ['Kilinochchi', 'Paranthan', 'Pallai', 'Poonakary'],
  'Kurunegala': [
    'Kurunegala',
    'Kuliyapitiya',
    'Narammala',
    'Wariyapola',
    'Pannala',
    'Polgahawela',
    'Nikaweratiya',
    'Maho',
    'Alawwa',
  ],
  'Mannar': ['Mannar', 'Murunkan', 'Madhu', 'Pesalai'],
  'Matale': [
    'Matale',
    'Dambulla',
    'Sigiriya',
    'Galewela',
    'Ukuwela',
    'Rattota',
    'Naula',
  ],
  'Matara': [
    'Matara',
    'Weligama',
    'Akuressa',
    'Dikwella',
    'Hakmana',
    'Kamburupitiya',
    'Deniyaya',
  ],
  'Monaragala': [
    'Monaragala',
    'Wellawaya',
    'Bibile',
    'Buttala',
    'Kataragama',
    'Siyambalanduwa',
  ],
  'Mullaitivu': ['Mullaitivu', 'Puthukkudiyiruppu', 'Oddusuddan', 'Mankulam'],
  'Nuwara Eliya': [
    'Nuwara Eliya',
    'Hatton',
    'Talawakele',
    'Ginigathhena',
    'Nanu Oya',
    'Maskeliya',
    'Ragala',
  ],
  'Polonnaruwa': [
    'Polonnaruwa',
    'Kaduruwela',
    'Hingurakgoda',
    'Medirigiriya',
    'Welikanda',
  ],
  'Puttalam': [
    'Puttalam',
    'Chilaw',
    'Wennappuwa',
    'Marawila',
    'Dankotuwa',
    'Nattandiya',
    'Kalpitiya',
    'Anamaduwa',
  ],
  'Ratnapura': [
    'Ratnapura',
    'Embilipitiya',
    'Balangoda',
    'Pelmadulla',
    'Kuruwita',
    'Eheliyagoda',
    'Kahawatta',
  ],
  'Trincomalee': ['Trincomalee', 'Kinniya', 'Kantale', 'Mutur', 'Nilaveli'],
  'Vavuniya': ['Vavuniya', 'Cheddikulam', 'Nedunkeni', 'Omanthai'],
};

List<PracticeOption> cityOptions(String? district) =>
    _plain(_cities[district] ?? const []);

bool cityInDistrict(String city, String? district) =>
    (_cities[district] ?? const []).contains(city);

const languageOptions = ['Sinhala', 'English', 'Tamil'];

// Only modes a family can actually book are offered. Appointments are in-person today; add
// video or phone here when the booking flow supports them.
const consultationModeOptions = ['In-person'];
const consultationModeAliases = {
  'inperson': 'In-person',
  'in person': 'In-person',
};

/// Splits a stored "Sinhala, English" string into its choices. Known options come back in their
/// canonical spelling; anything else is kept as written, so an older value is never dropped silently.
List<String> parseChoices(
  String? stored,
  List<String> known, {
  Map<String, String> aliases = const {},
}) {
  final choices = <String>[];
  for (final raw in (stored ?? '').split(RegExp('[,;/]'))) {
    final text = raw.trim();
    if (text.isEmpty) continue;
    final key = text.toLowerCase();
    final choice =
        known.cast<String?>().firstWhere(
          (option) => option!.toLowerCase() == key,
          orElse: () => null,
        ) ??
        aliases[key] ??
        text;
    if (!choices.contains(choice)) choices.add(choice);
  }
  return choices;
}

String? joinChoices(List<String> choices) =>
    choices.isEmpty ? null : choices.join(', ');

final _phone = RegExp(r'^(?:0|\+94)\d{9}$');

/// Null when the number is empty (the field is optional) or a Sri Lankan mobile or landline number.
String? phoneProblem(String value) {
  final digits = value.replaceAll(RegExp(r'[\s()-]'), '');
  return digits.isEmpty || _phone.hasMatch(digits)
      ? null
      : 'Enter a Sri Lankan phone number, e.g. 0112345678 or +94771234567.';
}

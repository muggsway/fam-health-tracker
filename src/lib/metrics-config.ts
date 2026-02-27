export interface PriorityMetricConfig {
  key: string;
  displayName: string;
  unit: string;
  description: string;
  higherIsBetter: boolean | null; // null = optimal range (e.g. glucose)
  chartColor: string;
}

export const PRIORITY_METRICS: PriorityMetricConfig[] = [
  {
    key: 'hba1c',
    displayName: 'HbA1c',
    unit: '%',
    description: 'Average blood sugar over 2-3 months. Indicates diabetes risk.',
    higherIsBetter: false,
    chartColor: '#ef4444',
  },
  {
    key: 'fasting_glucose',
    displayName: 'Fasting Glucose',
    unit: 'mg/dL',
    description: 'Blood sugar after fasting. Key diabetes marker.',
    higherIsBetter: null,
    chartColor: '#f97316',
  },
  {
    key: 'hscrp',
    displayName: 'hsCRP (Inflammation)',
    unit: 'mg/L',
    description: 'High-sensitivity C-reactive protein. Marker of systemic inflammation.',
    higherIsBetter: false,
    chartColor: '#dc2626',
  },
  {
    key: 'insulin_fasting',
    displayName: 'Fasting Insulin',
    unit: 'µU/mL',
    description: 'Fasting insulin levels. Elevated levels indicate insulin resistance.',
    higherIsBetter: false,
    chartColor: '#7c3aed',
  },
  {
    key: 'vitamin_d',
    displayName: 'Vitamin D (25-OH)',
    unit: 'ng/mL',
    description: 'Vitamin D levels. Critical for bone health, immunity, and mood.',
    higherIsBetter: null,
    chartColor: '#eab308',
  },
  {
    key: 'alt_sgpt',
    displayName: 'ALT / SGPT (Liver)',
    unit: 'U/L',
    description: 'Liver enzyme. Elevated levels indicate liver stress or damage.',
    higherIsBetter: false,
    chartColor: '#84cc16',
  },
  {
    key: 'hemoglobin',
    displayName: 'Hemoglobin',
    unit: 'g/dL',
    description: 'Protein in red blood cells carrying oxygen. Low = anaemia.',
    higherIsBetter: null,
    chartColor: '#06b6d4',
  },
  {
    key: 'triglycerides',
    displayName: 'Triglycerides',
    unit: 'mg/dL',
    description: 'Blood fats. Elevated levels increase cardiovascular risk.',
    higherIsBetter: false,
    chartColor: '#f59e0b',
  },
  {
    key: 'total_cholesterol',
    displayName: 'Total Cholesterol',
    unit: 'mg/dL',
    description: 'Total cholesterol in the blood. Part of cardiovascular risk assessment.',
    higherIsBetter: false,
    chartColor: '#3b82f6',
  },
  {
    key: 'apo_b',
    displayName: 'Apolipoprotein B',
    unit: 'mg/dL',
    description: 'ApoB is in every LDL particle. Better predictor of cardiovascular risk than LDL.',
    higherIsBetter: false,
    chartColor: '#8b5cf6',
  },
  {
    key: 'tsh',
    displayName: 'TSH (Thyroid)',
    unit: 'µIU/mL',
    description: 'Thyroid-stimulating hormone. Regulates thyroid function.',
    higherIsBetter: null,
    chartColor: '#10b981',
  },
];

export const PRIORITY_METRIC_KEYS = new Set(PRIORITY_METRICS.map((m) => m.key));

// Key metrics that should be present in every checkup
export const KEY_METRICS: { key: string; displayName: string }[] = [
  { key: 'hba1c', displayName: 'HbA1c' },
  { key: 'fasting_glucose', displayName: 'Fasting Glucose' },
  { key: 'hscrp', displayName: 'hsCRP (Inflammation)' },
  { key: 'vitamin_d', displayName: 'Vitamin D' },
  { key: 'alt_sgpt', displayName: 'ALT/SGPT (Liver)' },
  { key: 'hemoglobin', displayName: 'Hemoglobin' },
  { key: 'tsh', displayName: 'TSH (Thyroid)' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  diabetes: 'Diabetes & Blood Sugar',
  liver: 'Liver Function',
  kidney: 'Kidney Function',
  lipid: 'Lipid Profile',
  thyroid: 'Thyroid',
  vitamins: 'Vitamins & Minerals',
  blood: 'Complete Blood Count',
  inflammation: 'Inflammation & Cardiac Risk',
  hormones: 'Hormones',
  urine: 'Urine Analysis',
  other: 'Other',
};

// Category display order
export const CATEGORY_ORDER = [
  'diabetes',
  'inflammation',
  'liver',
  'lipid',
  'thyroid',
  'kidney',
  'blood',
  'vitamins',
  'hormones',
  'urine',
  'other',
];

// Map of alternative names / spellings → canonical metric_key
// Claude will return metric_key in the JSON, but this is a fallback normalizer
export function normalizeMetricKey(rawName: string): string {
  const name = rawName.toLowerCase().trim();

  const mappings: [RegExp, string][] = [
    [/hba1c|glycosylated hemo|glycohemo/i, 'hba1c'],
    [/fasting.*glucose|glucose.*fasting|fbs|fpg/i, 'fasting_glucose'],
    [/hs.?crp|high.*sens.*crp|c.reactive.*protein/i, 'hscrp'],
    [/insulin.*fasting|fasting.*insulin/i, 'insulin_fasting'],
    [/vitamin.*d|25.oh|25-hydroxy/i, 'vitamin_d'],
    [/alt|sgpt|alanine.*trans/i, 'alt_sgpt'],
    [/ast|sgot|aspartate.*trans/i, 'ast_sgot'],
    [/hemoglobin(?!.*a1c)|haemoglobin/i, 'hemoglobin'],
    [/triglyceride/i, 'triglycerides'],
    [/total.*cholesterol|cholesterol.*total/i, 'total_cholesterol'],
    [/hdl.*cholesterol|cholesterol.*hdl/i, 'hdl_cholesterol'],
    [/ldl.*cholesterol|cholesterol.*ldl/i, 'ldl_cholesterol'],
    [/vldl/i, 'vldl_cholesterol'],
    [/non.hdl/i, 'non_hdl_cholesterol'],
    [/apo.*b(?!\/)/i, 'apo_b'],
    [/apo.*a1|apo.*a-1/i, 'apo_a1'],
    [/apo.*b.*a1|apo.*ratio/i, 'apo_b_a1_ratio'],
    [/tsh/i, 'tsh'],
    [/t3.*total|total.*t3|triiodothyronine/i, 't3_total'],
    [/t4.*total|total.*t4|thyroxine/i, 't4_total'],
    [/creatinine.*serum|serum.*creatinine/i, 'creatinine'],
    [/creatinine.*urine|urine.*creatinine/i, 'creatinine_urine'],
    [/egfr|glomerular.*filtration/i, 'egfr'],
    [/urea.*nitrogen|bun/i, 'bun'],
    [/urea(?!.*nitrogen)/i, 'urea'],
    [/uric.*acid/i, 'uric_acid'],
    [/vitamin.*b12|b12|cyanocobalamin/i, 'vitamin_b12'],
    [/vitamin.*b1(?!2)|thiamin/i, 'vitamin_b1'],
    [/vitamin.*b2|riboflavin/i, 'vitamin_b2'],
    [/vitamin.*b3|nicotinic/i, 'vitamin_b3'],
    [/vitamin.*b5|pantothenic/i, 'vitamin_b5'],
    [/vitamin.*b6|p5p/i, 'vitamin_b6'],
    [/vitamin.*b7|biotin/i, 'vitamin_b7'],
    [/vitamin.*b9|folic/i, 'vitamin_b9'],
    [/vitamin.*a(?!\d)/i, 'vitamin_a'],
    [/vitamin.*e(?!\d)/i, 'vitamin_e'],
    [/vitamin.*k/i, 'vitamin_k'],
    [/iron(?!.*bind)/i, 'iron'],
    [/tibc|total.*iron.*bind/i, 'tibc'],
    [/ferritin/i, 'ferritin'],
    [/transferrin.*sat/i, 'transferrin_saturation'],
    [/homocysteine/i, 'homocysteine'],
    [/magnesium/i, 'magnesium'],
    [/calcium/i, 'calcium'],
    [/phosphorus|phosphate/i, 'phosphorus'],
    [/sodium/i, 'sodium'],
    [/potassium/i, 'potassium'],
    [/chloride/i, 'chloride'],
    [/ggtp|ggt|gamma.*glutamyl/i, 'ggt'],
    [/alp|alkaline.*phosph/i, 'alp'],
    [/bilirubin.*total|total.*bilirubin/i, 'bilirubin_total'],
    [/bilirubin.*direct|direct.*bilirubin/i, 'bilirubin_direct'],
    [/bilirubin.*indirect|indirect.*bilirubin/i, 'bilirubin_indirect'],
    [/total.*protein|protein.*total/i, 'total_protein'],
    [/albumin(?!.*urine|.*creatinine)/i, 'albumin'],
    [/globulin/i, 'globulin'],
    [/wbc|leukocyte.*count|white.*blood/i, 'wbc'],
    [/rbc|red.*blood.*cell.*count|erythrocyte.*count/i, 'rbc_count'],
    [/rdw/i, 'rdw'],
    [/mcv/i, 'mcv'],
    [/mch(?!c)/i, 'mch'],
    [/mchc/i, 'mchc'],
    [/platelet.*count/i, 'platelet_count'],
    [/esr/i, 'esr'],
    [/lp.a|lipoprotein.*a\b/i, 'lipoprotein_a'],
    [/lp.pla2/i, 'lp_pla2'],
    [/testosterone/i, 'testosterone'],
    [/insulin(?!.*fasting|.*resistance)/i, 'insulin_fasting'],
    [/cystatin/i, 'cystatin_c'],
    [/amylase/i, 'amylase'],
    [/lipase/i, 'lipase'],
    [/fructosamine/i, 'fructosamine'],
    [/blood.*ketone|ketone/i, 'blood_ketone'],
    [/uibc/i, 'uibc'],
    [/pus.*cell|leucocyte.*urine/i, 'urine_pus_cells'],
    [/microalbumin.*urine|urine.*microalbumin/i, 'urine_microalbumin'],
  ];

  for (const [pattern, key] of mappings) {
    if (pattern.test(rawName)) return key;
  }

  // Fallback: slugify the name
  return name.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function getCategoryForKey(key: string): string {
  const categoryMap: Record<string, string> = {
    hba1c: 'diabetes',
    fasting_glucose: 'diabetes',
    insulin_fasting: 'diabetes',
    fructosamine: 'diabetes',
    blood_ketone: 'diabetes',
    alt_sgpt: 'liver',
    ast_sgot: 'liver',
    ggt: 'liver',
    alp: 'liver',
    bilirubin_total: 'liver',
    bilirubin_direct: 'liver',
    bilirubin_indirect: 'liver',
    total_protein: 'liver',
    albumin: 'liver',
    globulin: 'liver',
    creatinine: 'kidney',
    egfr: 'kidney',
    bun: 'kidney',
    urea: 'kidney',
    uric_acid: 'kidney',
    cystatin_c: 'kidney',
    urine_microalbumin: 'kidney',
    creatinine_urine: 'kidney',
    total_cholesterol: 'lipid',
    hdl_cholesterol: 'lipid',
    ldl_cholesterol: 'lipid',
    vldl_cholesterol: 'lipid',
    non_hdl_cholesterol: 'lipid',
    triglycerides: 'lipid',
    apo_a1: 'lipid',
    apo_b: 'lipid',
    apo_b_a1_ratio: 'lipid',
    lipoprotein_a: 'lipid',
    lp_pla2: 'lipid',
    tsh: 'thyroid',
    t3_total: 'thyroid',
    t4_total: 'thyroid',
    vitamin_d: 'vitamins',
    vitamin_b12: 'vitamins',
    vitamin_b1: 'vitamins',
    vitamin_b2: 'vitamins',
    vitamin_b3: 'vitamins',
    vitamin_b5: 'vitamins',
    vitamin_b6: 'vitamins',
    vitamin_b7: 'vitamins',
    vitamin_b9: 'vitamins',
    vitamin_a: 'vitamins',
    vitamin_e: 'vitamins',
    vitamin_k: 'vitamins',
    iron: 'vitamins',
    ferritin: 'vitamins',
    tibc: 'vitamins',
    uibc: 'vitamins',
    transferrin_saturation: 'vitamins',
    magnesium: 'vitamins',
    calcium: 'vitamins',
    phosphorus: 'vitamins',
    sodium: 'vitamins',
    potassium: 'vitamins',
    chloride: 'vitamins',
    homocysteine: 'inflammation',
    hscrp: 'inflammation',
    hemoglobin: 'blood',
    rbc_count: 'blood',
    wbc: 'blood',
    rdw: 'blood',
    mcv: 'blood',
    mch: 'blood',
    mchc: 'blood',
    platelet_count: 'blood',
    esr: 'blood',
    testosterone: 'hormones',
    urine_pus_cells: 'urine',
  };
  return categoryMap[key] ?? 'other';
}

// One-liner tooltips shown on hover over metric name in the table
export const METRIC_DESCRIPTIONS: Record<string, string> = {
  hba1c: 'Average blood sugar over 2–3 months. Key marker for diabetes.',
  fasting_glucose: 'Blood sugar after overnight fast. Detects diabetes and pre-diabetes.',
  hscrp: 'High-sensitivity inflammation marker. Elevated levels increase cardiovascular risk.',
  insulin_fasting: 'Fasting insulin; high levels indicate insulin resistance.',
  vitamin_d: 'Essential for bones, immunity, and mood regulation.',
  alt_sgpt: 'Liver enzyme. Elevated when liver cells are damaged.',
  ast_sgot: 'Enzyme in liver and heart; elevated = tissue damage.',
  ggt: 'Liver enzyme sensitive to alcohol and bile duct problems.',
  alp: 'Enzyme from liver and bone; elevated = liver or bone disease.',
  hemoglobin: 'Oxygen-carrying protein in red blood cells. Low = anaemia.',
  triglycerides: 'Blood fats from diet and liver. High = cardiovascular risk.',
  total_cholesterol: 'Sum of all blood cholesterol fractions.',
  hdl_cholesterol: '"Good" cholesterol — removes harmful cholesterol from arteries.',
  ldl_cholesterol: '"Bad" cholesterol — deposits in artery walls.',
  vldl_cholesterol: 'Carries triglycerides; precursor to LDL.',
  non_hdl_cholesterol: 'All atherogenic cholesterol fractions except HDL.',
  apo_b: 'Protein on every LDL particle. Best cardiovascular risk predictor.',
  apo_a1: 'Protein on HDL; higher levels are cardioprotective.',
  tsh: 'Pituitary hormone that controls thyroid output.',
  t3_total: 'Active thyroid hormone; regulates metabolism and energy.',
  t4_total: 'Thyroid hormone converted to T3; governs metabolism.',
  creatinine: 'Kidney waste product. Elevated = reduced kidney function.',
  egfr: 'Estimated kidney filtration rate. Lower = worse kidney function.',
  bun: 'Blood urea nitrogen. Elevated = kidney stress or dehydration.',
  urea: 'Protein waste filtered by kidneys. Elevated = kidney or diet issue.',
  uric_acid: 'Purine waste. High levels cause gout and kidney stones.',
  vitamin_b12: 'Essential for nerve function and red blood cell production.',
  calcium: 'Mineral for bones, muscles, and nerve signalling.',
  phosphorus: 'Bone mineral; regulated alongside calcium by kidneys.',
  sodium: 'Electrolyte controlling blood pressure and fluid balance.',
  potassium: 'Electrolyte vital for heart rhythm and muscle function.',
  chloride: 'Electrolyte maintaining acid-base and fluid balance.',
  magnesium: 'Cofactor in 300+ enzyme reactions; critical for energy and muscles.',
  iron: 'Mineral needed to produce haemoglobin in red blood cells.',
  tibc: 'Iron-carrying capacity of blood; rises when iron is low.',
  ferritin: 'Iron storage protein. Low = depleted iron stores.',
  transferrin_saturation: 'Percentage of transferrin loaded with iron. Low = iron deficiency.',
  homocysteine: 'Amino acid; elevated levels damage blood vessel walls.',
  rbc_count: 'Number of red blood cells per unit volume of blood.',
  wbc: 'Count of immune cells. Elevated = infection or inflammation.',
  rdw: 'Variation in RBC size. Elevated = mixed or early deficiency.',
  mcv: 'Average red blood cell size. Small = iron deficiency; large = B12/folate.',
  mch: 'Average haemoglobin content per red blood cell.',
  mchc: 'Haemoglobin concentration inside red blood cells.',
  platelet_count: 'Clotting cells. Low = bleeding risk; high = clotting risk.',
  esr: 'Speed at which RBCs settle. Non-specific inflammation marker.',
  bilirubin_total: 'Haemoglobin breakdown product processed by liver.',
  bilirubin_direct: 'Water-soluble bilirubin after liver processing.',
  bilirubin_indirect: 'Fat-soluble bilirubin before liver processes it.',
  total_protein: 'Total albumin + globulin; reflects liver and nutritional status.',
  albumin: 'Main blood protein made by liver. Reflects nutrition and liver health.',
  globulin: 'Blood proteins including antibodies and clotting factors.',
  amylase: 'Pancreatic enzyme. Elevated = pancreatitis or salivary gland issue.',
  // Lipids / cardiovascular
  apo_b_a1_ratio: 'Ratio of atherogenic (bad) to protective (good) cholesterol particles. Single best predictor of cardiovascular risk.',
  lipoprotein_a: 'Inherited lipoprotein that promotes arterial plaque. Major independent cardiovascular risk factor.',
  lp_pla2: 'Enzyme linked to vascular inflammation and vulnerable plaque. Elevated = coronary heart disease risk.',
  // Diabetes / metabolic
  fructosamine: 'Reflects average blood sugar over the past 2–3 weeks. Useful for short-term glycaemic monitoring.',
  blood_ketone: 'Byproduct of fat metabolism. Elevated = fat-burning state or diabetic ketoacidosis in diabetics.',
  // Kidney
  cystatin_c: 'Sensitive kidney function marker. More accurate than creatinine for detecting early kidney disease.',
  uibc: 'Unsaturated iron-binding capacity — unused iron-carrying slots on transferrin. Rises when iron is depleted.',
  // Blood count
  rdw_cv: 'Variation in red blood cell size. Elevated may indicate mixed or early anaemia.',
  urine_pus_cells: 'White blood cells found in urine. Elevated = urinary tract infection or kidney inflammation.',
  // Vitamins
  vitamin_a: 'Fat-soluble vitamin essential for vision, immune function, and skin health.',
  vitamin_e: 'Antioxidant vitamin protecting cells from oxidative damage. Supports immune function.',
  vitamin_k: 'Essential for blood clotting and bone mineralisation.',
  vitamin_b1: 'Thiamine — essential for energy metabolism and nerve function.',
  vitamin_b2: 'Riboflavin — supports energy production and red blood cell development.',
  vitamin_b3: 'Niacin — required for energy metabolism, DNA repair, and cholesterol regulation.',
  vitamin_b5: 'Pantothenic acid — involved in hormone synthesis, red blood cells, and energy metabolism.',
  vitamin_b6: 'Pyridoxine — vital for protein metabolism, neurotransmitter synthesis, and homocysteine regulation.',
  vitamin_b7: 'Biotin — supports fat and carbohydrate metabolism; important for hair and nail health.',
  vitamin_b9: 'Folate — critical for DNA synthesis, cell division, and reducing homocysteine. Essential in pregnancy.',
  // Hormones
  testosterone: 'Primary sex hormone affecting muscle mass, energy, libido, and bone density in both sexes.',
  // Other enzymes / minerals
  lipase: 'Pancreatic enzyme that digests fats. Significantly elevated = pancreatitis.',
  zinc: 'Trace mineral vital for immunity, wound healing, and over 300 enzyme functions.',
  copper: 'Trace mineral needed for iron metabolism, connective tissue formation, and neurological function.',
};

// Brief analysis shown when a metric is out of range in the MetricsTable analysis column
export const METRIC_ANALYSIS: Record<string, { high: string; low: string }> = {
  hba1c: {
    high: 'Blood sugar control is poor. Cut refined carbs, exercise daily, consult a doctor.',
    low: 'Unusually low. Check for hypoglycaemia episodes.',
  },
  fasting_glucose: {
    high: 'Elevated fasting sugar. Reduce carbs/sugar, walk after meals, recheck in 3 months.',
    low: 'Low blood sugar. Eat regular balanced meals; avoid skipping breakfast.',
  },
  hscrp: {
    high: 'Systemic inflammation present. Increase omega-3s, cut processed food, reduce stress, improve sleep.',
    low: 'Optimal — low inflammation.',
  },
  insulin_fasting: {
    high: 'Insulin resistance likely. Reduce carbs, try intermittent fasting, increase strength training.',
    low: 'Normal or low — generally favourable.',
  },
  vitamin_d: {
    high: 'Possible excess supplementation. Reduce D3 dose; toxicity above 150 ng/mL.',
    low: 'Deficient. Supplement 2000–4000 IU D3 daily, get sunlight, eat fatty fish.',
  },
  alt_sgpt: {
    high: 'Liver stress or damage. Avoid alcohol, reduce fatty food, review medications with doctor.',
    low: 'Very low — generally normal.',
  },
  ast_sgot: {
    high: 'Liver or muscle damage. Investigate cause with doctor.',
    low: 'Normal.',
  },
  ggt: {
    high: 'Liver stress — often from alcohol or fatty liver. Cut alcohol, reduce refined carbs.',
    low: 'Normal.',
  },
  alp: {
    high: 'Possible liver or bone disease. Consult a doctor for follow-up.',
    low: 'Very low — may indicate hypothyroidism or zinc deficiency.',
  },
  hemoglobin: {
    high: 'Elevated — possible dehydration or polycythaemia. Increase water intake.',
    low: 'Anaemia. Increase iron-rich foods, check B12/folate, treat underlying cause.',
  },
  triglycerides: {
    high: 'Elevated blood fats. Cut sugar, refined carbs, and alcohol; add omega-3 fish oil.',
    low: 'Low — typically healthy.',
  },
  total_cholesterol: {
    high: 'High cardiovascular risk. Reduce saturated fat, increase fibre, exercise regularly.',
    low: 'Very low — may affect hormones. Consult a doctor.',
  },
  hdl_cholesterol: {
    high: 'Very high HDL — generally protective. Extremely high (>100) warrants investigation.',
    low: 'Low — raises heart disease risk. Exercise aerobically, eat olive oil, nuts, and fatty fish.',
  },
  ldl_cholesterol: {
    high: 'Increases artery plaque risk. Reduce saturated fat and refined carbs; increase soluble fibre.',
    low: 'Very low — may affect cell function. Usually not concerning.',
  },
  vldl_cholesterol: {
    high: 'Reflects excess triglycerides. Reduce sugar, alcohol, and refined carbs.',
    low: 'Low — generally favourable.',
  },
  non_hdl_cholesterol: {
    high: 'High atherogenic particle load. Reduce saturated fat; treat underlying lipid disorder.',
    low: 'Low — favourable.',
  },
  apo_b: {
    high: 'Many atherogenic LDL particles present. Reduce saturated fat and refined carbs.',
    low: 'Low — favourable for cardiovascular health.',
  },
  apo_a1: {
    high: 'High — protective for cardiovascular health.',
    low: 'Low HDL function. Exercise aerobically; eat healthy fats, avoid trans fats.',
  },
  tsh: {
    high: 'Hypothyroidism likely. Consult endocrinologist; may need thyroid hormone replacement.',
    low: 'Hyperthyroidism possible. Consult a doctor for further testing.',
  },
  t3_total: {
    high: 'Elevated active thyroid hormone — possible hyperthyroidism. Consult a doctor.',
    low: 'Low T3 — may indicate hypothyroidism or conversion issue. See a doctor.',
  },
  t4_total: {
    high: 'Elevated — possible hyperthyroidism. Consult an endocrinologist.',
    low: 'Low — possible hypothyroidism. Consult a doctor for thyroid panel review.',
  },
  creatinine: {
    high: 'Kidney function reduced. Increase water, avoid NSAIDs, reduce excess protein.',
    low: 'Low — often reflects low muscle mass; generally not a concern.',
  },
  egfr: {
    high: 'High — normal or hyperfiltration. Monitor if persistently very high.',
    low: 'Kidney function impaired. Limit salt and protein excess; consult a nephrologist.',
  },
  bun: {
    high: 'Kidney stress or dehydration. Increase water intake; moderate protein.',
    low: 'Low — possibly low protein diet or liver issue.',
  },
  urea: {
    high: 'Elevated — kidney stress or high protein intake. Increase water.',
    low: 'Low — may indicate low protein intake.',
  },
  uric_acid: {
    high: 'High uric acid — gout risk. Reduce red meat, alcohol, fructose; drink more water.',
    low: 'Low — generally not a concern.',
  },
  vitamin_b12: {
    high: 'Very high B12 — often from supplements. May need investigation if not supplementing.',
    low: 'Deficient — supplement methylcobalamin B12; eat eggs, dairy, or meat.',
  },
  calcium: {
    high: 'Elevated calcium — check vitamin D and parathyroid; reduce calcium supplements.',
    low: 'Low calcium — increase dairy, leafy greens, ensure sufficient vitamin D.',
  },
  phosphorus: {
    high: 'Elevated — review kidney function and reduce processed foods.',
    low: 'Low — possible malnutrition; ensure adequate dietary phosphorus.',
  },
  sodium: {
    high: 'High sodium — increase water intake, reduce salt.',
    low: 'Low sodium — possible excess fluid retention or kidney issue; consult a doctor.',
  },
  potassium: {
    high: 'High potassium can cause heart arrhythmia. Reduce high-potassium foods; see a doctor.',
    low: 'Low — causes muscle weakness. Eat bananas, avocados, potatoes, leafy greens.',
  },
  chloride: {
    high: 'Elevated — may indicate dehydration. Increase water intake.',
    low: 'Low — possible from vomiting/diarrhoea or kidney issue.',
  },
  magnesium: {
    high: 'High — likely from supplements. Reduce magnesium supplementation.',
    low: 'Deficient — affects energy and muscle. Eat nuts, seeds, leafy greens; consider Mg glycinate.',
  },
  iron: {
    high: 'Elevated — possible haemochromatosis or excess supplementation. Consult a doctor.',
    low: 'Low iron — increases anaemia risk. Eat red meat, legumes, spinach paired with vitamin C.',
  },
  tibc: {
    high: 'High TIBC — iron deficiency. Body produces more transferrin when iron is scarce.',
    low: 'Low TIBC — may indicate iron overload, chronic disease, or malnutrition.',
  },
  ferritin: {
    high: 'Elevated ferritin — may indicate iron overload or inflammation. Investigate cause.',
    low: 'Depleted iron stores. Supplement iron with doctor\'s guidance; increase iron-rich foods.',
  },
  transferrin_saturation: {
    high: 'High saturation — possible iron overload. Consult a doctor.',
    low: 'Low — iron deficiency. Increase dietary iron; check ferritin.',
  },
  homocysteine: {
    high: 'Elevated — damages blood vessels. Take B6, B12, and folate; eat leafy greens.',
    low: 'Low — favourable.',
  },
  wbc: {
    high: 'Elevated — possible infection, inflammation, or immune reaction. See a doctor.',
    low: 'Low — increased infection risk. Investigate cause with a doctor.',
  },
  rdw: {
    high: 'High — mixed anaemia possible (iron + B12/folate). Check both.',
    low: 'Low — generally normal.',
  },
  mcv: {
    high: 'Large red cells — likely B12 or folate deficiency. Supplement both.',
    low: 'Small red cells — iron deficiency anaemia. Increase iron intake.',
  },
  mch: {
    high: 'High — may indicate macrocytic anaemia (B12/folate). Supplement.',
    low: 'Low — iron deficiency. Increase iron intake.',
  },
  mchc: {
    high: 'High MCHC is rare — possible hereditary spherocytosis.',
    low: 'Low — iron deficiency or thalassaemia. Investigate.',
  },
  platelet_count: {
    high: 'High platelets — possible infection, inflammation, or iron deficiency. Investigate if >600k.',
    low: 'Low platelets — increased bleeding risk. Consult a doctor.',
  },
  esr: {
    high: 'Elevated — non-specific inflammation. Investigate underlying cause with doctor.',
    low: 'Low — generally normal.',
  },
  bilirubin_total: {
    high: 'Elevated — possible liver disease or haemolysis. Consult a doctor.',
    low: 'Low — generally normal.',
  },
  bilirubin_direct: {
    high: 'Elevated direct bilirubin — bile duct obstruction or liver disease. See a doctor.',
    low: 'Low — normal.',
  },
  bilirubin_indirect: {
    high: 'Elevated indirect bilirubin — possible haemolysis or Gilbert\'s syndrome.',
    low: 'Low — normal.',
  },
  total_protein: {
    high: 'Elevated — possible dehydration or inflammatory state.',
    low: 'Low — malnutrition or liver disease. Increase dietary protein; consult a doctor.',
  },
  albumin: {
    high: 'High — often dehydration. Increase water intake.',
    low: 'Low albumin — liver disease, malnutrition, or protein loss. Consult a doctor.',
  },
  amylase: {
    high: 'Elevated — possible pancreatitis or salivary gland issue. Consult a doctor.',
    low: 'Low — generally not concerning.',
  },
  apo_b_a1_ratio: {
    high: 'Unfavourable ratio — high cardiovascular risk. Reduce saturated fat and refined carbs; exercise regularly.',
    low: 'Favourable — lower cardiovascular risk.',
  },
  lipoprotein_a: {
    high: 'Elevated Lp(a) is largely genetic and hard to lower with lifestyle. Consult a doctor for management strategies.',
    low: 'Optimal — low Lp(a) is associated with reduced cardiovascular risk.',
  },
  lp_pla2: {
    high: 'Elevated — indicates vascular inflammation and higher coronary heart disease risk. Consult a cardiologist.',
    low: 'Low — favourable.',
  },
  fructosamine: {
    high: 'Elevated — poor short-term blood sugar control. Reduce carbs and sugar; recheck in 3 weeks.',
    low: 'Very low — excellent short-term blood sugar control, or possibly low protein levels.',
  },
  blood_ketone: {
    high: 'Elevated ketones — may indicate a fasting/ketogenic state, or diabetic ketoacidosis. Consult doctor if diabetic.',
    low: 'Low — normal in a non-fasting state.',
  },
  cystatin_c: {
    high: 'Elevated — indicates reduced kidney filtration. Consult a doctor for further evaluation.',
    low: 'Low — generally normal.',
  },
  uibc: {
    high: 'High UIBC — iron deficiency; body produces more transferrin when iron is scarce. Increase dietary iron.',
    low: 'Low — may indicate iron overload or chronic inflammatory disease.',
  },
  rdw_cv: {
    high: 'High variation in RBC size — possible mixed or early anaemia (iron + B12/folate). Check both.',
    low: 'Low — generally normal.',
  },
  urine_pus_cells: {
    high: 'Elevated — likely urinary tract infection. Consult a doctor; may need a urine culture and antibiotics.',
    low: 'Normal — no sign of urinary infection.',
  },
  vitamin_a: {
    high: 'Excess — possible toxicity from high-dose supplements. Reduce vitamin A intake.',
    low: 'Deficient — eat liver, eggs, dairy, and orange/yellow vegetables.',
  },
  vitamin_e: {
    high: 'High — likely from excess supplementation. Reduce dose.',
    low: 'Deficient — eat nuts, seeds, vegetable oils, and leafy greens.',
  },
  vitamin_k: {
    high: 'Elevated — may interact with blood-thinning medications. Consult doctor if on anticoagulants.',
    low: 'Deficient — eat leafy greens (spinach, kale). Affects blood clotting and bone health.',
  },
  vitamin_b1: {
    high: 'High — water-soluble; generally safe as excess is excreted.',
    low: 'Deficient — eat whole grains, legumes, pork, and fortified foods.',
  },
  vitamin_b2: {
    high: 'High — water-soluble; excess excreted. Generally safe.',
    low: 'Deficient — eat dairy, eggs, lean meat, and leafy greens.',
  },
  vitamin_b3: {
    high: 'Elevated — high-dose niacin supplements can cause flushing and liver stress. Reduce dose.',
    low: 'Deficient — eat poultry, fish, peanuts, and fortified cereals.',
  },
  vitamin_b5: {
    high: 'High — generally safe; excess is excreted.',
    low: 'Deficient — eat eggs, avocado, mushrooms, and legumes.',
  },
  vitamin_b6: {
    high: 'Elevated — chronic high-dose supplementation can cause peripheral nerve damage. Reduce B6 dose.',
    low: 'Deficient — eat poultry, fish, potatoes, and bananas.',
  },
  vitamin_b7: {
    high: 'High — biotin is water-soluble; generally safe. Note: high biotin can interfere with certain lab tests.',
    low: 'Deficient — eat eggs, nuts, seeds, and salmon.',
  },
  vitamin_b9: {
    high: 'High — generally safe from food; very high supplemental doses may mask B12 deficiency.',
    low: 'Deficient — eat leafy greens, legumes, and fortified cereals. Supplement if pregnant.',
  },
  testosterone: {
    high: 'Elevated — may indicate hormonal disorder or exogenous testosterone. Consult an endocrinologist.',
    low: 'Low — affects energy, mood, libido, and muscle mass. Consult a doctor for evaluation.',
  },
  lipase: {
    high: 'Elevated — possible pancreatitis. Seek prompt medical attention if severely elevated.',
    low: 'Low — generally not clinically significant.',
  },
  zinc: {
    high: 'Elevated — possible excess supplementation; high zinc inhibits copper absorption. Reduce intake.',
    low: 'Deficient — affects immunity and wound healing. Eat oysters, red meat, and pumpkin seeds.',
  },
  copper: {
    high: "Elevated — possible Wilson's disease or excess intake. Consult a doctor.",
    low: 'Deficient — eat nuts, seeds, seafood, and dark chocolate.',
  },
};

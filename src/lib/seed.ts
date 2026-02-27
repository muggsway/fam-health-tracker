import { v4 as uuidv4 } from 'uuid';
import { upsertProfile, createReport, createMetrics, getReportsByProfile } from './db';
import type { HealthMetric } from '@/types';

const PROFILES = [
  { id: 'raj-kumar', name: 'Raj Kumar' },
  { id: 'anju', name: 'Anju' },
  { id: 'sugandha', name: 'Sugandha' },
  { id: 'chiranjaya', name: 'Chiranjaya' },
  { id: 'amit', name: 'Amit' },
  { id: 'vishakha', name: 'Vishakha' },
  {
    id: 'mugdha',
    name: 'Mugdha',
    date_of_birth: null,
    blood_group: null,
    height_cm: null,
    weight_kg: null,
  },
  { id: 'akshit', name: 'Akshit' },
];

function m(
  reportId: string,
  metric_key: string,
  display_name: string,
  value: number | null,
  unit: string | null,
  ref_range_low: number | null,
  ref_range_high: number | null,
  ref_range_text: string | null,
  status: 'normal' | 'high' | 'low' | null,
  category: string,
  method: string | null = null,
  notes: string | null = null
): HealthMetric {
  return {
    id: uuidv4(),
    report_id: reportId,
    metric_key,
    display_name,
    value,
    unit,
    ref_range_low,
    ref_range_high,
    ref_range_text,
    status,
    category,
    method,
    notes,
    advice: null,
  };
}

function mugdha2024Metrics(reportId: string): HealthMetric[] {
  return [
    // ── Diabetes & Blood Sugar
    m(reportId, 'fasting_glucose', 'Fasting Blood Sugar', 82.36, 'mg/dL', 70, 100, '70-100', 'normal', 'diabetes', 'GOD-PAP Method'),
    m(reportId, 'hba1c', 'HbA1c', 5.2, '%', null, 5.7, '<5.7', 'normal', 'diabetes', 'Fully Automated H.P.L.C'),
    m(reportId, 'insulin_fasting', 'Fasting Insulin', 9.13, 'µU/mL', 1.9, 23, '1.9-23', 'normal', 'diabetes', 'One step Immunoenzymatic (Sandwich) assay'),
    m(reportId, 'fructosamine', 'Fructosamine', 225.3, 'µmol/L', null, 286, '<286', 'normal', 'diabetes', 'Nitroblue Tetrazolium (NBT)'),
    m(reportId, 'blood_ketone', 'Blood Ketone (D3HB)', 1.47, 'mg/dL', 0.21, 2.81, '0.21-2.81', 'normal', 'diabetes', 'Enzymatic (Kinetic)'),

    // ── Liver Function
    m(reportId, 'alt_sgpt', 'ALT (SGPT)', 25.8, 'U/L', null, 34, '<34', 'normal', 'liver', 'IFCC without Pyridoxal Phosphate Activation'),
    m(reportId, 'ast_sgot', 'AST (SGOT)', 17.8, 'U/L', null, 31, '<31', 'normal', 'liver', 'IFCC without Pyridoxal Phosphate Activation'),
    m(reportId, 'ggt', 'GGT (Gamma Glutamyl Transferase)', 13.1, 'U/L', null, 38, '<38', 'normal', 'liver', 'Modified IFCC method'),
    m(reportId, 'alp', 'Alkaline Phosphatase (ALP)', 87.56, 'U/L', 45, 129, '45-129', 'normal', 'liver', 'Modified IFCC method'),
    m(reportId, 'bilirubin_total', 'Bilirubin Total', 0.6, 'mg/dL', 0.3, 1.2, '0.3-1.2', 'normal', 'liver', 'Vanadate Oxidation'),
    m(reportId, 'bilirubin_direct', 'Bilirubin Direct', 0.14, 'mg/dL', null, 0.3, '<0.3', 'normal', 'liver', 'Vanadate Oxidation'),
    m(reportId, 'bilirubin_indirect', 'Bilirubin Indirect', 0.46, 'mg/dL', null, 0.9, '0-0.9', 'normal', 'liver', 'Calculated'),
    m(reportId, 'total_protein', 'Total Protein', 7.07, 'g/dL', 5.7, 8.2, '5.7-8.2', 'normal', 'liver', 'Biuret Method'),
    m(reportId, 'albumin', 'Albumin', 4.01, 'g/dL', 3.2, 4.8, '3.2-4.8', 'normal', 'liver', 'Albumin BCG method'),
    m(reportId, 'globulin', 'Globulin', 3.06, 'g/dL', 2.5, 3.4, '2.5-3.4', 'normal', 'liver', 'Calculated'),

    // ── Kidney Function
    m(reportId, 'creatinine', 'Creatinine (Serum)', 0.66, 'mg/dL', 0.55, 1.02, '0.55-1.02', 'normal', 'kidney', 'Creatinine Enzymatic Method'),
    m(reportId, 'egfr', 'eGFR (Estimated)', 122, 'mL/min/1.73m²', 90, null, '≥90 Normal', 'normal', 'kidney', 'CKD-EPI Creatinine Equation'),
    m(reportId, 'bun', 'Blood Urea Nitrogen (BUN)', 12.8, 'mg/dL', 7.94, 20.07, '7.94-20.07', 'normal', 'kidney', 'Kinetic UV Assay'),
    m(reportId, 'urea', 'Urea', 27.39, 'mg/dL', 17, 43, '17-43', 'normal', 'kidney', 'Calculated from BUN'),
    m(reportId, 'uric_acid', 'Uric Acid', 6.46, 'mg/dL', 3.2, 6.1, '3.2-6.1', 'high', 'kidney', 'Uricase/Peroxidase Method', 'Slightly elevated. Can indicate gout risk or kidney stress.'),
    m(reportId, 'calcium', 'Calcium', 9, 'mg/dL', 8.8, 10.6, '8.8-10.6', 'normal', 'vitamins', 'Arsenazo III Method'),
    m(reportId, 'cystatin_c', 'Cystatin C', 0.76, 'mg/L', null, 1.03, '≤1.03', 'normal', 'kidney', 'Latex Enhanced Immunoturbidimetry'),
    m(reportId, 'uibc', 'UIBC (Unsaturated Iron Binding Capacity)', 339.38, 'µg/dL', 162, 368, '162-368', 'normal', 'vitamins', 'Spectrophotometric Assay'),

    // ── Lipid Profile
    m(reportId, 'total_cholesterol', 'Total Cholesterol', 167, 'mg/dL', null, 200, '<200', 'normal', 'lipid', 'Cholesterol Oxidase, Esterase, Peroxidase'),
    m(reportId, 'hdl_cholesterol', 'HDL Cholesterol', 48, 'mg/dL', 40, 60, '40-60', 'normal', 'lipid', 'Direct Enzymatic Colorimetric'),
    m(reportId, 'ldl_cholesterol', 'LDL Cholesterol', 108, 'mg/dL', null, 100, '<100', 'high', 'lipid', 'Direct Measure', 'Slightly above optimal (<100 mg/dL)'),
    m(reportId, 'triglycerides', 'Triglycerides', 72, 'mg/dL', null, 150, '<150', 'normal', 'lipid', 'Enzymatic, End Point'),
    m(reportId, 'vldl_cholesterol', 'VLDL Cholesterol', 14.46, 'mg/dL', 5, 40, '5-40', 'normal', 'lipid', 'Calculated from Triglycerides'),
    m(reportId, 'non_hdl_cholesterol', 'Non-HDL Cholesterol', 118.9, 'mg/dL', null, 160, '<160', 'normal', 'lipid', 'Calculated'),
    m(reportId, 'apo_a1', 'Apolipoprotein A1 (Apo A1)', 102, 'mg/dL', 94, 162, '94-162 (F)', 'normal', 'lipid', 'Fully Automated Rate Immunoturbidimetry'),
    m(reportId, 'apo_b', 'Apolipoprotein B (Apo B)', 93, 'mg/dL', 53, 138, '53-138 (F)', 'normal', 'lipid', 'Fully Automated Rate Immunoturbidimetry'),
    m(reportId, 'apo_b_a1_ratio', 'Apo B / Apo A1 Ratio', 0.9, null, 0.38, 1.14, '0.38-1.14 (F)', 'normal', 'lipid', 'Calculated'),
    m(reportId, 'lipoprotein_a', 'Lipoprotein (a) [Lp(a)]', 8.1, 'mg/dL', null, 30, '<30', 'normal', 'lipid', 'Latex Enhanced Immunoturbidimetry'),
    m(reportId, 'lp_pla2', 'LP-PLA2', 141, 'nmol/min/mL', null, 225, '<225', 'normal', 'lipid', 'Enzymatic Assay'),

    // ── Thyroid
    m(reportId, 'tsh', 'TSH (Ultrasensitive)', 2.38, 'µIU/mL', 0.54, 5.30, '0.54-5.30', 'normal', 'thyroid', 'Fully Automated ECLIA Sandwich Immunoassay'),
    m(reportId, 't3_total', 'T3 Total', 97, 'ng/dL', 80, 200, '80-200', 'normal', 'thyroid', 'Fully Automated ECLIA'),
    m(reportId, 't4_total', 'T4 Total', 5.89, 'µg/dL', 4.8, 12.7, '4.8-12.7', 'normal', 'thyroid', 'Fully Automated ECLIA'),

    // ── Vitamins & Minerals
    m(reportId, 'vitamin_d', 'Vitamin D (25-OH)', 22.7, 'ng/mL', 30, null, '≥30 Sufficient', 'low', 'vitamins', 'Fully Automated ECLIA', 'Insufficient (21-29 ng/mL). Consider supplementation.'),
    m(reportId, 'vitamin_b12', 'Vitamin B12 (Cyanocobalamin)', 383, 'pg/mL', 197, 771, '197-771', 'normal', 'vitamins', 'Fully Automated ECLIA'),
    m(reportId, 'vitamin_a', 'Vitamin A (Retinol)', 445.88, 'ng/mL', 300, 800, '300-800', 'normal', 'vitamins', 'LC-MS/MS'),
    m(reportId, 'vitamin_e', 'Vitamin E (Alpha-Tocopherol)', 11128.1, 'ng/mL', 5500, 18000, '5500-18000', 'normal', 'vitamins', 'LC-MS/MS'),
    m(reportId, 'vitamin_k', 'Vitamin K (Phylloquinone)', 0.94, 'ng/mL', 0.13, 1.19, '0.13-1.19', 'normal', 'vitamins', 'LC-MS/MS'),
    m(reportId, 'vitamin_b1', 'Vitamin B1 (Thiamin)', 0.72, 'ng/mL', 0.5, 4.0, '0.5-4.0', 'normal', 'vitamins', 'LC-MS/MS'),
    m(reportId, 'vitamin_b2', 'Vitamin B2 (Riboflavin)', 3.54, 'ng/mL', 1.6, 68.2, '1.6-68.2', 'normal', 'vitamins', 'LC-MS/MS'),
    m(reportId, 'vitamin_b3', 'Vitamin B3 (Nicotinic Acid)', 1.97, 'ng/mL', 0.3, 9.8, '0.3-9.8', 'normal', 'vitamins', 'LC-MS/MS'),
    m(reportId, 'vitamin_b5', 'Vitamin B5 (Pantothenic Acid)', 23.84, 'ng/mL', 11, 150, '11-150', 'normal', 'vitamins', 'LC-MS/MS'),
    m(reportId, 'vitamin_b6', 'Vitamin B6 (P5P)', 19.78, 'ng/mL', 5, 50, '5-50', 'normal', 'vitamins', 'LC-MS/MS'),
    m(reportId, 'vitamin_b7', 'Vitamin B7 (Biotin)', 0.74, 'ng/mL', 0.2, 3, '0.2-3', 'normal', 'vitamins', 'LC-MS/MS'),
    m(reportId, 'vitamin_b9', 'Vitamin B9 (Folic Acid)', 0.5, 'ng/mL', 0.2, 20, '0.2-20', 'normal', 'vitamins', 'LC-MS/MS'),
    m(reportId, 'iron', 'Iron', 67.4, 'µg/dL', 50, 170, '50-170 (F)', 'normal', 'vitamins', 'Ferrozine method'),
    m(reportId, 'tibc', 'Total Iron Binding Capacity (TIBC)', 406.78, 'µg/dL', 215, 535, '215-535 (F)', 'normal', 'vitamins', 'Spectrophotometric Assay'),
    m(reportId, 'ferritin', 'Ferritin', 11.9, 'ng/mL', 10, 291, '10-291 (F)', 'normal', 'vitamins', 'Chemi Luminescent Immuno Assay', 'Low-normal. Women with values <20 ng/mL may experience fatigue.'),
    m(reportId, 'transferrin_saturation', 'Transferrin Saturation', 16.57, '%', 13, 45, '13-45', 'normal', 'vitamins', 'Calculated from Iron and TIBC'),
    m(reportId, 'magnesium', 'Magnesium', 1.87, 'mg/dL', 1.9, 3.1, '1.90-3.10', 'low', 'vitamins', 'Modified Xylidyl Blue Reaction', 'Slightly below normal range. Magnesium is vital for 300+ enzyme reactions.'),
    m(reportId, 'calcium', 'Calcium', 9, 'mg/dL', 8.8, 10.6, '8.8-10.6', 'normal', 'vitamins', 'Arsenazo III Method'),
    m(reportId, 'sodium', 'Sodium', 137.41, 'mmol/L', 136, 145, '136-145', 'normal', 'vitamins', 'Ion Selective Electrode'),
    m(reportId, 'chloride', 'Chloride', 102.94, 'mmol/L', 98, 107, '98-107', 'normal', 'vitamins', 'Ion Selective Electrode'),

    // ── Inflammation
    m(reportId, 'hscrp', 'hsCRP (High Sensitivity CRP)', 3.1, 'mg/L', null, 1.0, '<1.00', 'high', 'inflammation', 'Fully Automated Latex Agglutination', 'High cardiovascular risk category (>3.0 mg/L). Indicates systemic inflammation.'),
    m(reportId, 'homocysteine', 'Homocysteine', 17.43, 'µmol/L', null, 15, '<15 Normal', 'high', 'inflammation', 'Enzymatic Assay', 'Mild hyperhomocysteinemia (15-30 µmol/L). Associated with cardiovascular and cognitive risk. Consider folate/B12 support.'),

    // ── Blood (CBC)
    m(reportId, 'hemoglobin', 'Hemoglobin', 12.4, 'g/dL', 12, 15, '12.0-15.0', 'normal', 'blood', 'SLS-Hemoglobin Method'),
    m(reportId, 'rbc_count', 'RBC Count', 4.38, 'mill/mm³', 3.8, 4.8, '3.8-4.8', 'normal', 'blood', 'HF & EI'),
    m(reportId, 'wbc', 'Total Leukocyte Count (WBC)', 5.6, 'x10³/µL', 4, 10, '4.0-10.0', 'normal', 'blood', 'HF & Flow Cytometry'),
    m(reportId, 'rdw', 'Red Cell Distribution Width (RDW-CV)', 14.6, '%', 11.6, 14, '11.6-14.0', 'high', 'blood', 'Calculated', 'Slightly elevated. May suggest mixed anaemia or nutritional deficiencies.'),
    m(reportId, 'mcv', 'MCV', 87.2, 'fL', 83, 101, '83.0-101.0', 'normal', 'blood', 'Calculated'),
    m(reportId, 'mch', 'MCH', 28.3, 'pg', 27, 32, '27.0-32.0', 'normal', 'blood', 'Calculated'),
    m(reportId, 'mchc', 'MCHC', 32.5, 'g/dL', 31.5, 34.5, '31.5-34.5', 'normal', 'blood', 'Calculated'),
    m(reportId, 'platelet_count', 'Platelet Count', 198, 'thou/mm³', 150, 410, '150-410', 'normal', 'blood', 'HF & EI'),

    // ── Hormones
    m(reportId, 'testosterone', 'Testosterone', 21.1, 'ng/dL', 6, 82, '6-82 (F)', 'normal', 'hormones', 'Fully Automated ECLIA'),

    // ── Pancreatic
    m(reportId, 'amylase', 'Amylase', 54, 'U/L', 28, 100, '28-100', 'normal', 'other', 'Enzymatic Colorimetric Test'),
    m(reportId, 'lipase', 'Lipase', 47.7, 'U/L', 5.6, 51.3, '5.6-51.3', 'normal', 'other', 'Enzymatic Colorimetric Assay'),

    // ── Immune
    m(reportId, 'zinc', 'Zinc (Serum)', 78.1, 'µg/dL', 52, 286, '52-286', 'normal', 'vitamins', 'Nitro-PAPS'),
    m(reportId, 'copper', 'Copper (Serum)', 129.3, 'µg/dL', 80, 155, '80-155 (F)', 'normal', 'vitamins', '3,5-Dibr-PAESA'),
  ];
}

function mugdha2025Metrics(reportId: string): HealthMetric[] {
  return [
    // ── Liver & Kidney Panel
    m(reportId, 'creatinine', 'Creatinine', 0.73, 'mg/dL', 0.51, 0.95, '0.51-0.95', 'normal', 'kidney', 'Spectrophotometry'),
    m(reportId, 'egfr', 'eGFR (Estimated)', 115, 'mL/min/1.73m²', 59, null, '>59', 'normal', 'kidney', 'Spectrophotometry'),
    m(reportId, 'urea', 'Urea', 22.90, 'mg/dL', 15, 40, '15.00-40.00', 'normal', 'kidney', 'Spectrophotometry'),
    m(reportId, 'bun', 'Blood Urea Nitrogen (BUN)', 10.69, 'mg/dL', 6, 20, '6.00-20.00', 'normal', 'kidney', 'Spectrophotometry'),
    m(reportId, 'uric_acid', 'Uric Acid', 5.43, 'mg/dL', 2.6, 6.0, '2.60-6.00', 'normal', 'kidney', 'Spectrophotometry'),
    m(reportId, 'alt_sgpt', 'ALT (SGPT)', 99.0, 'U/L', null, 35, '<35', 'high', 'liver', 'Spectrophotometry', '⚠ Significantly elevated — nearly 4× the upper limit. Requires follow-up to rule out liver inflammation or fatty liver disease.'),
    m(reportId, 'ast_sgot', 'AST (SGOT)', 36.0, 'U/L', null, 35, '<35', 'high', 'liver', 'Spectrophotometry', 'Mildly elevated. Should be reviewed alongside ALT.'),
    m(reportId, 'ggt', 'GGT (Gamma Glutamyl Transferase)', 18.0, 'U/L', null, 38, '<38', 'normal', 'liver', 'Spectrophotometry'),
    m(reportId, 'alp', 'Alkaline Phosphatase (ALP)', 87.0, 'U/L', 30, 120, '30-120', 'normal', 'liver', 'Spectrophotometry'),
    m(reportId, 'bilirubin_total', 'Bilirubin Total', 0.53, 'mg/dL', 0.3, 1.2, '0.30-1.20', 'normal', 'liver', 'Spectrophotometry'),
    m(reportId, 'bilirubin_direct', 'Bilirubin Direct', 0.13, 'mg/dL', null, 0.3, '<0.30', 'normal', 'liver', 'Spectrophotometry'),
    m(reportId, 'bilirubin_indirect', 'Bilirubin Indirect', 0.40, 'mg/dL', null, 1.1, '<1.10', 'normal', 'liver', 'Spectrophotometry'),
    m(reportId, 'total_protein', 'Total Protein', 7.63, 'g/dL', 6.4, 8.3, '6.40-8.30', 'normal', 'liver', 'Spectrophotometry'),
    m(reportId, 'albumin', 'Albumin', 4.50, 'g/dL', 3.5, 5.2, '3.50-5.20', 'normal', 'liver', 'Spectrophotometry'),
    m(reportId, 'globulin', 'Globulin (Calculated)', 3.13, 'g/dL', 2.0, 3.5, '2.0-3.5', 'normal', 'liver', 'Calculated'),
    m(reportId, 'calcium', 'Calcium Total', 9.70, 'mg/dL', 8.6, 10.3, '8.60-10.30', 'normal', 'vitamins', 'Spectrophotometry'),
    m(reportId, 'phosphorus', 'Phosphorus', 3.83, 'mg/dL', 2.4, 4.4, '2.40-4.40', 'normal', 'vitamins', 'Spectrophotometry'),
    m(reportId, 'sodium', 'Sodium', 138.0, 'mEq/L', 136, 146, '136.00-146.00', 'normal', 'vitamins', 'Indirect ISE'),
    m(reportId, 'potassium', 'Potassium', 4.27, 'mEq/L', 3.5, 5.1, '3.50-5.10', 'normal', 'vitamins', 'Indirect ISE'),
    m(reportId, 'chloride', 'Chloride', 98.0, 'mEq/L', 101, 109, '101.00-109.00', 'low', 'vitamins', 'Indirect ISE', 'Mildly below normal range. Usually not clinically significant in isolation.'),

    // ── Lipid Screen
    m(reportId, 'total_cholesterol', 'Total Cholesterol', 176.0, 'mg/dL', null, 200, '<200.00', 'normal', 'lipid', 'CHO-POD Spectrophotometry'),
    m(reportId, 'triglycerides', 'Triglycerides', 162.0, 'mg/dL', null, 150, '<150.00', 'high', 'lipid', 'CHO-POD Spectrophotometry', 'Elevated. High triglycerides are associated with cardiovascular disease risk and may indicate insulin resistance.'),
    m(reportId, 'hdl_cholesterol', 'HDL Cholesterol', 35.0, 'mg/dL', 50, null, '>50.00 (F)', 'low', 'lipid', 'CHO-POD Spectrophotometry', 'Low HDL ("good" cholesterol) increases cardiovascular risk. Target >50 mg/dL for women.'),
    m(reportId, 'ldl_cholesterol', 'LDL Cholesterol (Calculated)', 108.60, 'mg/dL', null, 100, '<100.00', 'high', 'lipid', 'Calculated', 'Above optimal (<100 mg/dL).'),
    m(reportId, 'vldl_cholesterol', 'VLDL Cholesterol', 32.40, 'mg/dL', null, 30, '<30.00', 'high', 'lipid', 'Calculated'),
    m(reportId, 'non_hdl_cholesterol', 'Non-HDL Cholesterol', 141.0, 'mg/dL', null, 130, '<130', 'high', 'lipid', 'Calculated'),
    m(reportId, 'apo_a1', 'Apolipoprotein A1 (Apo A1)', 103.0, 'mg/dL', 76, 214, '76-214', 'normal', 'lipid', 'Immunoturbidimetry'),
    m(reportId, 'apo_b', 'Apolipoprotein B (Apo B)', 89.0, 'mg/dL', 46, 142, '46-142', 'normal', 'lipid', 'Immunoturbidimetry'),
    m(reportId, 'apo_b_a1_ratio', 'Apo B / Apo A1 Ratio', 0.86, null, 0.35, 0.98, '0.35-0.98', 'normal', 'lipid', 'Calculated'),

    // ── Diabetes
    m(reportId, 'fasting_glucose', 'Fasting Glucose (Plasma)', 90.0, 'mg/dL', 70, 100, '70.00-100.00', 'normal', 'diabetes', 'Hexokinase'),
    m(reportId, 'hba1c', 'HbA1c (Glycosylated Haemoglobin)', 5.7, '%', 4.0, 5.6, '4.00-5.60', 'high', 'diabetes', 'HPLC, NGSP Certified', 'Prediabetes range (5.7-6.4%). Action needed to prevent progression to Type 2 diabetes through diet, exercise, and lifestyle changes.'),

    // ── Vitamins
    m(reportId, 'vitamin_b12', 'Vitamin B12 (Cyanocobalamin)', 683.40, 'pg/mL', 211, 946, '211.00-946.00', 'normal', 'vitamins', 'ECLIA'),
    m(reportId, 'vitamin_d', 'Vitamin D (25-OH)', 101.60, 'nmol/L', 75, 250, '75.00-250.00', 'normal', 'vitamins', 'ECLIA', 'Units: nmol/L (Note: previous report used ng/mL — not directly comparable without conversion. 101.6 nmol/L ≈ 40.7 ng/mL, which is Sufficient.)'),

    // ── Thyroid
    m(reportId, 't3_total', 'T3 Total', 2.02, 'ng/mL', 0.8, 2.0, '0.80-2.00', 'high', 'thyroid', 'ECLIA', 'Slightly above upper reference limit. Worth monitoring alongside TSH.'),
    m(reportId, 't4_total', 'T4 Total', 11.43, 'µg/dL', 5.1, 14.1, '5.10-14.10', 'normal', 'thyroid', 'ECLIA'),
    m(reportId, 'tsh', 'TSH', 3.50, 'µIU/mL', 0.27, 4.2, '0.27-4.20', 'normal', 'thyroid', 'ECLIA'),

    // ── Iron Studies
    m(reportId, 'iron', 'Iron', 78.60, 'µg/dL', 50, 170, '50.00-170.00', 'normal', 'vitamins', 'Spectrophotometry, TPTZ'),
    m(reportId, 'tibc', 'Total Iron Binding Capacity (TIBC)', 419.50, 'µg/dL', 250, 425, '250.00-425.00', 'normal', 'vitamins', 'Spectrophotometry'),
    m(reportId, 'transferrin_saturation', 'Transferrin Saturation', 18.74, '%', 15, 50, '15.00-50.00', 'normal', 'vitamins', 'Calculated'),

    // ── Inflammation
    m(reportId, 'hscrp', 'hsCRP (Cardio CRP)', 2.93, 'mg/L', null, 1.0, '<1.00', 'high', 'inflammation', 'Immunoturbidimetry', 'Average cardiovascular risk (1-3 mg/L). Improvement from 3.1 mg/L in previous report.'),

    // ── Blood (CBC)
    m(reportId, 'hemoglobin', 'Hemoglobin', 13.90, 'g/dL', 12, 15, '12.00-15.00', 'normal', 'blood', 'Spectrophotometry, Electrical Impedance'),
    m(reportId, 'rbc_count', 'RBC Count', 5.06, 'mill/mm³', 3.8, 4.8, '3.80-4.80', 'high', 'blood', 'Spectrophotometry, Electrical Impedance', 'Slightly above upper reference range. Usually benign but worth monitoring.'),
    m(reportId, 'wbc', 'Total Leukocyte Count (WBC)', 8.59, 'thou/mm³', 4, 10, '4.00-10.00', 'normal', 'blood', 'Spectrophotometry, Flow Cytometry'),
    m(reportId, 'rdw', 'Red Cell Distribution Width (RDW)', 17.10, '%', 11.6, 14, '11.60-14.00', 'high', 'blood', 'Spectrophotometry', 'Significantly elevated. May indicate mixed nutritional anaemia (iron + B12/folate deficiency). Warrants investigation.'),
    m(reportId, 'mcv', 'MCV', 83.30, 'fL', 83, 101, '83.00-101.00', 'normal', 'blood', 'Spectrophotometry'),
    m(reportId, 'mch', 'MCH', 27.50, 'pg', 27, 32, '27.00-32.00', 'normal', 'blood', 'Spectrophotometry'),
    m(reportId, 'mchc', 'MCHC', 33.00, 'g/dL', 31.5, 34.5, '31.50-34.50', 'normal', 'blood', 'Spectrophotometry'),
    m(reportId, 'platelet_count', 'Platelet Count', 272, 'thou/mm³', 150, 410, '150.00-410.00', 'normal', 'blood', 'Spectrophotometry'),
    m(reportId, 'esr', 'ESR', 10, 'mm/hr', 0, 20, '0.00-20.00', 'normal', 'blood', 'Westergren'),

    // ── Urine
    m(reportId, 'urine_pus_cells', 'Urine Pus Cells (WBC)', 7, 'WBC/HPF', 0, 5, '0-5 WBC/hpf', 'high', 'urine', 'Microscopy', 'Elevated pus cells with bacteria detected. May indicate urinary tract infection (UTI). Clinical correlation recommended.'),

    // ── Pancreatic
    m(reportId, 'amylase', 'Amylase', 87.0, 'U/L', 28, 100, '28.00-100.00', 'normal', 'other', 'IFCC'),
  ];
}

function mugdha2025DecMetrics(reportId: string): HealthMetric[] {
  return [
    // ── Diabetes & Blood Sugar
    m(reportId, 'fasting_glucose', 'Glucose Fasting', 81.00, 'mg/dL', 70, 100, '70.00-100.00', 'normal', 'diabetes', 'Hexokinase'),
    m(reportId, 'hba1c', 'HbA1c', 5.5, '%', 4.0, 5.6, '4.00-5.60', 'normal', 'diabetes', 'HPLC, NGSP Certified'),
    m(reportId, 'insulin_fasting', 'Insulin Fasting', 6.76, 'µU/mL', 2.6, 24.9, '2.60-24.90', 'normal', 'diabetes', 'ECLIA'),

    // ── Liver Function
    m(reportId, 'ast_sgot', 'AST (SGOT)', 16.0, 'U/L', null, 35, '<35', 'normal', 'liver', 'IFCC'),
    m(reportId, 'alt_sgpt', 'ALT (SGPT)', 13.0, 'U/L', null, 35, '<35', 'normal', 'liver', 'IFCC', 'Major improvement from 99.0 U/L in Jan 2025.'),
    m(reportId, 'ggt', 'GGTP', 10.0, 'U/L', null, 38, '<38', 'normal', 'liver', 'IFCC'),
    m(reportId, 'alp', 'Alkaline Phosphatase (ALP)', 84.0, 'U/L', 30, 120, '30-120', 'normal', 'liver', 'IFCC, AMP-Buffer'),
    m(reportId, 'bilirubin_total', 'Bilirubin Total', 0.50, 'mg/dL', null, 1.10, '<1.10', 'normal', 'liver', 'DPD'),
    m(reportId, 'bilirubin_direct', 'Bilirubin Direct', 0.11, 'mg/dL', null, 0.30, '<0.30', 'normal', 'liver', 'DPD'),
    m(reportId, 'bilirubin_indirect', 'Bilirubin Indirect', 0.39, 'mg/dL', null, 1.10, '<1.10', 'normal', 'liver', 'Calculated'),
    m(reportId, 'total_protein', 'Total Protein', 7.74, 'g/dL', 6.4, 8.3, '6.40-8.30', 'normal', 'liver', 'Biuret'),
    m(reportId, 'albumin', 'Albumin', 4.37, 'g/dL', 3.5, 5.2, '3.50-5.20', 'normal', 'liver', 'BCG'),
    m(reportId, 'globulin', 'Globulin', 3.37, 'gm/dL', 2.0, 3.5, '2.0-3.5', 'normal', 'liver', 'Calculated'),

    // ── Kidney Function
    m(reportId, 'creatinine', 'Creatinine', 0.73, 'mg/dL', 0.51, 0.95, '0.51-0.95', 'normal', 'kidney', 'Compensated Jaffes reaction, IDMS traceable'),
    m(reportId, 'egfr', 'GFR Estimated', 114, 'mL/min/1.73m2', 59, null, '>59', 'normal', 'kidney', 'CKD EPI Equation 2021'),
    m(reportId, 'urea', 'Urea', 34.80, 'mg/dL', 15, 40, '15.00-40.00', 'normal', 'kidney', 'Urease UV'),
    m(reportId, 'bun', 'Urea Nitrogen Blood (BUN)', 16.25, 'mg/dL', 6, 20, '6.00-20.00', 'normal', 'kidney', 'Urease UV'),
    m(reportId, 'uric_acid', 'Uric Acid', 4.58, 'mg/dL', 2.6, 6.0, '2.60-6.00', 'normal', 'kidney', 'Uricase'),

    // ── Lipid Profile
    m(reportId, 'total_cholesterol', 'Cholesterol, Total', 171.0, 'mg/dL', null, 200, '<200.00', 'normal', 'lipid', 'CHO-POD'),
    m(reportId, 'triglycerides', 'Triglycerides', 66.0, 'mg/dL', null, 150, '<150.00', 'normal', 'lipid', 'GPO-POD', 'Excellent improvement from 162 mg/dL in Jan 2025.'),
    m(reportId, 'hdl_cholesterol', 'HDL Cholesterol', 45.0, 'mg/dL', 50, null, '>50.00', 'low', 'lipid', 'Enzymatic Immunoinhibition', 'Still below ideal (>50 mg/dL for females). Moderate cardiovascular risk.'),
    m(reportId, 'ldl_cholesterol', 'LDL Cholesterol', 112.80, 'mg/dL', null, 100, '<100.00', 'high', 'lipid', 'Calculated'),
    m(reportId, 'vldl_cholesterol', 'VLDL Cholesterol', 13.20, 'mg/dL', null, 30, '<30.00', 'normal', 'lipid', 'Calculated'),
    m(reportId, 'non_hdl_cholesterol', 'Non-HDL Cholesterol', 126, 'mg/dL', null, 130, '<130', 'normal', 'lipid', 'Calculated'),
    m(reportId, 'apo_a1', 'Apolipoprotein A1', 110, 'mg/dL', null, null, '46-135 normal', 'normal', 'lipid', 'Immunoturbidimetry'),
    m(reportId, 'apo_b', 'Apolipoprotein B', 86, 'mg/dL', 46, 135, '46-135', 'normal', 'lipid', 'Immunoturbidimetry'),

    // ── Vitamins & Minerals
    m(reportId, 'vitamin_d', 'Vitamin D, 25-Hydroxy', 174.50, 'nmol/L', 75, 250, '75.00-250.00', 'normal', 'vitamins', 'ECLIA'),
    m(reportId, 'vitamin_b12', 'Vitamin B12 (Cyanocobalamin)', 623.50, 'pg/mL', 211, 946, '211.00-946.00', 'normal', 'vitamins', 'ECLIA'),
    m(reportId, 'calcium', 'Calcium, Total', 9.40, 'mg/dL', 8.6, 10.3, '8.60-10.30', 'normal', 'vitamins', 'Arsenazo III'),
    m(reportId, 'phosphorus', 'Phosphorus', 4.62, 'mg/dL', 2.4, 4.4, '2.40-4.40', 'high', 'vitamins', 'Molybedate UV'),
    m(reportId, 'sodium', 'Sodium', 137.0, 'mEq/L', 136, 146, '136.00-146.00', 'normal', 'vitamins', 'Indirect ISE'),
    m(reportId, 'potassium', 'Potassium', 4.58, 'mEq/L', 3.5, 5.1, '3.50-5.10', 'normal', 'vitamins', 'Indirect ISE'),
    m(reportId, 'chloride', 'Chloride', 102.0, 'mEq/L', 101, 109, '101.00-109.00', 'normal', 'vitamins', 'Indirect ISE'),
    m(reportId, 'iron', 'Iron', 53.10, 'µg/dL', 50, 170, '50.00-170.00', 'normal', 'vitamins', 'Spectrophotometry, TPTZ'),
    m(reportId, 'tibc', 'Total Iron Binding Capacity (TIBC)', 437.0, 'µg/dL', 250, 425, '250.00-425.00', 'high', 'vitamins', 'NITROSO-PSAP'),
    m(reportId, 'transferrin_saturation', 'Transferrin Saturation', 12.15, '%', 15, 50, '15.00-50.00', 'low', 'vitamins', 'Calculated', 'Low transferrin saturation with normal iron — suggests early iron deficiency.'),

    // ── Thyroid
    m(reportId, 't3_total', 'T3, Total', 0.98, 'ng/mL', 0.8, 2.0, '0.80-2.00', 'normal', 'thyroid', 'ECLIA'),
    m(reportId, 't4_total', 'T4, Total', 7.45, 'µg/dL', 5.1, 14.1, '5.10-14.10', 'normal', 'thyroid', 'ECLIA'),
    m(reportId, 'tsh', 'TSH', 3.69, 'µIU/mL', 0.27, 4.2, '0.27-4.20', 'normal', 'thyroid', 'ECLIA'),

    // ── Inflammation
    m(reportId, 'hscrp', 'High Sensitivity CRP', 1.18, 'mg/L', null, 1.0, '<1.00', 'high', 'inflammation', 'Immunoturbidimetry', 'Average cardiovascular risk (1-3 mg/L). Slight improvement from Jan 2025.'),

    // ── Blood (CBC)
    m(reportId, 'hemoglobin', 'Hemoglobin', 11.60, 'g/dL', 12, 15, '12.00-15.00', 'low', 'blood', 'Spectrophotometry', 'Low haemoglobin indicating anaemia. Iron deficiency likely given low transferrin saturation.'),
    m(reportId, 'rbc_count', 'RBC Count', 4.61, 'mill/mm3', 3.8, 4.8, '3.80-4.80', 'normal', 'blood', 'Electrical impedance'),
    m(reportId, 'mcv', 'MCV', 77.20, 'fL', 83, 101, '83.00-101.00', 'low', 'blood', 'Calculated', 'Microcytic red cells — consistent with iron deficiency anaemia.'),
    m(reportId, 'mch', 'MCH', 25.20, 'pg', 27, 32, '27.00-32.00', 'low', 'blood', 'Calculated'),
    m(reportId, 'mchc', 'MCHC', 32.70, 'g/dL', 31.5, 34.5, '31.50-34.50', 'normal', 'blood', 'Calculated'),
    m(reportId, 'rdw', 'Red Cell Distribution Width (RDW)', 16.40, '%', 11.6, 14, '11.60-14.00', 'high', 'blood', 'Calculated', 'Elevated RDW consistent with iron deficiency anaemia.'),
    m(reportId, 'wbc', 'Total Leukocyte Count (WBC)', 5.32, 'thou/mm3', 4, 10, '4.00-10.00', 'normal', 'blood', 'Electrical Impedance'),
    m(reportId, 'platelet_count', 'Platelet Count', 267, 'thou/mm3', 150, 410, '150.00-410.00', 'normal', 'blood', 'Electrical impedance'),
    m(reportId, 'esr', 'ESR', 25, 'mm/hr', 0, 20, '0.00-20.00', 'high', 'blood', 'Westergren'),

    // ── Other
    m(reportId, 'amylase', 'Amylase', 66.0, 'U/L', 28, 100, '28.00-100.00', 'normal', 'other', 'IFCC'),
  ];
}

export async function seedData(): Promise<void> {
  // Seed all profiles
  for (const p of PROFILES) {
    await upsertProfile(p as Parameters<typeof upsertProfile>[0]);
  }

  // Seed Mugdha's reports only if they don't exist
  const existingReports = await getReportsByProfile('mugdha');
  const existingDates = new Set(existingReports.map((r) => r.report_date));

  if (!existingDates.has('2024-03')) {
    const reportId = uuidv4();
    await createReport({
      id: reportId,
      profile_id: 'mugdha',
      report_date: '2024-03',
      lab_name: 'Thyrocare',
      file_name: 'Full Body Health Checkup_Mar 2024.pdf',
      uploaded_at: new Date('2024-03-04').toISOString(),
    });
    await createMetrics(mugdha2024Metrics(reportId));
  }

  if (!existingDates.has('2025-01')) {
    const reportId = uuidv4();
    await createReport({
      id: reportId,
      profile_id: 'mugdha',
      report_date: '2025-01',
      lab_name: 'Dr. Lal PathLabs',
      file_name: 'Full Body Health Checkup Report_Jan 2025.pdf',
      uploaded_at: new Date('2025-01-01').toISOString(),
    });
    await createMetrics(mugdha2025Metrics(reportId));
  }

  if (!existingDates.has('2025-12')) {
    const reportId = uuidv4();
    await createReport({
      id: reportId,
      profile_id: 'mugdha',
      report_date: '2025-12',
      lab_name: 'Dr. Lal PathLabs',
      file_name: 'Lal PathLabs Full Body Health Checkup_Dec 2025.pdf',
      uploaded_at: new Date('2025-12-11').toISOString(),
    });
    await createMetrics(mugdha2025DecMetrics(reportId));
  }
}

export interface Profile {
  id: string;
  name: string;
  date_of_birth: string | null;
  blood_group: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  weight_updated_at: string | null;
}

export interface HealthReport {
  id: string;
  profile_id: string;
  report_date: string; // YYYY-MM
  lab_name: string | null;
  file_name: string | null;
  uploaded_at: string;
}

export interface HealthMetric {
  id: string;
  report_id: string;
  metric_key: string;
  display_name: string;
  value: number | null;
  unit: string | null;
  ref_range_low: number | null;
  ref_range_high: number | null;
  ref_range_text: string | null;
  status: 'normal' | 'high' | 'low' | null;
  category: string | null;
  method: string | null;
  notes: string | null;
  advice: string | null;
}

export interface MetricDataPoint {
  report_date: string;
  report_id: string;
  lab_name: string | null;
  value: number | null;
  unit: string | null;
  ref_range_low: number | null;
  ref_range_high: number | null;
  ref_range_text: string | null;
  status: 'normal' | 'high' | 'low' | null;
  method: string | null;
  advice: string | null;
}

export interface MetricWithHistory {
  metric_key: string;
  display_name: string;
  category: string | null;
  unit: string | null; // unit from latest reading
  dataPoints: MetricDataPoint[];
  latest: MetricDataPoint | null;
  previous: MetricDataPoint | null;
  methodChanged: boolean;
}

export interface MetricsByCategory {
  [category: string]: MetricWithHistory[];
}

export interface ParsedMetric {
  metric_key: string;
  display_name: string;
  value: number | null;
  unit: string | null;
  ref_range_low: number | null;
  ref_range_high: number | null;
  ref_range_text: string | null;
  status: 'normal' | 'high' | 'low' | null;
  category: string;
  method: string | null;
  notes: string | null;
  description: string | null;  // what this marker measures (1 sentence)
  advice: string | null;       // value-specific clinical interpretation (generated at parse time)
}

export interface ParsedReportData {
  lab_name: string | null;
  report_date: string | null; // YYYY-MM, null if unknown
  patient_name: string | null;
  date_of_birth: string | null; // YYYY-MM-DD, null if not found
  needs_date: boolean;
  metrics: ParsedMetric[];
}

export interface ProfileDashboardData {
  profile: Profile;
  reports: HealthReport[];
  metricsByCategory: MetricsByCategory;
  lastReportDate: string | null;
}

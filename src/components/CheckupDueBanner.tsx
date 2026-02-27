interface CheckupDueBannerProps {
  lastReportDate: string | null; // YYYY-MM
}

function monthsAgo(dateStr: string): number {
  const [year, month] = dateStr.split('-').map(Number);
  const now = new Date();
  return (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
}

export default function CheckupDueBanner({ lastReportDate }: CheckupDueBannerProps) {
  if (!lastReportDate) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
        No health data yet. Upload a report to get started.
      </div>
    );
  }

  const months = monthsAgo(lastReportDate);
  if (months <= 6) return null;

  const [year, month] = lastReportDate.split('-').map(Number);
  const label = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm text-orange-700">
      Health checkup overdue! Last data from {label} ({months} months ago).
    </div>
  );
}

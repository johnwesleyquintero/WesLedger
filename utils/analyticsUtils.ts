import { LedgerEntry } from '../types';

export interface ChartDataPoint {
  date: string;
  val: number;
}

export interface CategoryDataPoint {
  cat: string;
  val: number;
  pct: number;
}

export const calculateDailyTrend = (entries: LedgerEntry[]): ChartDataPoint[] => {
  if (entries.length === 0) return [];

  // Sort asc by date
  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dailyMap = new Map<string, number>();
  let runningBalance = 0;

  sorted.forEach(e => {
    runningBalance += Number(e.amount);
    dailyMap.set(e.date, runningBalance);
  });

  return Array.from(dailyMap.entries()).map(([date, val]) => ({ date, val }));
};

export const calculateTopExpenses = (entries: LedgerEntry[]): CategoryDataPoint[] => {
  const map = new Map<string, number>();
  let totalExp = 0;
  entries.forEach(e => {
    const amt = Number(e.amount);
    if (amt < 0) {
      const cat = e.category || 'Uncategorized';
      const val = Math.abs(amt);
      map.set(cat, (map.get(cat) || 0) + val);
      totalExp += val;
    }
  });

  return Array.from(map.entries())
    .map(([cat, val]) => ({ cat, val, pct: totalExp ? (val / totalExp) * 100 : 0 }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 5); // Top 5
};

export const generateSVGPoints = (chartData: ChartDataPoint[], width: number, height: number, padding: number): string => {
  if (chartData.length < 2) return "";

  const maxVal = Math.max(...chartData.map(d => d.val));
  const minVal = Math.min(...chartData.map(d => d.val));
  const range = maxVal - minVal || 1;

  return chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * (width - padding * 2) + padding;
    // Invert Y because SVG 0 is top
    const y = height - padding - ((d.val - minVal) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
};

export const generateAreaPath = (points: string, width: number, height: number, padding: number): string => {
  if (!points) return "";
  const firstX = padding;
  const lastX = width - padding;
  return `${points} L ${lastX},${height} L ${firstX},${height} Z`;
};
import React, { useMemo } from 'react';
import { LedgerEntry } from '../types';
import { formatCurrency } from '../constants';

interface AnalyticsProps {
  entries: LedgerEntry[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ entries }) => {
  
  // 1. Prepare Data for Chart (Daily Balance)
  const chartData = useMemo(() => {
    if (entries.length === 0) return [];
    
    // Sort asc by date
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const dailyMap = new Map<string, number>();
    let runningBalance = 0;

    // We need to accumulate *all* previous history to get true balance, 
    // but for the visual "Trend", we'll just plot the movement within the current view
    // or we simulate a starting point. For simplicity in this view, we plot "Cash Flow Impact" 
    // or just the running total of the visible entries.
    
    sorted.forEach(e => {
      runningBalance += Number(e.amount);
      dailyMap.set(e.date, runningBalance);
    });

    return Array.from(dailyMap.entries()).map(([date, val]) => ({ date, val }));
  }, [entries]);

  // 2. Prepare Data for Categories
  const categoryData = useMemo(() => {
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
  }, [entries]);

  // --- SVG Chart Logic ---
  const width = 600;
  const height = 150;
  const padding = 20;

  const points = useMemo(() => {
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
  }, [chartData]);
  
  // Area fill path
  const areaPath = useMemo(() => {
      if (!points) return "";
      const firstX = padding;
      const lastX = width - padding;
      return `${points} L ${lastX},${height} L ${firstX},${height} Z`;
  }, [points]);

  if (entries.length < 2) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* Chart Card */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded p-5 shadow-sm flex flex-col justify-between">
         <div className="flex justify-between items-center mb-4">
             <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Cash Flow Trend</h3>
             <span className="text-xs text-slate-400 font-mono">Current View</span>
         </div>
         
         <div className="relative w-full h-[150px] overflow-hidden">
             <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible preserve-3d">
                 {/* Gradient Definition */}
                 <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                    </linearGradient>
                 </defs>
                 
                 {/* Area Fill */}
                 <path d={areaPath} fill="url(#chartGradient)" />
                 
                 {/* Stroke Line */}
                 <polyline 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="2" 
                    points={points} 
                    strokeLinejoin="round" 
                    strokeLinecap="round"
                    className="drop-shadow-sm"
                 />
             </svg>
         </div>
         <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-mono">
            <span>{chartData[0]?.date}</span>
            <span>{chartData[chartData.length-1]?.date}</span>
         </div>
      </div>

      {/* Category Card */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-sm">
         <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-4">Top Expenses</h3>
         <div className="space-y-3">
             {categoryData.length === 0 ? (
                 <div className="text-sm text-slate-400 italic">No expenses in this view</div>
             ) : categoryData.map((item) => (
                 <div key={item.cat}>
                     <div className="flex justify-between text-sm mb-1">
                         <span className="font-medium text-slate-700">{item.cat}</span>
                         <span className="font-mono text-slate-600">{formatCurrency(item.val)}</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                         <div 
                            className="bg-slate-800 h-1.5 rounded-full" 
                            style={{ width: `${item.pct}%` }}
                         ></div>
                     </div>
                 </div>
             ))}
         </div>
      </div>

    </div>
  );
};
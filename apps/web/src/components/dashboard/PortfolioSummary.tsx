import React from 'react';

interface PortfolioSummaryProps {
  summary: any;
  user: any;
}

export function PortfolioSummary({ summary, user }: PortfolioSummaryProps) {
  const formatMoney = (val: number | undefined) => 
    val !== undefined ? `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00';

  const pnl = summary?.totalUnrealizedPnL || 0;
  
  return (
    <div className="glass-card p-5 h-full flex flex-col justify-between overflow-y-auto">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Portfolio Summary</h3>
      
      <div className="grid grid-cols-2 gap-y-2 gap-x-2">
        <div>
          <p className="text-xs text-slate-500">Portfolio Value</p>
          <p className="text-xl font-bold text-slate-200">{formatMoney(summary?.totalPortfolioValue)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Cash Available</p>
          <p className="text-xl font-bold text-blue-400">{formatMoney(user?.walletBalance)}</p>
        </div>
        
        {/* Mocked fields below as requested */}
        <div>
          <p className="text-xs text-slate-500">Today's P&L</p>
          <p className="text-lg font-bold text-emerald-400">+₹5,340.00</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Overall P&L</p>
          <p className={`text-lg font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {pnl >= 0 ? '+' : '-'}{formatMoney(Math.abs(pnl))}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Buying Power</p>
          <p className="text-sm font-bold text-slate-300">₹4,20,000.00</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Margin Used</p>
          <p className="text-sm font-bold text-slate-300">₹1,50,000.00</p>
        </div>
      </div>
    </div>
  );
}

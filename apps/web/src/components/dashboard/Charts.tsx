import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

export function PortfolioAllocation() {
  const data = [
    { name: 'Technology', value: 45, color: '#3b82f6' },
    { name: 'Finance', value: 20, color: '#8b5cf6' },
    { name: 'Healthcare', value: 15, color: '#10b981' },
    { name: 'Energy', value: 10, color: '#f59e0b' },
    { name: 'Cash', value: 10, color: '#64748b' },
  ];

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Portfolio Allocation</h3>
      <div className="flex-1 flex items-center justify-between">
        <div className="w-1/2 h-full min-h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-1/2 pl-4 space-y-2">
          {data.map(item => (
            <div key={item.name} className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300">{item.name}</span>
              </div>
              <span className="font-bold text-slate-100">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PnLTrend() {
  const data = [
    { month: 'Jan', value: 10000 },
    { month: 'Feb', value: 15000 },
    { month: 'Mar', value: 12000 },
    { month: 'Apr', value: 28000 },
    { month: 'May', value: 42000 },
  ];

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Profit/Loss Graph</h3>
      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'P&L']}
            />
            <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#34d399', strokeWidth: 2, stroke: '#1e293b' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

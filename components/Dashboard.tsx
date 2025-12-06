import React from 'react';
import { Stats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Receipt } from 'lucide-react';

interface DashboardProps {
  stats: Stats;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const barData = [
    { name: 'Pendapatan', value: stats.totalRevenue },
    { name: 'Pengeluaran', value: stats.totalExpense },
  ];

  const pieData = [
    { name: 'Pendapatan', value: stats.totalRevenue, color: '#10b981' }, // Emerald 500
    { name: 'Pengeluaran', value: stats.totalExpense, color: '#ef4444' }, // Red 500
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Keuangan</h2>
        <p className="text-slate-500">Ringkasan hasil analisis akuntansi terkini</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Pendapatan</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(stats.totalRevenue)}</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Pengeluaran</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(stats.totalExpense)}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>

        {/* Net Income */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Laba Bersih</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.netIncome >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                {formatCurrency(stats.netIncome)}
              </h3>
            </div>
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <Wallet size={24} />
            </div>
          </div>
        </div>

        {/* Transaction Count */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Transaksi</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.transactionCount}</h3>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <Receipt size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Perbandingan Arus Kas</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `Rp ${value/1000000}jt`} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Proporsi Keuangan</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
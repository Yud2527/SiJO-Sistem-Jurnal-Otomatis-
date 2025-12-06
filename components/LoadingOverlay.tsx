import React from 'react';
import { Loader2, Database, ServerCog } from 'lucide-react';

export const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-slate-100">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-primary-100 rounded-full animate-pulse opacity-75"></div>
          <div className="relative bg-primary-50 text-primary-600 rounded-full w-20 h-20 flex items-center justify-center">
            <ServerCog size={40} />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Memproses Data Transaksi...</h3>
        <p className="text-slate-500 mb-6">
          Sistem sedang melakukan analisis parameter data dan pencocokan akun (Account Mapping) sesuai konfigurasi.
        </p>
        <div className="flex items-center justify-center gap-2 text-primary-600 font-medium">
          <Loader2 className="animate-spin" size={20} />
          <span>Menjalankan algoritma penjurnalan...</span>
        </div>
      </div>
    </div>
  );
};
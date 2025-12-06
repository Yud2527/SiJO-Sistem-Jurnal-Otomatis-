import React, { useState, useEffect } from 'react';
import { Briefcase, ArrowRight, UserPlus, LogIn, Lock, Mail, Loader2, CheckCircle2, AlertCircle, Building2, ShieldCheck, X, Inbox } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

// Helper untuk simulasi delay network
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'OTP'>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  
  // Global Error/Success
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Field Validation Errors
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');

  // OTP State
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [showMockEmail, setShowMockEmail] = useState(false);

  // Reset error saat mengetik
  useEffect(() => {
    setGeneralError(null);
    setFieldErrors({});
  }, [view, email, password, name, university, otpInput]);

  const validateRegister = () => {
    const errors: {[key: string]: string} = {};
    let isValid = true;

    if (!name.trim()) {
      errors.name = "Nama lengkap wajib diisi.";
      isValid = false;
    }
    if (!university.trim()) {
      errors.university = "Nama institusi wajib diisi.";
      isValid = false;
    }
    if (!email.trim()) {
      errors.email = "Email wajib diisi.";
      isValid = false;
    } else if (!email.includes('@') || !email.includes('.')) {
      errors.email = "Format email tidak valid.";
      isValid = false;
    }
    if (!password) {
      errors.password = "Password wajib diisi.";
      isValid = false;
    } else if (password.length < 6) {
      errors.password = "Password minimal 6 karakter.";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleRegisterStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegister()) {
      setGeneralError("Mohon lengkapi data yang wajib diisi (bertanda merah).");
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Cek duplikasi email di localStorage
      await wait(800);
      const existingUsersStr = localStorage.getItem('sijo_users_db');
      const existingUsers: User[] = existingUsersStr ? JSON.parse(existingUsersStr) : [];
      
      if (existingUsers.some(u => u.email === email)) {
        throw new Error("Email ini sudah terdaftar. Silakan masuk.");
      }

      // 2. Generate OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      
      // 3. Simpan data sementara
      setPendingUser({
        email,
        password,
        name,
        role: '', // Default kosong, agar user melengkapi sendiri nanti
        university
      });

      // 4. Pindah ke view OTP
      setView('OTP');
      
      // 5. Tampilkan Mock Email setelah delay sedikit (UX Effect)
      setTimeout(() => {
        setShowMockEmail(true);
      }, 500);

    } catch (err: any) {
      setGeneralError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput) {
      setGeneralError("Masukkan kode verifikasi.");
      return;
    }

    setIsLoading(true);

    try {
      await wait(1000);
      
      if (otpInput !== generatedOtp) {
        throw new Error("Kode verifikasi salah.");
      }

      // Verifikasi Sukses: Simpan User ke DB
      const existingUsersStr = localStorage.getItem('sijo_users_db');
      const existingUsers: User[] = existingUsersStr ? JSON.parse(existingUsersStr) : [];
      
      if (pendingUser) {
        existingUsers.push(pendingUser);
        localStorage.setItem('sijo_users_db', JSON.stringify(existingUsers));
      }

      setSuccessMsg("Verifikasi berhasil! Akun Anda telah aktif.");
      
      setTimeout(() => {
        setView('LOGIN');
        setSuccessMsg("Registrasi berhasil. Silakan login.");
        setOtpInput('');
        
        // Auto-fill credentials agar user bisa langsung klik Masuk
        if (pendingUser) {
           setEmail(pendingUser.email);
           setPassword(pendingUser.password || ''); 
        }
        
        setPendingUser(null);
      }, 1500);

    } catch (err: any) {
      setGeneralError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setGeneralError("Email dan password wajib diisi.");
      return;
    }

    setIsLoading(true);
    
    try {
      await wait(1000);
      const existingUsersStr = localStorage.getItem('sijo_users_db');
      const existingUsers: User[] = existingUsersStr ? JSON.parse(existingUsersStr) : [];

      const user = existingUsers.find(u => u.email === email && u.password === password);

      if (!user) {
        throw new Error("Email atau password salah.");
      }

      onLogin(user);
    } catch (err: any) {
      setGeneralError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- MOCK EMAIL COMPONENT ---
  const renderMockEmail = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-red-600 px-4 py-3 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-medium">
            <Mail size={18} />
            <span>Gmail - New Message</span>
          </div>
          <button onClick={() => setShowMockEmail(false)} className="hover:bg-red-700 p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h3 className="font-bold text-lg text-slate-800">Kode Verifikasi Akun SiJO</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                S
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-700">SiJO System <span className="text-slate-400 font-normal">&lt;no-reply@sijo.ac.id&gt;</span></p>
                <p className="text-slate-500 text-xs">to me</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Halo {pendingUser?.name},</p>
            <p className="text-sm text-slate-600">Terima kasih telah mendaftar di Sistem Jurnal Otomatis. Berikut adalah kode verifikasi Anda:</p>
            
            <div className="bg-slate-50 border border-slate-200 py-4 text-center rounded-lg">
              <span className="text-3xl font-bold text-slate-800 tracking-widest">{generatedOtp}</span>
            </div>
            
            <p className="text-xs text-slate-400">Kode ini hanya berlaku untuk sesi pendaftaran saat ini.</p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
             <button 
               onClick={() => setShowMockEmail(false)}
               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
             >
               Tutup & Masukkan Kode
             </button>
          </div>
        </div>
      </div>
    </div>
  );

  // --- RENDER VIEW: OTP VERIFICATION ---
  if (view === 'OTP') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans animate-fade-in relative">
        {showMockEmail && renderMockEmail()}

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-full mb-4">
                <ShieldCheck size={32} className="text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Verifikasi Email</h2>
              <p className="text-slate-500 text-sm mt-2">
                Kami telah mengirimkan kode ke <strong>{pendingUser?.email}</strong>.
              </p>
              <button 
                onClick={() => setShowMockEmail(true)} 
                className="text-xs text-primary-600 font-semibold underline mt-1 hover:text-primary-700"
              >
                Buka Simulasi Inbox Email
              </button>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-center text-3xl tracking-[0.5em] font-bold py-4 border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:ring-0 outline-none transition-colors text-slate-800 placeholder-slate-300"
                  placeholder="000000"
                />
              </div>

              {generalError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 justify-center">
                  <AlertCircle size={16} /> {generalError}
                </div>
              )}
              
              {successMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg flex items-center gap-2 justify-center">
                  <CheckCircle2 size={16} /> {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-slate-900/20 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "Verifikasi & Aktifkan Akun"}
              </button>
            </form>

            <button 
              onClick={() => { setView('REGISTER'); setOtpInput(''); }}
              className="w-full mt-4 text-sm text-slate-500 hover:text-slate-800 font-medium py-2"
            >
              Kembali / Ubah Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER VIEW: LOGIN / REGISTER ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="mb-8 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center p-4 bg-slate-900 rounded-2xl mb-4 shadow-xl ring-4 ring-slate-100">
          <Briefcase size={40} className="text-primary-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SiJO</h1>
        <p className="text-slate-500 mt-2 text-sm">Sistem Informasi Jurnal Otomatis Berbasis AI</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
        <div className="p-8">
          {/* Toggle Login/Register */}
          <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => { setView('LOGIN'); setSuccessMsg(null); setGeneralError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                view === 'LOGIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => { setView('REGISTER'); setSuccessMsg(null); setGeneralError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                view === 'REGISTER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={view === 'LOGIN' ? handleLogin : handleRegisterStep1} className="space-y-4">
            
            {/* Field Khusus Register */}
            {view === 'REGISTER' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all text-sm group-hover:bg-white
                        ${fieldErrors.name ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500'}`}
                      placeholder="Contoh: Budi Santoso"
                    />
                    <UserPlus size={18} className="absolute left-3 top-3.5 text-slate-400" />
                  </div>
                  {fieldErrors.name && <p className="text-red-500 text-[10px] font-semibold mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {fieldErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">
                    Institusi / Universitas <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all text-sm group-hover:bg-white
                        ${fieldErrors.university ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500'}`}
                      placeholder="Nama Kampus/Perusahaan"
                    />
                    <Building2 size={18} className="absolute left-3 top-3.5 text-slate-400" />
                  </div>
                  {fieldErrors.university && <p className="text-red-500 text-[10px] font-semibold mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {fieldErrors.university}</p>}
                </div>
              </div>
            )}

            {/* Field Umum (Login & Register) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">
                Alamat Email {view === 'REGISTER' && <span className="text-red-500">*</span>}
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all text-sm group-hover:bg-white
                    ${fieldErrors.email ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500'}`}
                  placeholder="nama@email.com"
                />
                <Mail size={18} className="absolute left-3 top-3.5 text-slate-400" />
              </div>
              {fieldErrors.email && <p className="text-red-500 text-[10px] font-semibold mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">
                Password {view === 'REGISTER' && <span className="text-red-500">*</span>}
              </label>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all text-sm group-hover:bg-white
                    ${fieldErrors.password ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500'}`}
                  placeholder="••••••••"
                />
                <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
              </div>
              {fieldErrors.password && <p className="text-red-500 text-[10px] font-semibold mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {fieldErrors.password}</p>}
            </div>

            {/* Error & Success Messages */}
            {generalError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs animate-fade-in">
                <AlertCircle size={16} className="shrink-0" />
                <p>{generalError}</p>
              </div>
            )}

            {successMsg && (
               <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-xs animate-fade-in">
                <CheckCircle2 size={16} className="shrink-0" />
                <p>{successMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white py-3.5 rounded-xl font-semibold mt-2 transition-all transform active:scale-[0.98] shadow-lg shadow-slate-900/20"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  {view === 'LOGIN' ? 'Masuk ke Dashboard' : 'Kirim Kode Verifikasi'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          
          {view === 'REGISTER' && (
             <p className="text-[10px] text-slate-400 mt-4 text-center bg-slate-50 py-2 rounded">
               <span className="text-red-500 font-bold">*</span> Data wajib diisi lengkap untuk melanjutkan.
             </p>
          )}

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-xs text-slate-400 leading-relaxed px-4">
              <span className="flex items-center justify-center gap-1 mb-1 font-semibold text-slate-500"><Lock size={10}/> Secure Local Environment</span>
              Data tersimpan aman secara lokal di perangkat Anda (LocalStorage).<br/>
              © 2025 SiJO - Tugas Akhir D4 Akuntansi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
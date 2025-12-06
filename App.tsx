import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, FileInput, Table as TableIcon, CheckCircle2, AlertTriangle, Menu, X, Briefcase, Settings, Save, Server, UserCircle2, GraduationCap, BookOpen, Info, ShieldCheck, FileText, ChevronRight, Edit3, Camera, Mail, LogOut, Code2, Users, FileQuestion, Phone } from 'lucide-react';
import { JournalEntry, AppState, Stats, User } from './types';
import { analyzeBankStatement } from './services/geminiService';
import { LoadingOverlay } from './components/LoadingOverlay';
import { JournalTable } from './components/JournalTable';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';

const DEFAULT_COA = `1-1100 Kas Besar
1-1101 Kas Kecil
1-1200 Bank BCA
1-1201 Bank Mandiri
1-1300 Piutang Usaha
1-1400 Perlengkapan Kantor
1-1500 Sewa Dibayar Dimuka
2-1100 Utang Usaha
2-1200 Utang Gaji
2-1300 Utang Pajak
3-1000 Modal Disetor
3-2000 Laba Ditahan
4-1000 Pendapatan Jasa
4-2000 Pendapatan Lain-lain
5-1100 Beban Gaji & Upah
5-1200 Beban Sewa Kantor
5-1300 Beban Listrik, Air & Internet
5-1400 Beban Pemasaran
5-1500 Beban Transportasi
5-1600 Beban Konsumsi
5-1700 Beban Lain-lain
5-1800 Beban Administrasi Bank`;

const DEFAULT_PROFILE = {
  name: "Pengguna SiJO",
  role: "", 
  school: "",
  university: "Universitas Indonesia", 
  email: "user@example.com",
  avatar: null as string | null
};

// --- SESSION SECURITY HELPERS ---
const generateMockToken = (user: User) => {
  // Simulasi JWT: Header.Payload.Signature (Mock)
  const payload = JSON.stringify({ 
    sub: user.email, 
    name: user.name, 
    iat: Date.now(),
    iss: 'sijo-auth-system' 
  });
  return btoa(payload); // Encode Base64 sebagai token
};

const getValidSession = (): { user: User, token: string } | null => {
  try {
    const sessionStr = localStorage.getItem('sijo_session');
    if (!sessionStr) return null;

    const session = JSON.parse(sessionStr);
    
    // 1. Validasi Keberadaan Token
    if (!session.token || !session.user) return null;

    // 2. Validasi Integritas Token (Decode & Match)
    const decodedPayload = JSON.parse(atob(session.token));
    if (decodedPayload.sub !== session.user.email) {
      console.warn("Security Alert: Token mismatch detected.");
      return null;
    }

    return session;
  } catch (e) {
    console.error("Session validation error:", e);
    return null;
  }
};

const App: React.FC = () => {
  // Authentication State & Session
  const [session, setSession] = useState<{ user: User, token: string } | null>(getValidSession);

  // App Data States
  const [appState, setAppState] = useState<AppState>(AppState.GUIDE);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [coaText, setCoaText] = useState<string>(DEFAULT_COA);
  
  // UI States
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Profile Edit States
  const [editForm, setEditForm] = useState(DEFAULT_PROFILE);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DATA LOADING & PERSISTENCE (USER SCOPED) ---

  // 1. Load Data User saat Session Berubah/Terinisialisasi
  useEffect(() => {
    if (session) {
      const userKey = session.user.email; // Kunci unik per user

      // A. Load Profile
      const savedProfile = localStorage.getItem(`sijo_profile_${userKey}`);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        setEditForm(parsed);
      } else {
        // Init profile baru dari data session login
        const initialProfile = {
          ...DEFAULT_PROFILE,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role || "",
          university: session.user.university || DEFAULT_PROFILE.university
        };
        setProfile(initialProfile);
        setEditForm(initialProfile);
      }

      // B. Load Journal Entries (Persistent)
      const savedJournals = localStorage.getItem(`sijo_journals_${userKey}`);
      if (savedJournals) {
        setJournalEntries(JSON.parse(savedJournals));
        // Jika ada data jurnal, arahkan ke halaman Results atau Dashboard (opsional)
        // setAppState(AppState.RESULTS); 
      } else {
        setJournalEntries([]);
      }

      // C. Load COA Config
      const savedCoa = localStorage.getItem(`sijo_coa_${userKey}`);
      if (savedCoa) {
        setCoaText(savedCoa);
      } else {
        setCoaText(DEFAULT_COA);
      }

    } else {
      // Reset state jika tidak ada session (Security measure)
      setProfile(DEFAULT_PROFILE);
      setJournalEntries([]);
      setCoaText(DEFAULT_COA);
    }
  }, [session]);

  // 2. Auto-Save Data ke LocalStorage (User Scoped)
  useEffect(() => {
    if (session) {
      const userKey = session.user.email;
      localStorage.setItem(`sijo_profile_${userKey}`, JSON.stringify(profile));
    }
  }, [profile, session]);

  useEffect(() => {
    if (session) {
      const userKey = session.user.email;
      localStorage.setItem(`sijo_journals_${userKey}`, JSON.stringify(journalEntries));
    }
  }, [journalEntries, session]);

  useEffect(() => {
    if (session) {
      const userKey = session.user.email;
      localStorage.setItem(`sijo_coa_${userKey}`, coaText);
    }
  }, [coaText, session]);

  // --- HANDLERS ---

  const handleLogin = (user: User) => {
    // Generate Token & Create Session
    const token = generateMockToken(user);
    const newSession = { user, token };
    
    // Simpan ke storage global hanya untuk session aktif
    localStorage.setItem('sijo_session', JSON.stringify(newSession));
    setSession(newSession);
  };

  const handleLogout = () => {
    localStorage.removeItem('sijo_session');
    setSession(null);
    setAppState(AppState.GUIDE);
    // Data di-reset oleh useEffect saat session null
  };

  const handleStartEdit = () => {
    setEditForm(profile); 
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    setProfile(editForm);
    setIsEditingProfile(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- ANALYTICS ---

  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalExpense: 0,
    netIncome: 0,
    transactionCount: 0
  });

  useEffect(() => {
    let revenue = 0;
    let expense = 0;

    journalEntries.forEach(entry => {
      const isRevenue = entry.creditAccount.toLowerCase().includes('pendapatan') || 
                        entry.creditAccount.startsWith('4');
      const isExpense = entry.debitAccount.toLowerCase().includes('beban') || 
                        entry.debitAccount.toLowerCase().includes('biaya') ||
                        entry.debitAccount.startsWith('5');

      if (isRevenue) revenue += entry.amount;
      else if (isExpense) expense += entry.amount;
    });

    setStats({
      totalRevenue: revenue,
      totalExpense: expense,
      netIncome: revenue - expense,
      transactionCount: journalEntries.length
    });
  }, [journalEntries]);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError("Mohon masukkan data rekening koran terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await analyzeBankStatement(inputText, coaText);
      setJournalEntries(results);
      setAppState(AppState.RESULTS);
    } catch (err: any) {
      setError(err.message || "Terjadi kegagalan pemrosesan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAppState(AppState.INPUT);
    setJournalEntries([]);
    setInputText('');
    setError(null);
  };
  
  const handleSaveCoa = () => {
    if(!coaText.trim()) {
      setError("Konfigurasi akun tidak valid.");
      return;
    }
    setError(null);
    setAppState(AppState.INPUT);
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Jika tidak ada sesi valid, tampilkan Auth
  if (!session) {
    return <Auth onLogin={handleLogin} />;
  }

  // --- RENDER FUNCTIONS ---

  const renderAboutPage = () => (
    <div className="animate-fade-in space-y-8 max-w-2xl mx-auto pb-12 flex flex-col items-center justify-center min-h-[60vh]">
         {/* Kontak Developer - STATIC DATA (LOCKED) */}
         <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary-600"></div>
            <div className="flex items-center gap-3 mb-8 justify-center">
               <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                  <Phone size={24} />
               </div>
               <h2 className="text-2xl font-bold text-slate-800">Kontak Developer</h2>
            </div>

            <div className="flex flex-col items-center text-center">
               <div className="h-32 w-32 rounded-full bg-slate-100 overflow-hidden mb-6 border-4 border-slate-50 flex items-center justify-center text-slate-400 shadow-inner">
                  <UserCircle2 size={100} />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-1">Yudi Agus Setiawan</h3>
               <p className="text-primary-600 font-semibold mb-4">Mahasiswa Peneliti</p>

               <div className="flex items-center gap-2 mb-4 justify-center animate-fade-in">
                  <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Tugas Akhir
                  </span>
                  <span className="bg-primary-50 text-primary-700 text-[10px] font-bold px-3 py-1 rounded-full border border-primary-200 shadow-sm">
                    TA 2025/2026
                  </span>
               </div>

               <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 max-w-md mx-auto">
                 <p className="text-slate-600 text-xs italic leading-relaxed">
                    "Proyek Akhir sebagai salah satu syarat untuk memperoleh gelar Sarjana Terapan pada Program Studi Akuntansi"
                 </p>
               </div>

               <p className="text-slate-500 text-sm mb-8 font-medium">Sekolah Vokasi - IPB University</p>

               <div className="w-full max-w-md space-y-4">
                 <div className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-200 group">
                    <div className="bg-white p-2 rounded-lg text-slate-400 group-hover:text-primary-600 transition-colors shadow-sm">
                        <Mail size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Email Institusi</p>
                        <span className="text-sm text-slate-700 font-medium">yudiagus@apps.ipb.ac.id</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-200 group">
                    <div className="bg-white p-2 rounded-lg text-slate-400 group-hover:text-primary-600 transition-colors shadow-sm">
                        <GraduationCap size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Program Studi</p>
                        <span className="text-sm text-slate-700 font-medium">D4 Akuntansi</span>
                    </div>
                 </div>
               </div>
            </div>
         </div>
         <p className="text-slate-400 text-xs text-center">
            Hubungi pengembang untuk keperluan akademis atau laporan bug sistem.
         </p>
    </div>
  );

  const renderGuidePage = () => {
    const displayData = isEditingProfile ? editForm : profile;
    const showProfileAlert = profile.name === "Pengguna SiJO" || !profile.role || profile.role === "Mahasiswa / Umum";
    
    return (
    <div className="animate-fade-in space-y-6 pb-12">
      {showProfileAlert && !isEditingProfile && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 animate-fade-in shadow-sm">
           <div className="p-2 bg-amber-100 rounded-lg text-amber-600 shrink-0">
              <Info size={20} />
           </div>
           <div className="flex-1">
              <h3 className="font-bold text-slate-800 text-sm">Lengkapi Profil Anda</h3>
              <p className="text-xs text-slate-600 mt-1">
                 Untuk hasil laporan yang optimal dan personal, disarankan untuk memperbarui data <strong>Peran</strong> dan <strong>Institusi</strong> Anda.
              </p>
           </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <GraduationCap size={180} />
        </div>
        
        <button 
            onClick={isEditingProfile ? handleSaveProfile : handleStartEdit}
            className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm transition-all z-20 shadow-sm flex items-center gap-2 px-3
              ${isEditingProfile ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            title={isEditingProfile ? "Simpan Perubahan" : "Edit Profil"}
        >
            {isEditingProfile ? (
              <>
                <span className="text-xs font-bold">Simpan</span>
                <Save size={16} />
              </>
            ) : (
              <Edit3 size={20} />
            )}
        </button>

        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
            Selamat Datang di SiJO
          </h1>
          <p className="text-slate-300 max-w-2xl text-lg mt-4 leading-relaxed">
             Platform analisis transaksi keuangan yang dirancang untuk mempermudah proses penjurnalan melalui pemanfaatan teknologi Artificial Intelligence (AI) yang terintegrasi secara otomatis.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-6 border-t border-slate-700/50">
            <div className="flex items-center gap-4">
               <div className="relative group/avatar">
                  <div className="h-16 w-16 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-primary-400 overflow-hidden shrink-0">
                     {displayData.avatar ? (
                         <img src={displayData.avatar} alt="Profile" className="h-full w-full object-cover" />
                     ) : (
                         <UserCircle2 size={36} />
                     )}
                  </div>
                  
                  {isEditingProfile && (
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-primary-500 text-white p-1.5 rounded-full shadow-lg hover:bg-primary-600 transition-colors"
                        title="Ganti Foto"
                    >
                        <Camera size={12} />
                    </button>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
               </div>
               
               <div className="min-w-[200px]">
                 {isEditingProfile ? (
                    <div className="space-y-2 animate-fade-in">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Nama Lengkap</label>
                          <input 
                              value={editForm.name}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                              className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white text-sm font-semibold w-full focus:outline-none focus:border-primary-500 placeholder-slate-500"
                              placeholder="Nama Lengkap"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Peran / Status</label>
                          <input 
                              value={editForm.role}
                              onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                              className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-slate-300 text-xs w-full focus:outline-none focus:border-primary-500 placeholder-slate-500"
                              placeholder="Peran (e.g. Mahasiswa)"
                          />
                        </div>
                    </div>
                 ) : (
                    <div>
                        <p className="font-semibold text-white text-lg">{profile.name}</p>
                        <p className="text-sm text-slate-400">{profile.role || "Peran belum diisi"}</p>
                    </div>
                 )}
               </div>
            </div>

            <div className="hidden sm:block h-10 w-px bg-slate-700 mx-2"></div>

            <div className="min-w-[200px]">
              {isEditingProfile ? (
                 <div className="space-y-2 animate-fade-in">
                    <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Institusi / Universitas</label>
                        <input 
                            value={editForm.university}
                            onChange={(e) => setEditForm({...editForm, university: e.target.value})}
                            className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white text-sm font-semibold w-full focus:outline-none focus:border-primary-500 placeholder-slate-500"
                            placeholder="Universitas"
                        />
                    </div>
                 </div>
              ) : (
                <div>
                   <p className="font-semibold text-white">{profile.university}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold text-slate-800">Panduan Penggunaan Sistem</h2>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  step: "1",
                  title: "Konfigurasi Bagan Akun (COA)",
                  desc: "Sesuaikan daftar akun pada menu 'Master Data Akun'. Sistem akan menggunakan akun-akun ini sebagai referensi validasi saat memproses transaksi.",
                  icon: <Settings size={20} />
                },
                {
                  step: "2",
                  title: "Input Data Transaksi",
                  desc: "Salin teks dari mutasi bank (PDF/Excel) atau ketik manual ke kolom input. Format bebas, namun pastikan mengandung Tanggal, Keterangan, dan Nominal.",
                  icon: <FileInput size={20} />
                },
                {
                  step: "3",
                  title: "Proses Analisis AI",
                  desc: "Klik tombol 'Proses Jurnal Otomatis'. Algoritma AI akan menganalisis konteks transaksi dan memetakannya ke akun Debit/Kredit yang sesuai.",
                  icon: <Server size={20} />
                },
                {
                  step: "4",
                  title: "Validasi & Pelaporan",
                  desc: "Tinjau hasil Jurnal Umum. Jika sudah sesuai, Anda dapat melihat analisis di Dashboard atau mengunduh laporan dalam format CSV, PDF, atau Excel.",
                  icon: <TableIcon size={20} />
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
               <button 
                 onClick={() => setAppState(AppState.INPUT)}
                 className="flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
               >
                 Mulai Gunakan Sistem <ChevronRight size={18} />
               </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
               <Code2 className="text-primary-600" size={24} />
               <h2 className="text-lg font-bold text-slate-800">Spesifikasi Sistem</h2>
            </div>
            <p className="text-slate-600 text-xs mb-6 leading-relaxed text-justify">
              SiJO (Sistem Jurnal Otomatis) menggunakan model bahasa besar (LLM) untuk menganalisis konteks teks mutasi bank dan memetakannya ke akun akuntansi yang sesuai standar.
            </p>
            
            <div className="space-y-4">
               <div className="flex items-start gap-3">
                 <div className="bg-primary-50 p-2 rounded text-primary-600">
                    <Server size={16} />
                 </div>
                 <div>
                   <h3 className="font-semibold text-slate-800 text-sm">Teknologi Inti</h3>
                   <p className="text-xs text-slate-500">Google Gemini AI, React, TypeScript</p>
                 </div>
               </div>
               <div className="flex items-start gap-3">
                 <div className="bg-emerald-50 p-2 rounded text-emerald-600">
                    <ShieldCheck size={16} />
                 </div>
                 <div>
                   <h3 className="font-semibold text-slate-800 text-sm">Privasi Data</h3>
                   <p className="text-xs text-slate-500">Pemrosesan real-time, isolasi data pengguna</p>
                 </div>
               </div>
            </div>
         </div>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
             <div className="flex items-center gap-2 mb-4 text-slate-800">
               <ShieldCheck className="text-emerald-600" size={24} />
               <h3 className="font-bold">Standar Evaluasi</h3>
             </div>
             
             <ul className="space-y-3">
               {[
                 { label: "Prinsip Entri Ganda", detail: "Otomatisasi Debit = Kredit." },
                 { label: "Kronologis", detail: "Pencatatan urut tanggal." },
                 { label: "Kelengkapan", detail: "Validasi data input." },
                 { label: "Audit Trail", detail: "ID transaksi unik." }
               ].map((point, idx) => (
                 <li key={idx} className="flex gap-3 text-sm">
                   <CheckCircle2 className="text-emerald-500 flex-shrink-0 mt-0.5" size={16} />
                   <div>
                     <span className="font-semibold text-slate-700 block">{point.label}</span>
                     <span className="text-xs text-slate-500">{point.detail}</span>
                   </div>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </div>
    </div>
  )};

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar - Fixed/Static but within flex layout for desktop */}
      <aside className={`
        fixed lg:static top-0 h-full w-64 bg-slate-900 text-white z-30 transition-transform duration-300 ease-in-out flex flex-col shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Briefcase size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SiJO</h1>
              <p className="text-xs text-slate-400">Sistem Jurnal Otomatis</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          
          <button
            onClick={() => { setAppState(AppState.GUIDE); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              appState === AppState.GUIDE 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
                : 'text-emerald-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen size={20} />
            <span className="font-medium">Panduan & Sistem</span>
          </button>

          <div className="px-4 py-2 mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Konfigurasi
          </div>
          <button
            onClick={() => { setAppState(AppState.COA_SETUP); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              appState === AppState.COA_SETUP 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings size={20} />
            <span className="font-medium">Master Data Akun (COA)</span>
          </button>

          <div className="mt-4 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Modul Utama
          </div>

          <button
            onClick={() => { setAppState(AppState.INPUT); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              appState === AppState.INPUT 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileInput size={20} />
            <span className="font-medium">Input Transaksi</span>
          </button>

          <button
            onClick={() => { if(journalEntries.length > 0) setAppState(AppState.RESULTS); setIsSidebarOpen(false); }}
            disabled={journalEntries.length === 0}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              appState === AppState.RESULTS 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
                : journalEntries.length === 0 
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <TableIcon size={20} />
            <span className="font-medium">Jurnal Umum</span>
            {journalEntries.length > 0 && (
              <span className="ml-auto bg-primary-500 text-white text-xs py-0.5 px-2 rounded-full">
                {journalEntries.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { if(journalEntries.length > 0) setAppState(AppState.DASHBOARD); setIsSidebarOpen(false); }}
             disabled={journalEntries.length === 0}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              appState === AppState.DASHBOARD 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
                : journalEntries.length === 0 
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard Manajerial</span>
          </button>

          <div className="mt-6 border-t border-slate-800 pt-4"></div>
          
           <button
            onClick={() => { setAppState(AppState.ABOUT); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              appState === AppState.ABOUT 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users size={20} />
            <span className="font-medium">Kontak Developer</span>
          </button>
        </nav>
        
        <div className="border-t border-slate-800 bg-slate-900 shrink-0">
           <div className="p-4 px-6 flex justify-between items-center text-slate-500 hover:text-white cursor-pointer transition-colors" onClick={handleLogout}>
              <span className="text-xs font-bold uppercase tracking-wider">Keluar Sesi</span>
              <LogOut size={16} />
           </div>
           <div className="p-6 pt-2">
             <div className="flex items-center gap-3 mb-2">
               <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-primary-400 shrink-0 overflow-hidden">
                  {profile.avatar ? (
                     <img src={profile.avatar} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                     <UserCircle2 size={20} />
                  )}
               </div>
               <div className="min-w-0">
                 <p className="text-sm font-semibold text-slate-200 truncate">{profile.name}</p>
                 <div className="flex items-center gap-1 text-[10px] text-primary-400">
                   <GraduationCap size={10} />
                   <span className="truncate">{profile.university}</span>
                 </div>
               </div>
             </div>
             <p className="text-[10px] text-slate-600 mt-4 text-center">
               © 2025 SiJO. All rights reserved.
             </p>
           </div>
        </div>
      </aside>

      {/* Main Content - Now independently scrollable */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto bg-slate-50 relative">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm">
          <h1 className="text-lg font-bold text-slate-800">SiJO</h1>
          <button onClick={toggleSidebar} className="p-2 text-slate-600">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto min-h-full">
          {isLoading && <LoadingOverlay />}

          {appState === AppState.GUIDE && renderGuidePage()}
          
          {appState === AppState.ABOUT && renderAboutPage()}

          {appState === AppState.COA_SETUP && (
             <div className="max-w-4xl mx-auto animate-fade-in pb-10">
               <div className="mb-8">
                 <h2 className="text-3xl font-bold text-slate-900">Konfigurasi Bagan Akun (COA)</h2>
                 <p className="text-slate-600 mt-2">
                   Definisikan parameter akun yang akan digunakan dalam proses pemetaan (mapping) transaksi. Sistem akan memvalidasi input berdasarkan daftar ini.
                 </p>
               </div>

               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
                 <div className="flex-1 p-6 border-r border-slate-100">
                   <label className="block text-sm font-semibold text-slate-800 mb-3">
                     Entri Master Akun (Kode - Deskripsi)
                   </label>
                   <textarea
                     value={coaText}
                     onChange={(e) => setCoaText(e.target.value)}
                     className="w-full h-[400px] p-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-mono text-sm resize-none"
                     placeholder="Masukkan daftar akun Anda di sini..."
                   />
                   <p className="text-xs text-slate-400 mt-2">
                     Format: [Kode Akun] [Nama Akun]. Setiap entri dipisahkan baris baru.
                   </p>
                 </div>
                 
                 <div className="w-full md:w-72 bg-slate-50 p-6 flex flex-col">
                   <h3 className="font-semibold text-slate-800 mb-4">Parameter Input</h3>
                   <ul className="text-sm text-slate-600 space-y-3 mb-auto">
                     <li className="flex gap-2">
                       <span className="text-primary-500">•</span>
                       Kelompokkan Akun Aset (1-xxx)
                     </li>
                     <li className="flex gap-2">
                       <span className="text-primary-500">•</span>
                       Kelompokkan Liabilitas (2-xxx)
                     </li>
                     <li className="flex gap-2">
                       <span className="text-primary-500">•</span>
                       Kelompokkan Ekuitas (3-xxx)
                     </li>
                      <li className="flex gap-2">
                       <span className="text-primary-500">•</span>
                       Pendapatan & Beban (4-xxx & 5-xxx)
                     </li>
                   </ul>

                   <div className="mt-6 pt-6 border-t border-slate-200">
                     <button
                       onClick={() => setCoaText(DEFAULT_COA)}
                       className="w-full mb-3 px-4 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                     >
                       Muat Template Standar
                     </button>
                     <button
                       onClick={handleSaveCoa}
                       className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg font-semibold shadow-lg shadow-primary-500/20 transition-all"
                     >
                       <Save size={18} />
                       Simpan Konfigurasi
                     </button>
                   </div>
                 </div>
               </div>
               
               {error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-100">
                    <AlertTriangle size={18} />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
               )}
             </div>
          )}

          {appState === AppState.INPUT && (
            <div className="max-w-3xl mx-auto animate-fade-in pb-10">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Input Data Transaksi</h2>
                <p className="text-slate-600 max-w-lg mx-auto">
                  Sistem akan melakukan ekstraksi data mutasi dan melakukan klasifikasi akun debit/kredit secara otomatis berdasarkan Master COA.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Sumber Data (Rekening Koran / Mutasi Bank)
                  </label>
                  <button 
                    onClick={() => setAppState(AppState.COA_SETUP)}
                    className="text-xs text-primary-600 hover:underline font-medium"
                  >
                    Konfigurasi Ulang COA
                  </button>
                </div>
                
                <div className="relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Format yang didukung (Copy-Paste):\nTANGGAL | KETERANGAN | NOMINAL\n\nContoh:\n01/10/2025 Transfer Masuk dari PT Maju Jaya Rp 5.000.000\n02/10/2025 Pembayaran Listrik PLN Rp 450.000`}
                    className="w-full h-64 p-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-mono text-sm resize-none"
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-slate-400">
                    System Ready
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-100">
                    <AlertTriangle size={18} />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleAnalyze}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Server size={20} />
                    Proses Jurnal Otomatis
                  </button>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                 <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                   <div className="text-2xl mb-2 text-primary-600 font-bold">0.5s</div>
                   <h3 className="font-semibold text-slate-800">Latensi Rendah</h3>
                   <p className="text-xs text-slate-500">Pemrosesan data real-time.</p>
                 </div>
                 <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                   <div className="text-2xl mb-2 text-primary-600 font-bold">PSAK</div>
                   <h3 className="font-semibold text-slate-800">Standar Akuntansi</h3>
                   <p className="text-xs text-slate-500">Kepatuhan pada prinsip double-entry.</p>
                 </div>
                 <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                   <div className="text-2xl mb-2 text-primary-600 font-bold">CSV</div>
                   <h3 className="font-semibold text-slate-800">Ekspor Data</h3>
                   <p className="text-xs text-slate-500">Kompatibel dengan software akuntansi lain.</p>
                 </div>
              </div>
            </div>
          )}

          {appState === AppState.RESULTS && (
            <div className="pb-10">
               <JournalTable entries={journalEntries} onReset={handleReset} profile={profile} />
            </div>
          )}

          {appState === AppState.DASHBOARD && (
            <div className="pb-10">
               <Dashboard stats={stats} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
// E-IZIN PA Gunung Sugih - Pegawai & Ketua Jabatan Controller

function formatDateIndo(dateStr, includeDay = false) {
  if (!dateStr) return '';
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  if (isNaN(d.getTime())) return dateStr;
  const dayName = days[d.getDay()];
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  return includeDay ? `${dayName}, ${dayNum} ${monthName} ${year}` : `${dayNum} ${monthName} ${year}`;
}

const App = {
  state: {
    currentUser: null,
    atasanList: [],
    pegawaiIzinList: [],
    ketuaIzinList: [],
    ketuaMyIzinList: [],
    pegawaiFilter: 'all',
    ketuaFilter: 'pending',
    ketuaMyFilter: 'all',
    ketuaSection: 'approval',
    selectedIzin: null,
    selectedIzinId: null,
    currentApprovalIzinId: null,
    hasSigned: false,
    hasKetuaSigned: false
  },

  canvas: null,
  ctx: null,
  isDrawing: false,

  canvasKetua: null,
  ctxKetua: null,
  isDrawingKetua: false,

  init() {
    this.checkSession();
    this.bindEvents();
    this.initSignaturePad();
    this.initKetuaSignaturePad();
    lucide.createIcons();
  },

  // Periksa Status Login Pengguna
  checkSession() {
    const saved = localStorage.getItem('e_izin_user');
    if (saved) {
      try {
        this.state.currentUser = JSON.parse(saved);
        this.routeDashboard();
      } catch (e) {
        this.showLogin();
      }
    } else {
      this.showLogin();
    }
  },

  showLogin() {
    document.getElementById('viewLogin').classList.remove('hidden');
    document.getElementById('viewDashboardPegawai').classList.add('hidden');
    document.getElementById('viewDashboardKetua').classList.add('hidden');
    this.switchAuthTab('login');
    this.state.currentUser = null;
    lucide.createIcons();
  },

  // Arahkan ke dashboard sesuai Peran (Role)
  async routeDashboard() {
    document.getElementById('viewLogin').classList.add('hidden');
    const u = this.state.currentUser;

    if (u.role === 'ketua_jabatan') {
      // Tampilan Ketua Jabatan (Ada 2 Menu: Approval & Buat Surat Izin)
      document.getElementById('viewDashboardPegawai').classList.add('hidden');
      document.getElementById('viewDashboardKetua').classList.remove('hidden');
      document.getElementById('ketuaNamaCard').textContent = u.nama;
      document.getElementById('ketuaJabatanCard').textContent = u.jabatan || 'Ketua Pengadilan Agama';
      const headerNama = document.getElementById('ketuaHeaderNama');
      if (headerNama) headerNama.textContent = u.nama;
      await this.loadAtasanList();
      await this.loadKetuaIzinList();
      await this.loadKetuaMyIzinList();
      this.switchKetuaSection('approval');
    } else {
      // Tampilan Pegawai Biasa
      document.getElementById('viewDashboardKetua').classList.add('hidden');
      document.getElementById('viewDashboardPegawai').classList.remove('hidden');
      document.getElementById('pegawaiHeaderNama').textContent = u.nama;
      document.getElementById('pegawaiNamaCard').textContent = u.nama;
      document.getElementById('pegawaiJabatanCard').textContent = u.jabatan || 'Pegawai';
      await this.loadAtasanList();
      await this.loadPegawaiIzinList();
    }
    lucide.createIcons();
  },

  // Ganti Tab Masuk / Daftar Akun Pegawai
  switchAuthTab(tab) {
    const tabBtnLogin = document.getElementById('tabBtnLogin');
    const tabBtnRegister = document.getElementById('tabBtnRegister');
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    const demoBox = document.getElementById('demoAccountsBox');

    if (tab === 'register') {
      if (tabBtnRegister) {
        tabBtnRegister.className = 'flex-1 py-2 rounded-xl text-center transition bg-white text-court-800 shadow-xs font-bold';
      }
      if (tabBtnLogin) {
        tabBtnLogin.className = 'flex-1 py-2 rounded-xl text-center transition text-slate-600 hover:text-slate-900 font-semibold';
      }
      if (formLogin) formLogin.classList.add('hidden');
      if (formRegister) formRegister.classList.remove('hidden');
      if (demoBox) demoBox.classList.add('hidden');
    } else {
      if (tabBtnLogin) {
        tabBtnLogin.className = 'flex-1 py-2 rounded-xl text-center transition bg-white text-court-800 shadow-xs font-bold';
      }
      if (tabBtnRegister) {
        tabBtnRegister.className = 'flex-1 py-2 rounded-xl text-center transition text-slate-600 hover:text-slate-900 font-semibold';
      }
      if (formLogin) formLogin.classList.remove('hidden');
      if (formRegister) formRegister.classList.add('hidden');
      if (demoBox) demoBox.classList.remove('hidden');
    }
    lucide.createIcons();
  },

  // Isi Cepat Akun Contoh di Halaman Login
  autoFill(role) {
    if (role === 'pegawai') {
      const namaEl = document.getElementById('loginNama');
      const nipEl = document.getElementById('loginNip');
      if (namaEl) namaEl.value = 'Ahmad Fauzi';
      if (nipEl) nipEl.value = '199208152019031002';
    } else if (role === 'ketua') {
      const namaEl = document.getElementById('loginNama');
      const nipEl = document.getElementById('loginNip');
      if (namaEl) namaEl.value = 'Dr. H. Ahmad Zarkasi, S.H.I., M.H.';
      if (nipEl) nipEl.value = '197405102001121001';
    }
  },

  // Proses Login (Menggunakan Nama & NIP)
  async handleLogin(e) {
    e.preventDefault();
    const nama = document.getElementById('loginNama').value.trim();
    const nip = document.getElementById('loginNip').value.trim();
    const btn = document.getElementById('btnSubmitLogin');

    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Memeriksa...`;
    lucide.createIcons();

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, nip })
      });
      const json = await res.json();

      if (json.success) {
        this.state.currentUser = json.user;
        localStorage.setItem('e_izin_user', JSON.stringify(json.user));
        this.routeDashboard();
        this.showToast(`Berhasil masuk sebagai ${json.user.nama}`, 'success');
      } else {
        this.showToast(json.message || 'Login gagal.', 'error');
      }
    } catch (err) {
      this.showToast('Gagal terhubung ke server.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i> Masuk ke Aplikasi`;
      lucide.createIcons();
    }
  },

  // Proses Pendaftaran Akun Pegawai Baru (Nama, Jabatan & NIP)
  async handleRegister(e) {
    e.preventDefault();
    const nama = document.getElementById('regNama').value.trim();
    const jabatan = (document.getElementById('regJabatan')?.value || 'Pegawai').trim();
    const nip = document.getElementById('regNip').value.trim();
    const btn = document.getElementById('btnSubmitRegister');

    if (!nama || !nip) {
      this.showToast('Nama dan NIP wajib diisi.', 'error');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Mendaftarkan...`;
    lucide.createIcons();

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, jabatan, nip })
      });
      const json = await res.json();

      if (json.success) {
        this.showToast('Pendaftaran akun berhasil! Selamat datang.', 'success');
        this.state.currentUser = json.user;
        localStorage.setItem('e_izin_user', JSON.stringify(json.user));
        this.routeDashboard();
      } else {
        this.showToast(json.message || 'Pendaftaran gagal.', 'error');
      }
    } catch (err) {
      this.showToast('Gagal terhubung ke server.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="user-plus" class="w-4 h-4"></i> Daftar & Masuk Pegawai`;
      lucide.createIcons();
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('e_izin_user');
    this.showLogin();
    this.showToast('Anda telah keluar dari aplikasi.', 'info');
  },

  // Load Pejabat Penyetuju (Ketua Jabatan)
  async loadAtasanList() {
    try {
      const res = await fetch('/api/atasan');
      const json = await res.json();
      if (json.success) {
        this.state.atasanList = json.data;
        const select = document.getElementById('atasanId');
        if (select) {
          select.innerHTML = json.data.map(a => `<option value="${a.id}" selected>${a.nama} — ${a.jabatan}</option>`).join('');
        }
      }
    } catch (e) {
      console.error(e);
    }
  },

  // ==========================================
  // MODUL PEGAWAI (ROLE: PEGAWAI)
  // ==========================================

  async loadPegawaiIzinList() {
    if (!this.state.currentUser) return;

    try {
      const { id } = this.state.currentUser;
      const res = await fetch(`/api/izin?pegawaiId=${id}&status=${this.state.pegawaiFilter}`);
      const json = await res.json();
      if (json.success) {
        this.state.pegawaiIzinList = json.data;
        document.getElementById('pegawaiIzinCount').textContent = `${json.data.length} izin`;
        this.renderPegawaiPresenceStatus();
        this.renderPegawaiActiveCard();
        this.renderPegawaiIzinList();
        lucide.createIcons();
      }
    } catch (e) {
      console.error(e);
    }
  },

  renderPegawaiPresenceStatus() {
    const activeIzin = this.state.pegawaiIzinList.find(i => i.status === 'approved' && !i.jamKembaliAktual);
    const badge = document.getElementById('pegawaiPresenceBadge');

    if (activeIzin) {
      badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1';
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Sedang Izin (${activeIzin.jamKeluar} s.d. ${activeIzin.jamMasuk || '-'} WIB)`;
    } else {
      badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1';
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Di Kantor`;
    }
  },

  // Kartu Izin Aktif Pegawai (Tanpa QR Code)
  renderPegawaiActiveCard() {
    const container = document.getElementById('pegawaiActiveCard');
    const active = this.state.pegawaiIzinList.find(i => i.status === 'approved' && !i.jamKembaliAktual);

    if (!active) {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="bg-gradient-to-r from-court-900 to-court-800 text-white rounded-2xl p-4 shadow-md space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-extrabold uppercase bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded">
            IZIN AKTIF SAAT INI
          </span>
          <span class="text-xs text-emerald-200 mono-font font-bold">
            ${active.jamKeluar} s.d. ${active.jamMasuk || '-'} WIB
          </span>
        </div>

        <div>
          <h4 class="text-xs font-bold text-white leading-snug">${active.keterangan}</h4>
          <p class="text-[10px] text-emerald-200/90 mt-1">Tanggal: <strong>${active.tanggalIzin}</strong> • Penyetuju: <strong>${active.atasanNama}</strong></p>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <button onclick="App.openTiketModal('${active.id}')"
            class="py-2 px-3 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white transition flex items-center justify-center gap-1">
            <i data-lucide="file-text" class="w-3.5 h-3.5"></i> Lihat Surat
          </button>
          <button onclick="App.openKembaliModal('${active.id}')"
            class="py-2 px-3 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-emerald-950 transition flex items-center justify-center gap-1">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Tiba di Kantor
          </button>
        </div>
      </div>
    `;
  },

  // Riwayat Izin Pegawai: Pegawai TIDAK BISA acc/tolak, HANYA BISA hapus izin jika masih pending!
  renderPegawaiIzinList() {
    const container = document.getElementById('pegawaiIzinList');
    const empty = document.getElementById('pegawaiEmptyState');
    const items = this.state.pegawaiIzinList;

    if (items.length === 0) {
      container.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    container.innerHTML = items.map(item => {
      let statusBadge = '';
      if (item.status === 'pending') {
        statusBadge = `<span class="badge-pending px-2 py-0.5 rounded-full text-[10px] font-bold">Menunggu</span>`;
      } else if (item.status === 'approved') {
        statusBadge = `<span class="badge-approved px-2 py-0.5 rounded-full text-[10px] font-bold">Disetujui</span>`;
      } else if (item.status === 'completed') {
        statusBadge = `<span class="badge-completed px-2 py-0.5 rounded-full text-[10px] font-bold">Selesai</span>`;
      } else if (item.status === 'rejected') {
        statusBadge = `<span class="badge-rejected px-2 py-0.5 rounded-full text-[10px] font-bold">Ditolak</span>`;
      }

      return `
        <div class="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-2">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-500 font-semibold">${item.tanggalIzin} • ${item.jamKeluar} s.d. ${item.jamMasuk || '-'} WIB</span>
            ${statusBadge}
          </div>

          <div>
            <h4 class="text-xs font-bold text-slate-900 leading-snug">${item.keterangan}</h4>
            <div class="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-medium">
              <span>Keluar: <strong class="text-slate-800">${item.jamKeluar} WIB</strong></span>
              <span>Masuk: <strong class="text-slate-800">${item.jamMasuk || '-'} WIB</strong></span>
            </div>
            <p class="text-[10px] text-slate-400 mt-1">Ketua Jabatan Penyetuju: <span class="font-medium text-slate-700">${item.atasanNama}</span></p>
          </div>

          ${item.jamKembaliAktual ? `
            <div class="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
              Tiba kembali di kantor: <strong>${item.jamKembaliAktual} WIB</strong>
            </div>
          ` : ''}

          ${item.status === 'rejected' && item.catatanAtasan ? `
            <div class="text-[10px] text-red-800 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
              Alasan Penolakan: <strong>${item.catatanAtasan}</strong>
            </div>
          ` : ''}

          <!-- Baris Aksi Pegawai -->
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            
            <!-- Jika masih Menunggu (Pending): Pegawai HANYA bisa menghapus izin -->
            ${item.status === 'pending' ? `
              <span class="text-[10px] text-amber-700 italic">Menunggu verifikasi ketua jabatan...</span>
              <button onclick="App.hapusPermohonan('${item.id}')" 
                class="px-2.5 py-1 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition flex items-center gap-1">
                <i data-lucide="trash-2" class="w-3 h-3 text-red-600"></i> Hapus Permohonan
              </button>
            ` : ''}

            <!-- Jika sudah disetujui / selesai: Lihat Surat Resmi -->
            ${item.status === 'approved' ? `
              <button onclick="App.openTiketModal('${item.id}')" 
                class="px-2.5 py-1 rounded-lg text-xs font-bold bg-court-50 text-court-800 border border-court-200 flex items-center gap-1">
                <i data-lucide="file-text" class="w-3 h-3"></i> Lihat Surat
              </button>
              <button onclick="App.openKembaliModal('${item.id}')" 
                class="px-2.5 py-1 rounded-lg text-xs font-bold bg-court-700 text-white flex items-center gap-1 ml-auto">
                <i data-lucide="check" class="w-3 h-3"></i> Tiba di Kantor
              </button>
            ` : ''}

            ${item.status === 'completed' || item.status === 'rejected' ? `
              <button onclick="App.openTiketModal('${item.id}')" 
                class="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 ml-auto flex items-center gap-1">
                <i data-lucide="file-text" class="w-3 h-3"></i> Lihat Surat
              </button>
            ` : ''}

          </div>
        </div>
      `;
    }).join('');
  },

  // Menghapus Permohonan Izin yang Masih Menunggu
  async hapusPermohonan(izinId) {
    if (!confirm('Apakah Anda yakin ingin membatalkan dan menghapus permohonan izin ini?')) return;

    try {
      const res = await fetch(`/api/izin/${izinId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        this.showToast('Permohonan izin berhasil dihapus.', 'info');
        if (this.state.currentUser && this.state.currentUser.role === 'ketua_jabatan') {
          await this.loadKetuaMyIzinList();
          await this.loadKetuaIzinList();
        } else {
          await this.loadPegawaiIzinList();
        }
      } else {
        this.showToast(json.message || 'Gagal menghapus izin.', 'error');
      }
    } catch (e) {
      this.showToast('Gagal menghapus izin.', 'error');
    }
  },

  // ==========================================
  // MODUL KETUA JABATAN (ROLE: KETUA_JABATAN)
  // ==========================================

  // Ganti Menu Antara: 1. Approval Izin dan 2. Buat Surat Izin
  switchKetuaSection(section) {
    this.state.ketuaSection = section;
    const btnApproval = document.getElementById('btnKetuaMenuApproval');
    const btnBuatIzin = document.getElementById('btnKetuaMenuBuatIzin');
    const secApproval = document.getElementById('ketuaSectionApproval');
    const secBuatIzin = document.getElementById('ketuaSectionBuatIzin');

    if (section === 'buat_izin') {
      if (btnBuatIzin) {
        btnBuatIzin.className = 'py-2.5 px-2 rounded-xl text-center transition bg-court-700 text-white shadow-xs font-bold flex items-center justify-center gap-1.5';
      }
      if (btnApproval) {
        btnApproval.className = 'py-2.5 px-2 rounded-xl text-center transition text-slate-600 hover:text-slate-900 font-semibold flex items-center justify-center gap-1.5';
      }
      if (secApproval) secApproval.classList.add('hidden');
      if (secBuatIzin) secBuatIzin.classList.remove('hidden');
      this.loadKetuaMyIzinList();
    } else {
      if (btnApproval) {
        btnApproval.className = 'py-2.5 px-2 rounded-xl text-center transition bg-amber-700 text-white shadow-xs font-bold flex items-center justify-center gap-1.5';
      }
      if (btnBuatIzin) {
        btnBuatIzin.className = 'py-2.5 px-2 rounded-xl text-center transition text-slate-600 hover:text-slate-900 font-semibold flex items-center justify-center gap-1.5';
      }
      if (secApproval) secApproval.classList.remove('hidden');
      if (secBuatIzin) secBuatIzin.classList.add('hidden');
      this.loadKetuaIzinList();
    }
    lucide.createIcons();
  },

  // 1. MENU APPROVAL: Load Daftar Permohonan Pegawai yang Butuh Persetujuan
  async loadKetuaIzinList() {
    if (!this.state.currentUser) return;

    try {
      const res = await fetch(`/api/izin?status=${this.state.ketuaFilter}`);
      const json = await res.json();
      if (json.success) {
        // Hanya permohonan dari pegawai lain yang masuk ke antrean approval
        const staffList = json.data.filter(i => i.pegawaiId !== this.state.currentUser.id);
        this.state.ketuaIzinList = staffList;

        // Hitung total pending untuk badge counter
        const allRes = await fetch('/api/izin?status=pending');
        const allJson = await allRes.json();
        const pendingCount = (allJson.data || []).filter(i => i.pegawaiId !== this.state.currentUser.id).length;

        const badge = document.getElementById('badgeKetuaPendingCount');
        if (badge) {
          badge.textContent = pendingCount;
          if (pendingCount > 0) {
            badge.classList.remove('hidden');
          } else {
            badge.classList.add('hidden');
          }
        }

        const antreanCountEl = document.getElementById('ketuaAntreanCount');
        if (antreanCountEl) {
          antreanCountEl.textContent = `${pendingCount} butuh verifikasi`;
        }

        this.renderKetuaIzinList();
        lucide.createIcons();
      }
    } catch (e) {
      console.error(e);
    }
  },

  // 2. MENU BUAT SURAT IZIN: Load Riwayat Izin Keluar Milik Ketua Sendiri
  async loadKetuaMyIzinList() {
    if (!this.state.currentUser) return;

    try {
      const { id } = this.state.currentUser;
      const res = await fetch(`/api/izin?pegawaiId=${id}&status=${this.state.ketuaMyFilter}`);
      const json = await res.json();
      if (json.success) {
        this.state.ketuaMyIzinList = json.data;
        const countEl = document.getElementById('ketuaRiwayatCount');
        if (countEl) countEl.textContent = `${json.data.length} surat`;

        this.renderKetuaPresenceStatus();
        this.renderKetuaActiveCard();
        this.renderKetuaMyIzinList();
        lucide.createIcons();
      }
    } catch (e) {
      console.error(e);
    }
  },

  renderKetuaPresenceStatus() {
    const activeIzin = (this.state.ketuaMyIzinList || []).find(i => i.status === 'approved' && !i.jamKembaliAktual);
    const badge = document.getElementById('ketuaPresenceBadge');
    if (!badge) return;

    if (activeIzin) {
      badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 shrink-0';
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Sedang Izin (${activeIzin.jamKeluar} s.d. ${activeIzin.jamMasuk || '-'} WIB)`;
    } else {
      badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 shrink-0';
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Di Kantor`;
    }
  },

  renderKetuaActiveCard() {
    const container = document.getElementById('ketuaActiveCard');
    if (!container) return;
    const activeIzin = (this.state.ketuaMyIzinList || []).find(i => i.status === 'approved' && !i.jamKembaliAktual);

    if (!activeIzin) {
      container.innerHTML = '';
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="active-card text-white p-4 rounded-2xl shadow-lg space-y-3 relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-400 text-emerald-950 uppercase tracking-wider">
            <span class="w-2 h-2 rounded-full bg-emerald-950 animate-ping"></span>
            IZIN KELUAR AKTIF
          </span>
          <span class="text-xs font-bold text-emerald-100">
            ${activeIzin.jamKeluar} s.d. ${activeIzin.jamMasuk || '-'} WIB
          </span>
        </div>

        <div>
          <h4 class="text-xs font-bold text-white leading-snug">${activeIzin.keterangan}</h4>
          <p class="text-[10px] text-emerald-200 mt-1">Tanggal: <strong>${activeIzin.tanggalIzin}</strong></p>
        </div>
          </p>
        </div>

        <div class="pt-2 border-t border-emerald-600/60 flex items-center gap-2">
          <button onclick="App.openTiketModal('${activeIzin.id}')"
            class="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white transition flex items-center justify-center gap-1.5">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i> Lihat Surat
          </button>
          <button onclick="App.openKembaliModal('${activeIzin.id}')"
            class="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-white text-court-900 hover:bg-emerald-50 transition shadow-sm flex items-center justify-center gap-1.5">
            <i data-lucide="check-circle" class="w-3.5 h-3.5 text-court-700"></i> Check-In Kantor
          </button>
        </div>
      </div>
    `;
  },

  renderKetuaMyIzinList() {
    const container = document.getElementById('ketuaMyIzinList');
    const empty = document.getElementById('ketuaMyEmptyState');
    if (!container) return;
    const items = this.state.ketuaMyIzinList || [];

    if (items.length === 0) {
      container.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (empty) empty.classList.add('hidden');
    container.innerHTML = items.map(item => {
      let statusBadge = '';
      if (item.status === 'pending') {
        statusBadge = `<span class="badge-pending px-2 py-0.5 rounded-full text-[10px] font-bold">Menunggu</span>`;
      } else if (item.status === 'approved') {
        statusBadge = `<span class="badge-approved px-2 py-0.5 rounded-full text-[10px] font-bold">Disetujui</span>`;
      } else if (item.status === 'completed') {
        statusBadge = `<span class="badge-completed px-2 py-0.5 rounded-full text-[10px] font-bold">Selesai</span>`;
      } else if (item.status === 'rejected') {
        statusBadge = `<span class="badge-rejected px-2 py-0.5 rounded-full text-[10px] font-bold">Ditolak</span>`;
      }

      return `
        <div class="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-500">${item.tanggalIzin} • ${item.jamKeluar} s.d. ${item.jamMasuk || '-'} WIB</span>
            ${statusBadge}
          </div>

          <div>
            <h4 class="text-xs font-bold text-slate-900 leading-snug">${item.keterangan}</h4>
            <div class="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-medium">
              <span>Keluar: <strong class="text-slate-800">${item.jamKeluar} WIB</strong></span>
              <span>Masuk: <strong class="text-slate-800">${item.jamMasuk || '-'} WIB</strong></span>
              ${item.jamKembaliAktual ? `<span>Aktual: <strong class="text-court-700">${item.jamKembaliAktual} WIB</strong></span>` : ''}
            </div>
          </div>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            ${item.status === 'pending' ? `
              <span class="text-[10px] text-amber-700 italic">Menunggu...</span>
              <button onclick="App.hapusPermohonan('${item.id}')" 
                class="px-2.5 py-1 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition flex items-center gap-1">
                <i data-lucide="trash-2" class="w-3 h-3 text-red-600"></i> Hapus
              </button>
            ` : ''}

            ${item.status === 'approved' ? `
              <button onclick="App.openTiketModal('${item.id}')" 
                class="px-2.5 py-1 rounded-lg text-xs font-bold bg-court-50 text-court-800 border border-court-200 flex items-center gap-1">
                <i data-lucide="file-text" class="w-3 h-3"></i> Cetak / Lihat Surat
              </button>
              <button onclick="App.openKembaliModal('${item.id}')" 
                class="px-2.5 py-1 rounded-lg text-xs font-bold bg-court-700 text-white flex items-center gap-1 ml-auto">
                <i data-lucide="check" class="w-3.5 h-3.5"></i> Tiba di Kantor
              </button>
            ` : ''}

            ${item.status === 'completed' || item.status === 'rejected' ? `
              <button onclick="App.openTiketModal('${item.id}')" 
                class="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 ml-auto flex items-center gap-1">
                <i data-lucide="file-text" class="w-3 h-3"></i> Lihat Surat
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  // Render Daftar Permohonan Masuk untuk Ketua Jabatan
  renderKetuaIzinList() {
    const container = document.getElementById('ketuaIzinList');
    const empty = document.getElementById('ketuaEmptyState');
    const items = this.state.ketuaIzinList;

    if (items.length === 0) {
      container.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    container.innerHTML = items.map(item => {
      let statusBadge = '';
      if (item.status === 'pending') {
        statusBadge = `<span class="badge-pending px-2 py-0.5 rounded-full text-[10px] font-bold">Menunggu Persetujuan Anda</span>`;
      } else if (item.status === 'approved') {
        statusBadge = `<span class="badge-approved px-2 py-0.5 rounded-full text-[10px] font-bold">Disetujui</span>`;
      } else if (item.status === 'completed') {
        statusBadge = `<span class="badge-completed px-2 py-0.5 rounded-full text-[10px] font-bold">Selesai</span>`;
      } else if (item.status === 'rejected') {
        statusBadge = `<span class="badge-rejected px-2 py-0.5 rounded-full text-[10px] font-bold">Ditolak</span>`;
      }

      return `
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
          
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-500 font-medium">${item.tanggalIzin} • ${item.jamKeluar} s.d. ${item.jamMasuk || '-'} WIB</span>
            ${statusBadge}
          </div>

          <!-- Info Pemohon -->
          <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p class="text-xs font-extrabold text-slate-900">${item.pegawaiNama}</p>
              <p class="text-[10px] text-slate-500">${item.pegawaiJabatan}</p>
            </div>
            <span class="text-[9px] font-bold text-court-800 bg-court-100 px-2 py-0.5 rounded">ASN Pemohon</span>
          </div>

          <!-- Keterangan -->
          <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Keterangan Keperluan:</p>
            <p class="text-xs font-semibold text-slate-800 mt-0.5 leading-relaxed bg-amber-50/40 p-2 rounded-lg border border-amber-100">
              ${item.keterangan}
            </p>
          </div>

          <!-- Preview TTD Digital Pemohon -->
          <div class="flex items-center justify-between text-[11px] pt-1">
            <span class="text-slate-500">Tanda Tangan Pemohon:</span>
            <div class="h-10 w-24 bg-white border border-slate-200 rounded p-1 flex items-center justify-center">
              ${item.ttdDigital 
                ? `<img src="${item.ttdDigital}" alt="TTD" class="max-h-full max-w-full object-contain">` 
                : `<span class="text-[9px] text-slate-400">Ada di sistem</span>`}
            </div>
          </div>

          <!-- Tombol Aksi Ketua Jabatan -->
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            
            ${item.status === 'pending' ? `
              <!-- HANYA KETUA JABATAN YANG BISA ACC / TOLAK! -->
              <div class="flex items-center gap-2 w-full">
                <button onclick="App.prosesApprovalKetua('${item.id}', 'approved')"
                  class="flex-1 py-2 rounded-xl text-xs font-bold bg-court-700 hover:bg-court-800 text-white shadow-sm flex items-center justify-center gap-1">
                  <i data-lucide="check" class="w-3.5 h-3.5"></i> Setujui Izin
                </button>
                <button onclick="App.prosesApprovalKetua('${item.id}', 'rejected')"
                  class="flex-1 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center justify-center gap-1">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i> Tolak
                </button>
              </div>
            ` : `
              <button onclick="App.openTiketModal('${item.id}')"
                class="w-full py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1">
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i> Lihat Lembar Surat
              </button>
            `}

          </div>
        </div>
      `;
    }).join('');
  },

  // Ketua Jabatan Menyetujui atau Menolak Izin
  async prosesApprovalKetua(izinId, status) {
    if (status === 'rejected') {
      const catatanAtasan = prompt('Masukkan alasan penolakan izin (opsional):') || 'Permohonan izin belum dapat disetujui.';
      try {
        const res = await fetch(`/api/izin/${izinId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected', catatanAtasan })
        });
        const json = await res.json();

        if (json.success) {
          this.showToast('Permohonan izin telah ditolak.', 'error');
          await this.loadKetuaIzinList();
        } else {
          this.showToast(json.message || 'Gagal memproses permohonan.', 'error');
        }
      } catch (e) {
        this.showToast('Gagal memproses approval.', 'error');
      }
      return;
    }

    // Jika Status === 'approved': Buka modal untuk Tanda Tangan Digital Ketua Jabatan
    this.openApprovalModal(izinId);
  },

  openApprovalModal(izinId) {
    const izin = (this.state.ketuaIzinList && this.state.ketuaIzinList.find(i => i.id === izinId));
    if (!izin) {
      this.showToast('Data permohonan izin tidak ditemukan.', 'error');
      return;
    }

    this.state.currentApprovalIzinId = izinId;
    this.state.hasKetuaSigned = false;

    const pemohonEl = document.getElementById('approvalModalPemohon');
    if (pemohonEl) pemohonEl.textContent = `${izin.pegawaiNama} (${izin.pegawaiJabatan || 'Pegawai'})`;
    
    const waktuEl = document.getElementById('approvalModalWaktu');
    if (waktuEl) waktuEl.textContent = `${formatDateIndo(izin.tanggalIzin, true)} • ${izin.jamKeluar} s.d. ${izin.jamMasuk || '-'} WIB`;

    const keperluanEl = document.getElementById('approvalModalKeperluan');
    if (keperluanEl) keperluanEl.textContent = `Keperluan: "${izin.keterangan}"`;

    const catatanEl = document.getElementById('approvalCatatanAtasan');
    if (catatanEl) catatanEl.value = 'Disetujui oleh Ketua Pengadilan Agama Gunung Sugih.';

    const modal = document.getElementById('modalApprovalKetua');
    if (modal) modal.classList.remove('modal-hidden');

    this.clearKetuaSignature();
    setTimeout(() => {
      this.initKetuaSignaturePad();
    }, 150);

    lucide.createIcons();
  },

  closeApprovalModal() {
    const modal = document.getElementById('modalApprovalKetua');
    if (modal) modal.classList.add('modal-hidden');
    this.clearKetuaSignature();
    this.state.currentApprovalIzinId = null;
  },

  async submitApprovalWithSignature() {
    if (!this.state.currentApprovalIzinId) return;

    if (!this.state.hasKetuaSigned) {
      this.showToast('Harap bubuhkan tanda tangan digital Ketua Jabatan di kotak!', 'error');
      return;
    }

    const ttdAtasan = this.canvasKetua ? this.canvasKetua.toDataURL('image/png') : null;
    const catatanInput = document.getElementById('approvalCatatanAtasan');
    const catatanAtasan = (catatanInput ? catatanInput.value.trim() : '') || 'Disetujui oleh Ketua Pengadilan Agama Gunung Sugih.';
    const btn = document.getElementById('btnSubmitApprovalKetua');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Menyimpan...`;
      lucide.createIcons();
    }

    try {
      const res = await fetch(`/api/izin/${this.state.currentApprovalIzinId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          catatanAtasan,
          ttdAtasan
        })
      });
      const json = await res.json();

      if (json.success) {
        this.closeApprovalModal();
        this.showToast('Permohonan izin berhasil disahkan & ditandatangani!', 'success');
        await this.loadKetuaIzinList();
      } else {
        this.showToast(json.message || 'Gagal memproses persetujuan.', 'error');
      }
    } catch (e) {
      this.showToast('Gagal memproses persetujuan izin.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="check-check" class="w-3.5 h-3.5"></i> Setujui & Sahkan`;
        lucide.createIcons();
      }
    }
  },

  // ==========================================
  // SIGNATURE PAD & MODAL FORM PENGAJUAN
  // ==========================================

  initSignaturePad() {
    this.canvas = document.getElementById('sigCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');

    const resizeCanvas = () => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.ctx.strokeStyle = '#064e3b';
      this.ctx.lineWidth = 2.5;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    };

    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 200);

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      this.isDrawing = true;
      this.state.hasSigned = true;
      this.canvas.setPointerCapture(e.pointerId);
      const pos = getPos(e);
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.isDrawing) return;
      const pos = getPos(e);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
    });

    const stopDrawing = (e) => {
      if (this.isDrawing) {
        this.isDrawing = false;
        try { this.canvas.releasePointerCapture(e.pointerId); } catch(err) {}
      }
    };

    this.canvas.addEventListener('pointerup', stopDrawing);
    this.canvas.addEventListener('pointercancel', stopDrawing);
  },

  clearSignature() {
    if (!this.canvas || !this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.state.hasSigned = false;
  },

  initKetuaSignaturePad() {
    this.canvasKetua = document.getElementById('sigCanvasKetua');
    if (!this.canvasKetua) return;

    this.ctxKetua = this.canvasKetua.getContext('2d');

    const resizeCanvasKetua = () => {
      if (!this.canvasKetua) return;
      const rect = this.canvasKetua.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvasKetua.width = rect.width * dpr;
      this.canvasKetua.height = rect.height * dpr;
      this.ctxKetua.scale(dpr, dpr);
      this.ctxKetua.strokeStyle = '#92400e'; // Warm deep amber
      this.ctxKetua.lineWidth = 2.5;
      this.ctxKetua.lineCap = 'round';
      this.ctxKetua.lineJoin = 'round';
    };

    window.addEventListener('resize', resizeCanvasKetua);
    setTimeout(resizeCanvasKetua, 200);

    const getPos = (e) => {
      const rect = this.canvasKetua.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    this.canvasKetua.addEventListener('pointerdown', (e) => {
      this.isDrawingKetua = true;
      this.state.hasKetuaSigned = true;
      this.canvasKetua.setPointerCapture(e.pointerId);
      const pos = getPos(e);
      this.ctxKetua.beginPath();
      this.ctxKetua.moveTo(pos.x, pos.y);
    });

    this.canvasKetua.addEventListener('pointermove', (e) => {
      if (!this.isDrawingKetua) return;
      const pos = getPos(e);
      this.ctxKetua.lineTo(pos.x, pos.y);
      this.ctxKetua.stroke();
    });

    const stopDrawingKetua = (e) => {
      if (this.isDrawingKetua) {
        this.isDrawingKetua = false;
        try { this.canvasKetua.releasePointerCapture(e.pointerId); } catch(err) {}
      }
    };

    this.canvasKetua.addEventListener('pointerup', stopDrawingKetua);
    this.canvasKetua.addEventListener('pointercancel', stopDrawingKetua);
  },

  clearKetuaSignature() {
    if (!this.canvasKetua || !this.ctxKetua) return;
    this.ctxKetua.clearRect(0, 0, this.canvasKetua.width, this.canvasKetua.height);
    this.state.hasKetuaSigned = false;
  },

  openPengajuanModal() {
    const u = this.state.currentUser;
    document.getElementById('formNama').value = u ? u.nama : '';
    const nipEl = document.getElementById('formNip');
    if (nipEl) nipEl.value = u ? (u.nip || '') : '';
    document.getElementById('formJabatan').value = u ? (u.jabatan || 'Pegawai') : '';
    document.getElementById('formKeterangan').value = '';

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const curH = String(now.getHours()).padStart(2, '0');
    const curM = String(now.getMinutes()).padStart(2, '0');
    const endH = String(Math.min(now.getHours() + 2, 23)).padStart(2, '0');

    const tglEl = document.getElementById('tanggalIzin');
    if (tglEl) tglEl.value = todayStr;

    document.getElementById('jamKeluar').value = `${curH}:${curM}`;
    const masukEl = document.getElementById('jamMasuk');
    if (masukEl) masukEl.value = `${endH}:${curM}`;

    document.getElementById('modalPengajuan').classList.remove('modal-hidden');
    this.clearSignature();

    setTimeout(() => {
      this.initSignaturePad();
    }, 150);

    lucide.createIcons();
  },

  closePengajuanModal() {
    document.getElementById('modalPengajuan').classList.add('modal-hidden');
    this.clearSignature();
  },

  // Kirim Permohonan Izin Baru (Pilih Ketua Jabatan, Nama, NIP, Jabatan, Tanggal, Jam Keluar, Jam Masuk, Keterangan, TTD Digital)
  async handleFormSubmit(e) {
    e.preventDefault();

    if (!this.state.hasSigned) {
      this.showToast('Harap bubuhkan tanda tangan digital Anda di kotak!', 'error');
      return;
    }

    const ttdDigital = this.canvas.toDataURL('image/png');
    const btn = document.getElementById('btnSubmitPengajuan');
    btn.disabled = true;
    btn.innerHTML = `Mengirim...`;

    try {
      const formData = new FormData(e.target);
      const isKetua = this.state.currentUser && this.state.currentUser.role === 'ketua_jabatan';
      const payload = {
        pegawaiId: this.state.currentUser.id,
        role: this.state.currentUser.role,
        atasanId: formData.get('atasanId'),
        nama: formData.get('nama'),
        nip: formData.get('nip') || (this.state.currentUser ? this.state.currentUser.nip : ''),
        jabatan: formData.get('jabatan'),
        tanggalIzin: formData.get('tanggalIzin'),
        jamKeluar: formData.get('jamKeluar'),
        jamMasuk: formData.get('jamMasuk'),
        keterangan: formData.get('keterangan'),
        ttdDigital
      };

      const res = await fetch('/api/izin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        this.closePengajuanModal();
        if (isKetua) {
          this.showToast('Surat izin keluar berhasil dibuat dan diterbitkan.', 'success');
          await this.loadKetuaMyIzinList();
          await this.loadKetuaIzinList();
          this.switchKetuaSection('buat_izin');
        } else {
          this.showToast('Permohonan izin berhasil diajukan ke Ketua Jabatan.', 'success');
          await this.loadPegawaiIzinList();
        }
      } else {
        this.showToast(json.message || 'Gagal mengajukan izin.', 'error');
      }
    } catch (err) {
      this.showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="send" class="w-3.5 h-3.5"></i> Kirim Permohonan`;
      lucide.createIcons();
    }
  },

  // Modal Lembar Surat Izin Resmi (Sesuai Format Template PA Gunung Sugih)
  async openTiketModal(izinId) {
    try {
      const res = await fetch(`/api/izin/${izinId}`);
      const json = await res.json();
      if (!json.success) return;

      const item = json.data;
      this.state.selectedIzin = item;
      this.state.selectedIzinId = item.id;

      // 1. Yang bertandatangan di bawah ini (Ketua Jabatan)
      const atasanInfoEl = document.getElementById('suratAtasanInfo');
      if (atasanInfoEl) {
        atasanInfoEl.textContent = `${item.atasanNama} (${item.atasanJabatan || 'Ketua Pengadilan Agama Gunung Sugih'})`;
      }

      // 2. Memberikan izin kepada (Pemohon)
      const pemohonInfoEl = document.getElementById('suratPemohonInfo');
      if (pemohonInfoEl) {
        pemohonInfoEl.textContent = `${item.pegawaiNama} (NIP. ${item.pegawaiNip || '-'}, Jabatan: ${item.pegawaiJabatan})`;
      }

      // 3. Waktu keluar kantor
      const waktuInfoEl = document.getElementById('suratWaktuInfo');
      if (waktuInfoEl) {
        waktuInfoEl.textContent = `${formatDateIndo(item.tanggalIzin, true)}, Pukul ${item.jamKeluar} s.d. ${item.jamMasuk || '-'} WIB`;
      }

      // 4. Keterangan keperluan
      const keperluanInfoEl = document.getElementById('suratKeperluanInfo');
      if (keperluanInfoEl) {
        keperluanInfoEl.textContent = item.keterangan;
      }

      // 5. TTD Pemohon (Kiri)
      const ttdPemohonImg = document.getElementById('suratTtdPemohon');
      if (ttdPemohonImg) {
        if (item.ttdDigital) {
          ttdPemohonImg.src = item.ttdDigital;
          ttdPemohonImg.style.display = 'block';
        } else {
          ttdPemohonImg.style.display = 'none';
        }
      }
      const namaBawahPemohonEl = document.getElementById('suratNamaBawahPemohon');
      if (namaBawahPemohonEl) namaBawahPemohonEl.textContent = `( ${item.pegawaiNama} )`;

      const nipPemohonEl = document.getElementById('suratNipPemohon');
      if (nipPemohonEl) nipPemohonEl.textContent = `NIP. ${item.pegawaiNip || '....................'}`;

      // 6. TTD Ketua Jabatan (Kanan)
      const tanggalTempatEl = document.getElementById('suratTanggalTempat');
      if (tanggalTempatEl) {
        tanggalTempatEl.textContent = `Gunung Sugih, ${formatDateIndo(item.tanggalIzin)}`;
      }

      const jabatanBawahAtasanEl = document.getElementById('suratJabatanBawahAtasan');
      if (jabatanBawahAtasanEl) {
        jabatanBawahAtasanEl.textContent = `${item.atasanJabatan || 'Ketua Pengadilan Agama Gunung Sugih'},`;
      }

      const ttdAtasanImg = document.getElementById('suratTtdAtasan');
      if (ttdAtasanImg) {
        const signatureSource = item.ttdAtasan || (item.status === 'approved' ? item.ttdDigital : null);
        if (signatureSource) {
          ttdAtasanImg.src = signatureSource;
          ttdAtasanImg.style.display = 'block';
        } else {
          ttdAtasanImg.style.display = 'none';
        }
      }

      const namaBawahAtasanEl = document.getElementById('suratNamaBawahAtasan');
      if (namaBawahAtasanEl) namaBawahAtasanEl.textContent = `( ${item.atasanNama} )`;

      const nipAtasanEl = document.getElementById('suratNipAtasan');
      if (nipAtasanEl) nipAtasanEl.textContent = `NIP. ${item.atasanNip || '197405102001121001'}`;

      document.getElementById('modalTiket').classList.remove('modal-hidden');
      lucide.createIcons();
    } catch (e) {
      this.showToast('Gagal memuat lembar izin.', 'error');
    }
  },

  // Unduh Surat Format PDF Resmi
  downloadPDF() {
    const element = document.getElementById('printArea');
    if (!element) return;

    if (typeof html2pdf === 'undefined') {
      window.print();
      return;
    }

    const filename = `Surat_Izin_${this.state.selectedIzinId || 'PA_Gunung_Sugih'}.pdf`;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    this.showToast('Sedang membuat file PDF...', 'info');
    html2pdf().set(opt).from(element).save().then(() => {
      this.showToast('Surat izin format PDF berhasil diunduh.', 'success');
    }).catch(err => {
      console.error('HTML2PDF error:', err);
      window.print();
    });
  },

  closeTiketModal() {
    document.getElementById('modalTiket').classList.add('modal-hidden');
  },

  // Check-In Kembali
  openKembaliModal(izinId) {
    const item = (this.state.pegawaiIzinList && this.state.pegawaiIzinList.find(i => i.id === izinId)) ||
                 (this.state.ketuaMyIzinList && this.state.ketuaMyIzinList.find(i => i.id === izinId)) ||
                 (this.state.ketuaIzinList && this.state.ketuaIzinList.find(i => i.id === izinId));
    if (!item) return;

    this.state.selectedIzin = item;
    const now = new Date();
    const curH = String(now.getHours()).padStart(2, '0');
    const curM = String(now.getMinutes()).padStart(2, '0');

    document.getElementById('kembaliJam').value = `${curH}:${curM}`;
    document.getElementById('modalKembali').classList.remove('modal-hidden');
  },

  closeKembaliModal() {
    document.getElementById('modalKembali').classList.add('modal-hidden');
  },

  async submitKembali() {
    if (!this.state.selectedIzin) return;
    const jamKembali = document.getElementById('kembaliJam').value;

    try {
      const res = await fetch(`/api/izin/${this.state.selectedIzin.id}/kembali`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jamKembali })
      });
      const json = await res.json();
      if (json.success) {
        this.closeKembaliModal();
        this.showToast('Konfirmasi kembali berhasil disimpan.', 'success');
        if (this.state.currentUser && this.state.currentUser.role === 'ketua_jabatan') {
          await this.loadKetuaMyIzinList();
        } else {
          await this.loadPegawaiIzinList();
        }
      }
    } catch (e) {
      this.showToast('Gagal menyimpan konfirmasi.', 'error');
    }
  },

  // Event Listeners Filter
  bindEvents() {
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => this.handleLogin(e));
    }

    const formRegister = document.getElementById('formRegister');
    if (formRegister) {
      formRegister.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // Filter Pegawai
    document.querySelectorAll('.pegawai-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.pegawai-filter-btn').forEach(b => {
          b.className = 'pegawai-filter-btn px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200';
        });
        e.currentTarget.className = 'pegawai-filter-btn px-3 py-1 rounded-full text-[11px] font-bold bg-court-800 text-white';

        this.state.pegawaiFilter = e.currentTarget.dataset.filter;
        this.loadPegawaiIzinList();
      });
    });

    // Filter Approval Ketua
    document.querySelectorAll('.ketua-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.ketua-filter-btn').forEach(b => {
          b.className = 'ketua-filter-btn px-3 py-1 rounded-full text-[11px] font-semibold bg-white text-slate-600 border border-slate-200';
        });
        e.currentTarget.className = 'ketua-filter-btn px-3 py-1 rounded-full text-[11px] font-bold bg-amber-700 text-white';

        this.state.ketuaFilter = e.currentTarget.dataset.ketuaFilter;
        this.loadKetuaIzinList();
      });
    });

    // Filter Riwayat Izin Milik Ketua Sendiri
    document.querySelectorAll('.ketua-myfilter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.ketua-myfilter-btn').forEach(b => {
          b.className = 'ketua-myfilter-btn px-3 py-1 rounded-full text-[11px] font-semibold bg-white text-slate-600 border border-slate-200';
        });
        e.currentTarget.className = 'ketua-myfilter-btn px-3 py-1 rounded-full text-[11px] font-bold bg-court-800 text-white';

        this.state.ketuaMyFilter = e.currentTarget.dataset.ketuaMyfilter;
        this.loadKetuaMyIzinList();
      });
    });

    const formPengajuan = document.getElementById('formPengajuanIzin');
    if (formPengajuan) {
      formPengajuan.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }
  },

  printTiket() {
    window.print();
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-800 text-white',
      error: 'bg-red-800 text-white',
      info: 'bg-slate-900 text-white'
    };

    toast.className = `p-3 rounded-xl text-xs font-semibold shadow-lg transition-all transform duration-200 -translate-y-2 opacity-0 ${bgColors[type] || bgColors.info}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('-translate-y-2', 'opacity-0');
    }, 20);

    setTimeout(() => {
      toast.classList.add('-translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 2500);
    }, 3000);
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());

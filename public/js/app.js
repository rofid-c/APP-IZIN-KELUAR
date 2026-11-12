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
    pegawaiFilter: 'all',
    ketuaFilter: 'pending',
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
    document.getElementById('viewDashboardAdmin').classList.add('hidden');
    this.switchAuthTab('login');
    this.state.currentUser = null;
    lucide.createIcons();
  },

  // Arahkan ke dashboard sesuai Peran (Role)
  async routeDashboard() {
    document.getElementById('viewLogin').classList.add('hidden');
    const u = this.state.currentUser;

    if (u.role === 'admin') {
      // ===== ADMIN MODE =====
      document.getElementById('viewDashboardPegawai').classList.add('hidden');
      document.getElementById('viewDashboardKetua').classList.add('hidden');
      document.getElementById('viewDashboardAdmin').classList.remove('hidden');
      await this.loadAdminDashboard();
    } else if (u.role === 'ketua_jabatan') {
      // Tampilan Ketua Jabatan (Khusus Modul Approval)
      document.getElementById('viewDashboardPegawai').classList.add('hidden');
      document.getElementById('viewDashboardKetua').classList.remove('hidden');
      document.getElementById('ketuaNamaCard').textContent = u.nama;
      document.getElementById('ketuaJabatanCard').textContent = u.jabatan || 'Ketua Pengadilan Agama Gunung Sugih';
      const headerNama = document.getElementById('ketuaHeaderNama');
      if (headerNama) headerNama.textContent = u.nama;
      await this.loadAtasanList();
      await this.loadKetuaIzinList();
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

    if (tab === 'register') {
      if (tabBtnRegister) {
        tabBtnRegister.className = 'flex-1 py-2 rounded-xl text-center transition bg-white text-court-800 shadow-xs font-bold';
      }
      if (tabBtnLogin) {
        tabBtnLogin.className = 'flex-1 py-2 rounded-xl text-center transition text-slate-600 hover:text-slate-900 font-semibold';
      }
      if (formLogin) formLogin.classList.add('hidden');
      if (formRegister) formRegister.classList.remove('hidden');
    } else {
      if (tabBtnLogin) {
        tabBtnLogin.className = 'flex-1 py-2 rounded-xl text-center transition bg-white text-court-800 shadow-xs font-bold';
      }
      if (tabBtnRegister) {
        tabBtnRegister.className = 'flex-1 py-2 rounded-xl text-center transition text-slate-600 hover:text-slate-900 font-semibold';
      }
      if (formLogin) formLogin.classList.remove('hidden');
      if (formRegister) formRegister.classList.add('hidden');
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
    } else if (role === 'admin') {
      const namaEl = document.getElementById('loginNama');
      const nipEl = document.getElementById('loginNip');
      if (namaEl) namaEl.value = 'root';
      if (nipEl) nipEl.value = 'admin123';
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
        await this.loadPegawaiIzinList();
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

  // Load Daftar Permohonan Pegawai yang Butuh Persetujuan (Approval)
  async loadKetuaIzinList() {
    if (!this.state.currentUser) return;

    try {
      const res = await fetch(`/api/izin?status=${this.state.ketuaFilter}`);
      const json = await res.json();
      if (json.success) {
        // Hanya permohonan dari pegawai lain yang masuk ke antrean approval
        const staffList = json.data.filter(i => i.pegawaiId !== this.state.currentUser.id);
        this.state.ketuaIzinList = staffList;

        // Hitung total pending untuk antrean
        const allRes = await fetch('/api/izin?status=pending');
        const allJson = await allRes.json();
        const pendingCount = (allJson.data || []).filter(i => i.pegawaiId !== this.state.currentUser.id).length;

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
        this.showToast('Permohonan izin berhasil diajukan ke Ketua Jabatan.', 'success');
        await this.loadPegawaiIzinList();
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
      margin: [10, 14, 10, 14],
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
    const item = this.state.pegawaiIzinList && this.state.pegawaiIzinList.find(i => i.id === izinId);
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
        await this.loadPegawaiIzinList();
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
  },

  // ==========================================
  // MODUL ADMIN (PENGADILAN AGAMA GUNUNG SUGIH)
  // ==========================================

  _adminAllUsers: [],
  _adminAllIzin: [],
  _adminCurrentTab: 'users',
  _adminUserFilter: 'all',
  _adminAlurFilter: 'all',
  _selectedAlurIzin: null,

  async loadAdminDashboard() {
    await this.loadAdminStats();
    await this.loadAdminUsers();
    await this.loadAdminAlur();
    await this.loadAdminRecentTimeline();
    this.switchAdminTab(this._adminCurrentTab || 'users');
    lucide.createIcons();
  },

  // 1. STATISTIK RINGKASAN
  async loadAdminStats() {
    try {
      const res = await fetch('/api/admin/stats');
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        const totalUsersEl = document.getElementById('statTotalUsers');
        if (totalUsersEl) totalUsersEl.textContent = d.totalUsers ?? 0;
        
        const countPegawaiEl = document.getElementById('statCountPegawai');
        if (countPegawaiEl) countPegawaiEl.textContent = d.totalPegawai ?? 0;
        
        const countKetuaEl = document.getElementById('statCountKetua');
        if (countKetuaEl) countKetuaEl.textContent = d.totalKetua ?? 0;
        
        const pendingIzinEl = document.getElementById('statPendingIzin');
        if (pendingIzinEl) pendingIzinEl.textContent = d.pendingIzin ?? 0;

        const approvedIzinEl = document.getElementById('statApprovedIzin');
        if (approvedIzinEl) approvedIzinEl.textContent = d.approvedIzin ?? 0;

        const completedIzinEl = document.getElementById('statCompletedIzin');
        if (completedIzinEl) completedIzinEl.textContent = d.completedIzin ?? 0;

        const rejectedIzinEl = document.getElementById('statRejectedIzin');
        if (rejectedIzinEl) rejectedIzinEl.textContent = d.rejectedIzin ?? 0;

        // Badge Pending Users di Navigasi
        const navUserBadge = document.getElementById('badgePendingUsersNav');
        if (navUserBadge) {
          if (d.pendingAccUsers > 0) {
            navUserBadge.textContent = d.pendingAccUsers;
            navUserBadge.classList.remove('hidden');
          } else {
            navUserBadge.classList.add('hidden');
          }
        }

        // Banner Alert Pending Users
        const banner = document.getElementById('adminPendingUsersBanner');
        const bannerCount = document.getElementById('bannerPendingCount');
        if (banner && bannerCount) {
          if (d.pendingAccUsers > 0) {
            bannerCount.textContent = d.pendingAccUsers;
            banner.classList.remove('hidden');
          } else {
            banner.classList.add('hidden');
          }
        }

        // Badge Pending Izin di Navigasi
        const navIzinBadge = document.getElementById('badgePendingIzinNav');
        if (navIzinBadge) {
          if (d.pendingIzin > 0) {
            navIzinBadge.textContent = d.pendingIzin;
            navIzinBadge.classList.remove('hidden');
          } else {
            navIzinBadge.classList.add('hidden');
          }
        }
      }
    } catch (e) {
      console.error('Gagal memuat stats admin:', e);
    }
  },

  // 2. KELOLA PENGGUNA (PEGAWAI & KETUA JABATAN)
  async loadAdminUsers() {
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (!json.success) return;
      this._adminAllUsers = json.data || [];
      
      this._updateUserCounts();
      this.renderUsersTable();
    } catch (e) {
      console.error('Gagal memuat pengguna:', e);
    }
  },

  _updateUserCounts() {
    const list = this._adminAllUsers;
    const allCount = list.length;
    const pegawaiCount = list.filter(u => u.role === 'pegawai').length;
    const ketuaCount = list.filter(u => u.role === 'ketua_jabatan').length;
    const pendingCount = list.filter(u => u.statusAkun === 'pending').length;

    const elAll = document.getElementById('userCountAll');
    if (elAll) elAll.textContent = allCount;
    const elPegawai = document.getElementById('userCountPegawai');
    if (elPegawai) elPegawai.textContent = pegawaiCount;
    const elKetua = document.getElementById('userCountKetua');
    if (elKetua) elKetua.textContent = ketuaCount;
    const elPending = document.getElementById('userCountPending');
    if (elPending) elPending.textContent = pendingCount;
  },

  renderUsersTable() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;

    let list = this._adminAllUsers;
    const filter = this._adminUserFilter;

    if (filter === 'pegawai') list = list.filter(u => u.role === 'pegawai');
    else if (filter === 'ketua_jabatan') list = list.filter(u => u.role === 'ketua_jabatan');
    else if (filter === 'pending') list = list.filter(u => u.statusAkun === 'pending');

    const searchKeyword = (document.getElementById('adminUserSearchInput')?.value || '').toLowerCase().trim();
    if (searchKeyword) {
      list = list.filter(u => 
        (u.nama || '').toLowerCase().includes(searchKeyword) ||
        (u.nip || '').includes(searchKeyword) ||
        (u.jabatan || '').toLowerCase().includes(searchKeyword)
      );
    }

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-8 text-center text-slate-400">Tidak ada akun dalam kategori ini.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(u => {
      const isKetua = u.role === 'ketua_jabatan';
      const roleBadge = isKetua
        ? '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">⚖️ Ketua Jabatan</span>'
        : '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">👤 Pegawai</span>';

      let statusBadge = '';
      if (u.statusAkun === 'active') {
        statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif</span>';
      } else if (u.statusAkun === 'pending') {
        statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Menunggu ACC</span>';
      } else {
        statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Nonaktif</span>';
      }

      const escapedNama = (u.nama || '').replace(/'/g, "\\'");

      return `
        <tr class="hover:bg-slate-50 transition">
          <td class="px-5 py-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg ${isKetua ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'} font-bold flex items-center justify-center text-xs shrink-0">
                ${(u.nama || 'U').charAt(0)}
              </div>
              <div class="min-w-0">
                <p class="font-bold text-slate-900 truncate">${u.nama}</p>
                <p class="text-[11px] text-slate-500 font-mono">NIP: ${u.nip}</p>
              </div>
            </div>
          </td>
          <td class="px-5 py-3.5 font-medium text-slate-700 max-w-[200px] truncate">${u.jabatan || '-'}</td>
          <td class="px-5 py-3.5">${roleBadge}</td>
          <td class="px-5 py-3.5 text-center">${statusBadge}</td>
          <td class="px-5 py-3.5 text-right">
            <div class="flex items-center justify-end gap-1.5">
              ${u.statusAkun === 'pending' ? `
                <button onclick="App.setUserAccountStatus('${u.id}', 'active')"
                  class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition flex items-center gap-1">
                  <i data-lucide="check" class="w-3 h-3"></i> ACC
                </button>
              ` : (u.statusAkun === 'active' ? `
                <button onclick="App.openEditUserModal('${u.id}')"
                  class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition" title="Ubah Data">
                  <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="App.setUserAccountStatus('${u.id}', 'suspended')"
                  class="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition" title="Nonaktifkan">
                  Nonaktif
                </button>
              ` : `
                <button onclick="App.openEditUserModal('${u.id}')"
                  class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition" title="Ubah Data">
                  <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="App.setUserAccountStatus('${u.id}', 'active')"
                  class="px-2 py-1 rounded-lg text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50 transition" title="Aktifkan">
                  Aktifkan
                </button>
              `)}
              
              <button onclick="App.deleteAdminUser('${u.id}', '${escapedNama}')"
                class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition" title="Hapus Akun">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    lucide.createIcons();
  },

  filterAdminUsers(filter) {
    this._adminUserFilter = filter;
    document.querySelectorAll('.admin-user-filter-btn').forEach(btn => {
      const isActive = btn.dataset.userFilter === filter;
      btn.className = isActive
        ? 'admin-user-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 text-white shadow-xs'
        : 'admin-user-filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200';
    });
    this.renderUsersTable();
  },

  searchAdminUsers() {
    this.renderUsersTable();
  },

  // Modal Tambah / Ubah Akun
  openAddUserModal(defaultRole = 'pegawai') {
    const modal = document.getElementById('modalAddUser');
    if (!modal) return;
    document.getElementById('formAddUser').reset();
    document.getElementById('editUserId').value = '';
    document.getElementById('modalAddUserTitle').textContent = 'Tambah Akun Baru';
    document.getElementById('modalAddUserSubtitle').textContent = 'Pilih peran (Ketua Jabatan atau Pegawai) dan lengkapi data';

    const roleRadios = document.querySelectorAll('input[name="newUserRole"]');
    roleRadios.forEach(r => {
      r.checked = (r.value === defaultRole);
    });
    this.onRoleChange(defaultRole);

    modal.classList.remove('modal-hidden');
    lucide.createIcons();
  },

  openEditUserModal(id) {
    const user = this._adminAllUsers.find(u => u.id === id);
    if (!user) return;
    const modal = document.getElementById('modalAddUser');
    if (!modal) return;
    
    document.getElementById('editUserId').value = user.id;
    document.getElementById('modalAddUserTitle').textContent = 'Ubah Data Akun';
    document.getElementById('modalAddUserSubtitle').textContent = `Perbarui akun ${user.nama}`;
    
    const roleRadios = document.querySelectorAll('input[name="newUserRole"]');
    roleRadios.forEach(r => {
      r.checked = (r.value === user.role);
    });
    
    document.getElementById('newUserName').value = user.nama || '';
    document.getElementById('newUserNip').value = user.nip || '';
    document.getElementById('newUserJabatan').value = user.jabatan || '';
    document.getElementById('newUserStatus').value = user.statusAkun || 'active';
    
    modal.classList.remove('modal-hidden');
    lucide.createIcons();
  },

  closeAddUserModal() {
    const modal = document.getElementById('modalAddUser');
    if (modal) modal.classList.add('modal-hidden');
  },

  onRoleChange(role) {
    const title = document.getElementById('modalAddUserTitle');
    const jabatanInput = document.getElementById('newUserJabatan');
    const isEdit = !!document.getElementById('editUserId')?.value;

    if (role === 'ketua_jabatan') {
      if (!isEdit && title) title.textContent = 'Tambah Ketua Jabatan Baru';
      if (!isEdit && jabatanInput && !jabatanInput.value) jabatanInput.value = 'Ketua Pengadilan Agama Gunung Sugih';
    } else {
      if (!isEdit && title) title.textContent = 'Tambah Akun Pegawai Baru';
      if (!isEdit && jabatanInput && jabatanInput.value === 'Ketua Pengadilan Agama Gunung Sugih') jabatanInput.value = '';
    }
  },

  async submitAddUser(e) {
    e.preventDefault();
    const editId = document.getElementById('editUserId')?.value;
    const role = document.querySelector('input[name="newUserRole"]:checked')?.value || 'pegawai';
    const nama = document.getElementById('newUserName').value.trim();
    const nip = document.getElementById('newUserNip').value.trim();
    const jabatan = document.getElementById('newUserJabatan').value.trim();
    const statusAkun = document.getElementById('newUserStatus').value;

    const isEdit = !!editId;
    const url = isEdit ? `/api/admin/users/${editId}` : '/api/admin/users';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, nip, jabatan, role, statusAkun })
      });
      const json = await res.json();
      if (!json.success) {
        this.showToast(json.message || 'Gagal menyimpan akun.', 'error');
        return;
      }

      this.showToast(json.message, 'success');
      this.closeAddUserModal();
      await this.loadAdminUsers();
      await this.loadAdminStats();
    } catch (err) {
      this.showToast('Gagal menghubungi server.', 'error');
    }
  },

  // Ubah Status Akun (ACC / Suspended)
  async setUserAccountStatus(id, newStatus) {
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        this.showToast(json.message, 'success');
        await this.loadAdminUsers();
        await this.loadAdminStats();
      } else {
        this.showToast(json.message || 'Gagal memperbarui status akun.', 'error');
      }
    } catch (e) {
      this.showToast('Terjadi kesalahan jaringan.', 'error');
    }
  },

  // Hapus Akun Pengguna
  async deleteAdminUser(id, nama) {
    if (!confirm(`Hapus akun "${nama}"?\nTindakan ini permanen.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        this.showToast(json.message, 'success');
        await this.loadAdminUsers();
        await this.loadAdminStats();
      } else {
        this.showToast(json.message || 'Gagal menghapus akun.', 'error');
      }
    } catch (e) {
      this.showToast('Gagal menghapus akun.', 'error');
    }
  },

  // 3. ALUR & STATUS SURAT (TRACKING "DARI SIAPA KE SIAPA")
  async loadAdminAlur() {
    try {
      const res = await fetch('/api/admin/izin');
      const json = await res.json();
      if (!json.success) return;
      this._adminAllIzin = json.data || [];
      this.renderAlurCards();
    } catch (e) {
      console.error('Gagal memuat data alur:', e);
    }
  },

  renderAlurCards() {
    const container = document.getElementById('adminAlurCardsContainer');
    if (!container) return;

    let list = this._adminAllIzin;
    const filter = this._adminAlurFilter;
    if (filter !== 'all') {
      list = list.filter(i => i.status === filter);
    }

    const searchKeyword = (document.getElementById('adminAlurSearchInput')?.value || '').toLowerCase().trim();
    if (searchKeyword) {
      list = list.filter(i => 
        (i.kodeSurat || '').toLowerCase().includes(searchKeyword) ||
        (i.pegawaiNama || '').toLowerCase().includes(searchKeyword) ||
        (i.atasanNama || '').toLowerCase().includes(searchKeyword) ||
        (i.keterangan || '').toLowerCase().includes(searchKeyword)
      );
    }

    if (list.length === 0) {
      container.innerHTML = '<div class="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200/80">Tidak ada sirkulasi surat pada filter ini.</div>';
      return;
    }

    container.innerHTML = list.map(izin => this._renderTimelineCardHTML(izin, false)).join('');
    lucide.createIcons();
  },

  filterAdminAlur(filter) {
    this._adminAlurFilter = filter;
    document.querySelectorAll('.admin-alur-filter').forEach(btn => {
      const isActive = btn.dataset.alurFilter === filter;
      btn.className = isActive
        ? 'admin-alur-filter px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 text-white'
        : 'admin-alur-filter px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200';
    });
    this.renderAlurCards();
  },

  searchAdminAlur() {
    this.renderAlurCards();
  },

  // Render Template Card Alur Surat (Alur dari siapa ke siapa & status)
  _renderTimelineCardHTML(izin, isCompact = false) {
    const statusBadges = {
      pending: '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Menunggu ACC</span>',
      approved: '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Disetujui (Di Luar)</span>',
      completed: '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"><span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Selesai Kembali</span>',
      rejected: '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-800 border border-red-200"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Ditolak</span>'
    };

    const statusBadge = statusBadges[izin.status] || `<span class="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">${izin.status}</span>`;

    const step1Done = true;
    const step2Done = izin.status !== 'pending';
    const step2Rejected = izin.status === 'rejected';
    const step3Done = izin.status === 'completed';

    return `
      <div class="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition shadow-2xs space-y-3">
        
        <!-- Header: No Surat & Status -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-slate-800">${izin.kodeSurat || izin.id}</span>
            <span class="text-[10px] text-slate-400 font-medium">• ${izin.tanggalIzin || ''}</span>
          </div>
          <div>${statusBadge}</div>
        </div>

        <!-- Node Alur: DARI SIAPA ➔ KE SIAPA -->
        <div class="grid grid-cols-1 md:grid-cols-11 items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
          
          <!-- Pemohon (Dari) -->
          <div class="md:col-span-5 flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
              <i data-lucide="user" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0">
              <p class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Dari (Pemohon)</p>
              <p class="text-xs font-bold text-slate-900 truncate">${izin.pegawaiNama || '-'}</p>
              <p class="text-[10px] text-slate-500 truncate">${izin.pegawaiJabatan || 'Pegawai'}</p>
            </div>
          </div>

          <!-- Panah Indikator -->
          <div class="md:col-span-1 flex justify-center text-slate-400 py-1 md:py-0">
            <div class="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
              <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-600"></i>
            </div>
          </div>

          <!-- Penyetuju (Ketua Jabatan) -->
          <div class="md:col-span-5 flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
              <i data-lucide="award" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0">
              <p class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Kepada (Penyetuju)</p>
              <p class="text-xs font-bold text-slate-900 truncate">${izin.atasanNama || '-'}</p>
              <p class="text-[10px] text-slate-500 truncate">${izin.atasanJabatan || 'Ketua PA'}</p>
            </div>
          </div>

        </div>

        <!-- Keperluan Singkat & Waktu -->
        <div class="text-xs text-slate-700 bg-white p-2 rounded-lg flex items-center justify-between border border-slate-100">
          <div class="flex items-center gap-2 min-w-0">
            <i data-lucide="file-text" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
            <span class="truncate italic">"${izin.keterangan || '-'}"</span>
          </div>
          <span class="text-[11px] font-mono text-slate-500 font-semibold shrink-0 ml-2">
            ${izin.jamKeluar || '-'} – ${izin.jamMasuk || '-'}
          </span>
        </div>

        <!-- Progress Tracker 3-Langkah -->
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <div class="flex items-center gap-2.5">
            <span class="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> Diajukan
            </span>
            <span class="text-slate-300">➔</span>
            <span class="inline-flex items-center gap-1 font-semibold ${step2Done ? (step2Rejected ? 'text-red-600' : 'text-emerald-700') : 'text-slate-400'}">
              <i data-lucide="${step2Done ? (step2Rejected ? 'x-circle' : 'check-circle-2') : 'circle'}" class="w-3.5 h-3.5"></i>
              ${step2Rejected ? 'Ditolak' : (step2Done ? 'Disetujui' : 'Menunggu ACC')}
            </span>
            <span class="text-slate-300">➔</span>
            <span class="inline-flex items-center gap-1 font-semibold ${step3Done ? 'text-emerald-700' : 'text-slate-400'}">
              <i data-lucide="${step3Done ? 'check-circle-2' : 'circle'}" class="w-3.5 h-3.5"></i>
              ${step3Done ? `Kembali (${izin.jamKembaliAktual || '-'})` : 'Check-in'}
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <button onclick="App.openDetailAlurModal('${izin.id}')"
              class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1">
              <i data-lucide="eye" class="w-3 h-3"></i> Detail
            </button>
            <button onclick="App.showTiketModal('${izin.id}')"
              class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold transition flex items-center gap-1" title="Lihat Surat Resmi">
              <i data-lucide="file" class="w-3 h-3"></i> Surat
            </button>
            <button onclick="App.deleteAdminIzin('${izin.id}')"
              class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition" title="Hapus Berkas">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

      </div>
    `;
  },

  // Modal Detail Alur Surat Lengkap
  openDetailAlurModal(id) {
    const izin = this._adminAllIzin.find(i => i.id === id);
    if (!izin) return;
    this._selectedAlurIzin = izin;

    document.getElementById('detailAlurKodeSurat').textContent = `${izin.kodeSurat || izin.id} (${formatDateIndo(izin.tanggalIzin, true)})`;
    document.getElementById('detailAlurPemohon').textContent = izin.pegawaiNama || '-';
    document.getElementById('detailAlurNipPemohon').textContent = `NIP: ${izin.pegawaiNip || '-'}`;
    document.getElementById('detailAlurAtasan').textContent = izin.atasanNama || '-';
    document.getElementById('detailAlurJabatanAtasan').textContent = izin.atasanJabatan || 'Ketua PA';
    document.getElementById('detailAlurKeperluan').textContent = `"${izin.keterangan || '-'}"`;

    const stepsContainer = document.getElementById('detailAlurTimelineSteps');
    const timeline = izin.timeline || [];

    stepsContainer.innerHTML = timeline.map((step, idx) => {
      const isDone = step.done;
      const isCurrent = step.status === 'current';
      const isRejected = step.status === 'rejected';

      let iconColor = 'bg-slate-100 text-slate-400 border-slate-200';
      let icon = '<i data-lucide="circle" class="w-4 h-4"></i>';

      if (isDone) {
        iconColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
        icon = '<i data-lucide="check" class="w-4 h-4"></i>';
      } else if (isCurrent) {
        iconColor = 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse';
        icon = '<i data-lucide="clock" class="w-4 h-4"></i>';
      } else if (isRejected) {
        iconColor = 'bg-red-100 text-red-800 border-red-300';
        icon = '<i data-lucide="x" class="w-4 h-4"></i>';
      }

      return `
        <div class="flex items-start gap-3 relative">
          ${idx < timeline.length - 1 ? '<div class="absolute left-3.5 top-7 -bottom-3 w-0.5 bg-slate-200"></div>' : ''}
          <div class="w-7 h-7 rounded-full border-2 ${iconColor} flex items-center justify-center shrink-0 z-10 text-xs">
            ${icon}
          </div>
          <div class="flex-1 pb-3">
            <div class="flex items-center justify-between">
              <h5 class="text-xs font-bold text-slate-900">${step.title}</h5>
              <span class="text-[10px] text-slate-400 font-mono">${step.time ? new Date(step.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : ''}</span>
            </div>
            <p class="text-[11px] text-slate-600 mt-0.5">Aktor: <strong>${step.actor || '-'}</strong> (${step.role || '-'})</p>
            ${step.catatan ? `<p class="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-1 italic border border-slate-200/70">Catatan: "${step.catatan}"</p>` : ''}
            ${step.hasSignature ? `<span class="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"><i data-lucide="check-check" class="w-3 h-3"></i> Tanda Tangan Digital Terverifikasi</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    const modal = document.getElementById('modalDetailAlur');
    if (modal) modal.classList.remove('modal-hidden');
    lucide.createIcons();
  },

  closeDetailAlurModal() {
    const modal = document.getElementById('modalDetailAlur');
    if (modal) modal.classList.add('modal-hidden');
  },

  openTiketModalFromAlur() {
    if (this._selectedAlurIzin) {
      this.closeDetailAlurModal();
      this.showTiketModal(this._selectedAlurIzin.id);
    }
  },

  async deleteAdminIzin(id) {
    if (!confirm('Hapus berkas surat izin ini?\nTindakan ini permanen.')) return;
    try {
      const res = await fetch(`/api/admin/izin/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        this.showToast(json.message, 'success');
        await this.loadAdminAlur();
        await this.loadAdminRecentTimeline();
        await this.loadAdminStats();
      } else {
        this.showToast(json.message || 'Gagal menghapus izin.', 'error');
      }
    } catch (e) {
      this.showToast('Gagal menghapus izin.', 'error');
    }
  },

  // 4. TIMELINE TERKINI DI TAB OVERVIEW
  async loadAdminRecentTimeline() {
    try {
      const res = await fetch('/api/admin/izin');
      const json = await res.json();
      if (!json.success) return;
      this._adminAllIzin = json.data || [];
      
      const container = document.getElementById('adminRecentTimelineList');
      if (!container) return;

      const recent = this._adminAllIzin.slice(0, 3);
      if (recent.length === 0) {
        container.innerHTML = '<div class="py-6 text-center text-xs text-slate-400">Belum ada aktivitas surat izin.</div>';
        return;
      }

      container.innerHTML = recent.map(izin => this._renderTimelineCardHTML(izin, true)).join('');
      lucide.createIcons();
    } catch (e) {
      console.error('Gagal memuat aktivitas terkini:', e);
    }
  },

  // 5. GANTI TAB ADMIN (USERS, ALUR, OVERVIEW)
  switchAdminTab(tab, subFilter = null) {
    this._adminCurrentTab = tab;
    const tabMap = {
      users: 'adminTabUsers',
      alur: 'adminTabAlur',
      overview: 'adminTabOverview'
    };

    Object.entries(tabMap).forEach(([k, elementId]) => {
      const el = document.getElementById(elementId);
      if (el) el.classList.toggle('hidden', k !== tab);
    });

    // Update nav button active state
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      const isActive = btn.dataset.adminTab === tab;
      btn.className = isActive
        ? 'admin-nav-btn flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition text-white bg-emerald-600 shadow-sm'
        : 'admin-nav-btn flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition text-slate-400 hover:text-white';
    });

    if (tab === 'users') {
      if (subFilter) this.filterAdminUsers(subFilter);
      else this.loadAdminUsers();
    } else if (tab === 'alur') {
      this.loadAdminAlur();
    } else if (tab === 'overview') {
      this.loadAdminStats();
      this.loadAdminRecentTimeline();
    }

    lucide.createIcons();
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());

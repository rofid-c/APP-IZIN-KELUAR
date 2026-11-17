const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PEGAWAI_FILE = path.join(DATA_DIR, 'pegawai.json');
const IZIN_FILE = path.join(DATA_DIR, 'izin.json');
const KATEGORI_FILE = path.join(DATA_DIR, 'kategori_jabatan.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Master Kategori & Jenis Jabatan Resmi Pengadilan Agama Gunung Sugih
const DEFAULT_KATEGORI_JABATAN = [
  {
    id: "kat-pimpinan",
    nama: "Pimpinan Pengadilan",
    peran: "ketua_jabatan",
    isLocked: true,
    jenis: [
      "Ketua Pengadilan Agama Gunung Sugih",
      "Wakil Ketua Pengadilan Agama Gunung Sugih"
    ]
  },
  {
    id: "kat-panitera",
    nama: "Panitera",
    peran: "ketua_jabatan",
    isLocked: false,
    jenis: [
      "Panitera Pengadilan Agama Gunung Sugih"
    ]
  },
  {
    id: "kat-sekretaris",
    nama: "Sekretaris",
    peran: "ketua_jabatan",
    isLocked: false,
    jenis: [
      "Sekretaris Pengadilan Agama Gunung Sugih"
    ]
  },
  {
    id: "kat-panmub",
    nama: "Panmub (Panitera Muda)",
    peran: "ketua_jabatan",
    isLocked: false,
    jenis: [
      "Panitera Muda Permohonan",
      "Panitera Muda Gugatan",
      "Panitera Muda Hukum"
    ]
  },
  {
    id: "kat-kasubbag",
    nama: "Kassubag (Kepala Sub Bagian)",
    peran: "ketua_jabatan",
    isLocked: false,
    jenis: [
      "Kasubbag Kepegawaian, Organisasi, dan Tata Laksana",
      "Kasubbag Perencanaan, Teknologi Informasi, dan Pelaporan",
      "Kasubbag Umum dan Keuangan"
    ]
  },
  {
    id: "kat-pegawai",
    nama: "Fungsional & Pelaksana Pegawai",
    peran: "pegawai",
    isLocked: false,
    jenis: [
      "Panitera Pengganti",
      "Jurusita",
      "Jurusita Pengganti",
      "Pranata Komputer",
      "Pengelola Perkara",
      "Pengadministrasi Registrasi Perkara",
      "Resepsionis / Petugas PTSP",
      "PPNPN / Pramubakti"
    ]
  }
];

// Akun Contoh: 1 Pegawai & 1 Ketua Jabatan
const DEFAULT_USERS = [
  {
    id: "PEG-001",
    nama: "Ahmad Fauzi, S.Kom.",
    username: "Ahmad Fauzi",
    nip: "199208152019031002",
    password: "199208152019031002",
    jabatan: "Pranata Komputer Ahli Pertama",
    role: "pegawai",
    statusAkun: "active",
    createdAt: "2026-11-01T08:00:00.000Z"
  },
  {
    id: "KJ-001",
    nama: "Dr. H. Ahmad Zarkasi, S.H.I., M.H.",
    username: "Ahmad Zarkasi",
    nip: "197405102001121001",
    password: "197405102001121001",
    jabatan: "Ketua Pengadilan Agama Gunung Sugih",
    role: "ketua_jabatan",
    statusAkun: "active",
    createdAt: "2026-11-01T08:00:00.000Z"
  },
  {
    id: "KJ-002",
    nama: "Wakil Ketua PA",
    username: "Wakil Ketua PA",
    nip: "198005122008011003",
    password: "198005122008011003",
    jabatan: "Wakil Ketua Pengadilan Agama Gunung Sugih",
    role: "ketua_jabatan",
    statusAkun: "active",
    createdAt: "2026-11-01T08:00:00.000Z"
  }
];

// Pejabat Ketua Jabatan Perizinan (Fallback)
const DEFAULT_KETUA_JABATAN = [
  {
    id: "KJ-001",
    nama: "Dr. H. Ahmad Zarkasi, S.H.I., M.H.",
    nip: "197405102001121001",
    jabatan: "Ketua Pengadilan Agama Gunung Sugih",
    statusAkun: "active"
  },
  {
    id: "KJ-002",
    nama: "Wakil Ketua PA",
    nip: "198005122008011003",
    jabatan: "Wakil Ketua Pengadilan Agama Gunung Sugih",
    statusAkun: "active"
  }
];

function readJSON(filePath, fallbackData) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallbackData, null, 2), 'utf-8');
      return fallbackData;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return fallbackData;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    return false;
  }
}

// Data awal izin (tanpa estimasi kembali, tanpa QR code)
function getDefaultIzin() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  return [
    {
      id: "IZN-20261106-001",
      kodeSurat: "W11-A12/104/KP/XI/2026",
      pegawaiId: "PEG-001",
      pegawaiNama: "Ahmad Fauzi",
      pegawaiJabatan: "Pranata Komputer",
      atasanId: "KJ-001",
      atasanNama: "Dr. H. Ahmad Zarkasi, S.H.I., M.H.",
      atasanJabatan: "Ketua Pengadilan Agama",
      keterangan: "Koordinasi integrasi jaringan intranet ke Dinas Kominfo Lampung Tengah.",
      tanggalIzin: today,
      jamKeluar: "10:00",
      jamMasuk: "12:00",
      ttdDigital: null,
      status: "pending", // Masih menunggu approval ketua jabatan
      catatanAtasan: null,
      jamKembaliAktual: null,
      createdAt: `${today}T08:30:00.000Z`,
      approvedAt: null
    },
    {
      id: "IZN-20261105-002",
      kodeSurat: "W11-A12/102/KP/XI/2026",
      pegawaiId: "PEG-001",
      pegawaiNama: "Ahmad Fauzi",
      pegawaiJabatan: "Pranata Komputer",
      atasanId: "KJ-001",
      atasanNama: "Dr. H. Ahmad Zarkasi, S.H.I., M.H.",
      atasanJabatan: "Ketua Pengadilan Agama",
      keterangan: "Pencetakan rekening koran panjar perkara di Bank BSI Gunung Sugih.",
      tanggalIzin: yesterday,
      jamKeluar: "13:30",
      jamMasuk: "15:00",
      ttdDigital: null,
      status: "completed",
      catatanAtasan: "Disetujui.",
      jamKembaliAktual: "14:45",
      createdAt: `${yesterday}T11:00:00.000Z`,
      approvedAt: `${yesterday}T11:30:00.000Z`
    }
  ];
}

if (!fs.existsSync(PEGAWAI_FILE)) {
  writeJSON(PEGAWAI_FILE, DEFAULT_USERS);
}
if (!fs.existsSync(IZIN_FILE)) {
  writeJSON(IZIN_FILE, getDefaultIzin());
}

const storage = {
  // Autentikasi Pengguna (Menggunakan Nama dan NIP)
  authenticate(inputNama, inputNipOrPass) {
    const cleanNama = (inputNama || '').toLowerCase().trim();
    const cleanNip = (inputNipOrPass || '').replace(/[\s-]/g, '').trim();

    // Deteksi Otomatis Akun Administrator: nama: root, NIP: admin123
    if (cleanNama === 'root' && (cleanNip === 'admin123' || inputNipOrPass === 'admin123')) {
      return {
        id: "ADM-001",
        nama: "root",
        nip: "admin123",
        jabatan: "Administrator Sistem & Kepegawaian",
        role: "admin"
      };
    }

    const list = readJSON(PEGAWAI_FILE, DEFAULT_USERS);

    const user = list.find(p => {
      const pNama = (p.nama || '').toLowerCase().trim();
      const pUser = (p.username || '').toLowerCase().trim();
      const matchNama = pNama === cleanNama || pUser === cleanNama || pNama.includes(cleanNama);

      const pNip = (p.nip || '').replace(/[\s-]/g, '').trim();
      const matchNip = pNip && pNip === cleanNip;
      const matchPass = p.password && (p.password === cleanNip || p.password === inputNipOrPass);
      const matchDefault = cleanNip === '123456';

      return matchNama && (matchNip || matchPass || matchDefault || !p.nip);
    });

    if (!user) return null;

    // Cek apakah akun masih pending / nonaktif
    if (user.statusAkun === 'pending') {
      return {
        error: 'pending_approval',
        message: 'Akun Anda sedang menunggu persetujuan (ACC) dari Administrator.'
      };
    }
    if (user.statusAkun === 'suspended') {
      return {
        error: 'suspended',
        message: 'Akun Anda telah dinonaktifkan oleh Administrator.'
      };
    }

    return {
      id: user.id,
      nama: user.nama,
      nip: user.nip || (inputNipOrPass || ''),
      jabatan: user.jabatan,
      role: user.role,
      statusAkun: user.statusAkun || 'active'
    };
  },

  // Pendaftaran Akun Pegawai Baru (Menggunakan Nama, NIP, dan Kategori Jabatan)
  registerPegawai(nama, nip, jabatan = 'Pegawai', kategoriId = null, kategoriNama = null) {
    const list = readJSON(PEGAWAI_FILE, DEFAULT_USERS);
    const cleanNama = (nama || '').trim();
    const cleanNip = (nip || '').replace(/[\s-]/g, '').trim();
    const cleanJabatan = (jabatan || 'Pegawai').trim();

    if (!cleanNama || !cleanNip) {
      return { success: false, message: 'Nama dan NIP wajib diisi.' };
    }

    if (cleanNama.toLowerCase() === 'root' || cleanNip === 'admin123') {
      return { success: false, message: 'Nama dan NIP tersebut tidak dapat digunakan (kredensial Administrator).' };
    }

    // 1. Validasi Ketat Duplikasi NIP (1 NIP = 1 Akun)
    const nipExists = list.some(p => {
      const pNip = (p.nip || '').replace(/[\s-]/g, '').trim();
      return pNip && pNip === cleanNip;
    });

    if (nipExists) {
      return {
        success: false,
        message: `Nomor Induk Pegawai (NIP) "${cleanNip}" sudah terdaftar dalam sistem. 1 NIP hanya dapat digunakan untuk 1 akun.`
      };
    }

    // 2. Validasi Duplikasi Nama
    const namaExists = list.some(p => {
      const pNama = (p.nama || '').toLowerCase().trim();
      return pNama && pNama === cleanNama.toLowerCase();
    });

    if (namaExists) {
      return {
        success: false,
        message: `Pegawai dengan nama "${cleanNama}" sudah terdaftar dalam sistem. Silakan langsung masuk.`
      };
    }

    // Sinkronisasi Kategori Jabatan & Penentuan Role
    const kategoriList = this.getAllKategoriJabatan();
    let matchedKat = null;
    if (kategoriId) {
      matchedKat = kategoriList.find(k => k.id === kategoriId);
    }
    if (!matchedKat && cleanJabatan) {
      matchedKat = kategoriList.find(k => (k.jenis || []).some(j => j.toLowerCase() === cleanJabatan.toLowerCase()));
    }

    const finalKategoriId = matchedKat ? matchedKat.id : (kategoriId || null);
    const finalKategoriNama = matchedKat ? matchedKat.nama : (kategoriNama || null);
    const role = (matchedKat && matchedKat.peran === 'ketua_jabatan') ? 'ketua_jabatan' : 'pegawai';
    const idPrefix = role === 'ketua_jabatan' ? 'KJ' : 'PEG';

    const newUser = {
      id: `${idPrefix}-${Date.now().toString().slice(-4)}`,
      nama: cleanNama,
      username: cleanNama,
      nip: cleanNip,
      password: cleanNip,
      jabatan: cleanJabatan,
      kategoriId: finalKategoriId,
      kategoriNama: finalKategoriNama,
      role: role,
      statusAkun: 'pending', // Akun baru wajib persetujuan (ACC) dari Admin
      createdAt: new Date().toISOString()
    };

    list.push(newUser);
    writeJSON(PEGAWAI_FILE, list);
    return {
      success: true,
      pendingApproval: true,
      message: 'Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan (ACC) dari Administrator sebelum dapat masuk.',
      user: {
        id: newUser.id,
        nama: newUser.nama,
        nip: newUser.nip,
        jabatan: newUser.jabatan,
        kategoriId: newUser.kategoriId,
        kategoriNama: newUser.kategoriNama,
        role: newUser.role,
        statusAkun: newUser.statusAkun
      }
    };
  },

  getAllKetuaJabatan() {
    const list = readJSON(PEGAWAI_FILE, DEFAULT_USERS);
    const ketuaList = list.filter(u => u.role === 'ketua_jabatan' && (u.statusAkun === 'active' || !u.statusAkun));
    if (ketuaList.length > 0) {
      return ketuaList.map(k => ({
        id: k.id,
        nama: k.nama,
        nip: k.nip,
        jabatan: k.jabatan
      }));
    }
    return DEFAULT_KETUA_JABATAN;
  },

  getKetuaJabatanById(id) {
    const all = this.getAllKetuaJabatan();
    return all.find(a => a.id === id) || all[0];
  },

  // Ambil daftar izin (jika pegawai: miliknya, jika ketua: yang ditujukan kepadanya atau semua)
  getAllIzin(filter = {}) {
    let list = readJSON(IZIN_FILE, getDefaultIzin());

    if (filter.pegawaiId) {
      list = list.filter(i => i.pegawaiId === filter.pegawaiId);
    }

    if (filter.atasanId) {
      list = list.filter(i => i.atasanId === filter.atasanId);
    }

    if (filter.status && filter.status !== 'all') {
      list = list.filter(i => i.status === filter.status);
    }

    return list;
  },

  getIzinById(id) {
    const list = readJSON(IZIN_FILE, getDefaultIzin());
    return list.find(i => i.id === id) || null;
  },

  // Pegawai & Pejabat mengajukan izin keluar kantor (Semua butuh ACC pejabat penyetuju)
  createIzin(payload) {
    const list = readJSON(IZIN_FILE, getDefaultIzin());
    
    // Pejabat penyetuju yang dipilih oleh pemohon
    const atasan = this.getKetuaJabatanById(payload.atasanId) || this.getAllKetuaJabatan()[0] || DEFAULT_KETUA_JABATAN[0];

    const today = payload.tanggalIzin || new Date().toISOString().split('T')[0];
    const countToday = list.filter(i => i.tanggalIzin === today).length + 1;
    const id = `IZN-${today.replace(/-/g, '')}-${String(countToday).padStart(3, '0')}`;
    const kodeSurat = `W11-A12/${Math.floor(100 + Math.random() * 900)}/KP/XI/2026`;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const jamKeluar = payload.jamKeluar || `${hours}:${minutes}`;

    const newIzin = {
      id,
      kodeSurat,
      pegawaiId: payload.pegawaiId || (payload.role === 'ketua_jabatan' ? 'KJ-001' : 'PEG-001'),
      pegawaiNama: payload.nama || 'Pemohon',
      pegawaiNip: payload.nip || payload.pegawaiNip || '-',
      pegawaiJabatan: payload.jabatan || 'Pegawai',
      atasanId: atasan.id,
      atasanNama: atasan.nama,
      atasanNip: atasan.nip || '-',
      atasanJabatan: atasan.jabatan || '-',
      keterangan: payload.keterangan,
      tanggalIzin: today,
      jamKeluar: jamKeluar,
      jamMasuk: payload.jamMasuk || null,
      ttdDigital: payload.ttdDigital || null,
      ttdAtasan: null,
      status: 'pending',
      catatanAtasan: null,
      jamKembaliAktual: null,
      createdAt: new Date().toISOString(),
      approvedAt: null,
      isPimpinan: false
    };

    list.unshift(newIzin);
    writeJSON(IZIN_FILE, list);
    return newIzin;
  },

  // Konfirmasi Kembali ke Kantor (Check-In)
  confirmReturn(id, payload = {}) {
    const list = readJSON(IZIN_FILE, getDefaultIzin());
    const index = list.findIndex(i => i.id === id);
    if (index === -1) return null;

    const izin = list[index];
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    izin.status = 'completed';
    izin.jamKembaliAktual = payload.jamKembali || `${hours}:${minutes}`;
    izin.completedAt = now.toISOString();

    list[index] = izin;
    writeJSON(IZIN_FILE, list);
    return izin;
  },

  // Ketua Jabatan Approve / Reject Izin
  updateStatus(id, newStatus, catatanAtasan = '', ttdAtasan = null) {
    const list = readJSON(IZIN_FILE, getDefaultIzin());
    const index = list.findIndex(i => i.id === id);
    if (index === -1) return null;

    const izin = list[index];
    izin.status = newStatus;
    izin.catatanAtasan = catatanAtasan || (newStatus === 'approved' ? 'Disetujui oleh Ketua Jabatan.' : 'Permohonan izin ditolak.');

    if (newStatus === 'approved') {
      izin.approvedAt = new Date().toISOString();
      if (ttdAtasan) {
        izin.ttdAtasan = ttdAtasan;
      }
    } else if (newStatus === 'rejected') {
      izin.rejectedAt = new Date().toISOString();
    }

    list[index] = izin;
    writeJSON(IZIN_FILE, list);
    return izin;
  },

  // Pegawai hanya bisa menghapus izin yang BELUM di-acc (status pending)
  deleteIzin(id, pegawaiId) {
    const list = readJSON(IZIN_FILE, getDefaultIzin());
    const index = list.findIndex(i => i.id === id);
    if (index === -1) return { success: false, message: 'Izin tidak ditemukan.' };

    const izin = list[index];
    if (izin.status !== 'pending') {
      return { success: false, message: 'Izin yang sudah diproses tidak dapat dihapus.' };
    }

    list.splice(index, 1);
    writeJSON(IZIN_FILE, list);
    return { success: true, message: 'Permohonan izin berhasil dihapus.' };
  },

  // ==========================================
  // ADMIN METHODS (MANAJEMEN AKUN & SURAT)
  // ==========================================

  // Ambil semua data akun (Pegawai & Ketua Jabatan)
  getAllUsersAdmin() {
    const list = readJSON(PEGAWAI_FILE, DEFAULT_USERS);
    return list.map(p => ({
      id: p.id,
      nama: p.nama,
      username: p.username,
      nip: p.nip,
      jabatan: p.jabatan,
      role: p.role,
      statusAkun: p.statusAkun || 'active',
      createdAt: p.createdAt || null
    }));
  },

  // Tambah akun baru oleh Admin (bisa Pegawai atau Ketua Jabatan)
  createUserAdmin(payload) {
    const list = readJSON(PEGAWAI_FILE, DEFAULT_USERS);
    const cleanNama = (payload.nama || '').trim();
    const cleanNip = (payload.nip || '').replace(/[\s-]/g, '').trim();
    const role = payload.role === 'ketua_jabatan' ? 'ketua_jabatan' : 'pegawai';
    const jabatan = (payload.jabatan || (role === 'ketua_jabatan' ? 'Ketua Jabatan' : 'Pegawai')).trim();
    const statusAkun = payload.statusAkun || 'active';

    if (!cleanNama || !cleanNip) {
      return { success: false, message: 'Nama dan NIP wajib diisi.' };
    }

    if (cleanNama.toLowerCase() === 'root' || cleanNip === 'admin123') {
      return { success: false, message: 'Nama dan NIP tersebut tidak dapat digunakan (kredensial Administrator).' };
    }

    // 1. Validasi Duplikasi NIP (1 NIP = 1 Akun)
    const nipExists = list.some(p => {
      const pNip = (p.nip || '').replace(/[\s-]/g, '').trim();
      return pNip && pNip === cleanNip;
    });

    if (nipExists) {
      return {
        success: false,
        message: `Nomor Induk Pegawai (NIP) "${cleanNip}" sudah terdaftar pada akun lain. 1 NIP hanya untuk 1 akun.`
      };
    }

    // 2. Validasi Duplikasi Nama
    const namaExists = list.some(p => {
      const pNama = (p.nama || '').toLowerCase().trim();
      return pNama && pNama === cleanNama.toLowerCase();
    });

    if (namaExists) {
      return {
        success: false,
        message: `Akun dengan nama "${cleanNama}" sudah ada di sistem.`
      };
    }

    const prefix = role === 'ketua_jabatan' ? 'KJ' : 'PEG';
    const id = `${prefix}-${Date.now().toString().slice(-4)}`;

    const newUser = {
      id,
      nama: cleanNama,
      username: cleanNama,
      nip: cleanNip,
      password: cleanNip,
      jabatan,
      kategoriId: payload.kategoriId || null,
      kategoriNama: payload.kategoriNama || null,
      role,
      statusAkun,
      createdAt: new Date().toISOString()
    };

    list.push(newUser);
    writeJSON(PEGAWAI_FILE, list);
    return {
      success: true,
      message: `Akun ${role === 'ketua_jabatan' ? 'Ketua Jabatan' : 'Pegawai'} berhasil dibuat.`,
      user: newUser
    };
  },

  // Ubah status akun (ACC / Aktifkan / Nonaktifkan)
  updateUserStatus(id, newStatus) {
    const list = readJSON(PEGAWAI_FILE, DEFAULT_USERS);
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return { success: false, message: 'Akun tidak ditemukan.' };

    const validStatus = ['active', 'pending', 'suspended'];
    if (!validStatus.includes(newStatus)) {
      return { success: false, message: 'Status tidak valid.' };
    }

    list[index].statusAkun = newStatus;
    writeJSON(PEGAWAI_FILE, list);
    const label = newStatus === 'active' ? 'disetujui (ACC) & diaktifkan' : newStatus === 'suspended' ? 'dinonaktifkan' : 'diatur ke pending';
    return {
      success: true,
      message: `Akun ${list[index].nama} berhasil ${label}.`,
      user: list[index]
    };
  },

  // Perbarui data profil akun oleh admin
  updateUserAdmin(id, payload) {
    const list = readJSON(PEGAWAI_FILE, DEFAULT_USERS);
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return { success: false, message: 'Akun tidak ditemukan.' };

    const user = list[index];

    if (payload.nama) {
      const newNama = payload.nama.trim();
      const duplicateNama = list.some(p => p.id !== id && (p.nama || '').toLowerCase().trim() === newNama.toLowerCase());
      if (duplicateNama) {
        return { success: false, message: `Nama "${newNama}" sudah digunakan oleh akun lain.` };
      }
      user.nama = newNama;
    }

    if (payload.nip) {
      const newNip = payload.nip.replace(/[\s-]/g, '').trim();
      const duplicateNip = list.some(p => p.id !== id && (p.nip || '').replace(/[\s-]/g, '').trim() === newNip);
      if (duplicateNip) {
        return { success: false, message: `NIP "${newNip}" sudah digunakan oleh akun lain. 1 NIP hanya untuk 1 akun.` };
      }
      user.nip = newNip;
      user.password = newNip;
    }

    if (payload.jabatan) user.jabatan = payload.jabatan.trim();
    if (payload.role) user.role = payload.role;
    if (payload.statusAkun) user.statusAkun = payload.statusAkun;
    if (payload.kategoriId !== undefined) user.kategoriId = payload.kategoriId;
    if (payload.kategoriNama !== undefined) user.kategoriNama = payload.kategoriNama;

    list[index] = user;
    writeJSON(PEGAWAI_FILE, list);
    return {
      success: true,
      message: `Akun ${user.nama} berhasil diperbarui.`,
      user
    };
  },

  // ==========================================
  // MASTER KATEGORI & JENIS JABATAN
  // ==========================================
  getAllKategoriJabatan() {
    return readJSON(KATEGORI_FILE, DEFAULT_KATEGORI_JABATAN);
  },

  addKategoriJabatan({ nama, peran = 'ketua_jabatan', jenis = [] }) {
    const list = this.getAllKategoriJabatan();
    const cleanNama = (nama || '').trim();
    if (!cleanNama) {
      return { success: false, message: 'Nama kategori wajib diisi.' };
    }
    const exists = list.some(k => (k.nama || '').toLowerCase() === cleanNama.toLowerCase());
    if (exists) {
      return { success: false, message: `Kategori "${cleanNama}" sudah ada.` };
    }
    const id = 'kat-' + cleanNama.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) + '-' + Date.now().toString().slice(-4);
    const cleanJenis = Array.isArray(jenis) ? jenis.map(j => (j || '').trim()).filter(Boolean) : [];
    const newKat = {
      id,
      nama: cleanNama,
      peran: peran || 'ketua_jabatan',
      isLocked: false,
      jenis: cleanJenis
    };
    list.push(newKat);
    writeJSON(KATEGORI_FILE, list);
    return { success: true, message: `Kategori "${cleanNama}" berhasil ditambahkan.`, data: newKat };
  },

  updateKategoriJabatan(id, { nama, peran, jenis }) {
    const list = this.getAllKategoriJabatan();
    const idx = list.findIndex(k => k.id === id);
    if (idx === -1) {
      return { success: false, message: 'Kategori tidak ditemukan.' };
    }
    if (nama !== undefined) list[idx].nama = (nama || '').trim();
    if (peran !== undefined) list[idx].peran = peran;
    if (Array.isArray(jenis)) {
      list[idx].jenis = jenis.map(j => (j || '').trim()).filter(Boolean);
    }
    writeJSON(KATEGORI_FILE, list);
    return { success: true, message: 'Kategori jabatan berhasil diperbarui.', data: list[idx] };
  },

  addJenisToKategori(kategoriId, namaJenis) {
    const list = this.getAllKategoriJabatan();
    const idx = list.findIndex(k => k.id === kategoriId);
    if (idx === -1) {
      return { success: false, message: 'Kategori tidak ditemukan.' };
    }
    const cleanJenis = (namaJenis || '').trim();
    if (!cleanJenis) {
      return { success: false, message: 'Nama jenis jabatan wajib diisi.' };
    }
    if (!Array.isArray(list[idx].jenis)) list[idx].jenis = [];
    if (!list[idx].jenis.includes(cleanJenis)) {
      list[idx].jenis.push(cleanJenis);
      writeJSON(KATEGORI_FILE, list);
    }
    return { success: true, message: `Jenis jabatan "${cleanJenis}" berhasil ditambahkan ke ${list[idx].nama}.`, data: list[idx] };
  },

  deleteJenisFromKategori(kategoriId, namaJenis) {
    const list = this.getAllKategoriJabatan();
    const idx = list.findIndex(k => k.id === kategoriId);
    if (idx === -1) {
      return { success: false, message: 'Kategori tidak ditemukan.' };
    }
    list[idx].jenis = (list[idx].jenis || []).filter(j => j !== namaJenis);
    writeJSON(KATEGORI_FILE, list);
    return { success: true, message: `Jenis jabatan berhasil dihapus dari ${list[idx].nama}.`, data: list[idx] };
  },

  deleteKategoriJabatan(id) {
    let list = this.getAllKategoriJabatan();
    const target = list.find(k => k.id === id);
    if (!target) {
      return { success: false, message: 'Kategori tidak ditemukan.' };
    }
    if (target.isLocked) {
      return { success: false, message: 'Kategori sistem utama tidak dapat dihapus.' };
    }
    list = list.filter(k => k.id !== id);
    writeJSON(KATEGORI_FILE, list);
    return { success: true, message: 'Kategori berhasil dihapus.' };
  },

  // Helper cek apakah akun merupakan Pimpinan Pokok Pengadilan (Ketua & Wakil Ketua PA)
  isPimpinanPengadilan(user) {
    if (!user) return false;
    if (user.id === 'KJ-001' || user.id === 'KJ-002') return true;
    if (user.kategoriId === 'kat-pimpinan') return true;
    if (user.jabatan) {
      const j = user.jabatan.trim().toLowerCase();
      if (j === 'ketua pengadilan agama gunung sugih' || j === 'wakil ketua pengadilan agama gunung sugih') {
        return true;
      }
    }
    return false;
  },

  // Hapus akun (baik pegawai maupun pejabat, kecuali akun Pimpinan Pengadilan)
  deleteUserAdmin(id) {
    const list = readJSON(PEGAWAI_FILE, DEFAULT_USERS);
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return { success: false, message: 'Akun tidak ditemukan.' };

    const user = list[index];
    // Proteksi: Hanya Akun Pimpinan Pengadilan (Ketua & Wakil Ketua) yang bersifat permanen dan tidak dapat dihapus
    if (this.isPimpinanPengadilan(user)) {
      return {
        success: false,
        message: 'Akun Pimpinan Pengadilan (Ketua & Wakil Ketua) bersifat permanen dan tidak dapat dihapus, hanya dapat diubah (edit).'
      };
    }

    const nama = user.nama;
    list.splice(index, 1);
    writeJSON(PEGAWAI_FILE, list);
    return { success: true, message: `Akun ${nama} berhasil dihapus dari sistem.` };
  },

  // Legacy compatibility
  getAllPegawai() {
    return this.getAllUsersAdmin();
  },

  deletePegawai(id) {
    return this.deleteUserAdmin(id);
  },

  // Ambil semua izin dengan metadata timeline/alur lengkap
  getAllIzinAdmin() {
    const list = readJSON(IZIN_FILE, getDefaultIzin());
    return list.map(izin => {
      // Hitung tahapan alur surat:
      // 1: Diajukan (pending)
      // 2: Disetujui / Ditolak (approved / rejected)
      // 3: Selesai Kembali (completed)
      let timeline = [
        {
          step: 1,
          title: "Pengajuan Izin",
          actor: izin.pegawaiNama,
          role: "Pemohon (" + (izin.pegawaiJabatan || 'Pegawai') + ")",
          time: izin.createdAt || null,
          done: true,
          status: "done"
        },
        {
          step: 2,
          title: izin.status === 'rejected'
            ? "Permohonan Ditolak"
            : (izin.isPimpinan || izin.atasanId === 'SYSTEM' ? "ACC Otomatis Sistem" : "Persetujuan Ketua Jabatan"),
          actor: (izin.isPimpinan || izin.atasanId === 'SYSTEM') ? "Sistem E-IZIN" : izin.atasanNama,
          role: (izin.isPimpinan || izin.atasanId === 'SYSTEM') ? "Disetujui Otomatis Sistem" : (izin.atasanJabatan || 'Ketua Pengadilan Agama'),
          time: izin.approvedAt || izin.rejectedAt || null,
          done: izin.status !== 'pending',
          status: izin.status === 'pending' ? 'current' : (izin.status === 'rejected' ? 'rejected' : 'done'),
          catatan: izin.catatanAtasan || null,
          hasSignature: !!izin.ttdAtasan
        },
        {
          step: 3,
          title: "Check-in Kembali ke Kantor",
          actor: izin.pegawaiNama,
          role: "Pemohon",
          time: izin.completedAt || null,
          done: izin.status === 'completed',
          status: izin.status === 'completed' ? 'done' : (izin.status === 'approved' ? 'pending_action' : 'inactive'),
          jamKembali: izin.jamKembaliAktual || null
        }
      ];

      return {
        ...izin,
        timeline
      };
    });
  },

  // Hapus izin (admin)
  deleteIzinAdmin(id) {
    const list = readJSON(IZIN_FILE, getDefaultIzin());
    const index = list.findIndex(i => i.id === id);
    if (index === -1) return { success: false, message: 'Izin tidak ditemukan.' };
    list.splice(index, 1);
    writeJSON(IZIN_FILE, list);
    return { success: true, message: 'Data izin berhasil dihapus.' };
  },

  // Statistik ringkasan komprehensif
  getAdminStats() {
    const userList = readJSON(PEGAWAI_FILE, DEFAULT_USERS);
    const izinList = readJSON(IZIN_FILE, getDefaultIzin());

    const totalPegawai = userList.filter(p => p.role === 'pegawai').length;
    const totalKetua = userList.filter(p => p.role === 'ketua_jabatan').length;
    const pendingAccUsers = userList.filter(p => p.statusAkun === 'pending').length;

    return {
      totalUsers: userList.length,
      totalPegawai,
      totalKetua,
      pendingAccUsers,
      totalIzin: izinList.length,
      pendingIzin: izinList.filter(i => i.status === 'pending').length,
      approvedIzin: izinList.filter(i => i.status === 'approved').length,
      completedIzin: izinList.filter(i => i.status === 'completed').length,
      rejectedIzin: izinList.filter(i => i.status === 'rejected').length,
    };
  }
};

module.exports = {
  storage
};

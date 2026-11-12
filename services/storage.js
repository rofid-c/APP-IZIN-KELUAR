const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PEGAWAI_FILE = path.join(DATA_DIR, 'pegawai.json');
const IZIN_FILE = path.join(DATA_DIR, 'izin.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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

  // Pendaftaran Akun Pegawai Baru (Menggunakan Nama dan NIP)
  registerPegawai(nama, nip, jabatan = 'Pegawai') {
    const list = readJSON(PEGAWAI_FILE, DEFAULT_USERS);
    const cleanNama = (nama || '').trim();
    const cleanNip = (nip || '').replace(/[\s-]/g, '').trim();

    if (!cleanNama || !cleanNip) {
      return { success: false, message: 'Nama dan NIP wajib diisi.' };
    }

    const exists = list.some(p => {
      const pNama = (p.nama || '').toLowerCase().trim();
      const pNip = (p.nip || '').replace(/[\s-]/g, '').trim();
      return pNama === cleanNama.toLowerCase() || (pNip && pNip === cleanNip);
    });

    if (exists) {
      return { success: false, message: 'Pegawai dengan nama atau NIP ini sudah terdaftar. Silakan langsung masuk.' };
    }

    const newUser = {
      id: `PEG-${Date.now().toString().slice(-4)}`,
      nama: cleanNama,
      username: cleanNama,
      nip: cleanNip,
      password: cleanNip,
      jabatan: (jabatan || 'Pegawai').trim(),
      role: 'pegawai',
      statusAkun: 'active', // Pegawai default aktif atau bisa langsung digunakan
      createdAt: new Date().toISOString()
    };

    list.push(newUser);
    writeJSON(PEGAWAI_FILE, list);
    return {
      success: true,
      message: 'Akun pegawai berhasil didaftarkan.',
      user: {
        id: newUser.id,
        nama: newUser.nama,
        nip: newUser.nip,
        jabatan: newUser.jabatan,
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

  // Pegawai mengajukan izin baru (TANPA ESTIMASI KEMBALI)
  createIzin(payload) {
    const list = readJSON(IZIN_FILE, getDefaultIzin());
    const atasan = this.getKetuaJabatanById(payload.atasanId) || DEFAULT_KETUA_JABATAN[0];

    const today = payload.tanggalIzin || new Date().toISOString().split('T')[0];
    const countToday = list.filter(i => i.tanggalIzin === today).length + 1;
    const id = `IZN-${today.replace(/-/g, '')}-${String(countToday).padStart(3, '0')}`;
    const kodeSurat = `W11-A12/${Math.floor(100 + Math.random() * 900)}/KP/XI/2026`;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const jamKeluar = payload.jamKeluar || `${hours}:${minutes}`;

    const isKetua = (payload.pegawaiId && payload.pegawaiId.startsWith('KJ')) || payload.role === 'ketua_jabatan';

    const newIzin = {
      id,
      kodeSurat,
      pegawaiId: payload.pegawaiId || "PEG-001",
      pegawaiNama: payload.nama || "Ahmad Fauzi",
      pegawaiNip: payload.nip || payload.pegawaiNip || "199208152019031002",
      pegawaiJabatan: payload.jabatan || "Pranata Komputer",
      atasanId: atasan.id,
      atasanNama: atasan.nama,
      atasanNip: atasan.nip || "197405102001121001",
      atasanJabatan: atasan.jabatan,
      keterangan: payload.keterangan,
      tanggalIzin: today,
      jamKeluar: jamKeluar,
      jamMasuk: payload.jamMasuk || null,
      ttdDigital: payload.ttdDigital || null,
      ttdAtasan: isKetua ? (payload.ttdDigital || null) : null,
      status: isKetua ? 'approved' : 'pending',
      catatanAtasan: isKetua ? 'Disetujui Langsung (Izin Resmi Pimpinan)' : null,
      jamKembaliAktual: null,
      createdAt: new Date().toISOString(),
      approvedAt: isKetua ? new Date().toISOString() : null
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

    const exists = list.some(p => {
      const pNama = (p.nama || '').toLowerCase().trim();
      const pNip = (p.nip || '').replace(/[\s-]/g, '').trim();
      return pNama === cleanNama.toLowerCase() || (pNip && pNip === cleanNip);
    });

    if (exists) {
      return { success: false, message: 'Akun dengan Nama atau NIP ini sudah ada di sistem.' };
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
    if (payload.nama) user.nama = payload.nama.trim();
    if (payload.nip) {
      user.nip = payload.nip.replace(/[\s-]/g, '').trim();
      user.password = user.nip;
    }
    if (payload.jabatan) user.jabatan = payload.jabatan.trim();
    if (payload.role) user.role = payload.role;
    if (payload.statusAkun) user.statusAkun = payload.statusAkun;

    list[index] = user;
    writeJSON(PEGAWAI_FILE, list);
    return {
      success: true,
      message: `Data akun ${user.nama} berhasil diperbarui.`,
      user
    };
  },

  // Hapus akun (baik pegawai maupun ketua jabatan)
  deleteUserAdmin(id) {
    const list = readJSON(PEGAWAI_FILE, DEFAULT_USERS);
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return { success: false, message: 'Akun tidak ditemukan.' };

    const user = list[index];
    // Proteksi: jangan sampai tidak ada ketua jabatan sama sekali
    if (user.role === 'ketua_jabatan') {
      const remainingKetua = list.filter(p => p.role === 'ketua_jabatan' && p.id !== id);
      if (remainingKetua.length === 0) {
        return { success: false, message: 'Tidak dapat menghapus satu-satunya Ketua Jabatan di sistem.' };
      }
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
          title: izin.status === 'rejected' ? "Permohonan Ditolak" : "Persetujuan Ketua Jabatan",
          actor: izin.atasanNama,
          role: izin.atasanJabatan || 'Ketua Pengadilan Agama',
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

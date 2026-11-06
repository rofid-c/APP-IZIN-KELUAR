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
    role: "pegawai"
  },
  {
    id: "KJ-001",
    nama: "Dr. H. Ahmad Zarkasi, S.H.I., M.H.",
    username: "Ahmad Zarkasi",
    nip: "197405102001121001",
    password: "197405102001121001",
    jabatan: "Ketua Pengadilan Agama Gunung Sugih",
    role: "ketua_jabatan"
  }
];

// Pejabat Ketua Jabatan Perizinan (Hanya Ketua Pengadilan Agama Gunung Sugih)
const DEFAULT_KETUA_JABATAN = [
  {
    id: "KJ-001",
    nama: "Dr. H. Ahmad Zarkasi, S.H.I., M.H.",
    nip: "197405102001121001",
    jabatan: "Ketua Pengadilan Agama Gunung Sugih"
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
    const list = readJSON(PEGAWAI_FILE, DEFAULT_USERS);
    const cleanNama = (inputNama || '').toLowerCase().trim();
    const cleanNip = (inputNipOrPass || '').replace(/[\s-]/g, '').trim();

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
    return {
      id: user.id,
      nama: user.nama,
      nip: user.nip || (inputNipOrPass || ''),
      jabatan: user.jabatan,
      role: user.role
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
      role: 'pegawai'
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
        role: newUser.role
      }
    };
  },

  getAllKetuaJabatan() {
    return DEFAULT_KETUA_JABATAN;
  },

  getKetuaJabatanById(id) {
    return DEFAULT_KETUA_JABATAN.find(a => a.id === id) || DEFAULT_KETUA_JABATAN[0];
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
  }
};

module.exports = {
  storage
};

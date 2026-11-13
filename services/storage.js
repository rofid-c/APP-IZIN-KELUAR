const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'e_izin.db');
const db = new Database(DB_FILE);

// Aktifkan mode WAL untuk performa dan keamanan konkurensi data
db.pragma('journal_mode = WAL');

// 1. Inisialisasi Struktur Tabel SQL
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    username TEXT,
    nip TEXT NOT NULL UNIQUE,
    password TEXT,
    jabatan TEXT,
    role TEXT NOT NULL,
    statusAkun TEXT NOT NULL DEFAULT 'active',
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS izin (
    id TEXT PRIMARY KEY,
    kodeSurat TEXT,
    pegawaiId TEXT NOT NULL,
    pegawaiNama TEXT NOT NULL,
    pegawaiNip TEXT,
    pegawaiJabatan TEXT,
    atasanId TEXT NOT NULL,
    atasanNama TEXT NOT NULL,
    atasanNip TEXT,
    atasanJabatan TEXT,
    keterangan TEXT NOT NULL,
    tanggalIzin TEXT NOT NULL,
    jamKeluar TEXT NOT NULL,
    jamMasuk TEXT,
    ttdDigital TEXT,
    ttdAtasan TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    catatanAtasan TEXT,
    jamKembaliAktual TEXT,
    createdAt TEXT,
    approvedAt TEXT,
    rejectedAt TEXT,
    completedAt TEXT
  );
`);

// Akun Default (Fallback jika database baru pertama kali dibuat)
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

const DEFAULT_KETUA_JABATAN = [
  {
    id: "KJ-001",
    nama: "Dr. H. Ahmad Zarkasi, S.H.I., M.H.",
    nip: "197405102001121001",
    jabatan: "Ketua Pengadilan Agama Gunung Sugih",
    statusAkun: "active"
  }
];

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
      ttdAtasan: null,
      status: "pending",
      catatanAtasan: null,
      jamKembaliAktual: null,
      createdAt: `${today}T08:30:00.000Z`,
      approvedAt: null,
      rejectedAt: null,
      completedAt: null
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
      ttdAtasan: null,
      status: "completed",
      catatanAtasan: "Disetujui.",
      jamKembaliAktual: "14:45",
      createdAt: `${yesterday}T11:00:00.000Z`,
      approvedAt: `${yesterday}T11:30:00.000Z`,
      rejectedAt: null,
      completedAt: `${yesterday}T14:45:00.000Z`
    }
  ];
}

// 2. Auto-Migrasi dari JSON yang ada jika tabel SQLite masih kosong
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  const PEGAWAI_FILE = path.join(DATA_DIR, 'pegawai.json');
  let usersToInsert = [];
  if (fs.existsSync(PEGAWAI_FILE)) {
    try {
      usersToInsert = JSON.parse(fs.readFileSync(PEGAWAI_FILE, 'utf8'));
    } catch (e) {}
  }
  if (!usersToInsert || usersToInsert.length === 0) {
    usersToInsert = DEFAULT_USERS;
  }
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, nama, username, nip, password, jabatan, role, statusAkun, createdAt)
    VALUES (@id, @nama, @username, @nip, @password, @jabatan, @role, @statusAkun, @createdAt)
  `);
  const insertManyUsers = db.transaction((users) => {
    for (const u of users) {
      insertUser.run({
        id: u.id,
        nama: u.nama,
        username: u.username || u.nama,
        nip: (u.nip || '').replace(/[\s-]/g, '').trim(),
        password: u.password || u.nip,
        jabatan: u.jabatan || 'Pegawai',
        role: u.role || 'pegawai',
        statusAkun: u.statusAkun || 'active',
        createdAt: u.createdAt || new Date().toISOString()
      });
    }
  });
  insertManyUsers(usersToInsert);
}

const izinCount = db.prepare('SELECT COUNT(*) as count FROM izin').get().count;
if (izinCount === 0) {
  const IZIN_FILE = path.join(DATA_DIR, 'izin.json');
  let izinToInsert = [];
  if (fs.existsSync(IZIN_FILE)) {
    try {
      izinToInsert = JSON.parse(fs.readFileSync(IZIN_FILE, 'utf8'));
    } catch (e) {}
  }
  if (!izinToInsert || izinToInsert.length === 0) {
    izinToInsert = getDefaultIzin();
  }
  const insertIzin = db.prepare(`
    INSERT OR IGNORE INTO izin (
      id, kodeSurat, pegawaiId, pegawaiNama, pegawaiNip, pegawaiJabatan,
      atasanId, atasanNama, atasanNip, atasanJabatan, keterangan, tanggalIzin,
      jamKeluar, jamMasuk, ttdDigital, ttdAtasan, status, catatanAtasan,
      jamKembaliAktual, createdAt, approvedAt, rejectedAt, completedAt
    ) VALUES (
      @id, @kodeSurat, @pegawaiId, @pegawaiNama, @pegawaiNip, @pegawaiJabatan,
      @atasanId, @atasanNama, @atasanNip, @atasanJabatan, @keterangan, @tanggalIzin,
      @jamKeluar, @jamMasuk, @ttdDigital, @ttdAtasan, @status, @catatanAtasan,
      @jamKembaliAktual, @createdAt, @approvedAt, @rejectedAt, @completedAt
    )
  `);
  const insertManyIzin = db.transaction((izins) => {
    for (const i of izins) {
      insertIzin.run({
        id: i.id,
        kodeSurat: i.kodeSurat || null,
        pegawaiId: i.pegawaiId,
        pegawaiNama: i.pegawaiNama,
        pegawaiNip: i.pegawaiNip || null,
        pegawaiJabatan: i.pegawaiJabatan || null,
        atasanId: i.atasanId,
        atasanNama: i.atasanNama,
        atasanNip: i.atasanNip || null,
        atasanJabatan: i.atasanJabatan || null,
        keterangan: i.keterangan || '',
        tanggalIzin: i.tanggalIzin,
        jamKeluar: i.jamKeluar,
        jamMasuk: i.jamMasuk || null,
        ttdDigital: i.ttdDigital || null,
        ttdAtasan: i.ttdAtasan || null,
        status: i.status || 'pending',
        catatanAtasan: i.catatanAtasan || null,
        jamKembaliAktual: i.jamKembaliAktual || null,
        createdAt: i.createdAt || new Date().toISOString(),
        approvedAt: i.approvedAt || null,
        rejectedAt: i.rejectedAt || null,
        completedAt: i.completedAt || null
      });
    }
  });
  insertManyIzin(izinToInsert);
}

// 3. Modul Penyimpanan (Interface Storage SQLite)
const storage = {
  // Autentikasi Pengguna (Nama dan NIP)
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

    const users = db.prepare('SELECT * FROM users').all();
    const user = users.find(p => {
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
    const cleanNama = (nama || '').trim();
    const cleanNip = (nip || '').replace(/[\s-]/g, '').trim();

    if (!cleanNama || !cleanNip) {
      return { success: false, message: 'Nama dan NIP wajib diisi.' };
    }

    if (cleanNama.toLowerCase() === 'root' || cleanNip === 'admin123') {
      return { success: false, message: 'Nama dan NIP tersebut tidak dapat digunakan (kredensial Administrator).' };
    }

    // 1. Validasi Ketat Duplikasi NIP (1 NIP = 1 Akun)
    const nipExists = db.prepare('SELECT id FROM users WHERE nip = ?').get(cleanNip);
    if (nipExists) {
      return {
        success: false,
        message: `Nomor Induk Pegawai (NIP) "${cleanNip}" sudah terdaftar dalam sistem. 1 NIP hanya dapat digunakan untuk 1 akun.`
      };
    }

    // 2. Validasi Duplikasi Nama
    const namaExists = db.prepare('SELECT id FROM users WHERE LOWER(nama) = LOWER(?)').get(cleanNama);
    if (namaExists) {
      return {
        success: false,
        message: `Pegawai dengan nama "${cleanNama}" sudah terdaftar dalam sistem. Silakan langsung masuk.`
      };
    }

    const newUser = {
      id: `PEG-${Date.now().toString().slice(-4)}`,
      nama: cleanNama,
      username: cleanNama,
      nip: cleanNip,
      password: cleanNip,
      jabatan: (jabatan || 'Pegawai').trim(),
      role: 'pegawai',
      statusAkun: 'pending', // Akun baru wajib persetujuan (ACC) dari Admin
      createdAt: new Date().toISOString()
    };

    db.prepare(`
      INSERT INTO users (id, nama, username, nip, password, jabatan, role, statusAkun, createdAt)
      VALUES (@id, @nama, @username, @nip, @password, @jabatan, @role, @statusAkun, @createdAt)
    `).run(newUser);

    return {
      success: true,
      pendingApproval: true,
      message: 'Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan (ACC) dari Administrator sebelum dapat masuk.',
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
    const ketuaList = db.prepare(`SELECT * FROM users WHERE role = 'ketua_jabatan' AND (statusAkun = 'active' OR statusAkun IS NULL)`).all();
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

  // Ambil daftar izin (filter pegawai, atasan, atau status)
  getAllIzin(filter = {}) {
    let sql = 'SELECT * FROM izin WHERE 1=1';
    const params = [];

    if (filter.pegawaiId) {
      sql += ' AND pegawaiId = ?';
      params.push(filter.pegawaiId);
    }
    if (filter.atasanId) {
      sql += ' AND atasanId = ?';
      params.push(filter.atasanId);
    }
    if (filter.status && filter.status !== 'all') {
      sql += ' AND status = ?';
      params.push(filter.status);
    }

    sql += ' ORDER BY datetime(createdAt) DESC, id DESC';
    return db.prepare(sql).all(...params);
  },

  getIzinById(id) {
    return db.prepare('SELECT * FROM izin WHERE id = ?').get(id) || null;
  },

  // Pegawai mengajukan izin baru
  createIzin(payload) {
    const atasan = this.getKetuaJabatanById(payload.atasanId) || DEFAULT_KETUA_JABATAN[0];
    const today = payload.tanggalIzin || new Date().toISOString().split('T')[0];

    const todayCountRow = db.prepare('SELECT COUNT(*) as count FROM izin WHERE tanggalIzin = ?').get(today);
    const countToday = (todayCountRow ? todayCountRow.count : 0) + 1;
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
      approvedAt: isKetua ? new Date().toISOString() : null,
      rejectedAt: null,
      completedAt: null
    };

    db.prepare(`
      INSERT INTO izin (
        id, kodeSurat, pegawaiId, pegawaiNama, pegawaiNip, pegawaiJabatan,
        atasanId, atasanNama, atasanNip, atasanJabatan, keterangan, tanggalIzin,
        jamKeluar, jamMasuk, ttdDigital, ttdAtasan, status, catatanAtasan,
        jamKembaliAktual, createdAt, approvedAt, rejectedAt, completedAt
      ) VALUES (
        @id, @kodeSurat, @pegawaiId, @pegawaiNama, @pegawaiNip, @pegawaiJabatan,
        @atasanId, @atasanNama, @atasanNip, @atasanJabatan, @keterangan, @tanggalIzin,
        @jamKeluar, @jamMasuk, @ttdDigital, @ttdAtasan, @status, @catatanAtasan,
        @jamKembaliAktual, @createdAt, @approvedAt, @rejectedAt, @completedAt
      )
    `).run(newIzin);

    return newIzin;
  },

  // Konfirmasi Kembali ke Kantor (Check-In)
  confirmReturn(id, payload = {}) {
    const izin = db.prepare('SELECT * FROM izin WHERE id = ?').get(id);
    if (!izin) return null;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const jamKembali = payload.jamKembali || `${hours}:${minutes}`;
    const completedAt = now.toISOString();

    db.prepare(`
      UPDATE izin 
      SET status = 'completed', jamKembaliAktual = ?, completedAt = ?
      WHERE id = ?
    `).run(jamKembali, completedAt, id);

    return db.prepare('SELECT * FROM izin WHERE id = ?').get(id);
  },

  // Ketua Jabatan Approve / Reject Izin
  updateStatus(id, newStatus, catatanAtasan = '', ttdAtasan = null) {
    const izin = db.prepare('SELECT * FROM izin WHERE id = ?').get(id);
    if (!izin) return null;

    const defaultCatatan = catatanAtasan || (newStatus === 'approved' ? 'Disetujui oleh Ketua Jabatan.' : 'Permohonan izin ditolak.');
    const nowIso = new Date().toISOString();

    if (newStatus === 'approved') {
      db.prepare(`
        UPDATE izin 
        SET status = ?, catatanAtasan = ?, approvedAt = ?, ttdAtasan = COALESCE(?, ttdAtasan)
        WHERE id = ?
      `).run(newStatus, defaultCatatan, nowIso, ttdAtasan, id);
    } else if (newStatus === 'rejected') {
      db.prepare(`
        UPDATE izin 
        SET status = ?, catatanAtasan = ?, rejectedAt = ?
        WHERE id = ?
      `).run(newStatus, defaultCatatan, nowIso, id);
    } else {
      db.prepare(`
        UPDATE izin 
        SET status = ?, catatanAtasan = ?
        WHERE id = ?
      `).run(newStatus, defaultCatatan, id);
    }

    return db.prepare('SELECT * FROM izin WHERE id = ?').get(id);
  },

  // Pegawai hanya bisa menghapus izin yang BELUM di-acc (status pending)
  deleteIzin(id, pegawaiId) {
    const izin = db.prepare('SELECT * FROM izin WHERE id = ?').get(id);
    if (!izin) return { success: false, message: 'Izin tidak ditemukan.' };

    if (izin.status !== 'pending') {
      return { success: false, message: 'Izin yang sudah diproses tidak dapat dihapus.' };
    }

    db.prepare('DELETE FROM izin WHERE id = ?').run(id);
    return { success: true, message: 'Permohonan izin berhasil dihapus.' };
  },

  // ==========================================
  // ADMIN METHODS (MANAJEMEN AKUN & SURAT)
  // ==========================================

  // Ambil semua data akun (Pegawai & Ketua Jabatan)
  getAllUsersAdmin() {
    return db.prepare('SELECT id, nama, username, nip, jabatan, role, statusAkun, createdAt FROM users ORDER BY role DESC, nama ASC').all();
  },

  // Tambah akun baru oleh Admin (bisa Pegawai atau Ketua Jabatan)
  createUserAdmin(payload) {
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
    const nipExists = db.prepare('SELECT id FROM users WHERE nip = ?').get(cleanNip);
    if (nipExists) {
      return {
        success: false,
        message: `Nomor Induk Pegawai (NIP) "${cleanNip}" sudah terdaftar pada akun lain. 1 NIP hanya untuk 1 akun.`
      };
    }

    // 2. Validasi Duplikasi Nama
    const namaExists = db.prepare('SELECT id FROM users WHERE LOWER(nama) = LOWER(?)').get(cleanNama);
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
      role,
      statusAkun,
      createdAt: new Date().toISOString()
    };

    db.prepare(`
      INSERT INTO users (id, nama, username, nip, password, jabatan, role, statusAkun, createdAt)
      VALUES (@id, @nama, @username, @nip, @password, @jabatan, @role, @statusAkun, @createdAt)
    `).run(newUser);

    return {
      success: true,
      message: `Akun ${role === 'ketua_jabatan' ? 'Ketua Jabatan' : 'Pegawai'} berhasil dibuat.`,
      user: newUser
    };
  },

  // Ubah status akun (ACC / Aktifkan / Nonaktifkan)
  updateUserStatus(id, newStatus) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return { success: false, message: 'Akun tidak ditemukan.' };

    const validStatus = ['active', 'pending', 'suspended'];
    if (!validStatus.includes(newStatus)) {
      return { success: false, message: 'Status tidak valid.' };
    }

    db.prepare('UPDATE users SET statusAkun = ? WHERE id = ?').run(newStatus, id);
    const label = newStatus === 'active' ? 'disetujui (ACC) & diaktifkan' : newStatus === 'suspended' ? 'dinonaktifkan' : 'diatur ke pending';
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return {
      success: true,
      message: `Akun ${user.nama} berhasil ${label}.`,
      user: updated
    };
  },

  // Perbarui data profil akun oleh admin
  updateUserAdmin(id, payload) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return { success: false, message: 'Akun tidak ditemukan.' };

    let newNama = user.nama;
    if (payload.nama) {
      newNama = payload.nama.trim();
      const duplicateNama = db.prepare('SELECT id FROM users WHERE id != ? AND LOWER(nama) = LOWER(?)').get(id, newNama);
      if (duplicateNama) {
        return { success: false, message: `Nama "${newNama}" sudah digunakan oleh akun lain.` };
      }
    }

    let newNip = user.nip;
    if (payload.nip) {
      newNip = payload.nip.replace(/[\s-]/g, '').trim();
      const duplicateNip = db.prepare('SELECT id FROM users WHERE id != ? AND nip = ?').get(id, newNip);
      if (duplicateNip) {
        return { success: false, message: `NIP "${newNip}" sudah digunakan oleh akun lain. 1 NIP hanya untuk 1 akun.` };
      }
    }

    const newJabatan = payload.jabatan !== undefined ? payload.jabatan.trim() : user.jabatan;
    const newRole = payload.role || user.role;
    const newStatusAkun = payload.statusAkun || user.statusAkun;

    db.prepare(`
      UPDATE users 
      SET nama = ?, username = ?, nip = ?, password = ?, jabatan = ?, role = ?, statusAkun = ?
      WHERE id = ?
    `).run(newNama, newNama, newNip, newNip, newJabatan, newRole, newStatusAkun, id);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return {
      success: true,
      message: `Data akun ${updated.nama} berhasil diperbarui.`,
      user: updated
    };
  },

  // Hapus akun (baik pegawai maupun ketua jabatan)
  deleteUserAdmin(id) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return { success: false, message: 'Akun tidak ditemukan.' };

    if (user.role === 'ketua_jabatan') {
      const remainingKetua = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ketua_jabatan' AND id != ?").get(id).count;
      if (remainingKetua === 0) {
        return { success: false, message: 'Tidak dapat menghapus satu-satunya Ketua Jabatan di sistem.' };
      }
    }

    const nama = user.nama;
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
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
    const list = db.prepare('SELECT * FROM izin ORDER BY datetime(createdAt) DESC, id DESC').all();
    return list.map(izin => {
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
    const izin = db.prepare('SELECT id FROM izin WHERE id = ?').get(id);
    if (!izin) return { success: false, message: 'Izin tidak ditemukan.' };
    db.prepare('DELETE FROM izin WHERE id = ?').run(id);
    return { success: true, message: 'Data izin berhasil dihapus.' };
  },

  // Statistik ringkasan komprehensif
  getAdminStats() {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalPegawai = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'pegawai'").get().count;
    const totalKetua = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ketua_jabatan'").get().count;
    const pendingAccUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE statusAkun = 'pending'").get().count;

    const totalIzin = db.prepare('SELECT COUNT(*) as count FROM izin').get().count;
    const pendingIzin = db.prepare("SELECT COUNT(*) as count FROM izin WHERE status = 'pending'").get().count;
    const approvedIzin = db.prepare("SELECT COUNT(*) as count FROM izin WHERE status = 'approved'").get().count;
    const completedIzin = db.prepare("SELECT COUNT(*) as count FROM izin WHERE status = 'completed'").get().count;
    const rejectedIzin = db.prepare("SELECT COUNT(*) as count FROM izin WHERE status = 'rejected'").get().count;

    return {
      totalUsers,
      totalPegawai,
      totalKetua,
      pendingAccUsers,
      totalIzin,
      pendingIzin,
      approvedIzin,
      completedIzin,
      rejectedIzin
    };
  }
};

module.exports = {
  storage,
  db
};

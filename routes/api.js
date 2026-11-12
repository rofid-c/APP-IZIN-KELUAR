const express = require('express');
const router = express.Router();
const { storage } = require('../services/storage');

// POST /api/login - Login (Pegawai atau Ketua Jabatan)
router.post('/login', (req, res) => {
  const { nama, nip, password } = req.body;
  const credential = nip || password;
  if (!nama || !credential) {
    return res.status(400).json({
      success: false,
      message: 'Nama dan NIP wajib diisi.'
    });
  }

  const user = storage.authenticate(nama, credential);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Nama atau NIP salah. Silakan periksa kembali.'
    });
  }

  if (user.error) {
    return res.status(403).json({
      success: false,
      message: user.message || 'Akun tidak diizinkan masuk.'
    });
  }

  res.json({
    success: true,
    message: 'Login berhasil.',
    user
  });
});

// POST /api/register - Pendaftaran Akun Pegawai Baru
router.post('/register', (req, res) => {
  const { nama, nip, password, jabatan } = req.body;
  const credential = nip || password;
  if (!nama || !credential) {
    return res.status(400).json({
      success: false,
      message: 'Nama dan NIP wajib diisi.'
    });
  }

  const result = storage.registerPegawai(nama, credential, jabatan);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(201).json(result);
});

// GET /api/atasan - Daftar Ketua Jabatan
router.get('/atasan', (req, res) => {
  res.json({ success: true, data: storage.getAllKetuaJabatan() });
});

// GET /api/izin - Daftar Izin (bisa filter pegawaiId, atasanId, status)
router.get('/izin', (req, res) => {
  const { pegawaiId, atasanId, status } = req.query;
  const list = storage.getAllIzin({ pegawaiId, atasanId, status });
  res.json({ success: true, data: list });
});

// GET /api/izin/:id - Detail Izin
router.get('/izin/:id', (req, res) => {
  const item = storage.getIzinById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Izin tidak ditemukan.' });
  }
  res.json({ success: true, data: item });
});

// POST /api/izin - Pegawai Mengajukan Izin (TANPA ESTIMASI KEMBALI)
router.post('/izin', (req, res) => {
  try {
    const { pegawaiId, role, nama, nip, pegawaiNip, jabatan, atasanId, keterangan, tanggalIzin, jamKeluar, jamMasuk, ttdDigital } = req.body;

    if (!atasanId) {
      return res.status(400).json({ success: false, message: 'Pilih Ketua Jabatan Perizinan.' });
    }
    if (!nama || !jabatan || !keterangan || !jamKeluar || !jamMasuk) {
      return res.status(400).json({ success: false, message: 'Nama, jabatan, jam keluar, jam masuk, dan keterangan wajib diisi.' });
    }
    if (!ttdDigital) {
      return res.status(400).json({ success: false, message: 'Harap bubuhkan tanda tangan digital Anda.' });
    }

    const newIzin = storage.createIzin({
      pegawaiId,
      role,
      nama,
      nip: nip || pegawaiNip,
      jabatan,
      atasanId,
      keterangan,
      tanggalIzin,
      jamKeluar,
      jamMasuk,
      ttdDigital
    });

    res.status(201).json({
      success: true,
      message: 'Permohonan izin berhasil diajukan dan sedang menunggu persetujuan Ketua Jabatan.',
      data: newIzin
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/izin/:id/status - Ketua Jabatan Menyetujui atau Menolak Izin
router.post('/izin/:id/status', (req, res) => {
  const { status, catatanAtasan, ttdAtasan } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status harus approved atau rejected.' });
  }

  if (status === 'approved' && !ttdAtasan) {
    return res.status(400).json({ success: false, message: 'Tanda tangan digital Ketua Jabatan wajib dibubuhkan untuk menyetujui izin.' });
  }

  const updated = storage.updateStatus(req.params.id, status, catatanAtasan, ttdAtasan);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Izin tidak ditemukan.' });
  }

  res.json({
    success: true,
    message: status === 'approved' ? 'Permohonan izin berhasil disetujui dan ditandatangani.' : 'Permohonan izin telah ditolak.',
    data: updated
  });
});

// Alias untuk kemudahan request
router.post('/izin/:id/simulate-approval', (req, res) => {
  const { status, catatanAtasan } = req.body;
  const updated = storage.updateStatus(req.params.id, status, catatanAtasan);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Izin tidak ditemukan.' });
  }
  res.json({
    success: true,
    message: status === 'approved' ? 'Izin disetujui.' : 'Izin ditolak.',
    data: updated
  });
});

// POST /api/izin/:id/kembali - Pegawai Konfirmasi Tiba di Kantor (Check-In)
router.post('/izin/:id/kembali', (req, res) => {
  const updated = storage.confirmReturn(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Izin tidak ditemukan.' });
  }
  res.json({
    success: true,
    message: 'Konfirmasi kembali ke kantor berhasil disimpan.',
    data: updated
  });
});

// DELETE /api/izin/:id - Pegawai Menghapus Izin (Hanya yang masih berstatus 'pending')
router.delete('/izin/:id', (req, res) => {
  const { pegawaiId } = req.body || {};
  const result = storage.deleteIzin(req.params.id, pegawaiId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// GET /api/admin/stats — Statistik ringkasan sistem
router.get('/admin/stats', (req, res) => {
  const stats = storage.getAdminStats();
  res.json({ success: true, data: stats });
});

// GET /api/admin/users — Semua data akun (pegawai & ketua jabatan)
router.get('/api/admin/users', (req, res) => {
  const list = storage.getAllUsersAdmin();
  res.json({ success: true, data: list });
});
router.get('/admin/users', (req, res) => {
  const list = storage.getAllUsersAdmin();
  res.json({ success: true, data: list });
});

// GET /api/admin/pegawai (alias)
router.get('/admin/pegawai', (req, res) => {
  const list = storage.getAllUsersAdmin();
  res.json({ success: true, data: list });
});

// POST /api/admin/users — Buat akun baru (Pegawai atau Ketua Jabatan)
router.post('/admin/users', (req, res) => {
  const { nama, nip, jabatan, role, statusAkun } = req.body;
  if (!nama || !nip) {
    return res.status(400).json({ success: false, message: 'Nama dan NIP wajib diisi.' });
  }
  const result = storage.createUserAdmin({ nama, nip, jabatan, role, statusAkun });
  if (!result.success) return res.status(400).json(result);
  res.status(201).json(result);
});

// PUT /api/admin/users/:id/status — Update status akun (ACC / Aktifkan / Nonaktifkan)
router.put('/admin/users/:id/status', (req, res) => {
  const { status } = req.body;
  const result = storage.updateUserStatus(req.params.id, status);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

// PUT /api/admin/users/:id — Edit data akun (Admin)
router.put('/admin/users/:id', (req, res) => {
  const result = storage.updateUserAdmin(req.params.id, req.body);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

// DELETE /api/admin/users/:id — Hapus akun
router.delete('/admin/users/:id', (req, res) => {
  const result = storage.deleteUserAdmin(req.params.id);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

// DELETE /api/admin/pegawai/:id (alias)
router.delete('/admin/pegawai/:id', (req, res) => {
  const result = storage.deleteUserAdmin(req.params.id);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

// GET /api/admin/izin — Semua izin seluruh pegawai beserta alur surat (timeline)
router.get('/admin/izin', (req, res) => {
  const list = storage.getAllIzinAdmin();
  res.json({ success: true, data: list });
});

// DELETE /api/admin/izin/:id — Hapus record izin (admin)
router.delete('/admin/izin/:id', (req, res) => {
  const result = storage.deleteIzinAdmin(req.params.id);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

module.exports = router;

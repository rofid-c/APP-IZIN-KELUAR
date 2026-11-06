const express = require('express');
const path = require('path');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Folder static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'data', 'uploads')));

// Routes API
app.use('/api', apiRoutes);

// Fallback untuk SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  E-IZIN PA GUNUNG SUGIH - VERSI PEGAWAI BERJALAN`);
  console.log(`  Lokal PC : http://localhost:${PORT}`);
  console.log(`  Akses HP : http://192.168.100.232:${PORT}`);
  console.log(`=======================================================`);
});

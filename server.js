const express = require('express');
const path = require('path');
const os = require('os');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

function getNetworkIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if ((iface.family === 'IPv4' || iface.family === 4) && !iface.internal) {
        ips.push({ name, address: iface.address });
      }
    }
  }
  return ips;
}

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
  const ips = getNetworkIps();
  // Prioritaskan Wi-Fi / WLAN jika ada
  const wifiIp = ips.find(i => /wi-fi|wireless|wlan/i.test(i.name)) || ips.find(i => !i.address.startsWith('192.168.56.')) || ips[0];
  const hpIp = wifiIp ? wifiIp.address : 'IP_KOMPUTER';

  console.log(`=======================================================`);
  console.log(`  E-IZIN PA GUNUNG SUGIH - APLIKASI BERJALAN`);
  console.log(`  Lokal PC : http://localhost:${PORT}`);
  console.log(`  Akses HP : http://${hpIp}:${PORT}`);
  console.log(`=======================================================`);
});

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// Konfigurasi anti-rewel untuk server Linux (Codespaces)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

// Sistem Database File Sederhana
const loadDB = () => {
    if (!fs.existsSync('database.json')) fs.writeFileSync('database.json', '{}');
    return JSON.parse(fs.readFileSync('database.json', 'utf8'));
};
const saveDB = (data) => fs.writeFileSync('database.json', JSON.stringify(data, null, 2));

client.on('qr', (qr) => {
    console.log('\n======================================');
    console.log('SCAN QR CODE INI PAKAI WHATSAPP HP-MU');
    console.log('======================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🔥 BINGO! Bot KITA TABUNG sudah online dari GitHub Codespaces!');
});

client.on('message', async msg => {
    const sender = msg.from;
    const text = msg.body.trim();
    const args = text.split(' ');
    const command = args[0].toLowerCase();

    let db = loadDB();
    if (!db[sender]) {
        db[sender] = { saldo: 0, history: [] };
        saveDB(db);
    }

    if (command === '!masuk') {
        const nominal = parseInt(args[1]);
        const keterangan = args.slice(2).join(' ') || 'Pemasukan';
        if (!nominal) return msg.reply('Format salah! Ketik: !masuk 50000 Gaji');

        db[sender].saldo += nominal;
        db[sender].history.push({ tipe: 'IN', nominal, keterangan, tanggal: new Date().toLocaleString('id-ID') });
        saveDB(db);
        msg.reply(`✅ *Pemasukan Dicatat!*\nNominal: Rp ${nominal.toLocaleString('id-ID')}\nKet: ${keterangan}\n💰 Saldo Sekarang: Rp ${db[sender].saldo.toLocaleString('id-ID')}`);
    }

    else if (command === '!keluar') {
        const nominal = parseInt(args[1]);
        const keterangan = args.slice(2).join(' ') || 'Pengeluaran';
        if (!nominal) return msg.reply('Format salah! Ketik: !keluar 20000 Bensin');

        db[sender].saldo -= nominal;
        db[sender].history.push({ tipe: 'OUT', nominal, keterangan, tanggal: new Date().toLocaleString('id-ID') });
        saveDB(db);
        msg.reply(`💸 *Pengeluaran Dicatat!*\nNominal: Rp ${nominal.toLocaleString('id-ID')}\nKet: ${keterangan}\n💰 Saldo Sekarang: Rp ${db[sender].saldo.toLocaleString('id-ID')}`);
    }

    else if (command === '!saldo') {
        const userData = db[sender];
        let historyText = userData.history.slice(-5).map(h => 
            `${h.tipe === 'IN' ? '🟢' : '🔴'} Rp ${h.nominal.toLocaleString('id-ID')} - ${h.keterangan}`
        ).join('\n');

        msg.reply(`💳 *DOMPET KITA TABUNG*\n\nTotal Uang Kamu: *Rp ${userData.saldo.toLocaleString('id-ID')}*\n\n*Transaksi Terakhir:*\n${historyText || 'Belum ada transaksi.'}`);
    }
});

client.initialize();

#!/usr/bin/env node
/**
 * Generate WhatsApp broadcast links from a CSV of MABA data.
 *
 * Input CSV columns (header row required):
 *   Nama MABA, Kontak MABA, Nama PIC, Angakatan PIC
 *
 * Usage:
 *   node generate-wa-links.js input.csv output.csv
 */

const fs = require('fs');
const path = require('path');

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
    console.error('Usage: node generate-wa-links.js <input.csv> <output.csv>');
    process.exit(1);
}

function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    // Normalize line endings, keep newlines inside quoted fields intact
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (inQuotes) {
            if (char === '"' && next === '"') {
                field += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                field += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                row.push(field);
                field = '';
            } else if (char === '\r') {
                // skip, \n handles the line break
            } else if (char === '\n') {
                row.push(field);
                rows.push(row);
                row = [];
                field = '';
            } else {
                field += char;
            }
        }
    }
    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    return rows.filter(r => r.some(cell => cell.trim() !== ''));
}

function csvEscape(value) {
    const str = String(value ?? '');
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function toCsvRow(values) {
    return values.map(csvEscape).join(',');
}

function formatPhone(raw) {
    let phone = String(raw ?? '').replace(/\D/g, '');
    if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1);
    }
    return phone;
}

function buildMessage({ namaMaba, namaPic, angkatanPic }) {
    return `Bismillah, Assalamualaikum!
Haloo ${namaMaba}! Perkenalkan, aku ${namaPic} dari Fasilkom ${angkatanPic}. Aku dapat kontak kamu dari Adkesma BEM Pacil UI 🙏😊
Selamat yaaa sudah menjadi bagian dari Pacil UI! 🥳 Semoga perjalanan kuliahnya nanti dimudahkan dan dipenuhi pengalaman yang berharga, aamiin.
Aku izin menghubungi kamu sebagai perwakilan dari FUKI Fasilkom UI 2026. Dari data yang kamu isi melalui GForm Adkesma BEM Pacil UI, kamu terdata pernah mengikuti mentoring keagamaan sebelumnya. Karena itu, aku mau mengajak kamu untuk melanjutkan mentoring keagamaan Islam di UI! ✨
Mentoring ini nantinya menjadi wadah untuk belajar dan bertumbuh bersama dalam suasana Islami, dengan 1 kakak mentor dan beberapa teman satu kelompok (baik itu pacil atau fakultas lain). Selain belajar keislaman, insyaAllah mentoring juga bisa menjadi tempat untuk sharing, diskusi, saling support dalam perkuliahan, dan tentunya menambah relasi dengan kakak tingkat maupun teman-teman pacil dan ui lainnya.
Kalau kamu tertarik untuk melanjutkan mentoring di Pacil UI, kamu bisa langsung mendaftarkan diri melalui:
🔗 https://www.yukmentoringui.id/
Nanti pendaftarannya akan diproses terlebih dahulu, dan akan dikabari lagi ketika mentor dan kelompok mentoringmu sudah terbentuk 🙌😊
Kalau ada yang ingin ditanyakan tentang mentoringnya, boleh banget langsung tanyakan ke aku yaa! Jangan sungkan 🤗✨
Semoga Allah mudahkan langkah kita untuk terus belajar dan bertumbuh bersama. Yassarallah!`;
}

const rawText = fs.readFileSync(path.resolve(inputPath), 'utf8');
const rows = parseCsv(rawText);

if (rows.length < 2) {
    console.error('CSV kosong atau tidak ada data setelah header.');
    process.exit(1);
}

const header = rows[0].map(h => h.trim());
const col = {
    namaMaba: header.indexOf('Nama MABA'),
    kontakMaba: header.indexOf('Kontak MABA'),
    namaPic: header.indexOf('Nama PIC'),
    angkatanPic: header.indexOf('Angakatan PIC'),
};

const missingCols = Object.entries(col)
    .filter(([, idx]) => idx === -1)
    .map(([key]) => key);
if (missingCols.length > 0) {
    console.error(`Kolom tidak ditemukan di header CSV: ${missingCols.join(', ')}`);
    console.error(`Header yang terbaca: ${header.join(' | ')}`);
    process.exit(1);
}

const outRows = [
    ['Nama MABA', 'Kontak MABA', 'Nama PIC', 'Angakatan PIC', 'Link WhatsApp', 'Catatan'],
];

let warningCount = 0;

for (const row of rows.slice(1)) {
    const namaMaba = (row[col.namaMaba] ?? '').trim();
    const kontakMaba = (row[col.kontakMaba] ?? '').trim();
    const namaPic = (row[col.namaPic] ?? '').trim();
    const angkatanPic = (row[col.angkatanPic] ?? '').trim();

    const missingFields = [];
    if (!namaMaba) missingFields.push('Nama MABA');
    if (!kontakMaba) missingFields.push('Kontak MABA');
    if (!namaPic) missingFields.push('Nama PIC');
    if (!angkatanPic) missingFields.push('Angakatan PIC');

    if (missingFields.length > 0) {
        warningCount++;
        outRows.push([namaMaba, kontakMaba, namaPic, angkatanPic, '', `Data kosong: ${missingFields.join(', ')}`]);
        continue;
    }

    const phone = formatPhone(kontakMaba);
    const message = buildMessage({ namaMaba, namaPic, angkatanPic });
    const link = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

    outRows.push([namaMaba, kontakMaba, namaPic, angkatanPic, link, '']);
}

const outText = outRows.map(toCsvRow).join('\n') + '\n';
fs.writeFileSync(path.resolve(outputPath), outText, 'utf8');

console.log(`Selesai. ${outRows.length - 1} baris diproses -> ${outputPath}`);
if (warningCount > 0) {
    console.log(`Peringatan: ${warningCount} baris punya data kosong dan tidak menghasilkan link (lihat kolom Catatan).`);
}

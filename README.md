# Generate WhatsApp Links

Script Node.js untuk generate link WhatsApp (dengan pesan broadcast Yuk Mentoring UI yang sudah terisi otomatis) dari data spreadsheet, tanpa perlu isi form satu-satu di [index.html](index.html).

## Kebutuhan

- [Node.js](https://nodejs.org/) sudah terinstal (cek dengan `node -v`).

## Cara Pakai

1. Siapkan file CSV input. Lihat contoh format di [template-input.csv](template-input.csv), atau export dari Google Sheets/Excel ke format CSV dengan kolom berikut (nama header harus persis sama):

   | Nama MABA | Kontak MABA | Nama PIC | Angakatan PIC |
   |-----------|--------------|----------|----------------|
   | Dika      | 081234567890 | Ali      | 2023           |
   | Sarah     | 081298765432 | Rio      | 2022           |

   - **Nama MABA**: nama peserta/maba yang mau dihubungi.
   - **Kontak MABA**: nomor WhatsApp, boleh format `08xx...` atau `62xx...`.
   - **Nama PIC**: nama pengajak/pengirim pesan.
   - **Angakatan PIC**: angkatan pengajak (contoh: `2023`).

2. Jalankan script dari folder project ini:

   ```bash
   node generate-wa-links.js <file-input.csv> <file-output.csv>
   ```

   Contoh pakai file template:

   ```bash
   node generate-wa-links.js template-input.csv output.csv
   ```

3. Buka `output.csv`. Akan ada kolom tambahan:
   - **Link WhatsApp**: link siap klik (`https://api.whatsapp.com/send?phone=...&text=...`) yang otomatis membuka chat WhatsApp dengan pesan sudah terisi.
   - **Catatan**: terisi kalau ada data yang kosong di baris tersebut (baris itu tidak menghasilkan link).

## Catatan

- Nomor yang diawali `0` otomatis diubah ke awalan `62`.
- Baris dengan data kosong (Nama MABA/Kontak MABA/Nama PIC/Angakatan PIC) akan dilewati dan ditandai di kolom Catatan, bukan menghasilkan link yang salah.
- Isi pesan broadcast mengikuti template yang sama dengan [index.html](index.html). Kalau teks broadcast di halaman itu diubah, sesuaikan juga fungsi `buildMessage` di [generate-wa-links.js](generate-wa-links.js) supaya tetap sinkron.

# Gemini AI Chatbot

![[Gambar dari Cuplikan Layar Chatbot](https://i.ibb.co/684bq3Y/gemini-chatbot-ss.png)]

Ini adalah proyek chatbot sederhana namun kuat yang menggunakan **Node.js** dan **Express** untuk backend, serta **Vanilla JavaScript** untuk frontend. Chatbot ini didukung oleh model AI generatif Google, **Gemini**, untuk memberikan respons yang cerdas dan dinamis.

Proyek ini dibuat sebagai contoh bagaimana mengintegrasikan API Gemini ke dalam aplikasi web modern dengan pengalaman pengguna yang responsif dan menarik.

---

## Teknologi yang Digunakan

-   **Backend**: Node.js, Express.js
-   **Frontend**: HTML5, CSS3, Vanilla JavaScript
-   **AI Model**: Google Gemini (via `@google/generative-ai`)
-   **Styling**: Tailwind CSS
-   **Fitur Tambahan**:
    -   `dotenv` untuk manajemen variabel lingkungan.
    -   `cors` untuk menangani Cross-Origin Resource Sharing.
    -   `showdown` untuk merender respons Markdown menjadi HTML.

---

## Fitur Unggulan

-   **Integrasi Gemini AI**: Terhubung langsung dengan model `gemini-1.5-flash` untuk respons yang relevan dan kontekstual.
-   **Antarmuka Responsif**: Tampilan yang bersih dan modern menggunakan Tailwind CSS, berfungsi dengan baik di desktop maupun perangkat seluler.
-   **Rendering Markdown**: Respons dari bot yang mengandung format Markdown (seperti blok kode, daftar, tebal, miring) akan ditampilkan dengan gaya yang rapi.
-   **Indikator Mengetik (Typing Indicator)**: Pengalaman pengguna ditingkatkan dengan animasi loading yang halus saat bot sedang menyiapkan respons.
-   **Struktur Proyek Sederhana**: Kode yang mudah dipahami dengan pemisahan yang jelas antara logika frontend dan backend.

---

## Instalasi dan Pengaturan

Untuk menjalankan proyek ini di lingkungan lokal Anda, ikuti langkah-langkah berikut:

1.  **Clone Repositori**
    ```bash
    git clone [URL-repositori-Anda]
    cd gemini-chatbot-api
    ```

2.  **Install Dependencies**
    Gunakan `npm` untuk menginstal semua paket yang diperlukan yang tercantum dalam `package.json`.
    ```bash
    npm install
    ```

3.  **Buat File `.env`**
    Buat file bernama `.env` di direktori utama proyek. File ini akan menyimpan API Key Anda.

4.  **Tambahkan Google API Key**
    Buka file `.env` dan tambahkan API Key Anda dari Google AI Studio.
    ```
    GOOGLE_API_KEY="MASUKKAN_API_KEY_ANDA_DISINI"
    ```

---

## Cara Menjalankan

Setelah instalasi selesai, jalankan perintah berikut di terminal untuk memulai server backend:

```bash
npm start
```
atau
```bash
node index.js
```

Server akan berjalan, dan Anda akan melihat pesan:
`Server is running on http://localhost:3000`

Buka browser Anda dan kunjungi **`http://localhost:3000`** untuk mulai berinteraksi dengan chatbot.

---

## Struktur Proyek

```
gemini-chatbot-api/
├── node_modules/       # Dependensi proyek
├── public/             # Semua file frontend
│   ├── index.html    # Struktur utama halaman
│   ├── script.js     # Logika frontend (Fetch API, DOM)
│   └── style.css     # Styling & animasi
│
├── .env                # Menyimpan variabel rahasia (API Key)
├── index.js            # File utama server Express & endpoint API
├── package.json        # Metadata & daftar dependensi proyek
└── README.md           # Dokumentasi ini

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = 3000;

// konfiguracja uploadu
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/tiff', 'application/pdf', 'application/x-photoshop'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Dozwolone tylko formaty: JPG, TIFF, PDF, PSD'));
        }
    }
});

// formularz
app.get('/', (req, res) => {
    res.send(`
        <h2>Sprawdzanie plików media( jpg, tiff, PDF, PSD)</h2>
        <form action="/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="mediaFile" accept=".jpg,.tiff,.pdf,.psd" required />
            <button type="submit">Sprawdź plik</button>
        </form>
    `);
});

// obsługa uploadu
app.post('/upload', upload.single('mediaFile'), async (req, res) => {

    if (!req.file) {
        return res.send("Nie przesłano pliku.");
    }

    const filePath = path.join(__dirname, req.file.path);

    try {

        let html = '<h3>Parametry pliku:</h3><ul>';

        html += container === 'WAVE'
            ? '<li>Plik w formacie WAV.</li>'
            : '<li>Plik nie jest w formacie WAV.</li>';

        html += sampleRate === REQUIRED_SAMPLE_RATE
            ? `<li>Poprawna częstotliwość: ${sampleRate} Hz.</li>`
            : `<li>Niepoprawna częstotliwość: ${sampleRate} Hz (wymagane ${REQUIRED_SAMPLE_RATE} Hz).</li>`;

        html += bitsPerSample === REQUIRED_BIT_DEPTH
            ? `<li>Poprawna głębia bitowa: ${bitsPerSample} bit.</li>`
            : `<li>Niepoprawna głębia bitowa: ${bitsPerSample} bit (wymagane ${REQUIRED_BIT_DEPTH} bit).</li>`;

        html += '</ul><a href="/">Wróć</a>';
        fs.unlink(filePath);

        res.type('html').end(html);
    } catch (err) {
        fs.unlink(filePath);
        res.send("Błąd podczas analizy pliku: " + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});

const express = require('express');
const multer = require('multer');
const mm = require('music-metadata');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = 3000;

const REQUIRED_SAMPLE_RATE = 44100;
const REQUIRED_BIT_DEPTH = 16;

// konfiguracja uploadu
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/wav', 'audio/x-wav'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Dozwolony tylko format WAV'));
        }
    }
});

// formularz
app.get('/', (req, res) => {
    res.send(`
        <h2>Sprawdzanie pliku audio WAV</h2>
        <form action="/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="audioFile" accept=".wav" required />
            <button type="submit">Sprawdź plik</button>
        </form>
    `);
});

// obsługa uploadu
app.post('/upload', upload.single('audioFile'), async (req, res) => {

    if (!req.file) {
        return res.send("Nie przesłano pliku.");
    }

    const filePath = path.join(__dirname, req.file.path);

    try {
        const metadata = await mm.parseFile(filePath);

        const { sampleRate, bitsPerSample, container } = metadata.format;

        let html = '<h3>Parametry pliku:</h3><ul>';

        html += container === 'WAVE'
            ? '<li>Plik w formacie WAV.</li>'
            : `<li>Plik nie jest w formacie WAV(jest w formacie ${container}).</li>`;

        html += sampleRate === REQUIRED_SAMPLE_RATE
            ? `<li>Poprawna częstotliwość: ${sampleRate} Hz.</li>`
            : `<li>Niepoprawna częstotliwość: ${sampleRate} Hz (wymagane ${REQUIRED_SAMPLE_RATE} Hz).</li>`;

        html += bitsPerSample === REQUIRED_BIT_DEPTH
            ? `<li>Poprawna głębia bitowa: ${bitsPerSample} bit.</li>`
            : `<li>Niepoprawna głębia bitowa: ${bitsPerSample} bit (wymagane ${REQUIRED_BIT_DEPTH} bit).</li>`;

        html += '</ul><a href="/">Wróć</a>';
        await fs.unlink(filePath);

        res.type('html').end(html);
    } catch (err) {
        await fs.unlink(filePath);
        res.send("Błąd podczas analizy pliku: " + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});



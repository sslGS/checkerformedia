const express = require('express');
const multer = require('multer');
const mm = require('music-metadata');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

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

        let errors = [];

        if (container !== 'WAVE') {
            errors.push(`Plik nie jest w formacie WAV.`);
        }

        if (sampleRate !== 44100) {
            errors.push(`Niepoprawna częstotliwość: ${sampleRate} Hz (wymagane 44100 Hz).`);
        }

        if (bitsPerSample !== 16) {
            errors.push(`Niepoprawna głębia bitowa: ${bitsPerSample} bit (wymagane 16 bit).`);
        }

        fs.unlinkSync(filePath); // usuń plik po sprawdzeniu

        if (errors.length > 0) {
            res.send(`
                <h3>❌ Plik NIE spełnia wymagań:</h3>
                <ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>
                <a href="/">Wróć</a>
            `);
        } else {
            res.send(`
                <h3>✅ Plik spełnia wymagania:</h3>
                <ul>
                    <li>Format: WAV</li>
                    <li>Sample Rate: 44.1 kHz</li>
                    <li>Bit Depth: 16 bit</li>
                </ul>
                <a href="/">Sprawdź kolejny plik</a>
            `);
        }

    } catch (err) {
        fs.unlinkSync(filePath);
        res.send("Błąd podczas analizy pliku: " + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});



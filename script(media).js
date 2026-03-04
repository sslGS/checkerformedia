const express = require('express');
const multer = require('multer');
const mm = require('sharp');
const pdfParse = require('pdf-parse');
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
        const metadata = await mm(filePath).metadata();
        let html = '<h3>Parametry pliku:</h3><ul>';
        if(metadata.format === 'jpg' || metadata.format === 'tiff' || metadata.format === 'jpeg' || metadata.format === 'tif') {
            html += `<li>Plik w formacie ${metadata.format}</li>`;
            html += `<li> CMYK: ${metadata.space === 'cmyk' ? 'Tak' : 'Nie'}</li>`;
            html += `<li> Rozdielczość: ${metadata.density === 300 ? '300 DPI' : `błędny DPI (${metadata.density})`}</li>`;
        } else if(path.extname(req.file.originalname).toLowerCase() === '.pdf') {
            const dataBuffer = await fs.readFileSync(filePath);
            const pdfData = await pdfPaserse(dataBuffer);
            html += `<li>Plik w formacie PDF</li>`;
            if(pdfData.text && pdfData.text.length > 0) { 
                html += `<li>Plik prawdopodobnie nie zamieniony na krzywe (zawiera tekst)</li>`;
            }
        }

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

const express = require('express');
const multer = require('multer');
const mm = require('sharp');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
const path = require('path');
const fs = require('fs/promises');
const {default: Psd} = require('@webtoon/psd');
const app = express();
const PORT = 3000;

// konfiguracja uploadu
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {

        const allowedMime = [
            'image/jpeg',
            'image/tiff',
            'application/pdf',
            'application/x-photoshop',
            'image/vnd.adobe.photoshop',
            'application/octet-stream'
        ];

        const allowedExt = ['.jpg', '.jpeg', '.tif', '.tiff', '.pdf', '.psd'];

        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedMime.includes(file.mimetype) || allowedExt.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Dozwolone tylko formaty: JPG, TIFF, PDF, PSD'));
        }
    }
});

async function analyzePDF(filePath) {

    const data = new Uint8Array(await fs.readFile(filePath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    let hasFonts = false;
    let hasCMYK = true;
    let dpiIssues = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

        const page = await pdf.getPage(pageNum);
        const ops = await page.getOperatorList();

        const { fnArray, argsArray } = ops;

        for (let i = 0; i < fnArray.length; i++) {

            const fn = fnArray[i];

            // font detection
            if (fn === pdfjsLib.OPS.setFont) {
                hasFonts = true;
            }

            // image detection
            if (
                fn === pdfjsLib.OPS.paintImageXObject ||
                fn === pdfjsLib.OPS.paintInlineImageXObject
            ) {

                const imgName = argsArray[i][0];
                const img = await page.objs.get(imgName);

                if (img) {

                    // sprawdzanie przestrzeni kolorów
                    if (img.kind !== 3) {
                        hasCMYK = false;
                    }

                    // przybliżony DPI
                    const {width, height} = img

                    const viewport = page.getViewport({ scale: 1 });
                    const pageWidthInch = viewport.width / 72;

                    const dpi = width / pageWidthInch;

                    if (dpi < 300) {
                        dpiIssues.push(Math.round(dpi));
                    }
                }
            }
        }
    }

    return {
        hasFonts,
        hasCMYK,
        dpiIssues
    };
}

async function analyzePSD(filePath) {

    const buffer = await fs.readFile(filePath);

    // konwersja Buffer -> ArrayBuffer
    const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
    );

    const psd = Psd.parse(arrayBuffer);
    const { width, height, depth, colorMode} = psd;
    const isCMYK = colorMode === 4;

    return {
        width,
        height,
        depth,
        isCMYK
    };
}

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

        const ext = path.extname(req.file.originalname).toLowerCase();

        if (ext === '.jpg' || ext === '.jpeg' || ext === '.tiff' || ext === '.tif') {

            const metadata = await mm(filePath).metadata();

            html += `<li>Plik w formacie ${metadata.format}</li>`;
            html += `<li>CMYK: ${metadata.space === 'cmyk' ? 'Tak' : 'Nie'}</li>`;
            html += `<li>Rozdzielczość: ${metadata.density === 300
                    ? '300 DPI'
                    : `błędny DPI (${metadata.density || 'brak danych'})`
                }</li>`;
        }

        else if (ext === '.pdf') {

            html += `<li>Plik w formacie PDF</li>`;

            const pdfInfo = await analyzePDF(filePath);

            html += `<li>Fonty w pliku: ${pdfInfo.hasFonts
                    ? 'TAK (prawdopodobnie brak krzywych)'
                    : 'BRAK (fonty zamienione na krzywe)'
                }</li>`;

            html += `<li>CMYK: ${pdfInfo.hasCMYK ? 'Tak' : 'Nie (RGB wykryty)'}</li>`;

            if (pdfInfo.dpiIssues.length > 0) {
                html += `<li>Obrazy poniżej 300 DPI: ${pdfInfo.dpiIssues.join(', ')}</li>`;
            } else {
                html += `<li>Rozdzielczość obrazów: OK (≥300 DPI)</li>`;
            }
        }

        else if (ext === '.psd') {

            html += `<li>Plik PSD</li>`;

            const psdInfo = await analyzePSD(filePath);

            html += `<li>Wymiary: ${psdInfo.width} × ${psdInfo.height} px</li>`;
            html += `<li>CMYK: ${psdInfo.isCMYK ? 'Tak' : 'Nie (RGB)'}</li>`;
            html += `<li>Bit depth: ${psdInfo.depth === 8 ? '8 bit (OK)' : `niepoprawny (${psdInfo.depth})`
                }</li>`;
        }

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

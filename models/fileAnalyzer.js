const { sharp, pdfjsLib, Psd, path, fs} = require('../modules');
async function analyzeImage(filePath) {

    const metadata = await sharp(filePath).metadata();

    return {
        type: "image",
        format: metadata.format,
        cmyk: metadata.space === 'cmyk',
        dpi: metadata.density
    };
}

async function analyzePDF(filePath) {

    const data = new Uint8Array(await fs.readFile(filePath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    let hasFonts = 0;
    let hasCMYK = 1;
    let dpiIssues = [];
    
        for (let pageNum = 1, pages = pdf.numPages; pageNum <= pages; ++pageNum) {
    
            const page = await pdf.getPage(pageNum);
            const ops = await page.getOperatorList();
    
            const { fnArray, argsArray } = ops;
    
            for (let i = 0, len = fnArray.length; i < len; ++i) {
    
                const fn = fnArray[i];
    
                // font detection
                if (fn === pdfjsLib.OPS.setFont) {hasFonts = 1};
    
                // image detection
                if (
                    fn === pdfjsLib.OPS.paintImageXObject ||
                    fn === pdfjsLib.OPS.paintInlineImageXObject
                ) {
                    const img = await page.objs.get(argsArray[i][0]);
    
                    if (img) {
    
                        // sprawdzanie przestrzeni kolorów
                        if (img.kind !== 3) {
                            hasCMYK = 0;
                        }
    
                        // przybliżony DPI
                        const { width, height } = img
    
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
            type: 'PDF',
            Fonty: hasFonts,
            CMYK: hasCMYK,
            DPI: dpiIssues
        };
}

async function analyzePSD(filePath) {

    const buffer = await fs.readFile(filePath);

    const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
    );

    const psd = Psd.parse(arrayBuffer);

    return {
        type: "PSD",
        width: psd.width,
        height: psd.height,
        depth: psd.depth,
        cmyk: psd.colorMode === 4
    };
}

exports.analyze = async (filePath, filename) => {

    const ext = path.extname(filename).toLowerCase();

    if (['.jpg', '.jpeg', '.tiff', '.tif'].includes(ext)) {
        return analyzeImage(filePath);
    }

    if (ext === '.pdf') {
        return analyzePDF(filePath);
    }

    if (ext === '.psd') {
        return analyzePSD(filePath);
    }

    throw new Error("Nieobsługiwany format");
};
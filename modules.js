module.exports = {
    express: require('express').default,
    multer: require('multer'),
    sharp: require('sharp'),
    pdfjsLib: require('pdfjs-dist/legacy/build/pdf.mjs'),
    Psd: require('@webtoon/psd').default,
    path: require('path'),
    fs: require('fs/promises'),
    uploadRoutes: require('./routes/uploadRoutes'),
    uploadController: require('./controllers/uploadController'),
    analyzer: require('./models/fileAnalyzer.js')
};
const {express, multer, path, uploadController} = require('../modules');

const router = express.Router();

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

router.get('/', uploadController.showForm);
router.post('/upload', upload.single('mediaFile'), uploadController.uploadFile);

module.exports = router;
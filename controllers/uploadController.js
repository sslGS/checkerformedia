const {path, fs, analyzer, view} = require('../modules');
exports.showForm = (req, res) => {
    res.send(view.form());
};

exports.uploadFile = async (req, res) => {

    if (!req.file) {
        return res.send("Nie przesłano pliku.");
    }

    const filePath = path.join(__dirname, '..', req.file.path);

    try {

        const result = await analyzer.analyze(filePath, req.file.originalname);

        await fs.unlink(filePath);

        res.send(view.result(result));

    } catch (err) {

        await fs.unlink(filePath);

        res.send("Błąd podczas analizy pliku: " + err.message);
    }
};
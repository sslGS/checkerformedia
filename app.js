const {express, uploadRoutes} = require('./modules');

const app = express();
const PORT = 3000;

app.use('/', uploadRoutes);

app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});
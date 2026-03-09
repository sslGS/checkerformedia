exports.form = () => `
<h2>Sprawdzanie plików media</h2>

<form action="/upload" method="post" enctype="multipart/form-data">
<input type="file" name="mediaFile" accept=".jpg,.tiff,.pdf,.psd" required />
<button type="submit">Sprawdź plik</button>
</form>
`;

exports.result = (data) => {

    let html = `<h3>Wynik analizy</h3><ul>`;

    for (let key in data) {
        html += `<li>${key}: ${data[key]}</li>`;
    }

    html += `</ul><a href="/">Wróć</a>`;

    return html;
};
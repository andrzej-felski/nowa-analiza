function pobierzHarmonogram(oferta) {
    let wynik = [];
    let i = 1;
    while(true){
        let od = oferta["okres_od_" + i];
        if(!od){
            break;
        }
        wynik.push({
            od: Number(od),
            do: Number(oferta["okres_do_" + i]),
            cena: Number(oferta["cena_" + i])
        });
        i++;
    }
    return wynik;
}

function pokazParametryWyniku(oferta){
    switch (wybor.usluga) {
        case "internet":
            return `
                Prędkość:
                ${oferta.predkosc_pobierania} /
                ${oferta.predkosc_wysylania} Mb/s
            `;
        default:
            return "";
    }
}

function pokazWynik(oferta, konkurenci){
    let html = "";
    html += generujAkordeon(oferta);
    html += `
        <h2>Konkurencja</h2>
    `;
    konkurenci.forEach(k=>{
        html += generujAkordeon(k);
    });
    document.getElementById("wynik")
        .innerHTML = html;
	aktywujAkordeony();
}

function pobierzNazweFirmy(idFirmy) {
    let firma = dane.firmy.find(
        f => f.id_firmy == idFirmy
    );
    return firma
        ? firma.nazwa_firmy
        : idFirmy;
}

function policzSredniaCene(oferta){
    let harmonogram =
        pobierzHarmonogram(oferta);
    let suma = 0;
    let miesiace = 0;
    harmonogram.forEach(okres=>{
        let liczbaMiesiecy =
            okres.do - okres.od + 1;
        suma += liczbaMiesiecy * okres.cena;
        miesiace += liczbaMiesiecy;
    });
    return suma / miesiace;
}

function generujNaglowek(oferta){
    let srednia =
        policzSredniaCene(oferta)
        .toFixed(2);
    return `
        <div class="akordeon-naglowek">
            <strong>
                ${pobierzNazweFirmy(oferta.id_firmy)}
            </strong>
            <span>
                ${oferta.nazwa_oferty}
            </span>
            <span>
                ${oferta.predkosc_pobierania}/
                ${oferta.predkosc_wysylania}
                Mb/s
            </span>
            <span>
                ${srednia} zł/mies.
            </span>
        </div>
    `;
}

function generujTresc(oferta){
    let harmonogram =
        pobierzHarmonogram(oferta);
    let tabela = "";
    harmonogram.forEach(o=>{
        tabela += `
        <tr>
            <td>
            ${o.od}-${o.do}
            miesiąc
            </td>
            <td>
            ${o.cena} zł
            </td>
        </tr>
        `;
    });
    return `
    <div class="akordeon-tresc">
        <table>
            ${tabela}
        </table>
        <h4>Dodatki</h4>
        <p>
            ${oferta.dodatki || ""}
        </p>
        <h4>Uwagi</h4>
        <p>
            ${oferta.uwagi || ""}
        </p>
    </div>
    `;
}

function generujAkordeon(oferta){
	return `
	<div class="akordeon">
		${generujNaglowek(oferta)}
		${generujTresc(oferta)}
	</div>
	`;
}

function aktywujAkordeony(){
    document
    .querySelectorAll(".akordeon-naglowek")
    .forEach(naglowek => {
        naglowek.addEventListener("click", function(){
            this.parentElement
                .classList.toggle("otwarty");
        });
    });
}

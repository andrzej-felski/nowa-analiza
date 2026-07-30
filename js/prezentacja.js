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

function pokazParametryOferty(oferta){
    switch (wybor.usluga) {
        case "internet":
            return `
                <p>
                    <strong>Prędkość pobierania:</strong>
                    ${oferta.predkosc_pobierania} Mb/s
                </p>
                <p>
                    <strong>Prędkość wysyłania:</strong>
                    ${oferta.predkosc_wysylania} Mb/s
                </p>
            `;
        default:
            return "";
    }
}

function pokazDlugoscUmowy(oferta){
    return pokazOkres(oferta.okres_umowy);
}

function pokazWynik(oferta, konkurenci){
    let sredniaNaszej =
        policzSredniaCene(oferta);
    konkurenci.sort((a,b)=>
        policzSredniaCene(a) -
        policzSredniaCene(b)
    );
    let html = "";
    html += generujAkordeon(
        oferta,
        sredniaNaszej,
        true
    );
    html += `
        <h2>Konkurencja</h2>
    `;
    konkurenci.forEach(k=>{
        html += generujAkordeon(
            k,
            sredniaNaszej,
            false
        );
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

function generujNaglowek(oferta, sredniaBazowa, nasza){
    let srednia = policzSredniaCene(oferta);
    let roznica = "";
    let klasa = "";
    if(!nasza){
        let wartosc = srednia - sredniaBazowa;
        if(wartosc > 0){
            klasa = "konkurencja-drozsza";
            roznica =
                `Drożej o ${wartosc.toFixed(2)} zł/mies.`;
        }
        if(wartosc < 0){
            klasa = "konkurencja-tansza";
            roznica =
                `Taniej o ${Math.abs(wartosc).toFixed(2)} zł/mies.`;
        }
        if(wartosc === 0){
            roznica = "Taka sama cena";
        }
    }
    return `
    <div class="akordeon-naglowek ${klasa}">
        <div class="naglowek-lewa">
            <strong>
                ${pobierzNazweFirmy(oferta.id_firmy)}
            </strong>
            <span>
                ${oferta.nazwa_oferty}
            </span>
            ${pokazParametrNaglowka(oferta)}
        </div>
        <div class="naglowek-prawa">
            <strong>
                ${srednia.toFixed(2)} zł/mies.
            </strong>
            ${
                roznica
                ? `<span>${roznica}</span>`
                : ""
            }
            <span class="strzalka">▼</span>
        </div>
    </div>
    `;
}

function pokazParametrNaglowka(oferta){
    switch (wybor.usluga) {
        case "internet":
            return `
                <span>
                    ${oferta.predkosc_pobierania} /
                    ${oferta.predkosc_wysylania}
                    Mb/s
                </span>
            `;
        case "telewizja":
            return `
                <span>
                    ${oferta.liczba_kanalow} kanałów
                </span>
            `;
        default:
            return "";
    }
}

function generujTresc(oferta){
    let harmonogram = pobierzHarmonogram(oferta);
    let tabela = "";
    harmonogram.forEach(o=>{
        tabela += `
            <tr>
                <td>
                    ${pokazZakresOkresow(o.od, o.do)}
                </td>
                <td>
                    ${o.cena.toFixed(2)} zł
                </td>
            </tr>
        `;
    });
    return `
    <div class="akordeon-tresc">
        <div class="tresc-lewa">
            <h4>Informacje</h4>
            <p>
                <strong>Umowa:</strong>
                ${pokazOkres(oferta.okres_umowy)}
            </p>
            <p>
                <strong>Usługa:</strong>
                ${wybor.usluga == "internet" 
                    ? "Internet światłowodowy" 
                    : wybor.usluga}
            </p>
            ${pokazParametryOferty(oferta)}
            ${pokazInformacje(oferta)}
        </div>
        <div class="tresc-prawa">
            <h4>Opłaty</h4>
            <table>
                ${tabela}
            </table>
        </div>
    </div>
    `;
}

function generujAkordeon(oferta, sredniaBazowa, nasza){
    return `
    <div class="akordeon">
        ${generujNaglowek(
            oferta,
            sredniaBazowa,
            nasza
        )}
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

function pokazInformacje(oferta){
    let html = "";
    if (oferta.dodatki && oferta.dodatki.trim() !== "") {
        html += `
            <p>
				<strong>Dodatki:</strong>
				${oferta.dodatki}
			</p>
        `;
    }
    if (oferta.uwagi && oferta.uwagi.trim() !== "") {
        html += `
            <p>
				<strong>Uwagi:</strong>
				${oferta.uwagi}
			</p>
        `;
    }
    return html;
}

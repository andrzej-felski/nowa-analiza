// Formatowanie
function pokazOkres(wartoscOkresu) {
    const okres = Number(wartoscOkresu);
    if (okres === 999) {
        return "Bezterminowa";
    }
    if (okres === 1) {
        return "1 miesiąc";
    }
    if (
        okres % 10 >= 2 &&
        okres % 10 <= 4 &&
        (okres % 100 < 10 || okres % 100 >= 20)
    ) {
        return okres + " miesiące";
    }
    return okres + " miesięcy";
}

function pokazZakresOkresow(od, doOkresu){
    if (doOkresu === 999) {
        return `od ${od} miesiąca`;
    }
    if (od === doOkresu) {
        return `${od} miesiąc`;
    }
    return `${od}-${doOkresu} miesiąc`;
}

function pokazPakiet(oferta) {
    let wartosc;
    switch (wybor.usluga) {
        case "telefon_stacjonarny":
            wartosc = Number(oferta.pakiet_minut);
            break;
        case "internet_mobilny":
        case "abonament_komorkowy":
            wartosc = Number(oferta.pakiet_gb);
            break;
        default:
            return "";
    }
    if (wartosc === 9999) {
        return "Bez limitu";
    }
    return wybor.usluga === "telefon_stacjonarny"
        ? `${wartosc} min`
        : `${wartosc} GB`;
}

function pokazKanaly(liczba) {
    liczba = Number(liczba);
    const mod10 = liczba % 10;
    const mod100 = liczba % 100;
    let forma;
    if (liczba === 1) {
        forma = "kanał";
    } else if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
        forma = "kanały";
    } else {
        forma = "kanałów";
    }
    return `${liczba} ${forma}`;
}

function pokazNazweUslugi(usluga){
    switch(usluga){
        case "internet":
            return "Internet światłowodowy";
        case "internet_mobilny":
            return "Internet mobilny";
		case "telewizja":
			return "Telewizja";
		case "abonament_komorkowy":
			return "Abonament komórkowy";
		case "telefon_stacjonarny":
			return "Telefon stacjonarny";
		case "pakiety":
			return "Pakiety";
		case "telewizja_internetowa":
			return "Telewizja internetowa";
        default:
            return usluga;
    }
}

// Obliczenia
function pobierzHarmonogram(oferta) {
    if(!oferta){
        return [];
    }
    let wynik=[];
    let i = 1;
    while(true){
        let od = oferta["okres_od_" + i];
		if(od === undefined || od === ""){
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
	return miesiace
		? suma / miesiace
		: 0;
}

function pobierzZakresyPorownania(nasza, konkurencja){
    let punkty = new Set();
    [
        ...pobierzHarmonogram(nasza),
        ...pobierzHarmonogram(konkurencja)
    ].forEach(okres=>{
        punkty.add(okres.od);
        punkty.add(okres.do + 1);
    });
    let lista = [...punkty]
        .sort((a,b)=>a-b);
    let wynik = [];
    for(let i=0;i<lista.length-1;i++){
        wynik.push({
            od: lista[i],
            do: lista[i+1]-1
        });
    }
    return wynik;
}

function pobierzCeneWMiesiacu(oferta, miesiac){
    let harmonogram =
        pobierzHarmonogram(oferta);
    let znaleziony =
        harmonogram.find(o =>
            miesiac >= o.od &&
            miesiac <= o.do
        );
    return znaleziony
        ? znaleziony.cena
        : null;
}

// Generowanie HTML
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
		case "internet_mobilny":
			return `
				<p>
					<strong>Pakiet danych:</strong>
					${pokazPakiet(oferta)}
				</p>
			`;
		case "telewizja":
		case "telewizja_internetowa":
			return `
				<p>
					<strong>Liczba kanałów:</strong>
					${oferta.liczba_kanalow}
				</p>
			`;
		case "abonament_komorkowy":
			return `
				<p>
					<strong>Pakiet danych:</strong>
					${pokazPakiet(oferta)}
				</p>
			`;
		case "telefon_stacjonarny":
			return `
				<p>
					<strong>Pakiet darmowych minut:</strong>
					${pokazPakiet(oferta)}
				</p>
			`;
		case "pakiety":
			return `
                <p>
                    <strong>Prędkość pobierania:</strong>
                    ${oferta.predkosc_pobierania} Mb/s
                </p>
                <p>
                    <strong>Prędkość wysyłania:</strong>
                    ${oferta.predkosc_wysylania} Mb/s
                </p>
				<p>
					<strong>Liczba kanałów:</strong>
					${oferta.liczba_kanalow}
				</p>
			`;
        default:
            return "";
    }
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
		case "internet_mobilny":
			return `
				<span>
					${pokazPakiet(oferta)}
				</span>
			`;
		case "telewizja":
		case "telewizja_internetowa":
			return `
				<span>
					${oferta.nazwa_pakietu} - ${pokazKanaly(oferta.liczba_kanalow)}
				</span>
			`;
		case "abonament_komorkowy": {
			const pakiet = pokazPakiet(oferta);
			return `
				<span>
					${oferta.nazwa_pakietu}
					${pakiet ? " - " + pakiet : ""}
				</span>
			`;
		}
		case "telefon_stacjonarny":
			return `
				<span>
					${oferta.nazwa_pakietu}
					${pokazPakiet(oferta)
						? " - " + pokazPakiet(oferta)
						: ""}
				</span>
			`;
		case "pakiety":
			return `
				<span>
					${oferta.predkosc_pobierania} / ${oferta.predkosc_wysylania} Mb/s
					+ ${oferta.nazwa_pakietu} - ${pokazKanaly(oferta.liczba_kanalow)}
				</span>
			`;
        default:
            return "";
    }
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

function pokazCene(cena){
    return cena !== null && cena !== undefined
        ? Number(cena).toFixed(2) + " zł"
        : "-";
}

// Generowanie elementów
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
			Średnia cena: 
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

function generujTresc(oferta, nasza, ofertaBazowa){
    let harmonogram = pobierzHarmonogram(oferta);
    let tabela = "";
    harmonogram.forEach(o => {
        tabela += `
            <tr>
                <td>
                    ${pokazZakresOkresow(o.od, o.do)}
                </td>
				<td>
					${pokazCene(o.cena)}
				</td>
            </tr>
        `;
    });
    const sredniaCena = policzSredniaCene(oferta);
    tabela += `
        <tr class="wiersz-srednia">
            <td>
                Średnia cena
            </td>
            <td>
                ${sredniaCena.toFixed(2)} zł
            </td>
        </tr>
    `;
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
                ${pokazNazweUslugi(wybor.usluga)}
            </p>
            ${pokazParametryOferty(oferta)}
            ${pokazInformacje(oferta)}
        </div>
        <div class="tresc-prawa">
            <h4>Opłaty</h4>
            ${
                nasza
                ?
                `
                <table>
                    ${tabela}
                </table>
                `
                :
                generujTabelePorownania(
                    ofertaBazowa,
                    oferta
                )
            }
        </div>
    </div>
    `;
}

function generujTabelePorownania(nasza, konkurencja){
    let zakresy =
        pobierzZakresyPorownania(
            nasza,
            konkurencja
        );
    let html = "";
    zakresy.forEach(zakres => {
        let cenaNasza =
            pobierzCeneWMiesiacu(
                nasza,
                zakres.od
            );
        let cenaKonkurencji =
            pobierzCeneWMiesiacu(
                konkurencja,
                zakres.od
            );
        let znak = "";
        if (
            cenaKonkurencji !== null &&
            cenaNasza !== null
        ) {
            if(cenaKonkurencji > cenaNasza){
                znak = ">";
            }
            if(cenaKonkurencji < cenaNasza){
                znak = "<";
            }
            if(cenaKonkurencji === cenaNasza){
                znak = "=";
            }
        }
        let klasaNasza = "";
        if (
            cenaNasza !== null &&
            cenaKonkurencji !== null
        ) {
            if(cenaNasza < cenaKonkurencji){
                klasaNasza = "tansza";
            }
            if(cenaNasza > cenaKonkurencji){
                klasaNasza = "drozsza";
            }
        }
        html += `
        <tr>
            <td>
                ${pokazZakresOkresow(
                    zakres.od,
                    zakres.do
                )}
            </td>
            <td>
                ${pokazCene(cenaKonkurencji)}
            </td>
            <td class="znak">
                ${znak}
            </td>
            <td class="${klasaNasza}">
                ${pokazCene(cenaNasza)}
            </td>
        </tr>
        `;
    });
    let sredniaNasza = policzSredniaCene(nasza);
    let sredniaKonkurencji = policzSredniaCene(konkurencja);
    let roznicaSrednia = "";
    if(sredniaKonkurencji > sredniaNasza){
        roznicaSrednia = ">";
    }
    if(sredniaKonkurencji < sredniaNasza){
        roznicaSrednia = "<";
    }
    let klasaSredniaNasza = "";
    if(sredniaNasza < sredniaKonkurencji){
        klasaSredniaNasza = "tansza";
    }
    if(sredniaNasza > sredniaKonkurencji){
        klasaSredniaNasza = "drozsza";
    }
    html += `
    <tr class="wiersz-srednia">
        <td>
            Średnia cena
        </td>
        <td>
            ${pokazCene(sredniaKonkurencji)}
        </td>
        <td class="znak">
            ${roznicaSrednia}
        </td>
        <td class="${klasaSredniaNasza}">
            ${pokazCene(sredniaNasza)}
        </td>
    </tr>
    `;
    return `
        <table class="porownanie">
            <thead>
                <tr>
                    <th></th>
                    <th>
                        ${pobierzNazweFirmy(konkurencja.id_firmy)}
                    </th>
                    <th></th>
                    <th>
                        ${pobierzNazweFirmy(nasza.id_firmy)}
                    </th>
                </tr>
            </thead>
            <tbody>
                ${html}
            </tbody>
        </table>
    `;
}

function generujAkordeon(oferta, sredniaBazowa, nasza, ofertaBazowa){
    return `
    <div class="akordeon">
        ${generujNaglowek(
            oferta,
            sredniaBazowa,
            nasza
        )}
        ${generujTresc(
            oferta,
            nasza,
            ofertaBazowa
        )}
    </div>
    `;
}

async function pobierzDateOstatniejZmiany(repo, folder) {
	try {
		const response = await fetch(
			`https://api.github.com/repos/${repo}/commits?path=${folder}&per_page=1`
		);
		const commits = await response.json();
		if (!commits.length) {
			throw new Error("Brak commitów");
		}
		return new Date(commits[0].commit.committer.date)
			.toLocaleDateString("pl-PL", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric"
			}) + " r.";
	} catch (err) {
		console.error(err);
		return "brak danych";
	}
}

// Renderowanie
async function pokazWynik(oferta, konkurenci){
    let sredniaNasza =
        policzSredniaCene(oferta);
	konkurenci = [...konkurenci].sort((a,b)=>
		policzSredniaCene(a) -
		policzSredniaCene(b)
	);
    let html = "";
	html += generujAkordeon(
		oferta,
		sredniaNasza,
		true,
		oferta
	);
	const data = await pobierzDateOstatniejZmiany(
		"andrzej-felski/nowa-analiza",
		"dane"
	);
	html += `
		<div class="oferty-konkurencji">
			<h2>Oferty konkurencji</h2>
			<p> Stan na: ${data}</p>
		</div>
	`;
	if (konkurenci.length > 0) {
		konkurenci.forEach(k=>{
			html += generujAkordeon(
				k,
				sredniaNasza,
				false,
				oferta
			);
		});
	} else {
		html += `
			<div class="brak-konkurencji">
				Brak podobnych ofert konkurencji
			</div>
		`;
	}
    document.getElementById("wynik")
        .innerHTML = html;
    aktywujAkordeony();
}

// Obsługa UI
function otworzWybor(pole){
	if (
		pole === "pakiet" &&
		wybor.usluga === "pakiety"
	) {
		wyborPakietu.internet = null;
		wyborPakietu.telewizja = null;
		otworzWyborPakietu();
		return;
	}
    let opcje = pobierzOpcje(pole);
    if(opcje.length === 0){
        alert("Brak dostępnych opcji");
        return;
    }
    let modal = document.getElementById("oknoWyboru");
    let lista = document.getElementById("listaWyboru");
    lista.innerHTML = "";
    opcje.forEach(opcja => {
        lista.innerHTML += `
            <label class="opcja-wyboru">
                <input
                    type="radio"
                    name="wybor"
                    value="${opcja.value}">
                <span>${opcja.text}</span>
            </label>
        `;
    });
    document.getElementById("tytulWyboru").textContent =
        "Wybierz " + nazwyPol[pole];
    modal.classList.remove("ukryte");
}

function otworzWyborPakietu() {
    const modal = document.getElementById("oknoWyboru");
    document.getElementById("tytulWyboru").textContent =
        "Wybierz pakiet";
    document
        .getElementById("listaWyboru")
        .classList.add("ukryte");
    document
        .getElementById("wyborPakietu")
        .classList.remove("ukryte");
    document
        .getElementById("sekcjaTelewizji")
        .classList.add("ukryte");
    zbudujListeInternetu();
    modal.classList.remove("ukryte");
}

function zbudujListeInternetu() {
    const lista = document.getElementById("listaInternetu");
    lista.innerHTML = "";
    pobierzPredkosciPakietow().forEach(predkosc => {
        lista.innerHTML += `
            <label class="opcja-wyboru">
                <input
                    type="radio"
                    name="internetPakiet"
                    value="${predkosc.download}/${predkosc.upload}">
                <span>
                    ${predkosc.download} / ${predkosc.upload} Mb/s
                </span>
            </label>
        `;
    });
    document
        .querySelectorAll('input[name="internetPakiet"]')
        .forEach(radio => {
            radio.addEventListener("change", function(){
                const [download, upload] = this.value.split("/");
                wyborPakietu.internet = {
                    download,
                    upload
                };
                zbudujListeTelewizji(download, upload);
            });
        });
}

function zbudujListeTelewizji(download, upload) {
    const lista = document.getElementById("listaTelewizji");
    lista.innerHTML = "";
    const telewizje = pobierzTelewizjePakietow(
        download,
        upload
    );
    if (telewizje.length === 0) {
        lista.innerHTML = `
            <p>Brak dostępnych pakietów telewizji dla tej prędkości.</p>
        `;
        document
            .getElementById("sekcjaTelewizji")
            .classList.remove("ukryte");
        return;
    }
    telewizje.forEach(oferta => {
        lista.innerHTML += `
            <label class="opcja-wyboru">
                <input
                    type="radio"
                    name="telewizjaPakiet"
                    value="${oferta.id_oferty}">
				<span>
					${oferta.nazwa_pakietu}
					- ${pokazKanaly(oferta.liczba_kanalow)}
				</span>
            </label>
        `;
    });
    document
        .querySelectorAll('input[name="telewizjaPakiet"]')
        .forEach(radio => {
            radio.addEventListener("change", function(){
                const wybranaTelewizja =
                    telewizje.find(o =>
                        o.id_oferty == this.value
                    );
                wyborPakietu.telewizja = wybranaTelewizja;
                console.log(
                    "Wybrana telewizja:",
                    wyborPakietu.telewizja
                );
            });
        });
    document
        .getElementById("sekcjaTelewizji")
        .classList.remove("ukryte");
}

function zamknijModal() {
    document
        .getElementById("oknoWyboru")
        .classList.add("ukryte");
    document
        .getElementById("listaWyboru")
        .classList.remove("ukryte");
    document
        .getElementById("wyborPakietu")
        .classList.add("ukryte");
    document
        .getElementById("listaInternetu")
        .innerHTML = "";
    document
        .getElementById("listaTelewizji")
        .innerHTML = "";
    document
        .getElementById("sekcjaTelewizji")
        .classList.add("ukryte");
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
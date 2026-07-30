const dane = {
    firmy: [],
    konkurencja: [],
    uslugi: {}
};

const wybor = {
    firma: null,
    usluga: null,
    okres: null,
    pakiet: null,
    parametr: null
};

let aktualnePole = null;

async function start(){
    dane.firmy = await wczytajCSV("firmy.csv");
    dane.konkurencja = await wczytajCSV("konkurencja.csv");
    dane.uslugi.internet = await wczytajCSV("internet.csv");
    document
    .querySelectorAll(".wybor")
    .forEach(element => {
		element.addEventListener("click", function(){
			if (this.classList.contains("nieaktywne")) {
				return;
			}
			aktualnePole = this.dataset.pole;
			otworzWybor(aktualnePole);
		});
    });
	aktualizujDostepnoscPol();
}

async function wczytajCSV(plik){
    let response = await fetch("dane/" + plik);
    let tekst = await response.text();
    return Papa.parse(tekst, {
        header: true,
        delimiter: ";",
        skipEmptyLines: true,
        transformHeader: function(header){
            return header.trim();
        },
        transform: function(value){
            return value.trim();
        }
    }).data;
}

function pobierzOferty() {
    return dane.uslugi[wybor.usluga] || [];
}

function pokazOkres(okres) {
    okres = Number(okres);
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

function pobierzOpcje(pole) {
    switch (pole) {
        case "firma":
            return dane.firmy
                .filter(f => f.nasza_firma.toUpperCase() == "TAK")
                .map(f => ({
                    value: f.id_firmy,
                    text: f.nazwa_firmy
                }));
        case "usluga":
            return [
                {
                    value: "internet",
                    text: "Internet"
                }
            ];
		case "okres":
			return [...new Set(
				pobierzOferty()
					.filter(o => o.id_firmy == wybor.firma)
					.map(o => o.okres_umowy)
			)]
			.sort((a, b) => Number(a) - Number(b))
			.map(okres => ({
				value: okres,
				text: pokazOkres(okres)
			}));
        case "pakiet":
            return [...new Set(
                pobierzOferty()
                    .filter(o =>
                        o.id_firmy == wybor.firma &&
                        o.okres_umowy == wybor.okres
                    )
                    .map(o => o.nazwa_pakietu)
            )].map(pakiet => ({
                value: pakiet,
                text: pakiet
            }));
        case "parametr":
            return pobierzOferty()
                .filter(o =>
                    o.id_firmy == wybor.firma &&
                    o.okres_umowy == wybor.okres &&
                    o.nazwa_pakietu == wybor.pakiet
                )
                .map(o => ({
                    value: `${o.predkosc_pobierania}/${o.predkosc_wysylania}`,
                    text: `${o.predkosc_pobierania} / ${o.predkosc_wysylania} Mb/s`
                }));
        default:
            return [];
    }
}

function pobierzKonkurencje(idFirmy){
    return dane.konkurencja
        .filter(k => k.id_firmy == idFirmy)
        .map(k => k.id_konkurenta);
}

function pobierzOfertyKonkurencji(oferta){
    let konkurenci = pobierzKonkurencje(oferta.id_firmy);
   let wszystkie = pobierzOferty().filter(o =>
        konkurenci.includes(o.id_firmy)
    );
    let poGrupiePredkosci = wszystkie.filter(o =>
        o.grupa_porownawcza == oferta.grupa_porownawcza
    );
    let poGrupieOkresu = poGrupiePredkosci.filter(o =>
        o.grupa_okresu == oferta.grupa_okresu
    );
    return poGrupieOkresu;
}

function pobierzHarmonogram(oferta) {
    let harmonogram = [];
    let i = 1;
    while (true) {
        let od = oferta["okres_od_" + i];
        if (!od) {
            break;
        }
        harmonogram.push({
            od: Number(od),
            do: Number(oferta["okres_do_" + i]),
            cena: Number(oferta["cena_" + i])
        });
        i++;
    }
    return harmonogram;
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

document
.getElementById("szukaj")
.addEventListener("click", szukaj);

function szukaj(){
    if (
        !wybor.firma ||
        !wybor.usluga ||
        !wybor.okres ||
        !wybor.pakiet ||
        !wybor.parametr
    ){
        alert("Wybierz wszystkie pola");
        return;
    }
    let firma = wybor.firma;
    let pakiet = wybor.pakiet;
    let parametr = wybor.parametr;
    let [download, upload] = parametr.split("/");
    let okres = wybor.okres;
    let wybrana =
    pobierzOferty().find(o =>
        o.id_firmy == firma &&
        o.okres_umowy == okres &&
        o.nazwa_pakietu == pakiet &&
        o.predkosc_pobierania == download &&
        o.predkosc_wysylania == upload
    );
    pokazWynik(
        wybrana,
        pobierzOfertyKonkurencji(wybrana)
    );
}

function pokazWynik(oferta, konkurenci){
	let htmlKonkurencja = "";
	konkurenci.forEach(k=>{
	htmlKonkurencja += `
		<div class="oferta konkurencja">
			<h3>${pobierzNazweFirmy(k.id_firmy)}</h3>
			<h2>${k.nazwa_pakietu}</h2>
			${pokazParametryWyniku(k)}
			<br><br>
			${k.dodatki || ""}
		</div>
	`;
	});
	document.getElementById("wynik").innerHTML =
	`
	<div class="oferta">
		<h2>${oferta.nazwa_pakietu}</h2>
		${pokazParametryWyniku(oferta)}
	</div>
	<h2>Konkurencja</h2>
	${htmlKonkurencja}
	`;
}

function pobierzNazweFirmy(idFirmy) {
    let firma = dane.firmy.find(f => f.id_firmy == idFirmy);
    return firma ? firma.nazwa_firmy : idFirmy;
}

const nazwyPol = {
    firma: "firmę",
    usluga: "usługę",
    okres: "okres",
    pakiet: "pakiet",
    parametr: "parametr"
};

function otworzWybor(pole){
    let modal = document.getElementById("oknoWyboru");
    let lista = document.getElementById("listaWyboru");
    lista.innerHTML = "";
    pobierzOpcje(pole).forEach(opcja => {
        lista.innerHTML += `
            <label>
                <input
                    type="radio"
                    name="wybor"
                    value="${opcja.value}">
                ${opcja.text}
            </label>
            <br>
        `;

    });
	document.getElementById("tytulWyboru").textContent =
		"Wybierz " + nazwyPol[pole];
    modal.classList.remove("ukryte");
}

const pola = {
    firma: "wybranaFirma",
    usluga: "wybranaUsluga",
    okres: "wybranyOkres",
    pakiet: "wybranyPakiet",
    parametr: "wybranyParametr"
};

document
.getElementById("potwierdzWybor")
.addEventListener("click", function(){
    let zaznaczone =
    document.querySelector(
        'input[name="wybor"]:checked'
    );
    if(!zaznaczone){
        return;
    }
	wybor[aktualnePole] = zaznaczone.value;
	if (aktualnePole == "firma") {
		wybor.usluga = null;
		wybor.okres = null;
		wybor.pakiet = null;
		wybor.parametr = null;
		wyczyscPole("wybranaUsluga");
		wyczyscPole("wybranyOkres");
		wyczyscPole("wybranyPakiet");
		wyczyscPole("wybranyParametr");
	}
	else if (aktualnePole == "okres") {
		wybor.pakiet = null;
		wybor.parametr = null;
		wyczyscPole("wybranyPakiet");
		wyczyscPole("wybranyParametr");
	}
	else if (aktualnePole == "pakiet") {
		wybor.parametr = null;
		wyczyscPole("wybranyParametr");
	}
	document.getElementById(
		pola[aktualnePole]
	).textContent =
		zaznaczone.parentElement.textContent.trim();
	zamknijModal();
	aktualizujDostepnoscPol();
});

function wyczyscPole(id) {
    document.getElementById(id).textContent = "Wybierz";
}

function aktualizujDostepnoscPol() {
    document
        .querySelectorAll(".wybor")
        .forEach(element => {
			let pole = element.dataset.pole;
			let aktywne = true;
			if (pole == "usluga" && !wybor.firma) {
				aktywne = false;
			}
			if (pole == "okres" && !wybor.usluga) {
				aktywne = false;
			}
			if (pole == "pakiet" && !wybor.okres) {
				aktywne = false;
			}
			if (pole == "parametr" && !wybor.pakiet) {
				aktywne = false;
			}
			element.classList.toggle(
				"nieaktywne",
				!aktywne
			);
        });
}

function zamknijModal() {
    document
        .getElementById("oknoWyboru")
        .classList.add("ukryte");
}

document
	.getElementById("zamknijModal")
	.addEventListener("click", zamknijModal);
	
document
.getElementById("oknoWyboru")
.addEventListener("click", function(e) {
    if (e.target === this) {
        zamknijModal();
    }
});
	
document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        zamknijModal();
    }
});

start();

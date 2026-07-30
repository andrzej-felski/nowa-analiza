const dane = {
    firmy: [],
    konkurencja: [],
    uslugi: {}
};

const wybor = {
    firma: null,
    usluga: null,
    okres: null,
    oferta: null,
    pakiet: null
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
                    text: "Internet światłowodowy"
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
		case "oferta":
			return [...new Set(
				pobierzOferty()
					.filter(o =>
						o.id_firmy == wybor.firma &&
						o.okres_umowy == wybor.okres
					)
					.map(o => o.nazwa_oferty)
			)].map(oferta => ({
				value: oferta,
				text: oferta
			}));
		case "pakiet":
			return [...new Set(
				pobierzOferty()
					.filter(o =>
						o.id_firmy == wybor.firma &&
						o.okres_umowy == wybor.okres &&
						o.nazwa_oferty == wybor.oferta
					)
					.map(o =>
						`${o.predkosc_pobierania}/${o.predkosc_wysylania}`
					)
			)]
			.map(pakiet => ({
				value: pakiet,
				text: pakiet.replace("/", " / ") + " Mb/s"
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
		!wybor.oferta ||
		!wybor.pakiet
	){
        alert("Wybierz wszystkie pola");
        return;
    }
    let firma = wybor.firma;
	let oferta = wybor.oferta;
	let pakiet = wybor.pakiet;
	let [download, upload] = pakiet.split("/");
    let okres = wybor.okres;
    let wybrana =
    pobierzOferty().find(o =>
        o.id_firmy == firma &&
        o.okres_umowy == okres &&
		o.nazwa_oferty == oferta &&
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
			<h2>${k.nazwa_oferty}</h2>
			${pokazParametryWyniku(k)}
			<br><br>
			${k.dodatki || ""}
		</div>
	`;
	});
	document.getElementById("wynik").innerHTML =
	`
	<div class="oferta">
		<h2>${oferta.nazwa_oferty}</h2>
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
    oferta: "ofertę",
    pakiet: "pakiet"
};

function otworzWybor(pole){
    let modal = document.getElementById("oknoWyboru");
    let lista = document.getElementById("listaWyboru");
    lista.innerHTML = "";
    pobierzOpcje(pole).forEach(opcja => {
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

const pola = {
    firma: "wybranaFirma",
    usluga: "wybranaUsluga",
    okres: "wybranyOkres",
    oferta: "wybranaOferta",
    pakiet: "wybranyPakiet"
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
		wybor.oferta = null;
		wybor.pakiet = null;
		wyczyscPole("wybranaUsluga");
		wyczyscPole("wybranyOkres");
		wyczyscPole("wybranaOferta");
		wyczyscPole("wybranyPakiet");
	}
	else if (aktualnePole == "okres") {
		wybor.oferta = null;
		wybor.pakiet = null;
		wyczyscPole("wybranaOferta");
		wyczyscPole("wybranyPakiet");
	}

	else if (aktualnePole == "oferta") {
		wybor.pakiet = null;
		wyczyscPole("wybranyPakiet");
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
			if (pole == "oferta" && !wybor.okres) {
				aktywne = false;
			}

			if (pole == "pakiet" && !wybor.oferta) {
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

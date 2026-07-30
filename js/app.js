window.dane = {
    firmy: [],
    konkurencja: [],
    uslugi: {}
};

window.wybor = {
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
	dane.uslugi.internet_mobilny = await wczytajCSV("internet_mobilny.csv");
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

function pokazZakresOkresow(od, doOkresu){
    if (doOkresu === 999) {
        return `od ${od} miesiąca`;
    }
    if (od === doOkresu) {
        return `${od} miesiąc`;
    }
    return `${od}-${doOkresu} miesiąc`;
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
				},
				{
					value: "internet_mobilny",
					text: "Internet mobilny"
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
					.map(pobierzKluczPakietu)
					)
			)]
			.map(pakiet => ({
				value: pakiet,
				text: pokazNazwePakietu(pakiet)
			}));
        default:
            return [];
    }
}

function pobierzKluczPakietu(oferta){
    switch (wybor.usluga) {
        case "internet":
            return `${oferta.predkosc_pobierania}/${oferta.predkosc_wysylania}`;
        case "internet_mobilny":
            return String(oferta.pakiet_gb);
        default:
            return "";
    }
}

function pokazNazwePakietu(pakiet){
    switch (wybor.usluga) {
        case "internet":
            return pakiet.replace("/", " / ") + " Mb/s";
		case "internet_mobilny":
			return Number(pakiet) === 9999
				? "Bez limitu"
				: `${pakiet} GB`;
        default:
            return pakiet;
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
	let poGrupiePorownawczej = wszystkie.filter(o =>
		o.grupa_porownawcza == oferta.grupa_porownawcza
	);
	let poGrupieOkresu = poGrupiePorownawczej.filter(o =>
		o.grupa_okresu == oferta.grupa_okresu
	);
    return poGrupieOkresu;
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
    let okres = wybor.okres;
	let wybrana = pobierzOferty().find(o => {
		if (
			o.id_firmy != firma ||
			o.okres_umowy != okres ||
			o.nazwa_oferty != oferta
		){
			return false;
		}
		switch (wybor.usluga) {
			case "internet":
				let [download, upload] = pakiet.split("/");
				return (
					o.predkosc_pobierania == download &&
					o.predkosc_wysylania == upload
				);
			case "internet_mobilny":
				return Number(o.pakiet_gb) === Number(pakiet);
			default:
				return false;
		}
	});
	if(!wybrana){
		alert("Nie znaleziono oferty");
		return;
	}
    pokazWynik(
        wybrana,
        pobierzOfertyKonkurencji(wybrana)
    );
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
            if (pole == "pakiet" && (!wybor.oferta || !wybor.okres)) {
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

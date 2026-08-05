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

const wyborPakietu = {
    internet: null,
    telewizja: null
};

let aktualnePole = null;

async function start(){
    dane.firmy = await wczytajCSV("firmy.csv");
    dane.konkurencja = await wczytajCSV("konkurencja.csv");
    dane.uslugi.internet = await wczytajCSV("internet.csv");
	dane.uslugi.internet_mobilny = await wczytajCSV("internet_mobilny.csv");
	dane.uslugi.telewizja = await wczytajCSV("telewizja.csv");
	dane.uslugi.abonament_komorkowy = await wczytajCSV("abonament_komorkowy.csv");
	dane.uslugi.telefon_stacjonarny = await wczytajCSV("telefon_stacjonarny.csv");
	dane.uslugi.pakiety = await wczytajCSV("pakiety.csv");
	dane.uslugi.telewizja_internetowa = await wczytajCSV("telewizja_internetowa.csv");
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

function pobierzPakiety() {
	return pobierzOferty().filter(o =>
		o.id_firmy == wybor.firma &&
		o.okres_umowy == wybor.okres &&
		o.nazwa_oferty == wybor.oferta
	);
}

function pobierzPredkosciPakietow() {
    return [...new Map(
        pobierzPakiety().map(o => [
            o.predkosc_pobierania + "/" + o.predkosc_wysylania,
            {
                download: o.predkosc_pobierania,
                upload: o.predkosc_wysylania
            }
        ])
    ).values()];
}

function pobierzTelewizjePakietow(download, upload) {
    return pobierzPakiety().filter(o =>
        o.predkosc_pobierania == download &&
        o.predkosc_wysylania == upload
    );
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
                    - ${oferta.liczba_kanalow} kanałów
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
				},
				{
					value: "telewizja",
					text: "Telewizja"
				},
				{
					value: "abonament_komorkowy",
					text: "Abonament komórkowy"
				},
				{
					value: "telefon_stacjonarny",
					text: "Telefon stacjonarny"
				},
				{
					value: "pakiety",
					text: "Pakiety"
				},
				{
					value: "telewizja_internetowa",
					text: "Telewizja internetowa"
				},
			]
			.filter(usluga =>
				dane.uslugi[usluga.value].some(o =>
					o.id_firmy == wybor.firma
				)
			);
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
			let oferty = pobierzOferty().filter(o =>
				o.id_firmy == wybor.firma &&
				o.okres_umowy == wybor.okres &&
				o.nazwa_oferty == wybor.oferta
			);
			switch (wybor.usluga) {
				case "telewizja":
				case "telewizja_internetowa":
					return oferty.map(o => ({
						value: o.liczba_kanalow,
						text: `${o.nazwa_pakietu} - ${o.liczba_kanalow} kanałów`
					}));
				case "abonament_komorkowy":
					return oferty.map(o => {
						let pakiet = pokazPakiet(o);
						return {
							value: o.pakiet_gb,
							text: pakiet
								? `${o.nazwa_pakietu} - ${pakiet}`
								: o.nazwa_pakietu
						};
					});
				case "telefon_stacjonarny":
					return oferty.map(o => ({
						value: o.pakiet_minut,
						text: o.nazwa_pakietu +
							(pokazPakiet(o)
								? ` - ${pokazPakiet(o)}`
								: "")
					}));
				default:
					return [...new Set(oferty.map(pobierzKluczPakietu))]
						.map(pakiet => {
							const oferta = oferty.find(o => pobierzKluczPakietu(o) === pakiet);

							return {
								value: pakiet,
								text: pokazNazwePakietu(oferta)
							};
						});
			}
	}
}

function pobierzKluczPakietu(oferta){
    switch (wybor.usluga) {
        case "internet":
            return `${oferta.predkosc_pobierania} / ${oferta.predkosc_wysylania}`;
        case "internet_mobilny":
            return String(oferta.pakiet_gb);
		case "telewizja":
		case "telewizja_internetowa":
			return String(oferta.liczba_kanalow);
        case "abonament_komorkowy":
            return String(oferta.pakiet_gb);
		case "telefon_stacjonarny":
			return String(oferta.pakiet_minut);
        default:
            return "";
    }
}

function pokazNazwePakietu(oferta) {
    switch (wybor.usluga) {
        case "internet":
            return `${oferta.predkosc_pobierania} / ${oferta.predkosc_wysylania} Mb/s`;
        case "internet_mobilny":
            return Number(oferta.pakiet_gb) === 9999
                ? "Bez limitu"
                : `${oferta.pakiet_gb} GB`;
		case "telewizja":
		case "telewizja_internetowa":
			return `${oferta.nazwa_pakietu} - ${oferta.liczba_kanalow} kanałów`;
        case "abonament_komorkowy":
            if (Number(oferta.pakiet_gb) === 0)
                return oferta.nazwa_pakietu;
            return Number(oferta.pakiet_gb) === 9999
                ? `${oferta.nazwa_pakietu} - Bez limitu`
                : `${oferta.nazwa_pakietu} - ${oferta.pakiet_gb} GB`;
			case "telefon_stacjonarny":
				return Number(oferta.pakiet_minut) === 9999
					? "Bez limitu"
					: `${oferta.pakiet_minut} min`;
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
    if (wybor.usluga === "pakiety") {
        return wszystkie.filter(o =>
            o.grupa_porownawcza_internet ==
                oferta.grupa_porownawcza_internet
            &&
            o.grupa_porownawcza_telewizja ==
                oferta.grupa_porownawcza_telewizja
            &&
            o.grupa_okresu ==
                oferta.grupa_okresu
        );
    }
    return wszystkie.filter(o =>
        o.grupa_porownawcza == oferta.grupa_porownawcza &&
        o.grupa_okresu == oferta.grupa_okresu
    );
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
				let [download, upload] = pakiet.split("/").map(x => x.trim());
				return (
					o.predkosc_pobierania == download &&
					o.predkosc_wysylania == upload
				);
			case "internet_mobilny":
				return Number(o.pakiet_gb) === Number(pakiet);
			case "telewizja":
			case "telewizja_internetowa":
				return Number(o.liczba_kanalow) === Number(pakiet);
			case "abonament_komorkowy":
				return Number(o.pakiet_gb) === Number(pakiet);
			case "telefon_stacjonarny":
				return Number(o.pakiet_minut) === Number(pakiet);
			case "pakiety":
				return (
					o.predkosc_pobierania == pakiet.internet.download &&
					o.predkosc_wysylania == pakiet.internet.upload &&
					o.nazwa_pakietu == pakiet.telewizja.nazwa_pakietu &&
					o.liczba_kanalow == pakiet.telewizja.liczba_kanalow
				);
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
    oferta: "długość umowy",
    pakiet: "pakiet"
};

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

const pola = {
    firma: "wybranaFirma",
    usluga: "wybranaUsluga",
    okres: "wybranyOkres",
    oferta: "wybranaOferta",
    pakiet: "wybranyPakiet"
};

const kolejnoscPol = [
    "firma",
    "usluga",
    "okres",
    "oferta",
    "pakiet"
];

function wyczyscPolaPo(pole) {
    let indeks = kolejnoscPol.indexOf(pole);
    kolejnoscPol
        .slice(indeks + 1)
        .forEach(nastepnePole => {
            wybor[nastepnePole] = null;
            wyczyscPole(pola[nastepnePole]);
        });
	if (
		pole === "usluga" ||
		pole === "oferta" ||
		pole === "pakiet"
	) {
		wyborPakietu.internet = null;
		wyborPakietu.telewizja = null;
	}
}

document
.getElementById("potwierdzWybor")
.addEventListener("click", function(){
    if (
        aktualnePole === "pakiet" &&
        wybor.usluga === "pakiety"
    ){
        if (
            !wyborPakietu.internet ||
            !wyborPakietu.telewizja
        ){
            alert("Wybierz internet i telewizję");
            return;
        }
        wybor.pakiet = {
            internet: wyborPakietu.internet,
            telewizja: wyborPakietu.telewizja
        };
	document
		.getElementById("wybranyPakiet")
		.textContent =
			wyborPakietu.internet.download +
			" / " +
			wyborPakietu.internet.upload +
			" Mb/s + " +
			wyborPakietu.telewizja.nazwa_pakietu +
			" - " +
			wyborPakietu.telewizja.liczba_kanalow +
			" kanałów";
        zamknijModal();
        aktualizujDostepnoscPol();
        return;
    }
    let zaznaczone =
        document.querySelector(
            'input[name="wybor"]:checked'
        );
    if(!zaznaczone){
        return;
    }
    wybor[aktualnePole] = zaznaczone.value;
    wyczyscPolaPo(aktualnePole);
    document.getElementById(
        pola[aktualnePole]
    ).textContent =
        zaznaczone.parentElement.textContent.trim();
    zamknijModal();
    aktualizujDostepnoscPol();
});

function wyczyscPole(id) {
    let element = document.getElementById(id);
    if (element) {
        element.textContent = "Wybierz";
    }
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

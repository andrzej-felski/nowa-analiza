// Stan aplikacji
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

// Konfiguracja
const nazwyPol = {
    firma: "firmę",
    usluga: "usługę",
    okres: "długość umowy",
    oferta: "ofertę",
    pakiet: "pakiet"
};

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

// Inicjalizacja
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

async function wczytajDane() {
    dane.firmy = await wczytajCSV("firmy.csv");
    dane.konkurencja = await wczytajCSV("konkurencja.csv");
    const uslugi = [
        "internet",
        "internet_mobilny",
        "telewizja",
        "abonament_komorkowy",
        "telefon_stacjonarny",
        "pakiety",
        "telewizja_internetowa"
    ];
    for (const usluga of uslugi) {
        dane.uslugi[usluga] = await wczytajCSV(`${usluga}.csv`);
    }
}

async function start() {
    await wczytajDane();
    zarejestrujListenery();
    aktualizujDostepnoscPol();
}

// Pobieranie danych
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

function pobierzNazweFirmy(idFirmy) {
    let firma = dane.firmy.find(
        f => f.id_firmy == idFirmy
    );
    return firma
        ? firma.nazwa_firmy
        : idFirmy;
}

// Budowanie opcji
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
			const oferty = pobierzOferty().filter(o =>
				o.id_firmy == wybor.firma &&
				o.okres_umowy == wybor.okres &&
				o.nazwa_oferty == wybor.oferta
			);
			switch (wybor.usluga) {
				case "telewizja":
				case "telewizja_internetowa":
					return oferty.map(o => ({
						value: o.liczba_kanalow,
						text: `${o.nazwa_pakietu} - ${pokazKanaly(o.liczba_kanalow)}`
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

// Zarządzanie wyborem
function wyczyscPolaPo(pole) {
    let indeks = kolejnoscPol.indexOf(pole);
    kolejnoscPol
        .slice(indeks + 1)
        .forEach(nastepnePole => {
            wybor[nastepnePole] = null;
            wyczyscPole(pola[nastepnePole]);
        });
	if (
		pole === "firma" ||
		pole === "usluga" ||
		pole === "oferta" ||
		pole === "pakiet"
	) {
		wyborPakietu.internet = null;
		wyborPakietu.telewizja = null;
	}
}

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

// Funkcje pomocnicze
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
			return `${oferta.nazwa_pakietu} - ${pokazKanaly(oferta.liczba_kanalow)}`;
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

// Wyszukiwanie
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

// Listenery
function zarejestrujListeneryWyboru() {
    document
        .querySelectorAll(".wybor")
        .forEach(element => {
            element.addEventListener("click", function () {
                if (this.classList.contains("nieaktywne")) {
                    return;
                }
                aktualnePole = this.dataset.pole;
                otworzWybor(aktualnePole);
            });
        });
}

function potwierdzWybor() {
    if (
        aktualnePole === "pakiet" &&
        wybor.usluga === "pakiety"
    ) {
        if (
            !wyborPakietu.internet ||
            !wyborPakietu.telewizja
        ) {
            alert("Wybierz internet i telewizję");
            return;
        }
        wybor.pakiet = {
            internet: wyborPakietu.internet,
            telewizja: wyborPakietu.telewizja
        };
        document.getElementById("wybranyPakiet").textContent =
            wyborPakietu.internet.download +
            " / " +
            wyborPakietu.internet.upload +
            " Mb/s + " +
            wyborPakietu.telewizja.nazwa_pakietu +
            " - " +
            pokazKanaly(wyborPakietu.telewizja.liczba_kanalow);
        zamknijModal();
        aktualizujDostepnoscPol();
        return;
    }
    let zaznaczone =
        document.querySelector('input[name="wybor"]:checked');
    if (!zaznaczone) {
        return;
    }
    wybor[aktualnePole] = zaznaczone.value;
    wyczyscPolaPo(aktualnePole);
    document.getElementById(pola[aktualnePole]).textContent =
        zaznaczone.parentElement.textContent.trim();
    zamknijModal();
    aktualizujDostepnoscPol();
}

function klikniecieTlaModala(e) {
    if (e.target === this) {
        zamknijModal();
    }
}

function obsluzEscape(e) {
    if (e.key === "Escape") {
        zamknijModal();
    }
}

function zarejestrujListenery() {
    zarejestrujListeneryWyboru();

    document
        .getElementById("szukaj")
        .addEventListener("click", szukaj);

    document
        .getElementById("potwierdzWybor")
        .addEventListener("click", potwierdzWybor);

    document
        .getElementById("zamknijModal")
        .addEventListener("click", zamknijModal);

    document
        .getElementById("oknoWyboru")
        .addEventListener("click", klikniecieTlaModala);

    document
        .addEventListener("keydown", obsluzEscape);
}

start();

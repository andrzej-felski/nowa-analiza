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

async function start(){
    dane.firmy = await wczytajCSV("firmy.csv");
    dane.konkurencja = await wczytajCSV("konkurencja.csv");
    dane.uslugi.internet = await wczytajCSV("internet.csv");
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
    let usluga = document.getElementById("usluga").value;
    return dane.uslugi[usluga] || [];
}

function pokazFirmy(){
    let select = document.getElementById("firma");
    dane.firmy
    .filter(f => f.nasza_firma.toUpperCase()=="TAK")
    .forEach(f=>{
        select.innerHTML += `
        <option value="${f.id_firmy}">
            ${f.nazwa_firmy}
        </option>`;
    });
}

document
.getElementById("firma")
.addEventListener("change", function () {
    let usluga = document.getElementById("usluga");
    usluga.innerHTML = `
        <option value="">Wybierz</option>
    `;
    document.getElementById("okres").disabled = true;
    document.getElementById("pakiet").disabled = true;
    document.getElementById("parametr").disabled = true;
    if (!this.value) {
        usluga.disabled = true;
        return;
    }
    usluga.disabled = false;
    usluga.innerHTML += `
        <option value="internet">
            Internet światłowodowy
        </option>
    `;
});

document
.getElementById("usluga")
.addEventListener("change", pokazOkresy);

function pokazOkresy(){
    let firma =
    document.getElementById("firma").value;
    let okres =
    document.getElementById("okres");
    okres.innerHTML =
    '<option value="">Wybierz</option>';
	let lista =
	pobierzOferty().filter(o =>
		o.id_firmy == firma
	);
	[...new Set(lista.map(o=>Number(o.okres_umowy)))]
	.sort((a,b)=>a-b)
	.forEach(x=>{
        okres.innerHTML += `
        <option value="${x}">
            ${x==999 ? "Bezterminowa" : x+" "+odmianaMiesiecy(x)}
        </option>`;
    });
    okres.disabled=false;
}

function odmianaMiesiecy(liczba){
    liczba = Number(liczba);
    if (liczba === 1) {
        return "miesiąc";
    }
    if (
        liczba % 10 >= 2 &&
        liczba % 10 <= 4 &&
        !(liczba >= 12 && liczba <= 14)
    ) {
        return "miesiące";
    }
    return "miesięcy";
}

document
.getElementById("okres")
.addEventListener("change", pokazPakiety);

function pokazPakiety(){
    let firma =
    document.getElementById("firma").value;
    let okres =
    document.getElementById("okres").value;
    let pakiet =
    document.getElementById("pakiet");
    pakiet.innerHTML =
    '<option value="">Wybierz</option>';
	let lista =
	pobierzOferty().filter(o =>
		o.id_firmy == firma &&
		o.okres_umowy == okres
	);
    [...new Set(lista.map(o=>o.nazwa_pakietu))]
    .forEach(x=>{
        pakiet.innerHTML += `
        <option value="${x}">
            ${x}
        </option>`;
    });
    pakiet.disabled=false;
}

document
.getElementById("pakiet")
.addEventListener("change", pokazParametry);

function pokazParametry() {
    let usluga = document.getElementById("usluga").value;
    switch (usluga) {
        case "internet":
            pokazParametryInternet();
            break;
        default:
            console.warn("Brak obsługi usługi:", usluga);
    }
}

function pokazParametryInternet(){
    let firma =
    document.getElementById("firma").value;
    let okres =
    document.getElementById("okres").value;
    let pakiet =
    document.getElementById("pakiet").value;
	let parametr =
	document.getElementById("parametr");
	parametr.innerHTML =
	'<option value="">Wybierz</option>';
	let lista =
	pobierzOferty().filter(o =>
		o.id_firmy == firma &&
		o.okres_umowy == okres &&
		o.nazwa_pakietu == pakiet
	);
	[...new Set(
		lista.map(o =>
			o.predkosc_pobierania+"/"+o.predkosc_wysylania
		)
	)]
	.sort((a,b)=>{
		return Number(a.split("/")[0]) - Number(b.split("/")[0]);
	})
	.forEach(x=>{
	parametr.innerHTML += `
		<option value="${x}">
			${x.replace("/", " / ")} Mb/s
		</option>`;
    });
    parametr.disabled = false;
}

document
.getElementById("szukaj")
.addEventListener("click", szukaj);

function szukaj(){
    let firma =
    document.getElementById("firma").value;
    let pakiet =
    document.getElementById("pakiet").value;
	let parametr =
	document.getElementById("parametr").value;
	let [download, upload] = parametr.split("/");
	let okres =
	document.getElementById("okres").value;
	let wybrana =
	pobierzOferty().find(o=>
		o.id_firmy==firma &&
		o.okres_umowy==okres &&
		o.nazwa_pakietu==pakiet &&
		o.predkosc_pobierania==download &&
		o.predkosc_wysylania==upload
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
			<h3>
			${k.id_firmy}
			</h3>
			Prędkość:
			${k.predkosc_pobierania} /
			${k.predkosc_wysylania} Mb/s
			<br><br>
			${k.dodatki || ""}
		</div>
		`;
	});
	document.getElementById("wynik").innerHTML =
	`
	<div class="oferta">
		<h2>${oferta.nazwa_pakietu}</h2>
		Prędkość:
		${oferta.predkosc_pobierania} /
		${oferta.predkosc_wysylania} Mb/s
	</div>
	<h2>Konkurencja</h2>
	${htmlKonkurencja}
	`;
}

function pokazParametryWyniku(oferta){
    let usluga = document.getElementById("usluga").value;
    switch(usluga){
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

function pobierzKonkurencje(idFirmy){
    return dane.konkurencja
        .filter(k => k.id_firmy == idFirmy)
        .map(k => k.id_konkurenta);
}

function pobierzOfertyKonkurencji(oferta){
    let konkurenci = pobierzKonkurencje(oferta.id_firmy);
    console.log("Wybrana oferta:", oferta);
    console.log("Konkurenci:", konkurenci);
    let wszystkie = dane.uslugi.internet.filter(o =>
        konkurenci.includes(o.id_firmy)
    );
    console.log("Wszystkie oferty konkurencji:", wszystkie);
    let poGrupiePredkosci = wszystkie.filter(o =>
        o.grupa_porownawcza == oferta.grupa_porownawcza
    );
    console.log("Po grupie prędkości:", poGrupiePredkosci);
    let poGrupieOkresu = poGrupiePredkosci.filter(o =>
        o.grupa_okresu == oferta.grupa_okresu
    );
    console.log("Po grupie okresu:", poGrupieOkresu);
    return poGrupieOkresu;
}

let aktualnePole = null;
document
.querySelectorAll(".wybor")
.forEach(element => {
    element.addEventListener("click", function(){
        aktualnePole = this.dataset.pole;
        otworzWybor(aktualnePole);
    });
});

function otworzWybor(pole){
    let modal =
    document.getElementById("oknoWyboru");
    let lista =
    document.getElementById("listaWyboru");
    lista.innerHTML="";
    if(pole=="firma"){
        dane.firmy
        .filter(f=>f.nasza_firma.toUpperCase()=="TAK")
        .forEach(f=>{
            lista.innerHTML += `
            <label>
                <input 
                type="radio"
                name="wybor"
                value="${f.id_firmy}">
               
                ${f.nazwa_firmy}
            </label>
            <br>
            `;
        });
    }
    document.getElementById("tytulWyboru").innerHTML =
    "Wybierz firmę";
    modal.classList.remove("ukryte");
}

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
    wybor[aktualnePole] =
    zaznaczone.value;
    if(aktualnePole=="firma"){
        let firma =
        dane.firmy.find(
            f=>f.id_firmy==zaznaczone.value
        );
        document
        .getElementById("wybranaFirma")
        .innerHTML =
        firma.nazwa_firmy;
    }
    document
    .getElementById("oknoWyboru")
    .classList.add("ukryte");
});

start();

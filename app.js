const dane = {
    firmy: [],
    konkurencja: [],
    uslugi: {}
};

async function start(){
	dane.firmy = await wczytajCSV("firmy.csv");
	dane.konkurencja = await wczytajCSV("konkurencja.csv");
	dane.uslugi.internet = await wczytajCSV("internet.csv");
    pokazFirmy();
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
		parametr.innerHTML += `
		<option value="${x}">
			${x.replace("/", " / ")} Mb/s
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
            ${x} Mb/s
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
	let wybrana =
	pobierzOferty().find(o=>
		o.id_firmy==firma &&
		o.nazwa_pakietu==pakiet &&
		o.predkosc_pobierania==download &&
		o.predkosc_wysylania==upload
	);
    pokazWynik(wybrana);
}

function pokazWynik(oferta){
    if (!oferta) {
        document.getElementById("wynik").innerHTML =
        `
        <div class="oferta">
            Nie znaleziono oferty.
        </div>
        `;
        return;
    }
	let harmonogram = pobierzHarmonogram(oferta);
	let htmlCennik = "";
	harmonogram.forEach(pozycja => {
		htmlCennik += `
			<tr>
				<td>${pozycja.od}-${pozycja.do}</td>
				<td>${pozycja.cena} zł</td>
			</tr>
		`;
	});
    document.getElementById("wynik").innerHTML=
    `
    <div class="oferta">
		<h2>${oferta.nazwa_pakietu}</h2>
		Prędkość:
		${oferta.predkosc_pobierania}/
		${oferta.predkosc_wysylania} Mb/s
		<br><br>
		Dodatki:
		${oferta.dodatki}
		<br><br>
		Uwagi:
		${oferta.uwagi}
		<h3>Cennik</h3>
		<table class="cennik">
			<tr>
				<th>Okres</th>
				<th>Cena</th>
			</tr>
			${htmlCennik}
		</table>
    </div>
    `;
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

start();

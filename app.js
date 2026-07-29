let firmy=[];
let konkurencja=[];
let oferty=[];

async function start(){
    console.log("Start aplikacji");
    firmy = await wczytajCSV("firmy.csv");
    console.log("Firmy:", firmy);
    konkurencja = await wczytajCSV("konkurencja.csv");
    console.log("Konkurencja:", konkurencja);
    oferty = await wczytajCSV("internet.csv");
    console.log("Oferty:", oferty);
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

function pokazFirmy(){
    let select = document.getElementById("firma");
    firmy
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
.addEventListener("change", function(){
    let usluga =
    document.getElementById("usluga");
    if(this.value){
        usluga.disabled=false;
    }
    else{
        usluga.disabled=true;
    }
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
    oferty.filter(o =>
        o.id_firmy == firma
    );
    [...new Set(lista.map(o=>o.okres_umowy))]
    .forEach(x=>{
        okres.innerHTML += `
        <option value="${x}">
            ${x==999 ? "Bezterminowa" : x+" miesięcy"}
        </option>`;
    });
    okres.disabled=false;
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
    oferty.filter(o =>
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
.addEventListener("change", pokazPredkosci);


function pokazPredkosci(){
    let firma =
    document.getElementById("firma").value;
    let okres =
    document.getElementById("okres").value;
    let pakiet =
    document.getElementById("pakiet").value;
    let predkosc =
    document.getElementById("predkosc");
    predkosc.innerHTML =
    '<option value="">Wybierz</option>';
    let lista =
    oferty.filter(o =>
        o.id_firmy == firma &&
        o.okres_umowy == okres &&
        o.nazwa_pakietu == pakiet
    );
    [...new Set(
        lista.map(o =>
            o.predkosc_pobierania+"/"+o.predkosc_wysylania
        )
    )]
    .forEach(x=>{
        predkosc.innerHTML += `
        <option value="${x}">
            ${x} Mb/s
        </option>`;
    });
    predkosc.disabled=false;
}

function filtruj(){
    let firma =
    document.getElementById("firma").value;
    let lista =
    oferty.filter(o=>
        o.id_firmy==firma
    );
    let okres =
    document.getElementById("okres");
    okres.innerHTML="";
    [...new Set(lista.map(o=>o.okres_umowy))]
    .forEach(x=>{
        okres.innerHTML+=`
        <option>${x}</option>`;
    });
    pokazPakiety(lista);
}



function pokazPakiety(lista){
    let pakiet =
    document.getElementById("pakiet");
    pakiet.innerHTML="";
    [...new Set(lista.map(o=>o.nazwa_pakietu))]
    .forEach(x=>{
        pakiet.innerHTML+=`
        <option>${x}</option>`;
    });
    pokazPredkosci();
}

function pokazPredkosci(){
    let firma =
    document.getElementById("firma").value;
    let pakiet =
    document.getElementById("pakiet").value;
    let lista =
    oferty.filter(o =>
        o.id_firmy == firma &&
        o.nazwa_pakietu == pakiet
    );
    let predkosc =
    document.getElementById("predkosc");
    predkosc.innerHTML="";
    let kombinacje =
    [...new Set(
        lista.map(o =>
            `${o.predkosc_pobierania}/${o.predkosc_wysylania}`
        )
    )];
    kombinacje.forEach(x=>{
        predkosc.innerHTML += `
        <option value="${x}">
        ${x} Mb/s
        </option>`;
    });
}

document
.getElementById("szukaj")
.addEventListener("click", szukaj);

function szukaj(){
    let firma =
    document.getElementById("firma").value;
    let pakiet =
    document.getElementById("pakiet").value;
	let predkosc =
	document.getElementById("predkosc").value;
	let [download, upload] = predkosc.split("/");
	let wybrana =
	oferty.find(o=>
		o.id_firmy==firma &&
		o.nazwa_pakietu==pakiet &&
		o.predkosc_pobierania==download &&
		o.predkosc_wysylania==upload
	);
    pokazWynik(wybrana);
}

function pokazWynik(oferta){
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
    </div>
    `;
}

start();

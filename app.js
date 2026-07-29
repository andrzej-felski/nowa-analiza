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

    let select=document.getElementById("firma");

    firmy
    .filter(f=>f.nasza_firma.toUpperCase()=="TAK")
    .forEach(f=>{

        select.innerHTML += `
        <option value="${f.id_firmy}">
        ${f.nazwa_firmy}
        </option>`;

    });

}


document
.getElementById("firma")
.addEventListener("change", filtruj);



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

}



document
.getElementById("szukaj")
.addEventListener("click", szukaj);



function szukaj(){

    let firma =
    document.getElementById("firma").value;


    let pakiet =
    document.getElementById("pakiet").value;


    let wybrana =
    oferty.find(o=>
        o.id_firmy==firma &&
        o.nazwa_pakietu==pakiet
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

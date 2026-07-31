function pobierzHarmonogram(oferta) {
    let wynik = [];
    let i = 1;
    while(true){
        let od = oferta["okres_od_" + i];
        if(!od){
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
					${pokazPakietGB(oferta)}
				</p>
			`;
		case "telewizja":
			return `
				<p>
					<strong>Liczba kanałów:</strong>
					${oferta.liczba_kanalow}
				</p>
			`;
		case "abonament_komorkowy":
			return `
				<p>
					<strong>Pakiet:</strong>
					${pokazNazwePakietuAbonamentu(oferta)}
				</p>
			`;
        default:
            return "";
    }
}

function pokazPakietGB(oferta){
    switch (Number(oferta.pakiet_gb)) {
        case 0:
            return "";
        case 9999:
            return "Bez limitu";
        default:
            return `${oferta.pakiet_gb} GB`;
    }
}

function pokazDlugoscUmowy(oferta){
    return pokazOkres(oferta.okres_umowy);
}

function pokazWynik(oferta, konkurenci){
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
    html += `
        <h2 style="text-align:center;color:#fff;">Konkurencja</h2>
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

function pobierzNazweFirmy(idFirmy) {
    let firma = dane.firmy.find(
        f => f.id_firmy == idFirmy
    );
    return firma
        ? firma.nazwa_firmy
        : idFirmy;
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
    return suma / miesiace;
}

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
					${pokazPakietGB(oferta)}
				</span>
			`;
		case "telewizja":
			return `
				<span>
					${oferta.nazwa_pakietu} - ${oferta.liczba_kanalow} kanałów
				</span>
			`;
		case "abonament_komorkowy":
			return `
				<span>
					${pokazNazwePakietuAbonamentu(oferta)}
				</span>
			`;
        default:
            return "";
    }
}

function generujTresc(oferta, nasza, ofertaBazowa){
    let harmonogram = pobierzHarmonogram(oferta);
    let tabela = "";
    harmonogram.forEach(o=>{
        tabela += `
            <tr>
                <td>
                    ${pokazZakresOkresow(o.od, o.do)}
                </td>
                <td>
                    ${o.cena.toFixed(2)} zł
                </td>
            </tr>
        `;
    });
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
        default:
            return usluga;
    }
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

function generujTabelePorownania(nasza, konkurencja){
    let zakresy =
        pobierzZakresyPorownania(
            nasza,
            konkurencja
        );
    let html = "";
    zakresy.forEach(zakres=>{
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
        html += `
        <tr>
            <td>
                ${pokazZakresOkresow(
                    zakres.od,
                    zakres.do
                )}
            </td>
			<td class="${
				cenaKonkurencji > cenaNasza
				? "drozsza"
				: cenaKonkurencji < cenaNasza
				? "tansza"
				: ""
			}">
				${pokazCene(cenaKonkurencji)}
			</td>
			<td class="znak">
				${znak}
			</td>
			<td>
				${pokazCene(cenaNasza)}
			</td>
        </tr>
        `;
    });
	let sredniaNasza = policzSredniaCene(nasza);
	let sredniaKonkurencji = policzSredniaCene(konkurencja);
	let roznicaSrednia = "";
	if (sredniaKonkurencji > sredniaNasza) {
		roznicaSrednia = ">";
	}
	if (sredniaKonkurencji < sredniaNasza) {
		roznicaSrednia = "<";
	}
	html += `
	<tr class="wiersz-srednia">
		<td>
			Średnia cena
		</td>
		<td class="${
			sredniaKonkurencji > sredniaNasza
			? "drozsza"
			: sredniaKonkurencji < sredniaNasza
			? "tansza"
			: ""
		}">
			${pokazCene(sredniaKonkurencji)}
		</td>
		<td class="znak">
			${roznicaSrednia}
		</td>
		<td>
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

function pokazCene(cena){
    return cena !== null
        ? cena.toFixed(2) + " zł"
        : "-";
}

# Klientela

Prezentacioni sajt na [klientela.me](https://klientela.me).

Sajt koristi običan HTML, CSS i JavaScript. Nema build koraka ni paketa koje treba instalirati. Izgled, tekstovi, animacije i naracija sačuvani su iz originalne verzije.

## Organizacija

```text
index.html                         Sadržaj i struktura stranice
assets/css/main.css                Stilovi stranice
assets/css/no-script.css           Prikaz kada JavaScript nije dostupan
assets/js/site.js                  Navigacija, animacije i interakcije
assets/js/product-demo.js          Demonstracija portala i audio naracija
assets/images/brand/               Originalne varijante logotipa
assets/images/steps/               Slike koraka predstavljanja usluge
assets/audio/product-demo.mp3      Naracija demonstracije
```

## Lokalno pokretanje

Iz direktorijuma projekta pokreni:

```sh
python -m http.server 8080
```

Zatim otvori `http://localhost:8080`.

## Objavljivanje

Na web server se prenose `index.html` i cijeli direktorijum `assets/`. Putanje su relativne; oba moraju ostati u istom korijenu sajta. Novi direktorijum izdanja može se pripremiti i potom aktivirati promjenom serverskog simboličkog linka.

Klijentski portal se nalazi na [portal.klientela.me](https://portal.klientela.me) i održava se u posebnom serverskom projektu. Lozinke, serverska konfiguracija i privatna admin adresa ne pripadaju ovom javnom repozitorijumu.

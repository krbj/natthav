# Natthav - Felles utgifter for samboere

En app som hjelper samboere med å få oversikt og kontroll over felles faste utgifter.

## Prosjektstruktur

```
Natthav/
├── index.html              # Hovedfil med tab-navigasjon
├── demos/                  # HTML-demoer for godkjenning
│   ├── demo-utgifter.html  # Demo av utgiftsfordeling
│   └── demo-grafikk.html   # Demo av grafisk fremstilling
├── styles/
│   └── main.css           # Hovedstiler
├── scripts/
│   └── main.js            # Hovedfunksjonalitet
├── assets/                # Bilder og ikoner
└── docs/                  # Dokumentasjon og dialog-logg
```

## Utviklingsprosess

1. **HTML-demoer** lages først for hver fane
2. Demoene må godkjennes av Kristoffer Bjerkvik
3. Først etter godkjenning implementeres funksjonaliteten

## Hovedfunksjoner

- Fordeling av utgifter mellom to personer
- Fire standard hovedgrupper (kan utvides)
- Prosent-slider for justering av andeler
- Individuelt månedlig budsjett med varsler
- Grafisk fremstilling med kakediagram og linjediagram
- Profilbilder for visuell identifikasjon


export const EXPERIENCE_PRESETS = {
  packageContents: {
    iphone: [
      { label: { de: "USB-C auf USB-C Webkabel (1 m)", en: "USB-C to USB-C Woven Cable (1 m)" }, included: true },
      { label: { de: "Originalverpackung / Sichere Box", en: "Original Packaging / Secure Box" }, included: true },
      { label: { de: "SIM-Auswurfwerkzeug & Dokumentation", en: "SIM Eject Tool & Documentation" }, included: true },
      { label: { de: "20W USB-C Power Adapter (Netzteil)", en: "20W USB-C Power Adapter" }, included: false },
      { label: { de: "Kabelgebundene Kopfhörer (EarPods)", en: "Wired EarPods Headphones" }, included: false },
    ],
    samsung: [
      { label: { de: "USB-C auf USB-C Ladekabel", en: "USB-C to USB-C Cable" }, included: true },
      { label: { de: "SIM-Karten-Auswerfer & Kurzanleitung", en: "SIM Card Eject Pin & Quick Guide" }, included: true },
      { label: { de: "Originalverpackung", en: "Original Box" }, included: true },
      { label: { de: "Schnelllade-Netzteil", en: "Fast Charging Power Adapter" }, included: false },
    ],
    macbook: [
      { label: { de: "USB-C auf MagSafe 3 Ladekabel (2 m)", en: "USB-C to MagSafe 3 Cable (2 m)" }, included: true },
      { label: { de: "USB-C Power Adapter (Netzteil)", en: "USB-C Power Adapter" }, included: true },
      { label: { de: "Originalverpackung & Dokumentation", en: "Original Box & Documentation" }, included: true },
    ],
    watch: [
      { label: { de: "Magnetisches Schnellladegerät auf USB-C Kabel (1 m)", en: "Magnetic Fast Charger to USB-C Cable (1 m)" }, included: true },
      { label: { de: "Sportarmband (S/M & M/L)", en: "Sport Band (S/M & M/L)" }, included: true },
      { label: { de: "USB-C Netzteil", en: "USB-C Power Adapter" }, included: false },
    ],
    ipad: [
      { label: { de: "USB-C Ladekabel (1 m)", en: "USB-C Charge Cable (1 m)" }, included: true },
      { label: { de: "20W USB-C Power Adapter (Netzteil)", en: "20W USB-C Power Adapter" }, included: true },
      { label: { de: "Dokumentation", en: "Documentation" }, included: true },
      { label: { de: "Apple Pencil", en: "Apple Pencil" }, included: false },
    ],
  },
  conditionGuide: [
    {
      condition: "new" as const,
      label: { de: "Neu & Versiegelt", en: "Brand New & Sealed" },
      description: { de: "Originalverpackt und ungeöffnet mit voller Hersteller-Garantie.", en: "Original packaging and factory sealed with full manufacturer warranty." },
      imageUrls: [],
    },
    {
      condition: "open_box" as const,
      label: { de: "Open-Box (Wie neu)", en: "Open Box (Like New)" },
      description: { de: "Neuwertiges Gerät, nur zu Prüf- oder Vorführzwecken geöffnet. Keinerlei Gebrauchsspuren.", en: "Like-new condition, unsealed only for inspection or demo. Zero signs of wear." },
      imageUrls: [],
    },
    {
      condition: "used" as const,
      label: { de: "Gebraucht (Zustand A+ Exzellent)", en: "Refurbished (Grade A+ Excellent)" },
      description: { de: "Technisch einwandfrei, professionell 50+ Punkte geprüft. Minimale bis keine Mikrokratzer.", en: "Technically flawless, 50+ points certified. Minimal to no micro-scratches." },
      imageUrls: [],
    },
  ],
  refurbishmentSteps: [
    {
      title: { de: "01. Eingangsprüfung & Akkudiagnose", en: "01. Intake & Battery Diagnosis" },
      description: { de: "Prüfung von Ladezyklen, Originalbauteilen, Kapazität und thermischer Stabilität.", en: "Verification of cycle count, genuine parts, capacity, and thermal stability." },
    },
    {
      title: { de: "02. Ultraschall-Reinigung & Hygiene", en: "02. Ultrasonic Cleaning & Hygiene" },
      description: { de: "Mikrofon- und Lautsprechergitter sowie Ladebuchsen werden porentief hygienisch gereinigt.", en: "Microphones, speaker grills, and charging ports are deep-cleaned hygienically." },
    },
    {
      title: { de: "03. 50+ Hardware- & Sensortest", en: "03. 50+ Hardware & Sensor Test" },
      description: { de: "OLED-Display, Kameras, Face-ID / Touch-ID, Mikrofone, Lautsprecher und Mobilfunkantennen.", en: "OLED display, cameras, Face ID / Touch ID, mics, speakers, and cellular antennas." },
    },
    {
      title: { de: "04. Sichere Datenlöschung & Zertifizierung", en: "04. Secure Wipe & Certification" },
      description: { de: "Vollständige DSGVO-konforme Rücksetzung, neueste Betriebssystem-Installation & Siegel.", en: "Full GDPR-compliant data erasure, latest OS installation & store seal." },
    },
  ],
  trustPoints: [
    {
      title: { de: "Klare Zustandsangaben", en: "Clear Condition Details" },
      description: { de: "Zustand, Lieferumfang und bekannte Hinweise direkt am konkreten Angebot.", en: "Condition, included items, and known notes stated on the specific offer." },
    },
    {
      title: { de: "14 Tage Rückgaberecht", en: "14-Day Money Back Guarantee" },
      description: { de: "Testen Sie Ihr Gerät in aller Ruhe zu Hause oder direkt vor Ort im Wilhelmsburger Store.", en: "Test your device at home or in our Wilhelmsburg store with zero risk." },
    },
    {
      title: { de: "Kostenloser Expressversand", en: "Free Express Shipping" },
      description: { de: "Sicher verpackt mit DHL GoGreen inkl. Sendungsverfolgung und Transportversicherung.", en: "Securely packed via DHL GoGreen with tracking and full insurance." },
    },
  ],
  dimensions: {
    "iPhone 16 Pro Max": { heightMm: 163.0, widthMm: 77.6, depthMm: 8.25, weightG: 227, screenInches: 6.9 },
    "iPhone 16 Pro": { heightMm: 149.6, widthMm: 71.5, depthMm: 8.25, weightG: 199, screenInches: 6.3 },
    "iPhone 16": { heightMm: 147.6, widthMm: 71.6, depthMm: 7.80, weightG: 170, screenInches: 6.1 },
    "iPhone 15 Pro Max": { heightMm: 159.9, widthMm: 76.7, depthMm: 8.25, weightG: 221, screenInches: 6.7 },
    "iPhone 15 Pro": { heightMm: 146.6, widthMm: 70.6, depthMm: 8.25, weightG: 187, screenInches: 6.1 },
    "iPhone 15": { heightMm: 147.6, widthMm: 71.6, depthMm: 7.80, weightG: 171, screenInches: 6.1 },
    "Galaxy S24 Ultra": { heightMm: 162.3, widthMm: 79.0, depthMm: 8.60, weightG: 232, screenInches: 6.8 },
    "Galaxy S24+": { heightMm: 158.5, widthMm: 75.9, depthMm: 7.70, weightG: 196, screenInches: 6.7 },
    "Galaxy S24": { heightMm: 147.0, widthMm: 70.6, depthMm: 7.60, weightG: 167, screenInches: 6.2 },
  },
  campaigns: [
    {
      label: "Sommer-Deal",
      badge: { de: "Sommer-Deal", en: "Summer Deal" },
      message: { de: "Inklusive Gratis Panzerglas bei Abholung im Store in Hamburg-Wilhelmsburg.", en: "Free tempered glass screen protector included on store pickup." },
    },
    {
      label: "Bestseller",
      badge: { de: "Bestseller", en: "Best Seller" },
      message: { de: "Top-Zustand & blitzschneller kostenloser DHL Versand.", en: "Top condition & lightning fast free DHL shipping." },
    },
    {
      label: "Express-Versand",
      badge: { de: "Express-Versand", en: "Express Shipping" },
      message: { de: "Bestellungen bis 14 Uhr werden heute noch versendet.", en: "Orders before 2 PM ship today." },
    },
    {
      label: "Trade-In Bonus",
      badge: { de: "Trade-In Bonus", en: "Trade-In Bonus" },
      message: { de: "Zusätzlich 20 € Direktrabatt bei Inzahlungnahme Ihres alten Smartphones.", en: "Extra €20 trade-in bonus when turning in your old device." },
    },
  ],
};

export type Locale = "de" | "en";

export const locales: Locale[] = ["de", "en"];

export const dictionary = {
  de: {
    nav: [
      { label: "Startseite", path: "" },
      { label: "Reparatur & Service", path: "/repairs" },
      { label: "Smartphones", path: "/smartphones" },
      { label: "Zubehör", path: "/accessories" },
      { label: "Laptops", path: "/laptops" },
      { label: "Gaming", path: "/gaming" },
      { label: "Kontakt", path: "/contact" },
    ],
    header: {
      openMenu: "Menü öffnen",
      closeMenu: "Menü schließen",
    },
    footer: {
      headline: "Dein Premium-Shop für Smartphones & Reparaturen",
      description:
        "Im Apfel Park kombinieren wir Premium-Hardware, Zubehör und Sofort-Reparaturen unter einem Dach.",
      quickLinks: [
        { label: "Reparatur & Service", path: "/repairs" },
        { label: "Smartphones", path: "/smartphones" },
        { label: "Zubehör", path: "/accessories" },
        { label: "Laptops", path: "/laptops" },
        { label: "Gaming", path: "/gaming" },
      ],
      companyLinks: [
        { label: "Über uns", path: "/about" },
        { label: "FAQ", path: "/faq" },
        { label: "Datenschutz", path: "/privacy" },
        { label: "AGB", path: "/terms" },
      ],
      support: [
        "Sofort-Diagnose & transparente Preise",
        "Express-Reparatur im Shop",
        "Original- und Premium-Ersatzteile",
        "Datenrettung & Geräteschutz",
      ],
    },
    meta: {
      home: {
        title: "Apfel Park | Smartphone & Repair Studio",
        description:
          "Smart Phone. Smart Service. Smart Price. Premium Shop für Smartphones, Zubehör, Konsolen und Reparaturen in Hamburg.",
      },
      services: {
        title: "Services",
        description:
          "Professionelle Services von Sofort-Reparatur bis Geräte-Setup – alles im Apfel Park Hamburg.",
      },
      repairs: {
        title: "Reparaturen",
        description:
          "Smartphone-, Tablet- und Konsolenreparaturen mit Premium-Teilen, Garantie und Express-Service.",
      },
      accessories: {
        title: "Zubehör",
        description:
          "Handy-Zubehör, Schutz, Ladegeräte und Audio – sorgfältig ausgewählte Marken im Apfel Park.",
      },
      smartphones: {
        title: "Smartphones",
        description:
          "Neue und geprüfte Smartphones führender Marken – sofort verfügbar im Apfel Park.",
      },
      gaming: {
        title: "Gaming & Konsolen",
        description:
          "PlayStation- und Gaming-Services, Reparaturen und Zubehör im Apfel Park.",
      },
      laptops: {
        title: "Laptops",
        description:
          "Neue und gebrauchte Laptops kaufen – MacBooks, Windows-Laptops mit Garantie und bestem Preis-Leistungs-Verhältnis.",
      },
      contact: {
        title: "Kontakt",
        description:
          "Rufen Sie uns an oder besuchen Sie Apfel Park in Hamburg. Wir sind Montag bis Samstag für Sie da.",
      },
      about: {
        title: "Über uns",
        description:
          "Erfahre mehr über Apfel Park – der Premium-Shop für Smartphones, Zubehör und Reparaturen.",
      },
      faq: {
        title: "FAQ",
        description:
          "Antworten auf die häufigsten Fragen rund um Reparatur, Zubehör und Service im Apfel Park.",
      },
      privacy: {
        title: "Datenschutz",
        description:
          "Datenschutzinformationen für Apfel Park – transparent, sicher und DSGVO-konform.",
      },
      terms: {
        title: "AGB",
        description:
          "Allgemeine Geschäftsbedingungen für Reparaturen, Verkäufe und Services im Apfel Park.",
      },
    },
    home: {
      hero: {
        eyebrow: "Hamburgs Premium-Mobilshop",
        title: "Smart Phone. Smart Service. Smart Price.",
        subtitle:
          "Erlebe Premium-Smartphones, Zubehör und Express-Reparaturen im Apfel Park. Alles an einem Ort – schnell, transparent, professionell.",
        primaryCta: "Reparatur starten",
        secondaryCta: "Kontakt aufnehmen",
        cards: [
          {
            title: "Shop & Beratung",
            description: "Premium-Geräte, sofort verfügbar mit ehrlicher Beratung.",
            path: "/smartphones",
            image: "/images/hero-shop.svg",
          },
          {
            title: "Zubehör",
            description: "Cases, Schutz, Audio und Lifestyle-Accessories für dein Gerät.",
            path: "/accessories",
            image: "/images/hero-accessories.svg",
          },
          {
            title: "Smartphones",
            description: "Neue & geprüfte Geräte, Trade-In und Geräte-Setup.",
            path: "/smartphones",
            image: "/images/hero-smartphones.svg",
          },
          {
            title: "Game Consoles",
            description: "PlayStation-Reparaturen, Upgrades und Zubehör.",
            path: "/gaming",
            image: "/images/hero-console.svg",
          },
        ],
      },
      highlights: [
        { label: "Sofort-Reparatur", value: "< 1 Std." },
        { label: "Premium-Beratung", value: "100%" },
        { label: "Garantie", value: "12 Monate" },
      ],
      services: {
        title: "Reparaturen & Services",
        subtitle:
          "Von Display-Schäden bis Platinen-Reparatur – unser Team erledigt alles zuverlässig und schnell.",
        items: [
          {
            title: "Display & Glas",
            description: "Express-Displaytausch mit Premium-Ersatzteilen.",
          },
          {
            title: "Wasserschaden",
            description: "Spezialdiagnose, Reinigung und Datenrettung.",
          },
          {
            title: "Platine & Chip",
            description: "Reparatur auf Board-Level mit moderner Ausrüstung.",
          },
          {
            title: "Batterie & Power",
            description: "Akkutausch, Ladeanschluss und Power-Management.",
          },
        ],
      },
      support: {
        title: "Premium Support",
        subtitle:
          "Wir begleiten dich vor, während und nach dem Kauf – mit persönlicher Betreuung.",
        bullets: [
          "Sofortdiagnose ohne Termin",
          "Software-Setup und Datenübertragung",
          "Sicherheitscheck & Virenentfernung",
          "Finanzierung und Trade-In Beratung",
        ],
        image: "/images/repair-lab.svg",
      },
      repairFocus: {
        title: "Smartphone- & Tablet-Reparaturen",
        subtitle:
          "Schnell, zuverlässig, transparent. Wir reparieren alle gängigen Marken und Geräte.",
        items: [
          {
            title: "Smartphone Reparatur",
            description: "Schneller Austausch, Originalteile, Service mit Garantie.",
          },
          {
            title: "Tablet & iPad",
            description: "Display, Akku und Board-Service für Tablets aller Marken.",
          },
          {
            title: "Kamera & Sensoren",
            description: "Front- und Hauptkamera, Face-ID und Sensorik.",
          },
        ],
      },
      process: {
        title: "Dein Reparatur-Flow",
        steps: [
          {
            title: "Check-in",
            description: "Diagnose, Preis und Zeitrahmen in wenigen Minuten.",
          },
          {
            title: "Sofort-Reparatur",
            description: "Reparatur im Shop mit Premium-Werkstatt-Team.",
          },
          {
            title: "Qualitätsprüfung",
            description: "Testing, Reinigung und Übergabe inklusive Garantie.",
          },
        ],
      },
      testimonials: {
        title: "Was unsere Kunden sagen",
        subtitle: "Echte Bewertungen von zufriedenen Kunden",
        items: [
          {
            name: "Guru Sosale",
            badge: "Local Guide · 28 Bewertungen",
            timeAgo: "vor 2 Jahren",
            quote: "Super Service, habe einen neuen Displayschutz bekommen und die haben es super professionell gemacht!",
            rating: 5,
          },
          {
            name: "Godsaid Enyia",
            badge: "9 Bewertungen",
            timeAgo: "vor 3 Jahren",
            quote: "Toller Service!",
            rating: 5,
          },
          {
            name: "Sevilay Güldal",
            badge: "1 Bewertung",
            timeAgo: "vor 3 Wochen",
            quote: "Ich habe mein iPhone dort reparieren lassen und das Kameramodul austauschen lassen. Ich bin wirklich positiv überrascht! Die Reparatur ging viel schneller als bei Apple, völlig unkompliziert und absolut professionell. Die Mitarbeiter waren sehr freundlich, haben alles gut erklärt und der Preis war deutlich günstiger als bei Apple.",
            rating: 5,
          },
          {
            name: "Amar Emshija",
            badge: "1 Bewertung",
            timeAgo: "vor 1 Monat",
            quote: "Ich bin absolut begeistert von Apfel Park! Der Service ist professionell, freundlich und super schnell. Mein Handy wurde in kürzester Zeit repariert und funktioniert wieder perfekt. Die Beratung war ehrlich, geduldig und sehr kompetent - man merkt sofort, dass hier jemand mit Erfahrung und Herz arbeitet.",
            rating: 5,
          },
          {
            name: "Hans-Joachim Janiak",
            badge: "2 Bewertungen",
            timeAgo: "vor 4 Monaten",
            quote: "Am Montag ein Samsung S24 Ultra nach Sturz aus dem 5. Stock abgegeben. Mittwoch Mittag Anruf, Handy ist fertig! Leute, was will man mehr? Super freundlicher und kompetenter Service. Preis der Reparatur sensationell gut!",
            rating: 5,
          },
          {
            name: "Tim",
            badge: "Local Guide · 94 Bewertungen",
            timeAgo: "vor 5 Monaten",
            quote: "Ich hatte ein Problem mit meinem iPhone. Herr Özgür hatte mich hier sehr nett beraten. Nach ca. 10 Minuten hatte er den Fehler entdeckt. Hier war ein Profi am Werk. Mit etwas Geduld lief das Gerät wieder. Die Auswahl ist gigantisch!",
            rating: 5,
          },
          {
            name: "Cem Kaplan",
            badge: "1 Bewertung",
            timeAgo: "vor 5 Monaten",
            quote: "Das Preis-Leistungs-Verhältnis ist super und der Kundenservice ist perfekt. Ich fühle mich hier gut aufgehoben, obwohl ich von Handys keine Ahnung habe!",
            rating: 5,
          },
          {
            name: "Emiliana Vaz",
            badge: "2 Bewertungen",
            timeAgo: "vor 5 Monaten",
            quote: "Diesen Laden kann man nicht mit Worten beschreiben. Ich war in ganz Hamburg und keiner wollte diese Reparatur bei mir machen außer die, und es ging sehr schnell!",
            rating: 5,
          },
          {
            name: "Heide Rogalla",
            badge: "2 Bewertungen",
            timeAgo: "vor 5 Monaten",
            quote: "Super hilfreich und menschlich. Endlich ein Geschäft mit Herz und Service! Immer wieder gerne.",
            rating: 5,
          },
        ],
      },
      gallery: {
        title: "Inside Apfel Park",
        subtitle:
          "Einblick in Shop, Werkstatt und Zubehörwelt – modern, schnell und premium.",
        image: "/images/shop-gallery.svg",
        features: [
          "170 qm Showroom und Werkstatt",
          "Direkt am Kunden, direkt verfügbar",
          "Premium-Zubehör kuratiert",
        ],
      },
      cta: {
        title: "Bereit für Premium-Service?",
        description:
          "Hol dir dein neues Gerät oder sichere dir eine Express-Reparatur im Apfel Park.",
        primary: "Jetzt anrufen",
        secondary: "Reparatur buchen",
      },
    },
    services: {
      heroTitle: "Services für jedes Gerät",
      heroSubtitle:
        "Von Setup bis Sofort-Reparatur – wir liefern Premium-Service für Smartphone, Tablet und Konsole.",
      categories: [
        {
          title: "Sofort-Reparatur",
          description: "Display, Akku, Kamera oder Ladeanschluss – fertig in weniger als 1 Stunde.",
        },
        {
          title: "Premium Setup",
          description: "Datenübertragung, Backup, Schutz und persönliches Onboarding.",
        },
        {
          title: "Geräteschutz",
          description: "Schutzgläser, Cases, Versicherung und Beratung.",
        },
        {
          title: "Business Service",
          description: "Schnelle Reparaturen für Unternehmen und Teams.",
        },
      ],
    },
    repairs: {
      heroTitle: "Reparaturen ohne Stress",
      heroSubtitle:
        "Unsere Werkstatt löst komplexe Schäden, inklusive Board-Level Reparaturen.",
      highlights: [
        "Express-Service in Hamburg",
        "Original- und Premium-Ersatzteile",
        "12 Monate Garantie",
        "Faire Preise ohne Überraschungen",
      ],
      repairTypes: [
        {
          title: "Display & Glas",
          description: "Präziser Austausch inklusive Dichtung und Kalibrierung.",
        },
        {
          title: "Wasserschaden",
          description: "Tiefenreinigung, Korrosionsschutz und Datenrettung.",
        },
        {
          title: "Mainboard",
          description: "Chip- und Platinenreparatur auf Profi-Niveau.",
        },
        {
          title: "Audio & Mikrofon",
          description: "Lautsprecher, Mikrofone und Audiochips perfekt abgestimmt.",
        },
      ],
    },
    accessories: {
      heroTitle: "Zubehör, das dein Gerät schützt",
      heroSubtitle:
        "Premium-Cases, Audio, Power und Lifestyle-Accessories für jeden Stil.",
      categories: [
        "Cases & Schutzgläser",
        "Ladegeräte & Powerbanks",
        "Audio, Kopfhörer & Speaker",
        "Smart Home & Lifestyle",
      ],
    },
    smartphones: {
      heroTitle: "Smartphones sofort verfügbar",
      heroSubtitle:
        "Neue und geprüfte Geräte, Trade-In und Setup-Services direkt im Shop.",
      highlights: [
        "Top-Marken & Premium-Modelle",
        "Finanzierung und Trade-In",
        "Geräte-Setup inklusive",
      ],
    },
    gaming: {
      heroTitle: "Gaming & Konsolen",
      heroSubtitle:
        "PlayStation- und Konsolenservice, Upgrades und Zubehör in Hamburg.",
      highlights: [
        "Konsole Reparatur und Reinigung",
        "Lüfter- und Temperaturservice",
        "Controller, Docking & Zubehör",
      ],
    },
    laptops: {
      heroTitle: "Laptops kaufen & reparieren",
      heroSubtitle:
        "MacBooks und Windows-Laptops – neu, gebraucht und professionell gewartet.",
      sections: {
        new: {
          title: "Neue Laptops",
          subtitle: "Premium-Geräte direkt verfügbar mit voller Herstellergarantie.",
        },
        refurbished: {
          title: "Gebrauchte Laptops",
          subtitle: "Geprüfte Qualität, wie neu – zu unschlagbaren Preisen.",
        },
        accessories: {
          title: "Laptop Zubehör",
          subtitle: "Ladegeräte, Taschen, Docking-Stations und mehr.",
        },
        store: {
          title: "Verfügbare Laptops",
          subtitle: "Unsere aktuellen Angebote – sofort abholbereit.",
        },
      },
      highlights: [
        "12 Monate Garantie auf alle Geräte",
        "Professionelle Qualitätsprüfung",
        "Beste Preise in Hamburg",
        "Kostenlose Erstberatung",
      ],
      brands: ["Apple MacBook", "Lenovo", "HP", "Dell", "ASUS", "Acer"],
      accessories: [
        {
          title: "Ladegeräte",
          description: "Original und Universal-Netzteile für alle Laptop-Marken.",
        },
        {
          title: "Laptop-Taschen",
          description: "Schutz und Stil für unterwegs – von 13 bis 17 Zoll.",
        },
        {
          title: "Docking-Stations",
          description: "USB-C Hubs, Monitorkabel und Desktop-Setup.",
        },
        {
          title: "Ersatzteile",
          description: "Akkus, Tastaturen, Displays und mehr.",
        },
      ],
    },
    contact: {
      heroTitle: "Wir sind für dich da",
      heroSubtitle:
        "Ruf uns an oder komm vorbei – wir helfen sofort und persönlich.",
      contactCards: [
        {
          title: "Besuche uns",
          description: "Wilhelm-Strauß-Weg 2b, 21109 Hamburg",
        },
        {
          title: "Ruf uns an",
          description: "040 58978787",
        },
        {
          title: "Schreib uns",
          description: "info@apfel-park.de",
        },
      ],
    },
    about: {
      heroTitle: "Apfel Park – Premium seit Tag 1",
      heroSubtitle:
        "Dein vertrauenswürdiger Partner für Smartphones, Zubehör und Reparaturen in Hamburg.",
      intro: "Willkommen bei Apfel Park – deinem Premium-Shop für Smartphones, Zubehör und professionelle Reparaturen im Herzen von Hamburg. Seit unserer Gründung setzen wir auf Qualität, Transparenz und persönlichen Service.",
      story: {
        title: "Unsere Geschichte",
        content: "Was als kleine Werkstatt begann, ist heute einer der führenden Smartphone-Shops in Hamburg. Unser Gründer, selbst begeisterter Technik-Enthusiast, wollte einen Ort schaffen, an dem Kunden nicht nur hochwertige Produkte finden, sondern auch ehrliche Beratung und schnelle Hilfe bei Problemen. Dieser Traum ist Apfel Park.",
      },
      features: [
        {
          title: "100% Original-Produkte",
          description: "Wir verkaufen ausschließlich Original-Geräte und zertifiziertes Zubehör. Keine Fälschungen, keine Kompromisse – nur Premium-Qualität von führenden Marken.",
          icon: "genuine",
        },
        {
          title: "12 Monate Garantie",
          description: "Alle unsere Produkte und Reparaturen sind mit einer 12-monatigen Garantie abgesichert. Wir stehen hinter unserer Arbeit und unseren Produkten.",
          icon: "warranty",
        },
        {
          title: "Freundliches Team",
          description: "Unser Team besteht aus leidenschaftlichen Technik-Experten, die dir mit Rat und Tat zur Seite stehen. Wir nehmen uns Zeit für dich und deine Fragen.",
          icon: "team",
        },
        {
          title: "Erstklassiger Support",
          description: "Von der Beratung vor dem Kauf bis zur Unterstützung nach dem Kauf – wir sind für dich da. Schnelle Antworten, kompetente Hilfe, echte Lösungen.",
          icon: "support",
        },
      ],
      values: {
        title: "Unsere Werte",
        items: [
          "Transparenz bei Preis und Diagnose",
          "Premium-Ersatzteile und Qualitätskontrolle",
          "Persönliche Beratung statt Massenabfertigung",
          "Nachhaltigkeit durch Reparatur statt Wegwerfen",
        ],
      },
      cta: {
        title: "Entdecke unser Sortiment",
        description: "Stöbere durch unsere Auswahl an Smartphones, Laptops und Zubehör – alles Original, alles mit Garantie.",
        buttons: {
          smartphones: "Smartphones entdecken",
          accessories: "Zubehör ansehen",
          contact: "Kontakt aufnehmen",
        },
      },
      stats: [
        { value: "5+", label: "Jahre Erfahrung" },
        { value: "10.000+", label: "Zufriedene Kunden" },
        { value: "15.000+", label: "Reparaturen" },
        { value: "4.9", label: "Google Bewertung" },
      ],
    },
    faq: {
      heroTitle: "Häufige Fragen",
      heroSubtitle: "Antworten rund um Service, Reparatur und Zubehör.",
      items: [
        {
          question: "Wie schnell ist eine Reparatur?",
          answer:
            "Die meisten Reparaturen sind in weniger als einer Stunde erledigt. Bei komplexen Schäden informieren wir dich sofort über den Zeitrahmen.",
        },
        {
          question: "Gibt es Garantie?",
          answer:
            "Ja, wir geben 12 Monate Garantie auf unsere Reparaturen und Premium-Ersatzteile.",
        },
        {
          question: "Welche Marken repariert ihr?",
          answer:
            "Wir reparieren alle gängigen Marken – Apple, Samsung, Huawei, Xiaomi, Google Pixel und mehr.",
        },
        {
          question: "Kann ich ohne Termin kommen?",
          answer:
            "Ja, unsere Sofort-Diagnose ist ohne Termin möglich. Bei hoher Auslastung vereinbaren wir kurzfristige Slots.",
        },
      ],
    },
    privacy: {
      heroTitle: "Datenschutzerklärung",
      intro:
        "Wir nehmen den Schutz Ihrer Daten ernst. Diese Datenschutzerklärung informiert über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten auf unserer Website und bei unseren Services.",
      sections: [
        {
          title: "1. Verantwortlicher",
          body: [
            "Apfel Park, Wilhelm-Strauß-Weg 2b, 21109 Hamburg",
            "E-Mail: info@apfel-park.de | Telefon: 040 58978787",
          ],
        },
        {
          title: "2. Erhobene Daten",
          body: [
            "Kontakt- und Bestelldaten (Name, E-Mail, Telefonnummer, Adresse)",
            "Geräteinformationen für Reparaturen und Service-Aufträge",
            "Zahlungs- und Rechnungsdaten im Bestellprozess",
          ],
        },
        {
          title: "3. Zweck der Verarbeitung",
          body: [
            "Durchführung von Reparaturen, Bestellungen und Support",
            "Kommunikation zu Angeboten, Terminen und Services",
            "Erfüllung gesetzlicher Pflichten (z. B. Rechnungslegung)",
          ],
        },
        {
          title: "4. Weitergabe an Dritte",
          body: [
            "Zahlungsdienstleister (z. B. PayPal, Klarna, Sofort, Giropay, SEPA, Stripe)",
            "Versand- und Logistikpartner bei Bestellungen",
            "IT- und Hosting-Dienstleister (z. B. Vercel, Supabase)",
          ],
        },
        {
          title: "5. Cookies & Tracking",
          body: [
            "Wir verwenden technisch notwendige Cookies, um den Betrieb der Website zu gewährleisten.",
            "Optionale Tracking- und SEO-Tools können im Admin-Dashboard aktiviert werden.",
          ],
        },
        {
          title: "6. Ihre Rechte",
          body: [
            "Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung",
            "Widerspruch gegen die Verarbeitung und Datenübertragbarkeit",
            "Beschwerde bei der zuständigen Datenschutzbehörde",
          ],
        },
      ],
    },
    terms: {
      heroTitle: "Allgemeine Geschäftsbedingungen",
      intro:
        "Diese AGB gelten für alle Reparatur-, Service- und Kaufverträge mit Apfel Park.",
      sections: [
        {
          title: "1. Leistungen",
          body: [
            "Reparatur und Wartung von Smartphones, Tablets und Konsolen",
            "Verkauf von Geräten, Zubehör und Dienstleistungen",
          ],
        },
        {
          title: "2. Reparaturablauf",
          body: [
            "Wir erstellen nach Diagnose einen Kostenvoranschlag.",
            "Die Reparatur beginnt erst nach Ihrer Freigabe.",
            "Bei nicht durchführbaren Reparaturen informieren wir Sie umgehend.",
          ],
        },
        {
          title: "3. Preise & Zahlung",
          body: [
            "Alle Preise verstehen sich inkl. gesetzlicher MwSt.",
            "Zahlung per PayPal, Klarna, Sofort, Giropay, SEPA, Stripe oder Barzahlung vor Ort.",
          ],
        },
        {
          title: "4. Garantie",
          body: [
            "12 Monate Garantie auf Ersatzteile und Reparaturleistungen, sofern kein Fremdverschulden vorliegt.",
          ],
        },
        {
          title: "5. Haftung",
          body: [
            "Für Datenverlust haften wir nur bei grober Fahrlässigkeit oder Vorsatz.",
            "Bitte sichern Sie Ihre Daten vor der Reparatur.",
          ],
        },
      ],
    },
  },
  en: {
    nav: [
      { label: "Home", path: "" },
      { label: "Repair & Service", path: "/repairs" },
      { label: "Smartphones", path: "/smartphones" },
      { label: "Accessories", path: "/accessories" },
      { label: "Laptops", path: "/laptops" },
      { label: "Gaming", path: "/gaming" },
      { label: "Contact", path: "/contact" },
    ],
    header: {
      openMenu: "Open menu",
      closeMenu: "Close menu",
    },
    footer: {
      headline: "Premium smartphones, accessories & repairs",
      description:
        "Apfel Park combines premium devices, accessories and express repairs in one modern studio.",
      quickLinks: [
        { label: "Repair & Service", path: "/repairs" },
        { label: "Smartphones", path: "/smartphones" },
        { label: "Accessories", path: "/accessories" },
        { label: "Laptops", path: "/laptops" },
        { label: "Gaming", path: "/gaming" },
      ],
      companyLinks: [
        { label: "About", path: "/about" },
        { label: "FAQ", path: "/faq" },
        { label: "Privacy", path: "/privacy" },
        { label: "Terms", path: "/terms" },
      ],
      support: [
        "Instant diagnostics with clear pricing",
        "Express in-store repairs",
        "Original & premium spare parts",
        "Data recovery & device protection",
      ],
    },
    meta: {
      home: {
        title: "Apfel Park | Smartphone & Repair Studio",
        description:
          "Smart Phone. Smart Service. Smart Price. Premium smartphones, accessories, gaming and repairs in Hamburg.",
      },
      services: {
        title: "Services",
        description:
          "Professional services from instant repairs to device setup – all in one place in Hamburg.",
      },
      repairs: {
        title: "Repairs",
        description:
          "Smartphone, tablet and console repairs with premium parts, warranty and express service.",
      },
      accessories: {
        title: "Accessories",
        description:
          "Cases, protection, chargers and audio – curated accessories at Apfel Park.",
      },
      smartphones: {
        title: "Smartphones",
        description:
          "New and certified smartphones from leading brands – ready today.",
      },
      gaming: {
        title: "Gaming & Consoles",
        description:
          "PlayStation services, repairs and accessories at Apfel Park.",
      },
      laptops: {
        title: "Laptops",
        description:
          "Buy new and refurbished laptops – MacBooks, Windows laptops with warranty and best value.",
      },
      contact: {
        title: "Contact",
        description:
          "Call or visit Apfel Park in Hamburg. We are open Monday to Saturday.",
      },
      about: {
        title: "About",
        description:
          "Learn more about Apfel Park – premium smartphones, accessories and repairs in Hamburg.",
      },
      faq: {
        title: "FAQ",
        description:
          "Answers to the most common questions about repairs and services.",
      },
      privacy: {
        title: "Privacy Policy",
        description:
          "Privacy policy for Apfel Park – transparent, secure and GDPR compliant.",
      },
      terms: {
        title: "Terms & Conditions",
        description:
          "Terms and conditions for repairs, sales and services at Apfel Park.",
      },
    },
    home: {
      hero: {
        eyebrow: "Hamburg’s premium mobile shop",
        title: "Smart Phone. Smart Service. Smart Price.",
        subtitle:
          "Discover premium smartphones, accessories and express repairs at Apfel Park. Everything in one place – fast, transparent, professional.",
        primaryCta: "Start a repair",
        secondaryCta: "Contact us",
        cards: [
          {
            title: "Shop & Advice",
            description: "Premium devices, ready today with honest guidance.",
            path: "/smartphones",
            image: "/images/hero-shop.svg",
          },
          {
            title: "Accessories",
            description: "Cases, protection, audio and lifestyle accessories.",
            path: "/accessories",
            image: "/images/hero-accessories.svg",
          },
          {
            title: "Smartphones",
            description: "New & certified devices, trade-in and setup.",
            path: "/smartphones",
            image: "/images/hero-smartphones.svg",
          },
          {
            title: "Game Consoles",
            description: "PlayStation repairs, upgrades and accessories.",
            path: "/gaming",
            image: "/images/hero-console.svg",
          },
        ],
      },
      highlights: [
        { label: "Express repair", value: "< 1 hr" },
        { label: "Premium advice", value: "100%" },
        { label: "Warranty", value: "12 months" },
      ],
      services: {
        title: "Repairs & Services",
        subtitle:
          "From display damage to board-level repair – our team handles everything with care.",
        items: [
          {
            title: "Display & Glass",
            description: "Express screen replacement with premium parts.",
          },
          {
            title: "Water Damage",
            description: "Deep cleaning, corrosion control and data recovery.",
          },
          {
            title: "Board & Chip",
            description: "Advanced board-level repair with modern tooling.",
          },
          {
            title: "Battery & Power",
            description: "Battery swaps, charging port and power management.",
          },
        ],
      },
      support: {
        title: "Professional Support",
        subtitle:
          "We support you before, during and after purchase with personal care.",
        bullets: [
          "Instant diagnostics without appointment",
          "Device setup and data transfer",
          "Security check & virus removal",
          "Financing and trade-in advice",
        ],
        image: "/images/repair-lab.svg",
      },
      repairFocus: {
        title: "Smartphone & Tablet Repairs",
        subtitle:
          "Fast, reliable, transparent. We repair all major brands and devices.",
        items: [
          {
            title: "Smartphone Repair",
            description: "Fast replacement, premium parts, warranty included.",
          },
          {
            title: "Tablet & iPad",
            description: "Display, battery and board service for every tablet.",
          },
          {
            title: "Camera & Sensors",
            description: "Front and main camera, Face ID and sensors.",
          },
        ],
      },
      process: {
        title: "Your Repair Flow",
        steps: [
          {
            title: "Check-in",
            description: "Diagnosis, price and timeline in minutes.",
          },
          {
            title: "Express Repair",
            description: "In-store repair handled by our premium workshop team.",
          },
          {
            title: "Quality Control",
            description: "Testing, cleaning and handover with warranty.",
          },
        ],
      },
      testimonials: {
        title: "What customers say",
        subtitle: "Real reviews from satisfied customers",
        items: [
          {
            name: "Guru Sosale",
            badge: "Local Guide · 28 reviews",
            timeAgo: "2 years ago",
            quote: "Super service, got a new screen protector and they did it super professionally!",
            rating: 5,
          },
          {
            name: "Godsaid Enyia",
            badge: "9 reviews",
            timeAgo: "3 years ago",
            quote: "Great services!",
            rating: 5,
          },
          {
            name: "Sevilay Güldal",
            badge: "1 review",
            timeAgo: "3 weeks ago",
            quote: "I had my iPhone repaired there and had the camera module replaced. I am really positively surprised! The repair was much faster than at Apple, completely uncomplicated and absolutely professional. The staff were very friendly, explained everything well and the price was significantly cheaper.",
            rating: 5,
          },
          {
            name: "Amar Emshija",
            badge: "1 review",
            timeAgo: "1 month ago",
            quote: "I am absolutely thrilled with Apfel Park! The service is professional, friendly and super fast. My phone was repaired in no time and works perfectly again. The advice was honest, patient and very competent - you can tell right away that someone with experience and heart works here.",
            rating: 5,
          },
          {
            name: "Hans-Joachim Janiak",
            badge: "2 reviews",
            timeAgo: "4 months ago",
            quote: "Dropped off a Samsung S24 Ultra on Monday after a fall from the 5th floor. Wednesday noon call, phone is ready! Folks, what more could you want? Super friendly and competent service. Repair price sensationally good!",
            rating: 5,
          },
          {
            name: "Tim",
            badge: "Local Guide · 94 reviews",
            timeAgo: "5 months ago",
            quote: "I had a problem with my iPhone. Mr. Özgür advised me very nicely here. After about 10 minutes he had discovered the error. A pro was at work here. With some patience the device was running again. The selection is gigantic!",
            rating: 5,
          },
          {
            name: "Cem Kaplan",
            badge: "1 review",
            timeAgo: "5 months ago",
            quote: "The price-performance ratio is great and the customer service is perfect. I feel well taken care of here, even though I have no idea about phones!",
            rating: 5,
          },
          {
            name: "Emiliana Vaz",
            badge: "2 reviews",
            timeAgo: "5 months ago",
            quote: "This store cannot be described in words. I was all over Hamburg and no one wanted to do this repair for me except them, and it was done very quickly!",
            rating: 5,
          },
          {
            name: "Heide Rogalla",
            badge: "2 reviews",
            timeAgo: "5 months ago",
            quote: "Super helpful and human. Finally a business with heart and service! Always happy to come back.",
            rating: 5,
          },
        ],
      },
      gallery: {
        title: "Inside Apfel Park",
        subtitle:
          "A look into our shop, repair lab and accessory world – modern, fast and premium.",
        image: "/images/shop-gallery.svg",
        features: [
          "170 sqm showroom and repair lab",
          "Premium device wall and accessories",
          "Hands-on service with real experts",
        ],
      },
      cta: {
        title: "Ready for premium service?",
        description:
          "Grab your next device or book an express repair at Apfel Park today.",
        primary: "Call now",
        secondary: "Book repair",
      },
    },
    services: {
      heroTitle: "Services for every device",
      heroSubtitle:
        "From setup to instant repairs – premium service for smartphones, tablets and consoles.",
      categories: [
        {
          title: "Instant Repair",
          description: "Display, battery, camera or charging port – ready in under an hour.",
        },
        {
          title: "Premium Setup",
          description: "Data transfer, backup and personal onboarding.",
        },
        {
          title: "Device Protection",
          description: "Screen protectors, cases, insurance and guidance.",
        },
        {
          title: "Business Service",
          description: "Fast repairs for companies and teams.",
        },
      ],
    },
    repairs: {
      heroTitle: "Repairs without stress",
      heroSubtitle:
        "Our workshop resolves complex damage, including board-level repairs.",
      highlights: [
        "Express service in Hamburg",
        "Original & premium parts",
        "12-month warranty",
        "Fair prices with clarity",
      ],
      repairTypes: [
        {
          title: "Display & Glass",
          description: "Precise replacement with sealing and calibration.",
        },
        {
          title: "Water Damage",
          description: "Deep cleaning, corrosion control and data recovery.",
        },
        {
          title: "Mainboard",
          description: "Chip-level and board repair by specialists.",
        },
        {
          title: "Audio & Microphone",
          description: "Speakers, microphones and audio tuning.",
        },
      ],
    },
    accessories: {
      heroTitle: "Accessories that protect your device",
      heroSubtitle:
        "Premium cases, audio, power and lifestyle accessories for every style.",
      categories: [
        "Cases & screen protection",
        "Chargers & power banks",
        "Audio, headphones & speakers",
        "Smart home & lifestyle",
      ],
    },
    smartphones: {
      heroTitle: "Smartphones available today",
      heroSubtitle:
        "New and certified devices, trade-in and setup services in-store.",
      highlights: [
        "Top brands & flagship models",
        "Financing and trade-in",
        "Device setup included",
      ],
    },
    gaming: {
      heroTitle: "Gaming & consoles",
      heroSubtitle:
        "PlayStation service, repairs and accessories in Hamburg.",
      highlights: [
        "Console repair and cleaning",
        "Cooling and temperature tuning",
        "Controllers, docks & accessories",
      ],
    },
    laptops: {
      heroTitle: "Buy & repair laptops",
      heroSubtitle:
        "MacBooks and Windows laptops – new, refurbished and professionally serviced.",
      sections: {
        new: {
          title: "New Laptops",
          subtitle: "Premium devices available now with full manufacturer warranty.",
        },
        refurbished: {
          title: "Refurbished Laptops",
          subtitle: "Certified quality, like new – at unbeatable prices.",
        },
        accessories: {
          title: "Laptop Accessories",
          subtitle: "Chargers, bags, docking stations and more.",
        },
        store: {
          title: "Available Laptops",
          subtitle: "Our current offers – ready for pickup today.",
        },
      },
      highlights: [
        "12-month warranty on all devices",
        "Professional quality inspection",
        "Best prices in Hamburg",
        "Free initial consultation",
      ],
      brands: ["Apple MacBook", "Lenovo", "HP", "Dell", "ASUS", "Acer"],
      accessories: [
        {
          title: "Chargers",
          description: "Original and universal power adapters for all laptop brands.",
        },
        {
          title: "Laptop Bags",
          description: "Protection and style on the go – from 13 to 17 inches.",
        },
        {
          title: "Docking Stations",
          description: "USB-C hubs, monitor cables and desktop setup.",
        },
        {
          title: "Spare Parts",
          description: "Batteries, keyboards, displays and more.",
        },
      ],
    },
    contact: {
      heroTitle: "We’re here for you",
      heroSubtitle:
        "Call or visit – we help immediately and personally.",
      contactCards: [
        {
          title: "Visit us",
          description: "Wilhelm-Strauß-Weg 2b, 21109 Hamburg",
        },
        {
          title: "Call us",
          description: "040 58978787",
        },
        {
          title: "Write to us",
          description: "info@apfel-park.de",
        },
      ],
    },
    about: {
      heroTitle: "Apfel Park – Premium from Day One",
      heroSubtitle:
        "Your trusted partner for smartphones, accessories and repairs in Hamburg.",
      intro: "Welcome to Apfel Park – your premium destination for smartphones, accessories and professional repairs in the heart of Hamburg. Since day one, we've focused on quality, transparency and personal service.",
      story: {
        title: "Our Story",
        content: "What started as a small workshop is now one of Hamburg's leading smartphone shops. Our founder, a passionate tech enthusiast, wanted to create a place where customers not only find high-quality products but also honest advice and quick solutions to their problems. That dream is Apfel Park.",
      },
      features: [
        {
          title: "100% Genuine Products",
          description: "We only sell original devices and certified accessories. No fakes, no compromises – just premium quality from leading brands.",
          icon: "genuine",
        },
        {
          title: "12-Month Warranty",
          description: "All our products and repairs come with a 12-month warranty. We stand behind our work and our products.",
          icon: "warranty",
        },
        {
          title: "Friendly Team",
          description: "Our team consists of passionate tech experts who are here to help you. We take time for you and your questions.",
          icon: "team",
        },
        {
          title: "Outstanding Support",
          description: "From pre-purchase advice to after-sales support – we're here for you. Quick answers, expert help, real solutions.",
          icon: "support",
        },
      ],
      values: {
        title: "Our Values",
        items: [
          "Transparent pricing and diagnostics",
          "Premium parts and quality control",
          "Personal service over mass handling",
          "Sustainability through repair, not disposal",
        ],
      },
      cta: {
        title: "Explore Our Products",
        description: "Browse our selection of smartphones, laptops and accessories – all genuine, all with warranty.",
        buttons: {
          smartphones: "Browse Smartphones",
          accessories: "View Accessories",
          contact: "Get in Touch",
        },
      },
      stats: [
        { value: "5+", label: "Years Experience" },
        { value: "10,000+", label: "Happy Customers" },
        { value: "15,000+", label: "Repairs Done" },
        { value: "4.9", label: "Google Rating" },
      ],
    },
    faq: {
      heroTitle: "Frequently asked",
      heroSubtitle: "Answers about service, repairs and accessories.",
      items: [
        {
          question: "How fast is a repair?",
          answer:
            "Most repairs are completed in under one hour. For complex damage we immediately share the timeline.",
        },
        {
          question: "Do you offer warranty?",
          answer:
            "Yes, we provide a 12-month warranty on our repairs and premium spare parts.",
        },
        {
          question: "Which brands do you repair?",
          answer:
            "We repair all major brands – Apple, Samsung, Huawei, Xiaomi, Google Pixel and more.",
        },
        {
          question: "Can I walk in without appointment?",
          answer:
            "Yes, instant diagnostics are available without appointment. During peak times we schedule quick slots.",
        },
      ],
    },
    privacy: {
      heroTitle: "Privacy Policy",
      intro:
        "We take data protection seriously. This privacy policy explains the nature, scope and purpose of processing personal data on our website and services.",
      sections: [
        {
          title: "1. Controller",
          body: [
            "Apfel Park, Wilhelm-Strauß-Weg 2b, 21109 Hamburg",
            "Email: info@apfel-park.de | Phone: 040 58978787",
          ],
        },
        {
          title: "2. Data collected",
          body: [
            "Contact and order data (name, email, phone, address)",
            "Device information for repairs and service orders",
            "Payment and invoice data during checkout",
          ],
        },
        {
          title: "3. Purpose of processing",
          body: [
            "Executing repairs, orders and customer support",
            "Communication about appointments and services",
            "Compliance with legal obligations (e.g., invoicing)",
          ],
        },
        {
          title: "4. Data sharing",
          body: [
            "Payment providers (PayPal, Klarna, Sofort, Giropay, SEPA, Stripe)",
            "Shipping and logistics partners for orders",
            "IT and hosting providers (e.g., Vercel, Supabase)",
          ],
        },
        {
          title: "5. Cookies & tracking",
          body: [
            "We use necessary cookies to run the website.",
            "Optional tracking and SEO tools can be activated in the admin dashboard.",
          ],
        },
        {
          title: "6. Your rights",
          body: [
            "Access, correction, deletion and restriction of processing",
            "Objection to processing and data portability",
            "Complaint with the responsible data protection authority",
          ],
        },
      ],
    },
    terms: {
      heroTitle: "Terms & Conditions",
      intro:
        "These terms apply to all repairs, services and purchases with Apfel Park.",
      sections: [
        {
          title: "1. Services",
          body: [
            "Repair and maintenance of smartphones, tablets and consoles",
            "Sale of devices, accessories and services",
          ],
        },
        {
          title: "2. Repair process",
          body: [
            "We provide a cost estimate after diagnosis.",
            "Repairs begin only after your approval.",
            "If repairs are not possible, we will inform you immediately.",
          ],
        },
        {
          title: "3. Pricing & payment",
          body: [
            "All prices include statutory VAT.",
            "Payment via PayPal, Klarna, Sofort, Giropay, SEPA, Stripe, or cash in store.",
          ],
        },
        {
          title: "4. Warranty",
          body: [
            "12-month warranty on spare parts and repair services unless third-party damage occurs.",
          ],
        },
        {
          title: "5. Liability",
          body: [
            "We are liable for data loss only in cases of gross negligence or intent.",
            "Please back up your data before repair.",
          ],
        },
      ],
    },
  },
} as const;

export const getDictionary = (locale: Locale) => dictionary[locale];

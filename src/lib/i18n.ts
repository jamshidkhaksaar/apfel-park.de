export type Locale = "de" | "en";

export const locales: Locale[] = ["de", "en"];

export const dictionary = {
  de: {
    nav: [
      { label: "Startseite", path: "" },
      { label: "Reparatur & Service", path: "/repairs" },
      { label: "Smartphones", path: "/smartphones" },
      { label: "Tablets", path: "/tablets" },
      { label: "Zubehör", path: "/accessories" },
      { label: "Laptops", path: "/laptops" },
      { label: "Impressum", path: "/impressum" },
      { label: "Kontakt", path: "/contact" },
    ],
    header: {
      openMenu: "Menü öffnen",
      closeMenu: "Menü schließen",
      skipToContent: "Zum Inhalt springen",
    },
    featuredStore: {
      eyebrow: "Online Shop",
      title: "Aktuelle Angebote",
      cta: "Zum Shop",
      inStock: "Auf Lager",
      detailsAriaLabel: "Anfrage zu {{title}} starten",
    },
    footer: {
      headline: "Dein Premium-Shop für Smartphones & Reparaturen",
      description:
        "Im Apfel Park kombinieren wir Premium-Hardware, Zubehör und Sofort-Reparaturen unter einem Dach.",
      quickLinks: [
        { label: "Reparatur & Service", path: "/repairs" },
        { label: "Smartphones", path: "/smartphones" },
        { label: "Tablets", path: "/tablets" },
        { label: "Zubehör", path: "/accessories" },
        { label: "Laptops", path: "/laptops" },
      ],
      catalogLink: { label: "Alle Produkte A–Z", path: "/store/catalog" },
      companyLinks: [
        { label: "Über uns", path: "/about" },
        { label: "FAQ", path: "/faq" },
        { label: "Ratgeber: Smartphone länger nutzen", path: "/ratgeber/smartphone-laenger-nutzen" },
        { label: "Gerätezustände & Rechte", path: "/device-conditions" },
        { label: "Vertrag widerrufen", path: "/withdrawal" },
        { label: "Datenschutz", path: "/privacy" },
        { label: "AGB", path: "/terms" },
        { label: "Impressum", path: "/impressum" },
      ],
      support: [
        "Sofort-Diagnose & transparente Preise",
        "Express-Reparatur im Shop",
        "Passende Qualitäts-Ersatzteile",
        "Datenrettung & Geräteschutz",
      ],
    },
    meta: {
      home: {
        title: "iPhone & Smartphone kaufen Hamburg",
        description:
          "Smartphones & iPhones in Hamburg: neu, Open Box & gebraucht mit Garantie. Sofort abholbar oder schneller Versand. Tel. 040 58978787.",
      },
      services: {
        title: "Services & Reparatur Hamburg",
        description:
          "Professionelle Services von Sofort-Reparatur bis Geräte-Setup – alles im Apfel Park Hamburg.",
      },
      repairs: {
        title: "Handy-Reparatur Hamburg – Preise für Display, Akku & Rückseite",
        description:
          "Modellbezogene Reparaturpreise für iPhone und Samsung in Hamburg-Wilhelmsburg: Display in Standard, Premium oder Original, Akkutausch und Rückcover.",
      },
      accessories: {
        title: "Handy-Zubehör in Hamburg kaufen",
        description:
          "Hüllen, Panzerglas, Ladegeräte, Kabel und Kopfhörer für iPhone, Samsung und mehr. Ausgewählte Qualität im Apfel Park Hamburg.",
      },
      smartphones: {
        title: "Smartphones & iPhones kaufen Hamburg",
        description:
          "Geprüfte Smartphones von Apple, Samsung, Xiaomi und mehr. Neu, Open Box & gebraucht mit Garantie – online bestellen oder in Hamburg abholen.",
      },
      tablets: {
        title: "Tablets & iPads in Hamburg kaufen",
        description:
          "Tablets und iPads mit klar ausgewiesenem Zustand und Garantie. Online ansehen, nach Hamburg liefern lassen oder im Shop abholen.",
      },
      gaming: {
        title: "Gaming & Konsolen Zubehör Hamburg",
        description:
          "Gaming-Zubehör bei Apfel Park in Hamburg-Wilhelmsburg. Konsolen folgen in Kürze – Controller, Kabel und Zubehör gibt es schon jetzt im Laden.",
      },
      laptops: {
        title: "Laptops & MacBooks kaufen Hamburg",
        description:
          "Neue und gebrauchte Laptops kaufen – MacBooks & Windows-Laptops mit Garantie und bestem Preis-Leistungs-Verhältnis in Hamburg.",
      },
      contact: {
        title: "Kontakt & Anfahrt – Apfel Park Hamburg",
        description:
          "Apfel Park, Wilhelm-Strauß-Weg 2b, 21109 Hamburg. Mo–Sa 9:30–20:00 Uhr. Tel. 040 58978787 – ruf an oder schreib per WhatsApp.",
      },
      about: {
        title: "Über uns – Smartphone-Experten Hamburg",
        description:
          "Apfel Park ist dein lokaler Shop für iPhones, Smartphones, Zubehör, Ankauf und Reparaturen in Hamburg-Wilhelmsburg. Lerne unser Team kennen.",
      },
      faq: {
        title: "Häufige Fragen & Antworten",
        description:
          "Antworten auf die häufigsten Fragen zu Bestellung, Garantie, Open Box, Gerätezuständen, Ankauf und Reparatur bei Apfel Park Hamburg.",
      },
      privacy: {
        title: "Datenschutz – Apfel Park Hamburg",
        description:
          "Datenschutzinformationen für Apfel Park – transparent, sicher und DSGVO-konform.",
      },
      terms: {
        title: "AGB – Apfel Park Hamburg",
        description:
          "Allgemeine Geschäftsbedingungen für Reparaturen, Verkäufe und Services im Apfel Park Hamburg.",
      },
    },
    home: {
      hero: {
        eyebrow: "Hamburgs Smartphone-Shop in Wilhelmsburg",
        title: "iPhones & Smartphones – neu, Open Box & gebraucht",
        subtitle:
          "Smart Phone. Smart Service. Smart Price. Geprüfte Geräte mit Garantie – sofort abholbar in Hamburg oder mit schnellem Versand in ganz Deutschland.",
        primaryCta: "Smartphones entdecken",
        secondaryCta: "Reparatur anfragen",
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
            title: "Tablets & iPads",
            description: "Tablets und iPads mit klar ausgewiesenem Zustand und Garantie.",
            path: "/tablets",
            image: "/images/ipad.png",
          },
        ],
      },
      highlights: [
        { label: "Versand", value: "1–3 Tage" },
        { label: "Abholung", value: "Hamburg" },
        { label: "Zustand", value: "klar ausgewiesen" },
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
            description: "Schneller Austausch mit passenden Ersatzteilen und zusätzlicher Garantie.",
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
        "Von Setup bis Sofort-Reparatur – wir liefern Premium-Service für Smartphone, Tablet und Laptop.",
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
      heroTitle: "Handy Reparatur Hamburg",
      heroSubtitle:
        "Reparaturen ohne Stress in Hamburg-Wilhelmsburg – unsere Werkstatt löst auch komplexe Schäden, inklusive Board-Level Reparaturen.",
      highlights: [
        "Express-Service in Hamburg",
        "Passende Qualitäts-Ersatzteile",
        "Bedingungen vor Auftrag klar ausgewiesen",
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
        "Gaming-Zubehör in Hamburg-Wilhelmsburg. Konsolen nehmen wir demnächst ins Sortiment auf.",
      highlights: [
        "Controller, Docking & Zubehör",
        "Beratung im Laden statt online raten",
        "Konsolen folgen in Kürze",
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
        "Zustand direkt am Artikel",
        "Zustand direkt am Artikel",
        "Transparente Preise",
        "Persönliche Beratung im Shop",
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
          description: "info [at] apfel-park [dot] de",
        },
      ],
    },
    about: {
      heroTitle: "Apfel Park in Hamburg-Wilhelmsburg",
      heroSubtitle:
        "Dein vertrauenswürdiger Partner für Smartphones, Zubehör und Reparaturen in Hamburg.",
      intro: "Apfel Park verbindet einen lokalen Smartphone-Shop in Hamburg-Wilhelmsburg mit einem deutschlandweiten Online-Shop. Bei Geräten, Zubehör und Reparaturen setzen wir auf klare Angaben, nachvollziehbare Preise und persönliche Beratung.",
      story: {
        title: "Unsere Geschichte",
        content: "In unserem Geschäft am Wilhelm-Strauß-Weg 2b kannst du Smartphones und Zubehör ansehen, Bestellungen abholen und Reparaturen besprechen. Online zeigen wir Preis, Verfügbarkeit, Gerätezustand und die wichtigsten Produktdetails, damit du vor dem Kauf vergleichen kannst.",
      },
      features: [
        {
          title: "Klare Produktangaben",
          description: "Marke, Modell, Zustand, Speicher, Preis und Verfügbarkeit werden am jeweiligen Produkt ausgewiesen. Hersteller-Barcodes tragen wir nur ein, wenn sie verifiziert sind.",
          icon: "genuine",
        },
        {
          title: "Bedingungen vor Auftrag klar ausgewiesen",
          description: "Zusätzliche Garantien gelten nur, wenn sie im jeweiligen Angebot oder Reparaturauftrag ausdrücklich mit ihren Bedingungen ausgewiesen sind.",
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
        description: "Stöbere durch Smartphones und Zubehör mit klar ausgewiesenem Zustand, Preis, Verfügbarkeit und Garantie.",
        buttons: {
          smartphones: "Smartphones entdecken",
          accessories: "Zubehör ansehen",
          contact: "Kontakt aufnehmen",
        },
      },
      stats: [
        { value: "Hamburg", label: "Standort Wilhelmsburg" },
        { value: "Mo–Sa", label: "6 Tage geöffnet" },
        { value: "09:30", label: "Öffnung" },
        { value: "20:00", label: "Ladenschluss" },
      ],
    },
    faq: {
      heroTitle: "Häufige Fragen",
      heroSubtitle: "Antworten rund um Service, Reparatur und Zubehör.",
      items: [
        {
          question: "Wie schnell ist eine Reparatur?",
          answer:
            "Nach der Diagnose nennen wir dir den voraussichtlichen Zeitrahmen. Die Dauer hängt von Gerät, Schaden, Ersatzteilverfügbarkeit und Auslastung ab.",
        },
        {
          question: "Gibt es Garantie?",
          answer:
            "Zusätzliche Garantien gelten nur, wenn sie im jeweiligen Reparaturauftrag ausdrücklich mit ihren Bedingungen ausgewiesen sind.",
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
        {
          question: "Wie lange dauert der Versand?",
          answer: "Innerhalb Deutschlands erfolgt die Zustellung in der Regel in 1–3 Werktagen. Der versicherte Standardversand kostet 6,90 €; die Abholung im Store ist kostenlos.",
        },
        {
          question: "Wie lange kann ich einen Online-Kauf widerrufen?",
          answer: "Verbraucher haben bei Online-Käufen grundsätzlich 14 Tage Widerrufsrecht. Die unmittelbaren Rücksendekosten trägt der Kunde; Einzelheiten stehen auf unserer Seite Lieferung & Rückgabe.",
        },
        {
          question: "Was bedeuten Neu, Open-Box und Gebraucht A+?",
          answer: "Neu bedeutet versiegelt. Open-Box bezeichnet geöffnete Verpackungen, etwa Ausstellungs- oder Retourenware. Gebraucht A+ wurde bereits genutzt und wird mit konkretem Zustandshinweis angeboten.",
        },
        {
          question: "Sind die angebotenen iPhone 17 versiegelt?",
          answer: "Die aktuell angebotenen iPhone-17-Geräte sind neu und versiegelt. Der Zustand steht zusätzlich auf jeder Produktseite und in der Bestellung.",
        },
        {
          question: "Welche Zahlungsmöglichkeiten gibt es?",
          answer: "Online kannst du sicher mit Kreditkarte (Visa, Mastercard), Apple Pay oder Klarna bezahlen. Im Geschäft sind Barzahlung sowie Karten- und Debitkartenzahlung möglich.",
        },
        {
          question: "Erhalte ich eine Rechnung?",
          answer: "Ja. Zu jedem Kauf erhältst du eine Rechnung mit den Angaben zur Bestellung und zum gekauften Artikel.",
        },
      ],
    },
    privacy: {
      heroTitle: "Datenschutzerklärung",
      intro:
        "Diese Datenschutzerklärung informiert darüber, wie Apfel Park personenbezogene Daten bei der Nutzung dieser Website, bei Kontaktanfragen, Reparaturanfragen, Bestellungen und bei der Kommunikation per E-Mail verarbeitet.",
      sections: [
        {
          title: "1. Verantwortlicher",
          body: [
            "Apfel Park, Wilhelm-Strauß-Weg 2b, 21109 Hamburg",
            "E-Mail: info [at] apfel-park [dot] de | Telefon: 040 58978787",
            "Bei Datenschutzanfragen können Sie uns jederzeit über die oben genannten Kontaktdaten erreichen.",
          ],
        },
        {
          title: "2. Verarbeitete Datenkategorien",
          body: [
            "Kontakt- und Kommunikationsdaten wie Name, E-Mail-Adresse, Telefonnummer und Nachrichteninhalte.",
            "Auftrags- und Gerätedaten wie Reparaturanfragen, Gerätetyp, Fehlerbeschreibung, Statusinformationen, Kostenschätzungen und Reparaturnotizen.",
            "Bestell- und Rechnungsdaten, soweit sie für Verkauf, Reparatur, Abrechnung oder gesetzliche Aufbewahrung erforderlich sind.",
            "Technische Nutzungsdaten wie IP-Adresse, Zeitstempel, Browserinformationen sowie sicherheitsrelevante Protokolle zur Abwehr von Missbrauch und zur Sicherstellung des Betriebs.",
          ],
        },
        {
          title: "3. Zwecke und Rechtsgrundlagen",
          body: [
            "Art. 6 Abs. 1 lit. b DSGVO: Bearbeitung von Kontaktanfragen, Reparaturaufträgen, Bestellungen und vorvertraglichen Anfragen.",
            "Art. 6 Abs. 1 lit. c DSGVO: Erfüllung gesetzlicher Pflichten, insbesondere steuer- und handelsrechtlicher Aufbewahrungspflichten.",
            "Art. 6 Abs. 1 lit. f DSGVO: IT-Sicherheit, Missbrauchsvermeidung, Systemüberwachung und stabile Bereitstellung der Website.",
            "Art. 6 Abs. 1 lit. a DSGVO in Verbindung mit § 25 TDDDG: Laden externer Dienste und Marketing-Technologien wie Google Maps, Google reCAPTCHA, Google Analytics 4, Trustpilot, Google Kundenrezensionen sowie gegebenenfalls Meta Pixel und TikTok Pixel erst nach Ihrer Einwilligung.",
          ],
        },
        {
          title: "4. Empfänger und Dienstleister",
          body: [
            "Hosting und Serverbetrieb erfolgen auf einem gemieteten Server bei Hetzner. Die Website nutzt Cloudflare für DNS und technische Schutzfunktionen.",
            "E-Mail-Kommunikation und Reparaturstatus-E-Mails werden über unser selbst gehostetes Mail-System verarbeitet.",
            "Kartendarstellungen erfolgen nur nach Einwilligung über Google Maps. Wenn aktiviert, kann Google dabei technische Nutzungsdaten verarbeiten.",
            "Wenn Spam-Schutz per Google reCAPTCHA aktiviert ist, wird dieser externe Dienst ebenfalls nur nach Einwilligung geladen.",
            "Wenn Sie externe Dienste erlauben, nutzen wir Google Analytics 4 von Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Dabei werden Seitenaufrufe und Shop-Ereignisse wie Produktansicht, Warenkorb, Checkout und Kauf mit technischen Nutzungsdaten verarbeitet, um Reichweite und Verkaufstrichter auszuwerten. Wir übermitteln über diese Ereignisse keine Namen, E-Mail-Adressen oder Zahlungsdaten.",
            "Wenn Marketing-Tracking aktiviert und von Ihnen freigegeben wurde, können Meta Pixel und TikTok Pixel technische Nutzungs- und Ereignisdaten für Reichweitenmessung, Kampagnenauswertung und Werbeattribution verarbeiten.",
            "Für die Zahlungsabwicklung und Lieferung geben wir Bestell-, Kontakt- und Adressdaten nur an die jeweils ausgewählten oder erforderlichen Zahlungs- und Versanddienstleister weiter.",
            "Nach einer abgeschlossenen Bestellung übermitteln wir – nur mit Ihrer Einwilligung für externe Dienste – Ihren Namen, Ihre E-Mail-Adresse und die Bestellnummer an Trustpilot A/S, Pilestræde 58, 1112 Kopenhagen, Dänemark, damit Trustpilot Ihnen eine Einladung zur Bewertung senden kann. Ohne diese Einwilligung wird der Dienst nicht geladen und es werden keine Daten übermittelt.",
            "Auf der Bestellbestätigung blenden wir – ebenfalls nur mit Ihrer Einwilligung für externe Dienste – das Opt-in von Google Kundenrezensionen ein. Stimmen Sie dort zu, übermitteln wir Ihre E-Mail-Adresse, die Bestellnummer, das Lieferland und das voraussichtliche Lieferdatum an Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland, damit Google Ihnen eine Bewertungsumfrage senden kann. Das Abzeichen von Google Kundenrezensionen, das unsere Verkäuferbewertung anzeigt, binden wir aus demselben Grund ebenfalls erst nach Ihrer Einwilligung ein. Ohne diese Einwilligung werden die Skripte nicht geladen und es werden keine Daten übermittelt.",
            "Eine Weitergabe an weitere Empfänger erfolgt nur, wenn dies für die Vertragsabwicklung erforderlich ist oder wir gesetzlich dazu verpflichtet sind.",
          ],
        },
        {
          title: "5. Cookies, lokale Speicherung und Einwilligung",
          body: [
            "Wir verwenden notwendige Cookies bzw. lokale Speicherung für Sprachwahl, Theme-Darstellung, sichere Admin-Sitzungen und technische Bereitstellung der Website.",
            "Externe Inhalte wie Google Maps, Google reCAPTCHA sowie Marketing-Technologien wie Google Analytics 4, Meta Pixel und TikTok Pixel werden erst geladen, wenn Sie externen Diensten zustimmen.",
            "Ihre Auswahl zu externen Diensten speichern wir, damit Ihre Einwilligung oder Ablehnung nicht bei jedem Seitenaufruf erneut abgefragt werden muss.",
          ],
        },
        {
          title: "6. Speicherdauer",
          body: [
            "Kontakt- und Reparaturanfragen speichern wir nur so lange, wie dies für Bearbeitung, Nachverfolgung, Gewährleistung und gesetzliche Pflichten erforderlich ist.",
            "Rechnungs- und buchhaltungsrelevante Daten speichern wir entsprechend der gesetzlichen Aufbewahrungsfristen.",
            "Sicherheits- und Serverprotokolle werden nur so lange vorgehalten, wie dies für Stabilität, Missbrauchsabwehr und Fehleranalyse notwendig ist.",
          ],
        },
        {
          title: "7. Drittlandtransfers",
          body: [
            "Beim Laden externer Dienste wie Google Maps, Google reCAPTCHA, Google Analytics 4, Meta Pixel oder TikTok Pixel kann eine Übermittlung personenbezogener Daten in Drittländer, insbesondere in die USA, nicht ausgeschlossen werden.",
            "Diese Dienste werden daher standardmäßig nicht geladen, sondern erst nach Ihrer Einwilligung aktiviert.",
          ],
        },
        {
          title: "8. Ihre Rechte",
          body: [
            "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit nach Maßgabe der gesetzlichen Voraussetzungen.",
            "Soweit wir Daten auf Grundlage berechtigter Interessen verarbeiten, haben Sie das Recht auf Widerspruch. Erteilte Einwilligungen können Sie jederzeit mit Wirkung für die Zukunft widerrufen.",
            "Sie haben außerdem das Recht, sich bei einer zuständigen Datenschutzaufsichtsbehörde zu beschweren.",
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
            "Reparatur und Wartung von Smartphones und Tablets",
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
            "Zahlung per Kreditkarte, Apple Pay oder Klarna – im Geschäft auch bar.",
          ],
        },
        {
          title: "4. Gerätezustand",
          body: [
            "Neu & versiegelt bezeichnet originalverpackte Ware. Open-Box bezeichnet ausgepackte, nicht als gebraucht verkaufte Geräte, etwa Ausstellungs- oder Retourenware.",
            "Gebraucht A+ bezeichnet geprüfte, zuvor genutzte Geräte in sehr gutem Zustand. Artikelhinweise, echte Produktfotos und bei iPhones die angegebene Batteriekapazität beschreiben den jeweiligen Artikel.",
            "Geöffnete oder aktivierte Retouren werden niemals als 'Neu & versiegelt' verkauft, sondern ausschließlich als Open-Box oder Gebraucht angeboten.",
          ],
        },
        {
          title: "5. Lieferung, Widerruf & Mängelrechte",
          body: [
            "Abholung im Store ist kostenlos. Versicherter Versand innerhalb Deutschlands kostet 6,90 € und erfolgt in der Regel innerhalb von 1–3 Werktagen nach Zahlungseingang.",
            "Für online geschlossene Verbraucherverträge gilt grundsätzlich ein 14-tägiges Widerrufsrecht. Der Widerruf kann bequem über unsere Online-Widerrufsfunktion (Seite 'Vertrag widerrufen') erklärt werden; Sie erhalten unverzüglich eine Eingangsbestätigung.",
            "Die unmittelbaren Kosten der Rücksendung tragen Sie. Die Erstattung erfolgt spätestens 14 Tage nach Eingang des Widerrufs über dasselbe Zahlungsmittel; wir dürfen sie bis zum Wareneingang oder Versandnachweis zurückhalten. Details und das Muster-Widerrufsformular finden Sie unter Lieferung & Rückgabe.",
            "Ein Wertersatz kommt nur bei einem Umgang in Betracht, der über die Prüfung von Beschaffenheit, Eigenschaften und Funktionsweise hinausgeht, und bemisst sich stets am tatsächlichen, nachweisbaren Wertverlust. Eine Rücksendung ist auch ohne Originalverpackung möglich.",
            "Für Waren gelten die gesetzlichen Mängelrechte. Die Verjährungsfrist wird für gebrauchte Geräte nicht verkürzt und beträgt zwei Jahre ab Übergabe.",
          ],
        },
        {
          title: "6. Garantie",
          body: [
            "Eine zusätzliche Garantie gilt nur, wenn sie im Reparaturauftrag ausdrücklich mit Umfang und Bedingungen ausgewiesen ist. Gesetzliche Rechte bleiben unberührt.",
          ],
        },
        {
          title: "7. Haftung",
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
      { label: "Tablets", path: "/tablets" },
      { label: "Accessories", path: "/accessories" },
      { label: "Laptops", path: "/laptops" },
      { label: "Impressum", path: "/impressum" },
      { label: "Contact", path: "/contact" },
    ],
    header: {
      openMenu: "Open menu",
      closeMenu: "Close menu",
      skipToContent: "Skip to content",
    },
    featuredStore: {
      eyebrow: "Online Store",
      title: "Latest Arrivals",
      cta: "Go to Store",
      inStock: "In Stock",
      detailsAriaLabel: "Start inquiry for {{title}}",
    },
    footer: {
      headline: "Premium smartphones, accessories & repairs",
      description:
        "Apfel Park combines premium devices, accessories and express repairs in one modern studio.",
      quickLinks: [
        { label: "Repair & Service", path: "/repairs" },
        { label: "Smartphones", path: "/smartphones" },
        { label: "Tablets", path: "/tablets" },
        { label: "Accessories", path: "/accessories" },
        { label: "Laptops", path: "/laptops" },
      ],
      catalogLink: { label: "All Products A–Z", path: "/store/catalog" },
      companyLinks: [
        { label: "About", path: "/about" },
        { label: "FAQ", path: "/faq" },
        { label: "Guide: Make your smartphone last longer", path: "/ratgeber/smartphone-laenger-nutzen" },
        { label: "Device conditions & rights", path: "/device-conditions" },
        { label: "Withdraw contract", path: "/withdrawal" },
        { label: "Privacy", path: "/privacy" },
        { label: "Terms", path: "/terms" },
        { label: "Impressum", path: "/impressum" },
      ],
      support: [
        "Instant diagnostics with clear pricing",
        "Express in-store repairs",
        "Suitable quality replacement parts",
        "Data recovery & device protection",
      ],
    },
    meta: {
      home: {
        title: "Buy iPhones & Smartphones in Hamburg",
        description:
          "Smartphones & iPhones in Hamburg: new, open box & used with warranty. Pick up in store or fast shipping across Germany. Call 040 58978787.",
      },
      services: {
        title: "Services & Repair Hamburg",
        description:
          "Professional services from instant repairs to device setup – all in one place in Hamburg.",
      },
      repairs: {
        title: "Phone Repair Hamburg – Screen, Battery & Back Cover Prices",
        description:
          "Model-specific iPhone and Samsung repair prices in Hamburg-Wilhelmsburg: Standard, Premium or Original displays, battery replacement and back covers.",
      },
      accessories: {
        title: "Phone Accessories in Hamburg",
        description:
          "Cases, screen protection, chargers, cables and headphones for iPhone, Samsung and more. Curated quality at Apfel Park Hamburg.",
      },
      smartphones: {
        title: "Buy Smartphones & iPhones Hamburg",
        description:
          "Tested smartphones from Apple, Samsung, Xiaomi and more. New, open box and used with warranty – order online or collect in Hamburg.",
      },
      tablets: {
        title: "Buy Tablets & iPads in Hamburg",
        description:
          "Browse tablets and iPads with clearly stated condition and warranty. Order for delivery in Germany or collect at Apfel Park in Hamburg.",
      },
      gaming: {
        title: "Gaming & Console Accessories Hamburg",
        description:
          "Gaming accessories at Apfel Park in Hamburg-Wilhelmsburg. Consoles are coming soon; controllers, cables and accessories are in store now.",
      },
      laptops: {
        title: "Buy Laptops & MacBooks in Hamburg",
        description:
          "Buy new and refurbished laptops – MacBooks, Windows laptops with warranty and best value in Hamburg.",
      },
      contact: {
        title: "Contact & Directions – Apfel Park Hamburg",
        description:
          "Apfel Park, Wilhelm-Strauß-Weg 2b, 21109 Hamburg. Mon–Sat 9:30–20:00. Call 040 58978787 or message us on WhatsApp.",
      },
      about: {
        title: "About Us – Smartphone Experts Hamburg",
        description:
          "Apfel Park is your local shop for iPhones, smartphones, accessories, trade-in and repairs in Hamburg-Wilhelmsburg. Meet our team.",
      },
      faq: {
        title: "Frequently Asked Questions",
        description:
          "Answers to the most common questions about ordering, warranty, open box, device conditions, trade-in and repairs at Apfel Park Hamburg.",
      },
      privacy: {
        title: "Privacy Policy – Apfel Park Hamburg",
        description:
          "Privacy information for Apfel Park – transparent, secure, and GDPR compliant.",
      },
      terms: {
        title: "Terms & Conditions",
        description:
          "Terms and conditions for repairs, sales and services at Apfel Park.",
      },
    },
    home: {
      hero: {
        eyebrow: "Hamburg’s smartphone shop in Wilhelmsburg",
        title: "iPhones & Smartphones – New, Open Box & Used",
        subtitle:
          "Smart Phone. Smart Service. Smart Price. Tested devices with warranty – pick up today in Hamburg or fast shipping across Germany.",
        primaryCta: "Browse smartphones",
        secondaryCta: "Request a repair",
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
            description: "New and clearly described devices, trade-in and setup.",
            path: "/smartphones",
            image: "/images/hero-smartphones.svg",
          },
          {
            title: "Tablets & iPads",
            description: "Tablets and iPads with clearly stated condition and warranty.",
            path: "/tablets",
            image: "/images/ipad.png",
          },
        ],
      },
      highlights: [
        { label: "Delivery", value: "1–3 days" },
        { label: "Collection", value: "Hamburg" },
        { label: "Condition", value: "clearly stated" },
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
        "From setup to instant repairs – premium service for smartphones, tablets and laptops.",
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
      heroTitle: "Phone Repair Hamburg",
      heroSubtitle:
        "Repairs without stress in Hamburg-Wilhelmsburg – our workshop resolves complex damage, including board-level repairs.",
      highlights: [
        "Express service in Hamburg",
        "Suitable quality replacement parts",
        "Terms stated before work begins",
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
        "New and clearly described devices, trade-in and setup services in-store.",
      highlights: [
        "Top brands & flagship models",
        "Financing and trade-in",
        "Device setup included",
      ],
    },
    gaming: {
      heroTitle: "Gaming & consoles",
      heroSubtitle:
        "Gaming accessories in Hamburg-Wilhelmsburg. Consoles are joining the range soon.",
      highlights: [
        "Controllers, docks & accessories",
        "Advice in store instead of guessing online",
        "Consoles coming soon",
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
        "Condition shown on each item",
        "Condition shown on each item",
        "Transparent prices",
        "Personal in-store advice",
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
          description: "info [at] apfel-park [dot] de",
        },
      ],
    },
    about: {
      heroTitle: "Apfel Park in Hamburg-Wilhelmsburg",
      heroSubtitle:
        "Your trusted partner for smartphones, accessories and repairs in Hamburg.",
      intro: "Apfel Park combines a local smartphone shop in Hamburg-Wilhelmsburg with an online store serving Germany. For devices, accessories and repairs, we focus on clear information, transparent prices and personal advice.",
      story: {
        title: "Our Story",
        content: "At Wilhelm-Strauß-Weg 2b you can view smartphones and accessories, collect orders and discuss repairs. Online we show price, availability, device condition and key product details so you can compare before buying.",
      },
      features: [
        {
          title: "Clear Product Information",
          description: "Brand, model, condition, storage, price and availability are shown on each product. We add manufacturer barcodes only after verification.",
          icon: "genuine",
        },
        {
          title: "Clear Terms",
          description: "Any additional guarantee applies only when its scope and terms are expressly stated for the specific offer or repair order.",
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
        description: "Browse smartphones and accessories with clearly stated condition, price, availability and warranty.",
        buttons: {
          smartphones: "Browse Smartphones",
          accessories: "View Accessories",
          contact: "Get in Touch",
        },
      },
      stats: [
        { value: "Hamburg", label: "Wilhelmsburg location" },
        { value: "Mon–Sat", label: "Open six days" },
        { value: "09:30", label: "Opening time" },
        { value: "20:00", label: "Closing time" },
      ],
    },
    faq: {
      heroTitle: "Frequently asked",
      heroSubtitle: "Answers about service, repairs and accessories.",
      items: [
        {
          question: "How fast is a repair?",
          answer:
            "After diagnosis, we give you an estimated timeline. Duration depends on the device, damage, part availability and current workload.",
        },
        {
          question: "Do you offer warranty?",
          answer:
            "Any additional guarantee applies only when its scope and terms are expressly stated in the specific repair order.",
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
        {
          question: "How long does delivery take?",
          answer: "Delivery within Germany normally takes 1–3 business days. Insured standard shipping costs €6.90, while collection from the store is free.",
        },
        {
          question: "How long can I cancel an online purchase?",
          answer: "Consumers generally have a 14-day right of withdrawal for online purchases. The customer bears the direct return cost; details are on our Delivery & Returns page.",
        },
        {
          question: "What do New, Open Box and Used A+ mean?",
          answer: "New means sealed. Open box means the packaging has been opened, for example for a display or return item. Used A+ has been used before and is listed with a specific condition note.",
        },
        {
          question: "Are the listed iPhone 17 devices sealed?",
          answer: "The iPhone 17 devices currently listed are new and sealed. The condition is also shown on every product page and in the order.",
        },
        {
          question: "Which payment methods are available?",
          answer: "Online you can pay securely by credit card (Visa, Mastercard), Apple Pay, or Klarna. In store, cash, credit cards and debit cards are accepted.",
        },
        {
          question: "Will I receive an invoice?",
          answer: "Yes. Every purchase includes an invoice with the order and product details.",
        },
      ],
    },
    privacy: {
      heroTitle: "Privacy Policy",
      intro:
        "This privacy policy explains how Apfel Park processes personal data when you use this website, contact us, request repairs, place orders, or communicate with us by email.",
      sections: [
        {
          title: "1. Controller",
          body: [
            "Apfel Park, Wilhelm-Strauß-Weg 2b, 21109 Hamburg",
            "Email: info [at] apfel-park [dot] de | Phone: 040 58978787",
            "You can contact us at any time using the details above for privacy-related questions.",
          ],
        },
        {
          title: "2. Categories of data processed",
          body: [
            "Contact and communication data such as name, email address, phone number, and message content.",
            "Repair and device data such as repair requests, device type, issue description, status updates, cost estimates, and repair notes.",
            "Order and invoice data where required for sales, repairs, invoicing, or legal retention duties.",
            "Technical usage data such as IP address, timestamps, browser details, and security-related logs required to protect and operate the website.",
          ],
        },
        {
          title: "3. Purposes and legal bases",
          body: [
            "Article 6(1)(b) GDPR: handling contact requests, repair orders, purchases, and pre-contractual inquiries.",
            "Article 6(1)(c) GDPR: complying with legal obligations, especially accounting and retention obligations.",
            "Article 6(1)(f) GDPR: IT security, abuse prevention, system monitoring, and reliable website operation.",
            "Article 6(1)(a) GDPR together with Section 25 TDDDG: loading external services and marketing technologies such as Google Maps, Google reCAPTCHA, Google Analytics 4, and, if configured, Meta Pixel and TikTok Pixel only after consent.",
          ],
        },
        {
          title: "4. Recipients and service providers",
          body: [
            "Hosting and server operations run on a rented server with Hetzner. The website also uses Cloudflare for DNS and technical protection features.",
            "Email communication and repair-status emails are processed through our self-hosted mail system.",
            "Maps are provided only after consent through Google Maps. When enabled, Google may process technical usage data.",
            "If spam protection through Google reCAPTCHA is enabled, this external service is also loaded only after consent.",
            "If you allow external services, we use Google Analytics 4 from Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland. It processes page views and shop events such as product views, cart actions, checkout and purchases together with technical usage data so that we can measure reach and the sales funnel. These events do not send names, email addresses or payment data.",
            "If marketing tracking is configured and you allow external services, Meta Pixel and TikTok Pixel may process technical usage and event data for reach measurement, campaign reporting, and ad attribution.",
            "For payment and delivery, we share order, contact, and address data only with the selected or necessary payment and shipping providers.",
            "After a completed order, and only if you allowed external services, we pass your name, email address, and order reference to Trustpilot A/S, Pilestræde 58, 1112 Copenhagen, Denmark, so that Trustpilot can send you an invitation to leave a review. Without that consent the service is not loaded and no data is transferred.",
            "On the order confirmation we also show the Google Customer Reviews opt-in, again only if you allowed external services. If you accept there, we pass your email address, order number, delivery country, and estimated delivery date to Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland, so that Google can send you a review survey. The Google Customer Reviews badge, which displays our seller rating, is loaded only after the same consent. Without it neither script is loaded and no data is transferred.",
            "We share data with other recipients only where necessary for contract performance or where we are legally required to do so.",
          ],
        },
        {
          title: "5. Cookies, local storage, and consent",
          body: [
            "We use necessary cookies or local storage for language selection, theme preference, secure admin sessions, and technical delivery of the website.",
            "External content such as Google Maps, Google reCAPTCHA, and marketing technologies such as Google Analytics 4, Meta Pixel and TikTok Pixel are loaded only after you allow external services.",
            "We store your consent choice so that your preference does not need to be requested again on every visit.",
          ],
        },
        {
          title: "6. Retention periods",
          body: [
            "We keep contact and repair-request data only as long as necessary for processing, follow-up, warranty, and legal obligations.",
            "Invoice and accounting data is retained according to applicable statutory retention periods.",
            "Security and server logs are stored only as long as required for stability, abuse prevention, and troubleshooting.",
          ],
        },
        {
          title: "7. International transfers",
          body: [
            "When external services such as Google Maps, Google reCAPTCHA, Google Analytics 4, Meta Pixel, or TikTok Pixel are loaded, a transfer of personal data to third countries, especially the United States, cannot be ruled out.",
            "These services are therefore not loaded by default and are activated only after your consent.",
          ],
        },
        {
          title: "8. Your rights",
          body: [
            "You have the right to access, rectify, erase, restrict processing, and receive data portability subject to the legal requirements.",
            "Where we process data on the basis of legitimate interests, you have the right to object. You may withdraw consent at any time for the future.",
            "You also have the right to lodge a complaint with a competent data protection supervisory authority.",
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
            "Repair and maintenance of smartphones and tablets",
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
            "Payment by credit card, Apple Pay, or Klarna – cash in store.",
          ],
        },
        {
          title: "4. Device condition",
          body: [
            "New & sealed means goods in their original sealed packaging. Open-box means unboxed goods not sold as used, such as display or returned stock.",
            "Used A+ means inspected, previously used devices in very good condition. Listing notes, real product photos and, for iPhones, stated battery health describe the individual item.",
            "Opened or activated returns are never sold as 'New & sealed'; they are offered exclusively as Open-box or Used.",
          ],
        },
        {
          title: "5. Delivery, withdrawal & defect rights",
          body: [
            "Collection from the store is free. Insured shipping within Germany costs €6.90 and normally takes 1–3 business days after payment.",
            "Online consumer purchases generally have a 14-day withdrawal right. Withdrawal can be declared conveniently via our online withdrawal function ('Withdraw contract' page); you immediately receive a receipt confirmation.",
            "You bear the direct cost of return shipping. Refunds are made within 14 days of receiving the withdrawal using the same payment method; we may withhold the refund until the goods arrive or proof of shipment is provided. Details and the model withdrawal notice are available on Delivery & Returns.",
            "A value-loss deduction only applies to handling beyond what is necessary to check the nature, characteristics, and functioning of the goods, and is always based on the actual, provable loss of value. Returns are possible without the original packaging.",
            "Statutory defect rights apply to goods. We do not reduce the limitation period for used devices; it is two years from delivery.",
          ],
        },
        {
          title: "6. Warranty",
          body: [
            "An additional guarantee applies only when its scope and terms are expressly stated in the repair order. Statutory rights remain unaffected.",
          ],
        },
        {
          title: "7. Liability",
          body: [
            "We are liable for data loss only in cases of gross negligence or intent.",
            "Please back up your data before repair.",
          ],
        },
      ],
    },
  },
} as const;

export type AboutStat = (typeof dictionary)[Locale]["about"]["stats"][number];

export const isLocale = (value: string): value is Locale =>
  value === "de" || value === "en";

export const getDictionary = (locale: string) =>
  dictionary[isLocale(locale) ? locale : "de"];

export type NavItems = (typeof dictionary)[Locale]["nav"];
export type HeaderLabels = (typeof dictionary)[Locale]["header"];

export type FeaturedStoreLabels = (typeof dictionary)[Locale]["featuredStore"];

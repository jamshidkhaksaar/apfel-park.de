import type { Locale } from '@/lib/i18n';

export const repairServiceSlugs = [
  'apple',
  'display-battery',
  'water-damage',
  'camera',
  'samsung',
  'harburg',
] as const;

export type RepairServiceSlug = (typeof repairServiceSlugs)[number];

type RepairServiceCopy = {
  title: string;
  shortTitle: string;
  description: string;
  intro: string;
  symptomsTitle: string;
  symptoms: string[];
  diagnosisTitle: string;
  diagnosis: string[];
  processTitle: string;
  process: string[];
  trustTitle: string;
  trust: string;
};

export type RepairService = {
  slug: RepairServiceSlug;
  serviceType: string;
  /**
   * 'location' pages serve a neighbouring district and are listed separately
   * from the damage-type services, so the services grid stays coherent.
   */
  kind?: 'service' | 'location';
  copy: Record<Locale, RepairServiceCopy>;
};

export const repairServices: RepairService[] = [
  {
    slug: 'apple',
    serviceType: 'Apple iPhone, iPad and Apple Watch repair',
    copy: {
      de: {
        title: 'Apple Reparatur in Hamburg',
        shortTitle: 'Apple',
        description: 'iPhone, iPad oder Apple Watch defekt? Apfel Park prüft Apple Geräte in Hamburg-Wilhelmsburg und bestätigt Preis, Ersatzteil und Dauer vor der Reparatur.',
        intro: 'Bei iPhone, iPad und Apple Watch können ähnliche Symptome unterschiedliche Ursachen haben. Ein schwacher Akku, ein beschädigtes Display, ein Ladeproblem oder eine ausgefallene Kamera wird deshalb zuerst am konkreten Gerät geprüft. In unserem Laden in Hamburg-Wilhelmsburg besprechen wir den Befund, die verfügbare Ersatzteilqualität und den Preis, bevor kostenpflichtige Arbeiten beginnen.',
        symptomsTitle: 'Apple-Fehler, die wir prüfen',
        symptoms: [
          'Gesprungenes iPhone- oder iPad-Display, Touch-Aussetzer, Linien oder schwarze Bildbereiche',
          'Kurze Akkulaufzeit, unerwartetes Abschalten oder auffällige Wärme beim Laden',
          'Ladeanschluss erkennt Kabel nur zeitweise oder das Gerät lädt nicht zuverlässig',
          'Kamera, Lautsprecher, Mikrofon, Tasten oder Sensoren funktionieren nicht richtig',
          'Apple Watch mit Display-, Akku- oder Ladeproblemen',
        ],
        diagnosisTitle: 'Was vor der Freigabe geklärt wird',
        diagnosis: [
          'Exaktes Modell, sichtbarer Schaden und die betroffenen Funktionen',
          'Abgrenzung zwischen Bauteil-, Anschluss-, Software- und Folgeschaden',
          'Verfügbares Ersatzteil, Preis und realistische Bearbeitungsdauer',
          'Wichtige Funktionen vor und nach der Arbeit, soweit das Gerät testbar ist',
        ],
        processTitle: 'So beauftragst du die Reparatur',
        process: [
          'Modell und Fehler online senden oder das Gerät in Wilhelmsburg vorbeibringen.',
          'Wir prüfen den Schaden und erklären die sinnvollen Optionen.',
          'Du bestätigst Preis und Reparatur, bevor ein Teil ersetzt wird.',
          'Nach dem Funktionstest erhältst du das Gerät mit Reparaturbeleg zurück.',
        ],
        trustTitle: 'Unabhängige Werkstatt, klar bezeichnet',
        trust: 'Apfel Park ist eine unabhängige Reparaturwerkstatt und kein Apple Store oder autorisierter Apple Service Provider. Wir verwenden Apple und die Produktnamen ausschließlich zur Beschreibung der Geräte, die wir bearbeiten. Ob eine Reparatur wirtschaftlich sinnvoll ist, entscheiden wir mit dir anhand des konkreten Befunds.',
      },
      en: {
        title: 'Apple Repair in Hamburg',
        shortTitle: 'Apple',
        description: 'iPhone, iPad or Apple Watch broken? Apfel Park inspects Apple devices in Hamburg-Wilhelmsburg and confirms price, part and timing before repair.',
        intro: 'Similar symptoms on an iPhone, iPad or Apple Watch can have different causes. A weak battery, damaged screen, charging fault or failed camera is therefore checked on the actual device first. At our Hamburg-Wilhelmsburg store, we explain the findings, available part quality and price before any paid work begins.',
        symptomsTitle: 'Apple device faults we inspect',
        symptoms: [
          'Cracked iPhone or iPad display, unreliable touch, lines or black screen areas',
          'Short battery life, unexpected shutdowns or unusual heat while charging',
          'Charging port detects the cable intermittently or the device will not charge reliably',
          'Camera, speakers, microphone, buttons or sensors do not work correctly',
          'Apple Watch display, battery or charging problems',
        ],
        diagnosisTitle: 'What we confirm before approval',
        diagnosis: [
          'Exact model, visible damage and the functions affected',
          'Whether the cause is a component, port, software issue or secondary damage',
          'Available replacement part, price and realistic turnaround',
          'Key functions before and after the work where the device can be tested',
        ],
        processTitle: 'How to request the repair',
        process: [
          'Send the model and fault online or bring the device to Wilhelmsburg.',
          'We inspect the damage and explain the sensible options.',
          'You approve the price and repair before a part is replaced.',
          'After functional testing, you receive the device with a repair receipt.',
        ],
        trustTitle: 'Clearly identified as an independent workshop',
        trust: 'Apfel Park is an independent repair workshop, not an Apple Store or Apple Authorised Service Provider. Apple and its product names are used only to identify the devices we work on. We discuss whether repair makes economic sense based on the actual findings.',
      },
    },
  },
  {
    slug: 'display-battery',
    serviceType: 'Smartphone display and battery repair',
    copy: {
      de: {
        title: 'Display- & Akkureparatur in Hamburg',
        shortTitle: 'Display & Akku',
        description: 'Display oder Akku defekt? Apfel Park prüft Smartphones in Hamburg-Wilhelmsburg und nennt Preis, Teilequalität und Dauer vor der Reparatur.',
        intro: 'Ein gesprungenes Display, Touch-Aussetzer oder ein schwacher Akku machen ein sonst gutes Smartphone schnell unzuverlässig. In unserem Laden in Hamburg-Wilhelmsburg prüfen wir zuerst Modell, Schaden und Gerätezustand. Danach erhältst du eine nachvollziehbare Empfehlung und einen Preis, bevor eine kostenpflichtige Reparatur beginnt.',
        symptomsTitle: 'Wann eine Prüfung sinnvoll ist',
        symptoms: [
          'Glasbruch, schwarze Flecken, Linien oder flackernde Bildbereiche',
          'Touchscreen reagiert verzögert, nur teilweise oder gar nicht',
          'Akku entlädt sich ungewöhnlich schnell oder das Gerät schaltet ab',
          'Gerät wird beim Laden heiß, lädt langsam oder zeigt schwankende Prozentwerte',
        ],
        diagnosisTitle: 'Was wir kontrollieren',
        diagnosis: [
          'Display, Touchfunktion, Rahmen und sichtbare Sturzschäden',
          'Akkuzustand, Ladeverhalten und mögliche Ursachen im Ladeanschluss',
          'Kamera, Lautsprecher, Mikrofon und Sensoren vor und nach der Arbeit',
          'Passendes Ersatzteil und realistische Reparaturdauer für dein Modell',
        ],
        processTitle: 'So läuft die Reparatur ab',
        process: [
          'Gerät und Fehler online melden oder direkt im Laden vorbeibringen.',
          'Wir prüfen das Gerät und bestätigen Preis, Ersatzteil und voraussichtliche Dauer.',
          'Erst nach deiner Freigabe führen wir die Arbeit aus und testen die wichtigsten Funktionen.',
          'Du erhältst dein Gerät mit Reparaturbeleg und Hinweisen zur weiteren Nutzung zurück.',
        ],
        trustTitle: 'Transparent statt pauschal',
        trust: 'Der endgültige Preis hängt von Modell, Ersatzteil und zusätzlichen Schäden ab. Wir werben deshalb nicht mit einem Lockpreis, der für dein Gerät später nicht gilt. Nutze den Preisfinder für gelistete Modelle oder sende eine Anfrage für eine konkrete Einschätzung.',
      },
      en: {
        title: 'Screen & Battery Repair in Hamburg',
        shortTitle: 'Screen & Battery',
        description: 'Broken screen or weak battery? Apfel Park checks smartphones in Hamburg-Wilhelmsburg and confirms price, part quality and timing first.',
        intro: 'A cracked screen, unreliable touch input or a weak battery can make an otherwise good phone difficult to use. At our Hamburg-Wilhelmsburg store, we first inspect the model, the fault and the overall condition. You then receive a clear recommendation and price before any paid repair starts.',
        symptomsTitle: 'When an inspection makes sense',
        symptoms: [
          'Cracked glass, black spots, lines or flickering areas',
          'Touch input responds slowly, only partly or not at all',
          'The battery drains unusually fast or the device switches off',
          'The phone gets hot while charging, charges slowly or shows unstable percentages',
        ],
        diagnosisTitle: 'What we check',
        diagnosis: [
          'Display, touch function, frame and visible impact damage',
          'Battery health, charging behaviour and possible charging-port causes',
          'Camera, speakers, microphone and sensors before and after the work',
          'The suitable replacement part and realistic repair time for your model',
        ],
        processTitle: 'How the repair works',
        process: [
          'Submit the device and fault online or bring it to the store.',
          'We inspect it and confirm the price, replacement part and expected timing.',
          'Only after your approval do we perform the repair and test the main functions.',
          'You receive the device with a repair receipt and practical aftercare notes.',
        ],
        trustTitle: 'Clear pricing, not teaser pricing',
        trust: 'The final price depends on the model, replacement part and any additional damage. We therefore do not promise a generic teaser price that may not apply to your device. Use the price finder for listed models or send a request for a specific assessment.',
      },
    },
  },
  {
    slug: 'water-damage',
    serviceType: 'Smartphone water damage diagnosis and repair',
    copy: {
      de: {
        title: 'Handy-Wasserschaden prüfen in Hamburg',
        shortTitle: 'Wasserschaden',
        description: 'Smartphone nass geworden? Apfel Park untersucht Wasserschäden in Hamburg-Wilhelmsburg, dokumentiert den Befund und bespricht die Optionen.',
        intro: 'Nach Kontakt mit Wasser, Getränken oder hoher Feuchtigkeit zählt ein vorsichtiger Umgang. Schalte das Gerät aus, trenne es vom Ladekabel und versuche nicht, es durch wiederholtes Einschalten zu testen. Reis oder starke Hitze entfernen keine Rückstände auf der Platine und können zusätzliche Probleme verursachen. Wir öffnen und prüfen das Gerät fachgerecht, bevor wir eine Reparatur empfehlen.',
        symptomsTitle: 'Typische Anzeichen',
        symptoms: [
          'Gerät startet nicht, startet neu oder wird ungewöhnlich warm',
          'Display, Kamera, Lautsprecher oder Mikrofon funktionieren unzuverlässig',
          'Laden ist nicht möglich oder der Anschluss erkennt das Kabel nur zeitweise',
          'Beschlag in Kameralinsen oder sichtbare Feuchtigkeit im Gerät',
        ],
        diagnosisTitle: 'Was die Diagnose umfasst',
        diagnosis: [
          'Sichtprüfung von Anschlüssen, Dichtungen und Flüssigkeitsindikatoren',
          'Kontrolle auf Korrosion und Rückstände an erreichbaren Bauteilen',
          'Funktionstest der betroffenen Baugruppen, sofern sicher möglich',
          'Einschätzung, ob Reinigung, Teiletausch oder Datenrettungsberatung sinnvoll ist',
        ],
        processTitle: 'Was du jetzt tun solltest',
        process: [
          'Gerät ausschalten und nicht weiter laden.',
          'SIM-Karte entfernen, sichtbare Flüssigkeit außen vorsichtig abtrocknen.',
          'Gerät möglichst zeitnah zur Diagnose bringen und Flüssigkeitsart sowie Zeitpunkt nennen.',
          'Vor weiteren Arbeiten erhältst du den Befund und eine Kostenentscheidung.',
        ],
        trustTitle: 'Keine unrealistischen Erfolgsversprechen',
        trust: 'Der Verlauf eines Wasserschadens hängt von Flüssigkeit, Dauer, Korrosion und bereits erfolgten Einschaltversuchen ab. Deshalb kann eine Rettung nie pauschal garantiert werden. Wir erklären dir den Befund und ob eine Reparatur wirtschaftlich sinnvoll erscheint.',
      },
      en: {
        title: 'Phone Water-Damage Check in Hamburg',
        shortTitle: 'Water Damage',
        description: 'Phone got wet? Apfel Park inspects water damage in Hamburg-Wilhelmsburg, documents the findings and discusses realistic options.',
        intro: 'After contact with water, drinks or heavy moisture, careful handling matters. Switch the device off, disconnect the charger and do not repeatedly power it on to test it. Rice or strong heat cannot remove conductive residue from the board and may create further damage. We open and inspect the device properly before recommending repair work.',
        symptomsTitle: 'Common warning signs',
        symptoms: [
          'The device will not start, keeps restarting or becomes unusually warm',
          'Display, camera, speakers or microphone work intermittently',
          'Charging fails or the port only detects a cable sometimes',
          'Fogging in camera lenses or visible moisture inside the device',
        ],
        diagnosisTitle: 'What the diagnosis covers',
        diagnosis: [
          'Visual inspection of ports, seals and liquid-contact indicators',
          'Checks for corrosion and residue on accessible components',
          'Functional testing of affected assemblies where it is safe to do so',
          'Assessment of cleaning, part replacement or data-recovery advice',
        ],
        processTitle: 'What to do now',
        process: [
          'Switch the device off and do not charge it again.',
          'Remove the SIM and gently dry visible liquid from the exterior.',
          'Bring it in promptly and tell us the liquid type and when exposure happened.',
          'You receive the findings and cost options before further work.',
        ],
        trustTitle: 'No unrealistic recovery promises',
        trust: 'The outcome depends on the liquid, exposure time, corrosion and any attempts to power the phone on. Recovery can therefore never be guaranteed in advance. We explain the findings and whether a repair appears economically sensible.',
      },
    },
  },
  {
    slug: 'camera',
    serviceType: 'Smartphone camera diagnosis and repair',
    copy: {
      de: {
        title: 'Handy-Kamerareparatur in Hamburg',
        shortTitle: 'Kamera',
        description: 'Unscharfe, schwarze oder zitternde Handykamera? Apfel Park prüft Kamera, Glas und Software in Hamburg-Wilhelmsburg vor dem Teiletausch.',
        intro: 'Unscharfe Bilder, ein zitternder Fokus oder eine schwarze Kameravorschau bedeuten nicht automatisch, dass das Kameramodul ersetzt werden muss. Auch Schutzglas, Verschmutzung, Sturzschäden, Software oder andere Bauteile können die Ursache sein. Wir grenzen den Fehler zuerst ein und besprechen danach die passende Lösung.',
        symptomsTitle: 'Fehler, die wir prüfen',
        symptoms: [
          'Kamera fokussiert nicht, zittert oder erzeugt dauerhaft unscharfe Bilder',
          'Kamera-App zeigt ein schwarzes Bild oder beendet sich',
          'Kameraglas ist gebrochen, verkratzt oder innen beschlagen',
          'Frontkamera, Blitz oder Bildstabilisierung funktionieren nicht korrekt',
        ],
        diagnosisTitle: 'Unsere Prüfschritte',
        diagnosis: [
          'Test von Haupt-, Ultraweitwinkel- und Frontkamera, soweit vorhanden',
          'Kontrolle von Kameraglas, Rahmen, Steckverbindungen und sichtbaren Sturzspuren',
          'Abgrenzung zwischen Softwareproblem und Hardwaredefekt',
          'Funktionstest von Fokus, Blitz, Video und Mikrofon nach der Arbeit',
        ],
        processTitle: 'Von der Anfrage bis zur Abholung',
        process: [
          'Beschreibe Modell, Kamera und Fehler möglichst genau.',
          'Wir prüfen das Gerät und nennen dir die wahrscheinliche Ursache.',
          'Du bestätigst Preis und Reparatur, bevor ein Teil ersetzt wird.',
          'Nach dem Abschlusstest erhältst du Gerät und Reparaturbeleg zurück.',
        ],
        trustTitle: 'Das passende Teil für den tatsächlichen Fehler',
        trust: 'Kamerafehler können ähnlich aussehen, aber unterschiedliche Ursachen haben. Eine Diagnose verhindert unnötigen Teiletausch und schafft eine bessere Entscheidungsgrundlage. Bei zusätzlichen Schäden informieren wir dich, bevor Kosten entstehen.',
      },
      en: {
        title: 'Phone Camera Repair in Hamburg',
        shortTitle: 'Camera',
        description: 'Blurry, black or shaking phone camera? Apfel Park checks the camera, lens glass and software in Hamburg-Wilhelmsburg before replacing parts.',
        intro: 'Blurry photos, shaking focus or a black camera preview do not automatically mean the camera module must be replaced. Lens glass, dirt, impact damage, software or another component can cause similar symptoms. We isolate the fault first and then discuss the appropriate solution.',
        symptomsTitle: 'Faults we inspect',
        symptoms: [
          'The camera will not focus, shakes or produces consistently blurry photos',
          'The camera app shows a black image or closes unexpectedly',
          'Lens glass is cracked, scratched or fogged on the inside',
          'Front camera, flash or image stabilisation does not work correctly',
        ],
        diagnosisTitle: 'Our checks',
        diagnosis: [
          'Main, ultra-wide and front camera tests where fitted',
          'Inspection of lens glass, frame, connectors and visible impact marks',
          'Separation of software problems from hardware faults',
          'Focus, flash, video and microphone tests after the work',
        ],
        processTitle: 'From request to collection',
        process: [
          'Describe the model, affected camera and fault as precisely as possible.',
          'We inspect the device and explain the likely cause.',
          'You approve the price and repair before a part is replaced.',
          'After final testing, you receive the device and repair receipt.',
        ],
        trustTitle: 'The right part for the actual fault',
        trust: 'Camera faults can look similar while having different causes. Diagnosis helps avoid unnecessary part replacement and gives you a better basis for deciding. If we find additional damage, we inform you before costs are incurred.',
      },
    },
  },
  {
    slug: 'samsung',
    serviceType: 'Samsung smartphone repair',
    copy: {
      de: {
        title: 'Samsung Reparatur in Hamburg',
        shortTitle: 'Samsung',
        description: 'Galaxy S, A, Fold oder Flip defekt? Apfel Park repariert Samsung-Geräte in Hamburg-Wilhelmsburg – Preis, Ersatzteil und Dauer klären wir vorher.',
        intro: 'Samsung fällt bei vielen Werkstätten hinten runter, weil dort vor allem iPhones auf dem Tisch liegen. Bei uns in Hamburg-Wilhelmsburg gehören Galaxy S, Galaxy A, Fold, Flip und Galaxy Tab zum Alltag. Wir sehen uns zuerst Modell, Schaden und Gesamtzustand an und sagen dir danach ehrlich, was sich lohnt und was nicht.',
        symptomsTitle: 'Typische Samsung-Defekte',
        symptoms: [
          'Grüne oder farbige Linien im AMOLED-Display, oft nach einem Update oder leichtem Sturz',
          'Eingebrannte Bildreste bei älteren Galaxy-Modellen',
          'Fold und Flip: beschädigtes Innendisplay oder ein Scharnier, das hakt oder nicht mehr bündig schließt',
          'Akku entlädt sich schnell, das Gerät wird beim Laden heiß oder die USB-C-Buchse sitzt locker',
          'S Pen wird nicht mehr erkannt (Galaxy Note und S Ultra)',
        ],
        diagnosisTitle: 'Was wir bei Samsung prüfen',
        diagnosis: [
          'Display, Touchverhalten und bei Edge- und Ultra-Modellen die gebogenen Ränder',
          'Akkuzustand, Ladeverhalten und Zustand der USB-C-Buchse',
          'Bei Fold und Flip zusätzlich Scharnier, Innendisplay und Schutzschicht',
          'Kamera, Lautsprecher, Mikrofon und Sensoren vor und nach der Arbeit',
        ],
        processTitle: 'So läuft die Reparatur ab',
        process: [
          'Modell und Fehler online melden oder direkt im Laden in Wilhelmsburg vorbeibringen.',
          'Wir prüfen das Gerät und bestätigen Preis, Ersatzteil und voraussichtliche Dauer.',
          'Erst nach deiner Freigabe reparieren wir und testen anschließend die wichtigsten Funktionen.',
          'Du bekommst dein Galaxy mit Reparaturbeleg zurück, inklusive Hinweisen zur weiteren Nutzung.',
        ],
        trustTitle: 'Warum Samsung anders ist als iPhone',
        trust: 'Samsung-Displays sind fest verklebt und je nach Modell teurer als vergleichbare iPhone-Displays, besonders bei Ultra-, Fold- und Flip-Geräten. Wir nennen dir deshalb den Preis für dein konkretes Modell, bevor wir anfangen, statt mit einem Pauschalpreis zu werben, der für dein Gerät nicht gilt. Startpreise für gelistete Galaxy-Modelle findest du im Preisfinder.',
      },
      en: {
        title: 'Samsung Repair in Hamburg',
        shortTitle: 'Samsung',
        description: 'Galaxy S, A, Fold or Flip broken? Apfel Park repairs Samsung devices in Hamburg-Wilhelmsburg, confirming price, part and timing before any work.',
        intro: 'Samsung tends to be an afterthought at shops that mostly handle iPhones. At our Hamburg-Wilhelmsburg store, Galaxy S, Galaxy A, Fold, Flip and Galaxy Tab are everyday work. We look at the model, the fault and the overall condition first, then tell you honestly what is worth repairing and what is not.',
        symptomsTitle: 'Common Samsung faults',
        symptoms: [
          'Green or coloured lines across the AMOLED display, often after an update or a minor drop',
          'Burn-in or ghosting on older Galaxy models',
          'Fold and Flip: damaged inner screen, or a hinge that catches or no longer closes flush',
          'Battery drains quickly, the device heats up while charging, or the USB-C port feels loose',
          'S Pen no longer recognised (Galaxy Note and S Ultra)',
        ],
        diagnosisTitle: 'What we check on Samsung devices',
        diagnosis: [
          'Display, touch response and, on Edge and Ultra models, the curved edges',
          'Battery health, charging behaviour and the condition of the USB-C port',
          'On Fold and Flip, additionally the hinge, inner display and protective layer',
          'Camera, speakers, microphone and sensors before and after the work',
        ],
        processTitle: 'How the repair works',
        process: [
          'Report the model and fault online, or bring it to the store in Wilhelmsburg.',
          'We inspect the device and confirm price, replacement part and expected timing.',
          'Only after your approval do we carry out the repair and test the main functions.',
          'You get your Galaxy back with a repair receipt and practical aftercare notes.',
        ],
        trustTitle: 'Why Samsung differs from iPhone',
        trust: 'Samsung displays are firmly bonded and, depending on the model, cost more than comparable iPhone screens, particularly on Ultra, Fold and Flip devices. We therefore quote the price for your specific model before starting, rather than advertising a flat rate that will not apply to your device. Starting prices for listed Galaxy models are in the price finder.',
      },
    },
  },
  {
    slug: 'harburg',
    serviceType: 'Smartphone repair for Hamburg-Harburg',
    kind: 'location',
    copy: {
      de: {
        title: 'Handy Reparatur für Harburg',
        shortTitle: 'Harburg',
        description: 'Handy oder iPhone kaputt in Harburg? Apfel Park repariert in Hamburg-Wilhelmsburg, wenige Minuten entfernt – Preis und Dauer klären wir vorher.',
        intro: 'Unser Laden liegt in Hamburg-Wilhelmsburg, gleich nördlich von Harburg. Viele Kundinnen und Kunden kommen aus Harburg, Heimfeld, Wilstorf und Eißendorf zu uns. Wir reparieren iPhone, Samsung und weitere Marken, prüfen dein Gerät vor Ort und nennen dir den Preis, bevor wir anfangen.',
        symptomsTitle: 'Was wir reparieren',
        symptoms: [
          'Display und Touchscreen bei iPhone, Samsung Galaxy, Xiaomi und Google Pixel',
          'Akkutausch, wenn das Gerät nicht mehr durch den Tag kommt',
          'Ladebuchse, wenn das Kabel wackelt oder gar nicht mehr lädt',
          'Kamera, Lautsprecher, Mikrofon und Tasten',
          'Wasserschaden – je früher du kommst, desto besser stehen die Chancen',
        ],
        diagnosisTitle: 'So kommst du zu uns',
        diagnosis: [
          'Mit der S-Bahn: ab Hamburg-Harburg wenige Minuten bis Wilhelmsburg, danach kurzer Fußweg',
          'Mit dem Auto: Richtung Norden, Parkplätze gibt es direkt am Luna Center',
          'Adresse: Wilhelm-Strauß-Weg 2b, 21109 Hamburg',
          'Geöffnet Montag bis Samstag von 09:30 bis 20:00 Uhr, ohne Termin',
        ],
        processTitle: 'So läuft die Reparatur ab',
        process: [
          'Gerät und Fehler online melden oder einfach ohne Termin vorbeikommen.',
          'Wir prüfen das Gerät und bestätigen Preis, Ersatzteil und voraussichtliche Dauer.',
          'Erst nach deiner Freigabe reparieren wir – viele Reparaturen sind am selben Tag fertig.',
          'Du bekommst dein Gerät mit Reparaturbeleg zurück.',
        ],
        trustTitle: 'Ehrlich zur Lage',
        trust: 'Wir sitzen nicht in Harburg selbst, sondern in Wilhelmsburg. Das sagen wir lieber direkt, statt so zu tun, als hätten wir eine Filiale um die Ecke. Der Weg lohnt sich trotzdem: feste Preise für gelistete Modelle, viele Reparaturen am selben Tag, und wir arbeiten an Samsung-Geräten genauso selbstverständlich wie an iPhones.',
      },
      en: {
        title: 'Phone Repair for Hamburg-Harburg',
        shortTitle: 'Harburg',
        description: 'Broken phone in Harburg? Apfel Park repairs in Hamburg-Wilhelmsburg, a few minutes away, confirming price and timing before any work begins.',
        intro: 'Our store is in Hamburg-Wilhelmsburg, just north of Harburg. Many of our customers come from Harburg, Heimfeld, Wilstorf and Eißendorf. We repair iPhone, Samsung and other brands, inspect your device on site and quote the price before we start.',
        symptomsTitle: 'What we repair',
        symptoms: [
          'Screens and touch input on iPhone, Samsung Galaxy, Xiaomi and Google Pixel',
          'Battery replacement when the device no longer lasts the day',
          'Charging port when the cable wobbles or no longer charges',
          'Camera, speakers, microphone and buttons',
          'Water damage – the sooner you come in, the better the odds',
        ],
        diagnosisTitle: 'How to reach us',
        diagnosis: [
          'By S-Bahn: a few minutes from Hamburg-Harburg to Wilhelmsburg, then a short walk',
          'By car: head north, parking is available at the Luna Center',
          'Address: Wilhelm-Strauß-Weg 2b, 21109 Hamburg',
          'Open Monday to Saturday, 09:30 to 20:00, no appointment needed',
        ],
        processTitle: 'How the repair works',
        process: [
          'Report the device and fault online, or simply drop in without an appointment.',
          'We inspect the device and confirm price, replacement part and expected timing.',
          'Only after your approval do we repair – many jobs are finished the same day.',
          'You get your device back with a repair receipt.',
        ],
        trustTitle: 'Straight about the location',
        trust: 'We are not in Harburg itself, we are in Wilhelmsburg. We would rather say that plainly than pretend to have a branch around the corner. The trip is still worth it: fixed prices for listed models, many repairs finished the same day, and we work on Samsung devices as readily as on iPhones.',
      },
    },
  },
];

export const getRepairService = (slug: string): RepairService | null =>
  repairServices.find((service) => service.slug === slug) ?? null;

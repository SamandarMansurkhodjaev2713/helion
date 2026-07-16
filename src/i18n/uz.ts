import type { Dictionary } from './types'

/** Uzbek (Latin script) — full parallel translation of the Russian source. */
export const uz: Dictionary = {
  meta: {
    title: 'Helion — Notanish chegaradan narida',
    description:
      'Helion olamlar orasidagi sukunatda marshrutlar quradi. Asteroid kamaridan tashqariga birinchi fuqarolik reysi — 2027.',
  },
  nav: {
    missions: 'Missiyalar',
    fleet: 'Flot',
    route: 'Marshrut',
    crew: 'Ekipaj',
    cta: 'Joy band qilish',
    languageLabel: 'Til tanlash',
    menuLabel: 'Asosiy navigatsiya',
  },
  telemetry: {
    status: 'MISSION ACTIVE',
    phaseLabel: 'FAZA',
  },
  hero: {
    titleLine1: 'Koinot',
    titleEmphasis: 'chegarasidan',
    titleLine3: 'narida.',
    lead: 'Helion olamlar orasidagi sukunatda marshrutlar quradi — har safar bitta imkonsiz sayohat.',
    asideTitle: 'Cheksizlikni',
    asideEmphasis: 'kashf et',
    asideBody:
      'Kashfiyotlar va chegarasiz ufqlar olami. Bizning vazifamiz — sizni barcha xaritalar tugaydigan joyga olib borish.',
    voyageLabel: 'Birinchi reys',
    voyageYear: '2027',
    scrollHint: 'Pastga suring',
    missionTag: 'Missiya 04 — Birinchi aloqa',
    bLine1: 'U buni',
    bEmphasisA: 'birinchi',
    bEmphasisB: 'koʻrdi',
    bBody1:
      'Uning niqobida aks etgan — hali nom berilmagan olam. Toʻqson million kilometr sovuq zulmat, ammo u qoʻl uzatib tegadigandek yaqin koʻrinardi.',
    bBody2:
      'Har bir asbob bir narsani takrorlardi: ortga qayt. Yoqilgʻi zaxirasi, radiatsiya egri chizigʻi, barcha kanallardagi sukunat. U yana bir aylanaga qoldi — baʼzi narsani oʻlchaysan, baʼzisini esa oʻz koʻzing bilan koʻrasan.',
    statDistanceValue: '92 mln km',
    statDistanceLabel: 'masofa',
    statOutboundValue: '311 kun',
    statOutboundLabel: 'parvoz',
    statCrewValue: '12 dan 1',
    statCrewLabel: 'ekipaj',
    finaleLine1: 'Masofa — bu shunchaki',
    finaleEmphasis: 'biz aytadigan hikoya',
    finaleLeftEyebrow: 'Birinchi fuqarolik reysi',
    finaleLeftBody:
      'Har bir ekspeditsiya bir xil boshlanadi: kimdir haqiqatan koʻrish uchun yetarlicha uzoq qotib turadi.',
    finaleSeatsValue: '12',
    finaleSeatsLabel: 'joy',
    finaleDepartureValue: '2027',
    finaleDepartureLabel: 'start',
    finaleRightBody:
      'Kamardan tashqariga birinchi reysga qoʻshiling. Endi hech qachon avvalgidek boʻlmaydigan yagona ufq.',
    reserveCta: 'Joy band qilish',
    routeLink: 'Marshrutni koʻrish →',
  },
  missions: {
    eyebrow: '003 / Ekspeditsiyalar',
    title: 'Ekspeditsiyalar',
    titleEmphasis: 'solnomasi',
    intro:
      'Boʻshliqda chizilgan uchta marshrut. Har biri — qiziquvchanlik qanchalik uzoqqa borishi mumkinligi haqidagi dosye.',
    statusActive: 'PARVOZDA',
    statusReturned: 'YAKUNLANDI',
    statusPlanned: 'REJADA',
    viewDossier: 'Dosyeni ochish',
    labelDistance: 'masofa',
    labelDuration: 'davomiyligi',
    labelCrew: 'ekipaj',
    items: [
      {
        code: 'HX-04',
        name: 'Birinchi aloqa',
        distance: '92 mln km',
        duration: '311 kun',
        crew: '12',
        status: 'active',
        summary:
          'Kamardan narigi nomsiz olam aylanib oʻtildi. Sirtining zond emas, inson koʻzi bilan olingan birinchi tasviri.',
      },
      {
        code: 'HX-02',
        name: 'Sokin boshpana',
        distance: '1.4 mlrd km',
        duration: '6 yil',
        crew: '8',
        status: 'returned',
        summary:
          'Saturn orbitasidagi suzuvchi stansiya. Halqalar ichida toʻqqiz oy — va ularning birinchi akustika arxivi.',
      },
      {
        code: 'HX-07',
        name: 'Uzoq yorugʻlik',
        distance: '4.5 mlrd km',
        duration: 'reja',
        crew: '16',
        status: 'planned',
        summary:
          'Koyper kamariga reys. Quyosh shunchaki eng yorugʻ yulduzga aylanadigan nuqta.',
      },
    ],
  },
  fleet: {
    eyebrow: '004 / Flot',
    title: 'Sukunatni saqlaydigan',
    titleEmphasis: 'kemalar',
    intro:
      'Uchta sinf. Bitta tamoyil: insonni zond yetgan joydan uzoqroqqa olib borish — va uni uyiga qaytarish.',
    selectHint: 'Bortni tanlang',
    ships: [
      {
        id: 'aurora',
        name: 'Aurora',
        klass: 'H-1 · Flagman',
        role: 'Boshqariladigan tashuvchi',
        description:
          'Dasturning flagmani. 400 kunlik yopiq hayot taʼminoti sikli va yillar davomida uzluksiz tortishga moʻljallangan ion marsh dvigateli.',
        specs: [
          { label: 'Tortish', value: '1.2', unit: 'MN' },
          { label: 'Ekipaj', value: '12', unit: 'kishi' },
          { label: 'Avtonomlik', value: '400', unit: 'kun' },
          { label: 'Tezlik', value: '58', unit: 'km/s' },
        ],
      },
      {
        id: 'vesta',
        name: 'Vesta',
        klass: 'H-2 · Taʼminot',
        role: 'Yuk transporti',
        description:
          'Ekipajsiz taʼminot borti. Yoqilgʻi, suv va modullarni orbitadagi yigʻish nuqtalariga tashiydi — sokin, aniq, ekipajsiz.',
        specs: [
          { label: 'Yuk', value: '48', unit: 't' },
          { label: 'Ulanish', value: '20', unit: '×' },
          { label: 'Avtonomlik', value: '600', unit: 'kun' },
          { label: 'Tezlik', value: '44', unit: 'km/s' },
        ],
      },
      {
        id: 'xerxes',
        name: 'Kserks',
        klass: 'H-3 · Razvedka',
        role: 'Tezkor razvedkachi',
        description:
          'Yengil razvedkachi. Ekspeditsiyadan oldinga oʻtadi, yoʻlakni suratga oladi va flot kursni chizishdan avval maʼlumot qaytaradi.',
        specs: [
          { label: 'Tortish', value: '0.6', unit: 'MN' },
          { label: 'Ekipaj', value: '3', unit: 'kishi' },
          { label: 'Tezlanish', value: '9', unit: 'oy' },
          { label: 'Tezlik', value: '71', unit: 'km/s' },
        ],
      },
    ],
  },
  route: {
    eyebrow: '005 / Marshrut',
    title: 'Yerdan —',
    titleEmphasis: 'birinchi yorugʻlikkacha',
    intro:
      'Bitta traektoriyaga jamlangan toʻrt yillik tayyorgarlik. Uni startdan ufqqacha bosib oʻting.',
    scrollHint: 'Suring',
    progressLabel: 'TRAEKTORIYA',
    milestones: [
      {
        phase: 'Faza 01',
        date: '2025 · III chor.',
        title: 'Ekipaj tanlovi',
        body: 'Oʻn ikki joy. Minglab ariza. Tanlov muhandislar kemani tayyorlaganidan uzoqroq davom etadi.',
      },
      {
        phase: 'Faza 02',
        date: '2026 · I chor.',
        title: 'Orbitada yigʻish',
        body: '«Vesta» modullari past orbitada uchrashadi. Aurora gravitatsiya ushlamaydigan joyda yigʻiladi.',
      },
      {
        phase: 'Faza 03',
        date: '2026 · IV chor.',
        title: 'L2 da yoqilgʻi',
        body: 'Lagranj nuqtasi — sukunatdan oldingi soʻnggi yoqilgʻi. Bu yerdan yoʻl faqat bir tomonga: oldinga.',
      },
      {
        phase: 'Faza 04',
        date: '2027 · I chor.',
        title: 'Ekspeditsiya starti',
        body: 'Marsh dvigateli tortishga chiqadi. Yer nuqtaga aylanadi. Hammasi shuning uchun boshlangan narsa boshlanadi.',
      },
      {
        phase: 'Ufq',
        date: '2027 →',
        title: 'Birinchi yorugʻlik',
        body: 'Nomsiz olam ilk bor niqobda aks etadi. Undan keyin — faqat oʻzingiz koʻradigan narsa.',
      },
    ],
  },
  crew: {
    eyebrow: '006 / Ekipaj',
    title: 'Koʻzini',
    titleEmphasis: 'uzmaganlar',
    intro: 'Har bir asbob ortida — yana bir aylanaga qolishga qaror qilgan inson.',
    members: [
      {
        name: 'Iris Kan',
        role: 'Ekspeditsiya komandiri',
        tag: 'HX-04',
        bio: 'Oʻn besh yil orbital dasturlar. Nomsiz olamni birinchi boʻlib koʻrdi — va birinchi boʻlib yuz oʻgirmaslikka qaror qildi.',
      },
      {
        name: 'Dmitriy Val',
        role: 'Navigator',
        tag: 'Kurs',
        bio: 'Xato qilib boʻlmaydigan traektoriyalarni hisoblaydi. Xarita yoʻq joyda xaritani xayolida saqlaydi.',
      },
      {
        name: 'Leya Ortis',
        role: 'Bort muhandisi',
        tag: 'Tizimlar',
        bio: 'Aurorani soʻnggi klapangacha biladi. Ustaxonadan toʻqson million kilometr uzoqda sinmasni taʼmirlaydi.',
      },
      {
        name: 'Teo Raskin',
        role: 'Ekspeditsiya shifokori',
        tag: 'Ekipaj',
        bio: 'Oʻn ikki kishi uyiga qaytishi uchun javob beradi. Avvalgidek — yoki hech boʻlmaganda tirik.',
      },
    ],
  },
  contact: {
    eyebrow: '007 / Aloqa',
    title: 'Bor-yoʻgʻi',
    titleEmphasis: 'oʻn ikki joy',
    body: 'Asteroid kamaridan tashqariga birinchi fuqarolik reysi. Tarixdagi — ikki marta sotib boʻlmaydigan joy.',
    telegramCta: 'Telegramga yozish',
    emailCta: 'Pochtaga yozish',
    channelNote: 'Bir kun ichida javob beramiz — har safar bitta soat mintaqasi.',
    seatsValue: '07',
    seatsLabel: 'joy boʻsh',
    manifest: 'HELION PROGRAM · MANIFESTDA JOY 07 / 12',
  },
  footer: {
    tagline: 'Helion — olamlar orasidagi sukunat.',
    rights: '© 2026 Helion. Toʻqima dastur, haqiqiy kod.',
    builtWith: 'Qoʻlda yigʻilgan — shablonsiz va konstruktorsiz.',
    author: 'Dizayn va kod — Samandar Mansurkhodjaev',
    backToTop: 'Yuqoriga',
  },
}

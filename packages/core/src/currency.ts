import type { Language } from '@pinpoint/wording'
import { z } from 'zod'

import { refusal } from './field-errors'

/**
 * A city's second currency (#186).
 *
 * Every place's price is in US dollars. A city may add one more currency, so
 * its places can also hold the price as it was seen — a menu in yen, a ticket
 * booth in won. Nothing converts between the two.
 */

/**
 * A three-letter currency code, never USD.
 *
 * The shape only, matching the database's check. Whether a code is a real
 * currency is decided by `CURRENCIES` below, which is what the applications
 * offer — so a code that leaves the list later still reads back, and still
 * shows on a card, rather than failing validation on every read.
 *
 * Not USD because every place already has a price in dollars, and a second
 * box for the same currency would be two answers to one question.
 */
export const currencyCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}$/, refusal('currency.malformed'))
  .refine((code) => code !== 'USD', { message: refusal('currency.alreadyDollars') })

/**
 * The currencies a city may be given, as `[code, English name]`, ordered by code.
 *
 * Active ISO 4217 codes, without USD and without the funds, metals and testing
 * codes nobody prices a menu in. Plain data rather than `Intl.supportedValuesOf`
 * and `Intl.DisplayNames`, because the phone's JavaScript runtime carries less
 * `Intl` data than a browser (see `price.ts`), and a picker that lists nothing
 * on one platform is worse than a list that is a year out of date. The names
 * were taken from `Intl.DisplayNames('en')` when this was written.
 */
export const CURRENCIES: readonly (readonly [code: string, name: string])[] = [
  ["AED", "United Arab Emirates Dirham"],
  ["AFN", "Afghan Afghani"],
  ["ALL", "Albanian Lek"],
  ["AMD", "Armenian Dram"],
  ["AOA", "Angolan Kwanza"],
  ["ARS", "Argentine Peso"],
  ["AUD", "Australian Dollar"],
  ["AWG", "Aruban Florin"],
  ["AZN", "Azerbaijani Manat"],
  ["BAM", "Bosnia-Herzegovina Convertible Mark"],
  ["BBD", "Barbadian Dollar"],
  ["BDT", "Bangladeshi Taka"],
  ["BHD", "Bahraini Dinar"],
  ["BIF", "Burundian Franc"],
  ["BMD", "Bermudan Dollar"],
  ["BND", "Brunei Dollar"],
  ["BOB", "Bolivian Boliviano"],
  ["BRL", "Brazilian Real"],
  ["BSD", "Bahamian Dollar"],
  ["BTN", "Bhutanese Ngultrum"],
  ["BWP", "Botswanan Pula"],
  ["BYN", "Belarusian Ruble"],
  ["BZD", "Belize Dollar"],
  ["CAD", "Canadian Dollar"],
  ["CDF", "Congolese Franc"],
  ["CHF", "Swiss Franc"],
  ["CLP", "Chilean Peso"],
  ["CNY", "Chinese Yuan"],
  ["COP", "Colombian Peso"],
  ["CRC", "Costa Rican Colón"],
  ["CUP", "Cuban Peso"],
  ["CVE", "Cape Verdean Escudo"],
  ["CZK", "Czech Koruna"],
  ["DJF", "Djiboutian Franc"],
  ["DKK", "Danish Krone"],
  ["DOP", "Dominican Peso"],
  ["DZD", "Algerian Dinar"],
  ["EGP", "Egyptian Pound"],
  ["ERN", "Eritrean Nakfa"],
  ["ETB", "Ethiopian Birr"],
  ["EUR", "Euro"],
  ["FJD", "Fijian Dollar"],
  ["FKP", "Falkland Islands Pound"],
  ["GBP", "British Pound"],
  ["GEL", "Georgian Lari"],
  ["GHS", "Ghanaian Cedi"],
  ["GIP", "Gibraltar Pound"],
  ["GMD", "Gambian Dalasi"],
  ["GNF", "Guinean Franc"],
  ["GTQ", "Guatemalan Quetzal"],
  ["GYD", "Guyanaese Dollar"],
  ["HKD", "Hong Kong Dollar"],
  ["HNL", "Honduran Lempira"],
  ["HTG", "Haitian Gourde"],
  ["HUF", "Hungarian Forint"],
  ["IDR", "Indonesian Rupiah"],
  ["ILS", "Israeli New Shekel"],
  ["INR", "Indian Rupee"],
  ["IQD", "Iraqi Dinar"],
  ["IRR", "Iranian Rial"],
  ["ISK", "Icelandic Króna"],
  ["JMD", "Jamaican Dollar"],
  ["JOD", "Jordanian Dinar"],
  ["JPY", "Japanese Yen"],
  ["KES", "Kenyan Shilling"],
  ["KGS", "Kyrgyz Som"],
  ["KHR", "Cambodian Riel"],
  ["KMF", "Comorian Franc"],
  ["KPW", "North Korean Won"],
  ["KRW", "South Korean Won"],
  ["KWD", "Kuwaiti Dinar"],
  ["KYD", "Cayman Islands Dollar"],
  ["KZT", "Kazakhstani Tenge"],
  ["LAK", "Laotian Kip"],
  ["LBP", "Lebanese Pound"],
  ["LKR", "Sri Lankan Rupee"],
  ["LRD", "Liberian Dollar"],
  ["LSL", "Lesotho Loti"],
  ["LYD", "Libyan Dinar"],
  ["MAD", "Moroccan Dirham"],
  ["MDL", "Moldovan Leu"],
  ["MGA", "Malagasy Ariary"],
  ["MKD", "Macedonian Denar"],
  ["MMK", "Myanmar Kyat"],
  ["MNT", "Mongolian Tugrik"],
  ["MOP", "Macanese Pataca"],
  ["MRU", "Mauritanian Ouguiya"],
  ["MUR", "Mauritian Rupee"],
  ["MVR", "Maldivian Rufiyaa"],
  ["MWK", "Malawian Kwacha"],
  ["MXN", "Mexican Peso"],
  ["MYR", "Malaysian Ringgit"],
  ["MZN", "Mozambican Metical"],
  ["NAD", "Namibian Dollar"],
  ["NGN", "Nigerian Naira"],
  ["NIO", "Nicaraguan Córdoba"],
  ["NOK", "Norwegian Krone"],
  ["NPR", "Nepalese Rupee"],
  ["NZD", "New Zealand Dollar"],
  ["OMR", "Omani Rial"],
  ["PAB", "Panamanian Balboa"],
  ["PEN", "Peruvian Sol"],
  ["PGK", "Papua New Guinean Kina"],
  ["PHP", "Philippine Peso"],
  ["PKR", "Pakistani Rupee"],
  ["PLN", "Polish Zloty"],
  ["PYG", "Paraguayan Guarani"],
  ["QAR", "Qatari Riyal"],
  ["RON", "Romanian Leu"],
  ["RSD", "Serbian Dinar"],
  ["RUB", "Russian Ruble"],
  ["RWF", "Rwandan Franc"],
  ["SAR", "Saudi Riyal"],
  ["SBD", "Solomon Islands Dollar"],
  ["SCR", "Seychellois Rupee"],
  ["SDG", "Sudanese Pound"],
  ["SEK", "Swedish Krona"],
  ["SGD", "Singapore Dollar"],
  ["SHP", "St. Helena Pound"],
  ["SLE", "Sierra Leonean Leone"],
  ["SOS", "Somali Shilling"],
  ["SRD", "Surinamese Dollar"],
  ["SSP", "South Sudanese Pound"],
  ["STN", "São Tomé & Príncipe Dobra"],
  ["SVC", "Salvadoran Colón"],
  ["SYP", "Syrian Pound"],
  ["SZL", "Swazi Lilangeni"],
  ["THB", "Thai Baht"],
  ["TJS", "Tajikistani Somoni"],
  ["TMT", "Turkmenistani Manat"],
  ["TND", "Tunisian Dinar"],
  ["TOP", "Tongan Paʻanga"],
  ["TRY", "Turkish Lira"],
  ["TTD", "Trinidad & Tobago Dollar"],
  ["TWD", "New Taiwan Dollar"],
  ["TZS", "Tanzanian Shilling"],
  ["UAH", "Ukrainian Hryvnia"],
  ["UGX", "Ugandan Shilling"],
  ["UYU", "Uruguayan Peso"],
  ["UZS", "Uzbekistani Som"],
  ["VES", "Venezuelan Bolívar"],
  ["VND", "Vietnamese Dong"],
  ["VUV", "Vanuatu Vatu"],
  ["WST", "Samoan Tala"],
  ["XAF", "Central African CFA Franc"],
  ["XCD", "East Caribbean Dollar"],
  ["XCG", "Caribbean Guilder"],
  ["XOF", "West African CFA Franc"],
  ["XPF", "CFP Franc"],
  ["YER", "Yemeni Rial"],
  ["ZAR", "South African Rand"],
  ["ZMW", "Zambian Kwacha"],
  ["ZWG", "Zimbabwean Gold"],
]

/**
 * The same currencies' names in Spanish, keyed by code.
 *
 * Taken from `Intl.DisplayNames('es')` when this was written, for the reason
 * the English list above is plain data. Capitalised at the first letter only:
 * Spanish writes a currency's name as an ordinary noun (`yen japonés`), and
 * these are read standing alone at the start of a line in a picker.
 *
 * Typed against the English list's codes, so a currency added there without a
 * Spanish name here reads as its code rather than as a blank — and
 * `currency.test.ts` fails on it.
 */
const SPANISH_NAMES: Readonly<Record<string, string>> = {
  AED: "Dírham de los Emiratos Árabes Unidos",
  AFN: "Afgani afgano",
  ALL: "Lek albanés",
  AMD: "Dram armenio",
  AOA: "Kuanza angoleño",
  ARS: "Peso argentino",
  AUD: "Dólar australiano",
  AWG: "Florín arubeño",
  AZN: "Manat azerbaiyano",
  BAM: "Marco convertible de Bosnia y Herzegovina",
  BBD: "Dólar barbadense",
  BDT: "Taka bangladesí",
  BHD: "Dinar bareiní",
  BIF: "Franco burundés",
  BMD: "Dólar bermudeño",
  BND: "Dólar bruneano",
  BOB: "Boliviano",
  BRL: "Real brasileño",
  BSD: "Dólar bahameño",
  BTN: "Gultrum butanés",
  BWP: "Pula botsuano",
  BYN: "Rublo bielorruso",
  BZD: "Dólar beliceño",
  CAD: "Dólar canadiense",
  CDF: "Franco congoleño",
  CHF: "Franco suizo",
  CLP: "Peso chileno",
  CNY: "Yuan renminbi",
  COP: "Peso colombiano",
  CRC: "Colón costarricense",
  CUP: "Peso cubano",
  CVE: "Escudo de Cabo Verde",
  CZK: "Corona checa",
  DJF: "Franco yibutiano",
  DKK: "Corona danesa",
  DOP: "Peso dominicano",
  DZD: "Dinar argelino",
  EGP: "Libra egipcia",
  ERN: "Nakfa eritreo",
  ETB: "Bir etíope",
  EUR: "Euro",
  FJD: "Dólar fiyiano",
  FKP: "Libra malvinense",
  GBP: "Libra esterlina",
  GEL: "Lari georgiano",
  GHS: "Cedi ghanés",
  GIP: "Libra gibraltareña",
  GMD: "Dalasi gambiano",
  GNF: "Franco guineano",
  GTQ: "Quetzal guatemalteco",
  GYD: "Dólar guyanés",
  HKD: "Dólar hongkonés",
  HNL: "Lempira hondureño",
  HTG: "Gurde haitiano",
  HUF: "Forinto húngaro",
  IDR: "Rupia indonesia",
  ILS: "Nuevo séquel israelí",
  INR: "Rupia india",
  IQD: "Dinar iraquí",
  IRR: "Rial iraní",
  ISK: "Corona islandesa",
  JMD: "Dólar jamaicano",
  JOD: "Dinar jordano",
  JPY: "Yen japonés",
  KES: "Chelín keniano",
  KGS: "Som kirguís",
  KHR: "Riel camboyano",
  KMF: "Franco comorense",
  KPW: "Won norcoreano",
  KRW: "Won surcoreano",
  KWD: "Dinar kuwaití",
  KYD: "Dólar de las Islas Caimán",
  KZT: "Tengue kazajo",
  LAK: "Kip laosiano",
  LBP: "Libra libanesa",
  LKR: "Rupia esrilanquesa",
  LRD: "Dólar liberiano",
  LSL: "Loti lesotense",
  LYD: "Dinar libio",
  MAD: "Dírham marroquí",
  MDL: "Leu moldavo",
  MGA: "Ariari malgache",
  MKD: "Dinar macedonio",
  MMK: "Kiat de Myanmar",
  MNT: "Tugrik mongol",
  MOP: "Pataca macaense",
  MRU: "Uguiya mauritano",
  MUR: "Rupia mauriciana",
  MVR: "Rufiya maldiva",
  MWK: "Kuacha malauí",
  MXN: "Peso mexicano",
  MYR: "Ringit malasio",
  MZN: "Metical mozambiqueño",
  NAD: "Dólar namibio",
  NGN: "Naira nigeriano",
  NIO: "Córdoba oro",
  NOK: "Corona noruega",
  NPR: "Rupia nepalí",
  NZD: "Dólar neozelandés",
  OMR: "Rial omaní",
  PAB: "Balboa panameño",
  PEN: "Sol peruano",
  PGK: "Kina papú",
  PHP: "Peso filipino",
  PKR: "Rupia pakistaní",
  PLN: "Esloti polaco",
  PYG: "Guaraní paraguayo",
  QAR: "Rial catarí",
  RON: "Leu rumano",
  RSD: "Dinar serbio",
  RUB: "Rublo ruso",
  RWF: "Franco ruandés",
  SAR: "Rial saudí",
  SBD: "Dólar salomonense",
  SCR: "Rupia seychellense",
  SDG: "Libra sudanesa",
  SEK: "Corona sueca",
  SGD: "Dólar singapurense",
  SHP: "Libra de Santa Elena",
  SLE: "Leona sierraleonesa",
  SOS: "Chelín somalí",
  SRD: "Dólar surinamés",
  SSP: "Libra sursudanesa",
  STN: "Dobra santotomense",
  SVC: "Colón salvadoreño",
  SYP: "Libra siria",
  SZL: "Lilangeni esuatiní",
  THB: "Bat tailandés",
  TJS: "Somoni tayiko",
  TMT: "Manat turcomano",
  TND: "Dinar tunecino",
  TOP: "Paanga tongano",
  TRY: "Lira turca",
  TTD: "Dólar de Trinidad y Tobago",
  TWD: "Nuevo dólar taiwanés",
  TZS: "Chelín tanzano",
  UAH: "Grivna ucraniana",
  UGX: "Chelín ugandés",
  UYU: "Peso uruguayo",
  UZS: "Sum uzbeko",
  VES: "Bolívar venezolano",
  VND: "Dong vietnamita",
  VUV: "Vatu vanuatense",
  WST: "Tala samoano",
  XAF: "Franco CFA de África Central",
  XCD: "Dólar del Caribe Oriental",
  XCG: "Florín caribeño",
  XOF: "Franco CFA de África Occidental",
  XPF: "Franco CFP",
  YER: "Rial yemení",
  ZAR: "Rand sudafricano",
  ZMW: "Kuacha zambiano",
  ZWG: "Oro zimbabuense",
}

const NAMES: Readonly<Record<Language, ReadonlyMap<string, string>>> = {
  en: new Map(CURRENCIES),
  es: new Map(Object.entries(SPANISH_NAMES)),
}

/** Every currency a city may be given, as `[code, name]` in the language asked for. */
export function currenciesIn(language: Language): readonly (readonly [string, string])[] {
  if (language === 'en') return CURRENCIES
  return CURRENCIES.map(([code]) => [code, currencyName(language, code)] as const)
}

/** `Japanese Yen` for `JPY`, or the code itself for one the list no longer holds. */
export function currencyName(language: Language, code: string): string {
  return NAMES[language].get(code) ?? code
}

/** `JPY — Japanese Yen`: how a currency is offered and how a chosen one reads. */
export function currencyLabel(language: Language, code: string): string {
  const name = NAMES[language].get(code)
  return name === undefined ? code : `${code} — ${name}`
}

/** Case and accents ignored, so `bolivar` finds `Venezuelan Bolívar`. */
function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * The currencies matching what somebody typed: by code or by any part of the
 * name. An empty search lists them all.
 *
 * Matches on the code come first, so `JPY` puts the yen at the top rather than
 * wherever `J` falls in a list of names that happen to contain it.
 */
export function searchCurrencies(
  language: Language,
  query: string,
): readonly (readonly [string, string])[] {
  const all = currenciesIn(language)
  const q = normalise(query)
  if (q === '') return all

  const byCode = all.filter(([code]) => code.toLowerCase().startsWith(q))
  const byName = all.filter(
    ([code, name]) => !code.toLowerCase().startsWith(q) && normalise(name).includes(q),
  )
  return [...byCode, ...byName]
}

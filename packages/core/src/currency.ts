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

const NAMES = new Map(CURRENCIES)

/** `Japanese Yen` for `JPY`, or the code itself for one the list no longer holds. */
export function currencyName(code: string): string {
  return NAMES.get(code) ?? code
}

/** `JPY — Japanese Yen`: how a currency is offered and how a chosen one reads. */
export function currencyLabel(code: string): string {
  const name = NAMES.get(code)
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
export function searchCurrencies(query: string): readonly (readonly [string, string])[] {
  const q = normalise(query)
  if (q === '') return CURRENCIES

  const byCode = CURRENCIES.filter(([code]) => code.toLowerCase().startsWith(q))
  const byName = CURRENCIES.filter(
    ([code, name]) => !code.toLowerCase().startsWith(q) && normalise(name).includes(q),
  )
  return [...byCode, ...byName]
}

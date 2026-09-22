import { ENGLISH } from './english'

/**
 * The languages the product is offered in, and how one is asked for.
 *
 * THERE IS ONE, AND THE ARGUMENT IS TAKEN ANYWAY
 *
 * `say` takes a language from its first day, with exactly one to pass it. That
 * is deliberate. The alternative — `say(message)` now, a language later — is
 * smaller today and changes the signature of every call in the repository in the
 * change that adds the second language, which is already the larger of the two.
 *
 * `price.ts` wrote the instruction for this case down before there was anywhere
 * to act on it: *"`en` because the interface is English. When the interface is
 * translated this becomes an argument threaded from wherever the language is
 * decided, not a second call to the device."* Taking it now means that change
 * replaces a constant with a value, at call sites it is visiting anyway.
 *
 * No provider and no context here. Where the language is *decided* is each
 * application's business, exactly as where a colour is applied is.
 */
export const LANGUAGES = ['en'] as const

export type Language = (typeof LANGUAGES)[number]

/** The one there is. Named rather than defaulted, so every call site says it. */
export const ENGLISH_LANGUAGE: Language = 'en'

/** Everything the product can say. A name, never the sentence behind it. */
export type MessageKey = keyof typeof ENGLISH

type Catalogue = typeof ENGLISH

/**
 * What naming a given message takes: nothing, or exactly the values its
 * sentence has gaps for.
 *
 * A tuple rather than an optional parameter, so the arity is part of the type.
 * The compiler then refuses a name given values it has nowhere to put and a
 * name whose sentence has a gap left unfilled — both of which are otherwise
 * invisible until somebody reads the screen they happen on.
 */
type ArgsFor<K extends MessageKey> = Catalogue[K] extends (values: infer V) => string
  ? [values: V]
  : []

/**
 * Something the product has to say, named rather than written.
 *
 * This is what crosses out of a shared package. It is deliberately not a string
 * and deliberately not something that reads as one: a package reporting a
 * refusal has no idea who is reading, and a sentence chosen there has already
 * answered a question only the surface can answer.
 *
 * The values ride alongside rather than being joined in, because where a name
 * sits inside a sentence is not the same in every language.
 */
export interface Message {
  readonly key: MessageKey
  readonly values?: Readonly<Record<string, string | number>>
}

/** Name something the product says. */
export function message<K extends MessageKey>(key: K, ...rest: ArgsFor<K>): Message {
  const [values] = rest as [Readonly<Record<string, string | number>>?]
  return values === undefined ? { key } : { key, values }
}

/**
 * Every language's copy of the catalogue.
 *
 * Typed against English's shape rather than as a loose record, so a second
 * language cannot be added holding fewer names than this one, or holding a
 * plain sentence where a value has to go. That is the check that matters at the
 * type level; `check:wording` covers what a type cannot see.
 */
const CATALOGUES: Readonly<Record<Language, Catalogue>> = {
  en: ENGLISH,
}

/**
 * Resolve a named message to the sentence a person reads.
 *
 * Called where something is drawn, by an application. Nothing under
 * `packages/` calls this except this package's own tests — a shared package
 * reports a name and stops there, which is what `monorepo-structure` requires.
 */
export function say(language: Language, message: Message): string {
  const entry = CATALOGUES[language][message.key]

  if (typeof entry === 'string') return entry

  // Narrowed to the valued form. The values were checked against the key when
  // the message was made; nothing revalidates them here, because a message
  // cannot be constructed any other way.
  const fill = entry as (values: Readonly<Record<string, string | number>>) => string
  return fill(message.values ?? {})
}

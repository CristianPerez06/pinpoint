import type { Catalogue } from './catalogue'
import { ENGLISH } from './english'
import { SPANISH } from './spanish'

/**
 * The languages the product is offered in.
 *
 * `say` took a language from its first day, with exactly one to pass it, so
 * that adding the second would replace a value at every call site rather than
 * change a signature. This is that second value. A third is a third catalogue
 * typed as `Catalogue`, a third entry here and in `CATALOGUES` below, and
 * nothing else.
 *
 * No provider and no context here. Where the language is *decided* is each
 * application's business, exactly as where a colour is applied is — see
 * `language.ts` for the rule both of them decide it by.
 */
export const LANGUAGES = ['en', 'es'] as const

export type Language = (typeof LANGUAGES)[number]

/** English, named, for the places that have to say it without asking anyone. */
export const ENGLISH_LANGUAGE: Language = 'en'

/** Spanish, named for the same reason. */
export const SPANISH_LANGUAGE: Language = 'es'

/** Everything the product can say. A name, never the sentence behind it. */
export type MessageKey = keyof typeof ENGLISH

/**
 * What naming a given message takes: nothing, or exactly the values its
 * sentence has gaps for.
 *
 * A tuple rather than an optional parameter, so the arity is part of the type.
 * The compiler then refuses a name given values it has nowhere to put and a
 * name whose sentence has a gap left unfilled — both of which are otherwise
 * invisible until somebody reads the screen they happen on.
 */
type ArgsFor<K extends MessageKey> = (typeof ENGLISH)[K] extends (values: infer V) => string
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
 *
 * There is no fallback from one language to another, deliberately. A missing
 * sentence that fell back to English would draw words somebody can read, on a
 * screen that otherwise looks finished — so nobody would report it. The type
 * makes it impossible instead.
 */
const CATALOGUES: Readonly<Record<Language, Catalogue>> = {
  en: ENGLISH,
  es: SPANISH,
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

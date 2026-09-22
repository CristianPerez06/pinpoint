import type { ENGLISH } from './english'

/**
 * English's shape, with every sentence widened to `string`.
 *
 * `typeof ENGLISH` is `as const`, so its entries are literal types — the Spanish
 * could not be assigned to it at all. What has to match is the set of names and
 * which of them take values, and that is exactly what this keeps.
 */
export type Catalogue = {
  readonly [K in keyof typeof ENGLISH]: (typeof ENGLISH)[K] extends (values: infer V) => string
    ? (values: V) => string
    : string
}

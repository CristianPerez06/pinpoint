export { signInSchema, signUpSchema } from './auth'
export type { SignInInput, SignUpInput } from './auth'

export { citySchema, newCitySchema } from './city'
export type { City, NewCity } from './city'

export { markerSchema, newMarkerSchema } from './marker'
export type { Marker, NewMarker } from './marker'

export {
  interestStateOf,
  markerInterestSchema,
  newMarkerInterestSchema,
} from './marker-interest'
export type {
  InterestState,
  MarkerInterest,
  NewMarkerInterest,
} from './marker-interest'

// Only the write-side rule lives here. The type list, its icons, its families,
// and `markerTypeOf` are presentation and live in `@pinpoint/map` — import them
// from there rather than re-exporting them, so there is one answer to where a
// marker's appearance comes from.
export { markerTypeSchema } from './marker-type'

export { newTripSchema, tripSchema } from './trip'
export type { NewTrip, Trip } from './trip'

export { newTripMemberSchema, tripMemberSchema } from './trip-member'
export type { NewTripMember, TripMember } from './trip-member'

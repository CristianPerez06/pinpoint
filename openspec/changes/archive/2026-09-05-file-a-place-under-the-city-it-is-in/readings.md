# Readings

Taken against the live trip before any code was written, which is what section 1 of
`tasks.md` exists for. Everything below is measured; the conclusions drawn from it are
marked as such.

## The trip

| City | Places |
| --- | --- |
| Tokyo | 19 |
| Kyoto | 16 |
| *(unassigned)* | 0 |

Two cities, 35 places, nothing unfiled.

## How places sit relative to each other

For every marker, the distance to the nearest other marker filed under the **same** city,
and to the nearest marker of a **different** city. Haversine, in kilometres.

| Measure | Markers | Min | Avg | Max |
| --- | --- | --- | --- | --- |
| Nearest place in the same city | 35 | 0.00 | 1.22 | **4.61** |
| Nearest place in a different city | 35 | **360.78** | 365.51 | 372.27 |

## What this establishes

**The distributions do not overlap, so the rule fits this trip.** `tasks.md` 1.3 carried a
stop condition — no gap, no threshold, rethink the design. It is not triggered, and not
narrowly: the gap spans two orders of magnitude.

**A city's own places sit within 4.61 km of one another.** That is the floor. Any threshold
below it would fail to claim places that plainly belong together.

**No place on this trip would be refiled by the rule.** Every marker is within 4.61 km of a
same-city neighbour and 360 km from the nearest other city, so at a 15 km threshold each is
claimed by exactly one city — its own. Derived from the two rows above rather than measured
separately.

## What this does NOT establish, and it matters

**The threshold is not pinned by this data.** Any value between roughly 5 km and 360 km
behaves identically here. The measurement confirms the approach and gives a floor; it does
not choose the number.

**The boundary case is absent from this trip.** Tokyo and Kyoto are ~360 km apart. The case
the design was written to survive — two genuinely neighbouring cities, Kyoto and Nara at
about 35 km, where a threshold could reach across — has nothing in this data at that
distance. It is untested, not confirmed.

**Nearest-marker versus centre-of-markers is not discriminated either.** At 360 km of
separation both metrics give the same answer for every place here. `tasks.md` 1.4 asked for
centre-based readings to confirm or overturn that choice; this trip cannot do it. The
decision stands on the reasoning in `design.md` and should be revisited against a trip whose
cities are close together.

**No city on this trip has zero markers**, so the case that produced the name-matching
decision — a city created before anything is filed under it, claiming nothing by position —
does not occur in this data. It has to be set up by hand to be tested.

## The threshold

**15 km.** Three times the observed maximum, so a sparser city than either of these still
holds together, and comfortably below the ~35 km at which two neighbouring cities sit, so
one cannot claim the other's places.

Chosen rather than derived, and the specification should say so. `FAR_AWAY_KM` was taken
from a distribution with a meaningful edge — every correct match within 17 km, the nearest
wrong one at 270 km — and this is not that. The data rules out an overlap and sets a floor;
the headroom above the floor is a judgement.

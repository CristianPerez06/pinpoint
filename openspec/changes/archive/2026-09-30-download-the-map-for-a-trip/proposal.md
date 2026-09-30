## Why

The trip already opens on the phone with no signal, but the streets under it only draw where
the map happened to be looked at recently, and nothing guarantees even that. Abroad without
roaming, underground or in the mountains, a person can see their pins over a blank map. This
lets them download the map around their trip's places ahead of time, on purpose.

OpenFreeMap, which serves the map, forbids collecting its data "in automated ways without
permission". We asked; its maintainer said yes, with no conditions (recorded 2026-09-30). That
was the only thing this was waiting on.

## What Changes

Phone only.

- **An *Offline map* line in the trip sheet**, under People. It says *Not downloaded*, the size
  on the phone once downloaded, or *N new areas* when places were added somewhere new since.
  It opens its own screen, the way Calendar does.
- **The Offline map screen lists the areas that would be downloaded**, each with its size said
  as *about*, and the total. An area is a group of places near each other with a margin around
  them, named after its city, or *3 places with no city*. Places far apart are separate areas,
  so a trip to Tokyo and Kyoto never downloads the countryside between them.
- **Nothing downloads until Download is pressed**, and the button says how much. On mobile
  data a line says Wi-Fi is better for a download this size, without stopping anyone.
- **While downloading**, the screen shows progress overall and per area, and Cancel. It keeps
  going on any screen of Pinpoint; leaving the app pauses it, and coming back continues it
  without downloading again what was finished.
- **Once downloaded**, the map of those areas draws with no signal down to street level. The
  screen says *Ready for no signal*, the size on the phone and the day it was downloaded, and
  offers **Remove from this phone**.
- **Places added somewhere new** show as new areas, and **Update** downloads only those —
  or the whole trip again, said up front, if OpenFreeMap has published newer streets since.
- **With no signal**, Download and Update are greyed out with *Downloading needs a
  connection*. Remove still works.
- **Signing out keeps the downloaded map**, because it holds only streets.

Not being done:
- **The laptop.** Planning happens online.
- **Choosing areas one by one.** The whole trip downloads, or none of it. Remove takes all of
  it off.
- **Downloading in the background** with the app closed. It pauses and continues on return.
- **Refreshing a downloaded map to OpenFreeMap's newer streets.** OpenFreeMap republishes its
  streets every week at a new address. A downloaded trip keeps drawing the edition it
  downloaded, online too, because following the new address loses what was downloaded.
  Update adds new areas in that same edition while OpenFreeMap still serves it; once it has
  published a newer one, Update downloads the whole trip again, saying so and its size first.
  Remove and download again also gets the latest.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `offline-use`: gains *The map around a trip's places can be downloaded ahead of time*, and
  *Signing out removes what the phone kept about the person* says the downloaded map stays.

## Impact

- `@pinpoint/map`: working out the areas from a trip's places, and estimating their size.
  Plain arithmetic, no new dependency.
- `apps/mobile`: the new screen, the line in the trip sheet, and downloading through the map
  library already installed, which has offline downloads built in. No new dependency and no
  new development build.
- `@pinpoint/wording`: every new sentence, in English and Spanish.
- No database change. Downloads go straight from OpenFreeMap to the phone, at no cost.

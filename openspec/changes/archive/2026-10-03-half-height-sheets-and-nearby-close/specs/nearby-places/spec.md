## REMOVED Requirements

### Requirement: Choosing a row opens the place and returns to the list

**Reason**: Reopening the list when the place is closed was found, in use on the phone,
to be the wrong default. Closing a place reads as "done, back to the map", and the list
rising again over the pin that has just been shown hides the answer the person went to
the list for.

**Migration**: Replaced by *Choosing a row opens the place*. Nothing is stored; the way
back to the list is the Nearby tool, which orders the list fresh as every opening does.

## ADDED Requirements

### Requirement: Choosing a row opens the place

Pressing a row SHALL close the sheet, open that place as selecting it on the map does,
and move the map to it (`map-rendering`). Closing the place SHALL leave the map, with
the place still on screen where the map moved to, and SHALL NOT reopen the Nearby
sheet. Opening Nearby again SHALL order it fresh, as every opening does.

Rationale: a row is pressed to find out where a place is. Once the place is shown, the
map is the answer; putting the list back over it on close covers the one thing the
person went to look at. *Only one thing opens at a time* still holds: the sheet is closed
while the place is open, not drawn behind it.

#### Scenario: Opening a place from the list

- **WHEN** a person presses a row in Nearby
- **THEN** the sheet closes, the place opens, and the map moves to it

#### Scenario: Closing the place

- **WHEN** the person closes a place opened from Nearby
- **THEN** the map is shown with the place on it
- **AND** the Nearby sheet does not open again

#### Scenario: Back to the list by hand

- **WHEN** the person presses Nearby again after closing the place
- **THEN** the sheet opens ordered by the current distances

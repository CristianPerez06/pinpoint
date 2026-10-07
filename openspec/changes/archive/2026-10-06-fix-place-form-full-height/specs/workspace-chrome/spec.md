## ADDED Requirements

### Requirement: The form saving a place stays below the header at its full height

In the phone application, the form saving or editing a place SHALL, at its full height,
stand entirely within the space it is drawn in, short of a gap below the top of that space.
Its handle and its whole title SHALL stay visible, and the handle SHALL go on being able to
drag the form back to its lower height. Where the screen leaves more room than the full
height asks for, the full height SHALL be unchanged.

Rationale: the form is drawn over the map, below the trip header, so a full height
measured against the whole screen ran under the header on every phone — hiding the one
control that moves the form, and leaving only dismissing it as a way back.

#### Scenario: The form is dragged to its full height

- **WHEN** the form saving a place is open on the phone
- **AND** the person drags its handle up to the full height
- **THEN** the handle and the whole title are visible below the trip header
- **AND** dragging the handle down returns the form to its lower height

#### Scenario: The smallest phone

- **WHEN** the form saving a place is dragged to its full height on a phone the size of an
  iPhone SE
- **THEN** the handle and the whole title are visible below the trip header

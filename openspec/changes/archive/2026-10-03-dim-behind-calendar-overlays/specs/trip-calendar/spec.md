## ADDED Requirements

### Requirement: A place opened over the calendar sets the calendar back

While a place opened from the calendar is shown, as its details or as the form editing
it, the calendar behind it SHALL be visibly darkened, on both applications and on both
grounds. Closing the place SHALL return the calendar to how it was.

The darkening SHALL be the same one the centred date calendar is raised over, so that
everything the calendar screen raises over itself steps back the same way. It SHALL
darken rather than lighten on either ground: a wash in the ground's own colour fades the
calendar toward the place's surface rather than away from it, which is the confusion
this exists to remove.

A press on the darkened calendar SHALL NOT act on anything beneath it. Over a place's
details it SHALL dismiss them. Over the form it SHALL NOT discard changes without asking:
where the application asks before discarding the form, the press SHALL dismiss through
that question, and where it does not ask, the press SHALL do nothing.

Where the place's form raises the date calendar, that calendar SHALL be raised over a
darkening of its own, so the form steps back from it as the calendar stepped back from
the form.

Rationale: the place's surface and the calendar are drawn in the same colours, so with
nothing between them they read as one surface and it is not clear where one ends. A
place opened on the map is not set back from the map (`workspace-chrome`), because the
map shows the pin the place is about and dimming it would hide that pin. The calendar
holds no pin and draws nothing the place describes, so that reason does not reach here,
and the place is a layer over a list like any other.

#### Scenario: A place's details over the calendar

- **WHEN** a person opens a place from a day or from the places waiting for a day
- **THEN** the calendar behind its details is visibly darker
- **AND** the details are clearly the layer on top

#### Scenario: A place's form over the calendar

- **WHEN** a person edits a place from the calendar
- **THEN** the calendar behind the form is visibly darker

#### Scenario: Closing the place

- **WHEN** the place opened from the calendar is closed
- **THEN** the calendar is drawn at full strength again

#### Scenario: A press on the darkened calendar

- **WHEN** a place's details are open over the calendar
- **AND** a press lands on the darkened calendar, on a place in a day
- **THEN** the details close
- **AND** that place is not opened by the same press

#### Scenario: A press on the darkened calendar with changes in the form

- **WHEN** a place's form holding changes is open over the calendar
- **AND** a press lands on the darkened calendar
- **THEN** the changes are not discarded without the person being asked
- **AND** nothing beneath the press acts on it

#### Scenario: Both grounds

- **WHEN** a place is opened from the calendar on the light ground and on the dark ground
- **THEN** the calendar is darkened on both
- **AND** it is darkened to the same depth as behind the centred date calendar

#### Scenario: Both applications

- **WHEN** a place is opened from the calendar on the laptop and on the phone
- **THEN** both darken the calendar behind it, the same way

#### Scenario: The date calendar raised from the form

- **WHEN** the date calendar is opened from a place's form over the calendar
- **THEN** the form behind it is darkened as well
- **AND** closing the date calendar returns the form, still over the darkened calendar

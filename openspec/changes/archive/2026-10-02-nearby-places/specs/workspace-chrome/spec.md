## MODIFIED Requirements

### Requirement: Controls are placed by how often they are used

The system SHALL give permanent, always-visible placement to the controls used
throughout a session, and SHALL NOT give it to controls used once per trip or less.

A control used rarely MAY live behind a menu. A control used constantly SHALL NOT.

Rare **destructive** controls SHALL be placed away from the frequent ones, so that
neither is reached by mistake while aiming for the other.

There is one exception, and it is narrow. A control that is **the only way out of a
state the screen cannot otherwise leave** MAY be permanently placed although it is rare.
A control qualifies only where the screen offers no other route out of that state, and
the change that places it SHALL say which state and why nothing else answers it. Being
merely important, or merely hard to find, does not qualify.

Rationale: chrome is charged against the map, which is what the screen is for. Spending
permanent placement on something done once per trip takes that space every session for a
control almost nobody is reaching for, and it dilutes the controls that are. This is one
rule stated once for both applications, because it follows from screen shape and
frequency rather than from platform.

Rationale for the exception: frequency is the right measure for a control that *does*
something to the trip, because not finding it costs a detour through a menu. It is the
wrong measure for a control that is a way out. A person whose re-read failed while they
were offline has, by definition, nothing else on the screen that works — so the cost of
burying it is not a detour, it is force-quitting the application, and the rarity that
argued for hiding it is exactly what makes it unfindable at the one moment it is wanted.
The exception is written as a test rather than as a list, so it can be applied to the
next candidate instead of being reopened, and it is deliberately hard to pass: a control
that has any other route to the same outcome does not meet it.

#### Scenario: A rare action is not permanently displayed

- **WHEN** a trip workspace is shown
- **THEN** controls that act on the trip as a whole rather than on the map — renaming
  it, creating another, managing who is on it — are not each permanently displayed
- **AND** each remains reachable

#### Scenario: The session's own controls stay reachable

- **WHEN** a trip workspace is shown
- **THEN** finding a place, placing one by hand, narrowing the trip, and listing the
  places nearest first are each reachable without first opening something

#### Scenario: Signing out is kept away from the frequent controls

- **WHEN** a trip workspace is shown
- **THEN** signing out is not adjacent to the controls used throughout a session

#### Scenario: A rare control is the only way out of a state

- **WHEN** a control is rare, and the screen offers no other way out of the state that
  control exists to leave
- **THEN** it may be given permanent, always-visible placement
- **AND** the change that places it states which state and why nothing else answers it

#### Scenario: A rare control that has another route

- **WHEN** a rare control's outcome can also be reached another way from that screen
- **THEN** it does not qualify for the exception
- **AND** it is placed by how often it is used, as every other control is

### Requirement: The session's tools weigh the same at every width

The controls that make up a session — beginning a place from search, beginning one from the
map, narrowing what the map shows, and listing the places nearest first (`nearby-places`) —
SHALL be drawn at the same visual weight as each
other, at every width and on both platforms.

Same weight means none of them is given a fill, a border, a lettering weight or a size **as
emphasis** that the others do not have while all of them are at rest. It does not mean they
are indistinguishable: each keeps its own name and its own glyph, and a control that is
*declaring a state* is not at rest and is required to say so.

A treatment a control carries because of **what kind of control it is** is not emphasis
within the meaning of this requirement. A search field is filled because the styling rules
say a field is filled, and it accepts typing where its neighbours accept a press; it is not
being ranked above them by having a fill they do not. What this requirement forbids is a
treatment applied to *rank* one tool, which is recognisable by the test that removing it
would leave the control still doing its job in the same way.

Rationale: these controls are equals. Each fires an action and none navigates, and
`marker-capture` states that the two ways to begin adding a place are peers of which
neither is a fallback for the other. Drawing one of them more strongly asserts a hierarchy
that no requirement anywhere describes — and asserts it in colour, which no review reads.

Nearby joins them on the same terms: it opens a list rather than beginning an act, but it
is used throughout a session on the trip, and *Controls are placed by how often they are
used* gives it the same permanent place. Being the newest is not a reason to draw it
louder.

Rationale for stating it at every width rather than for one shape: this equality was
already true of the phone-shaped bar and already written down there, but only as the reason
its names are lettered at one size. The laptop bar drew one of the tools as a filled
control for the life of the project without contradicting any requirement, because no
requirement reached it. A rule that holds at one breakpoint is a rule the other breakpoint
is free to break while type-checking, rendering, and looking deliberate.

This requirement governs weight only. Which controls exist, where they stand, what they are
called and what shape they take at a given width are settled elsewhere — in particular a
tool in the phone-shaped bar is a glyph above one line of words, and this requirement does
not carry that shape onto a laptop-shaped screen.

A control MAY be replaced, while the map is doing something other than what it usually
does, by something of a different weight. This governs the tools as they stand at rest, not
what stands in their place.

#### Scenario: The session's tools at a laptop width

- **WHEN** a trip workspace is shown on a laptop-shaped screen and no tool is declaring a
  state
- **THEN** no tool carries a fill, a border, a lettering weight or a size the others do not
- **AND** each tool is still distinguishable by its own name

#### Scenario: The session's tools at a phone width

- **WHEN** a trip workspace is shown on a phone-shaped screen and no tool is declaring a
  state
- **THEN** the four tools are drawn at the same weight as each other

#### Scenario: A tool is a field rather than a button

- **WHEN** one of the session's tools is a text field and its neighbours are buttons
- **THEN** the fill the field carries as a field is not treated as emphasis
- **AND** the field is not thereby ranked above the tools beside it

#### Scenario: A tool is declaring a state

- **WHEN** a tool is declaring that it is narrowing what the map shows
- **THEN** it is permitted to differ from its neighbours
- **AND** the difference is carried by more than hue alone

#### Scenario: The map is armed

- **WHEN** the map is armed and a tool has been replaced by what the arming needs
- **THEN** the replacement is not required to match the weight of the tools it stands among

## ADDED Requirements

### Requirement: The session's tools weigh the same at every width

The controls that make up a session — beginning a place from search, beginning one from the
map, and narrowing what the map shows — SHALL be drawn at the same visual weight as each
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

Rationale for stating it at every width rather than for one shape: this equality was
already true of the phone-shaped bar and already written down there, but only as the reason
its three names are lettered at one size. The laptop bar drew one of the three as a filled
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
- **THEN** the three tools are drawn at the same weight as each other

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

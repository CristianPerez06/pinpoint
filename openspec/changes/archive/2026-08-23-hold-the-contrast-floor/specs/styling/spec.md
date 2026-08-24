## ADDED Requirements

### Requirement: Text is chosen against the surface it is drawn on

Every text colour SHALL be chosen against the surface it is actually drawn on, and that
surface SHALL NOT be assumed to be the theme's ground. Text drawn on a themed fill —
a filled button, a selected chip, a control that fills on hover — SHALL be chosen
against that fill.

A token SHALL NOT be used to letter a fill merely because it is the theme's ground.
A ground and a fill are different surfaces; a value chosen for legibility over the first
carries no claim about the second, and on a fill whose lightness does not track the
theme it will be wrong on exactly one of the two grounds.

Where a fill is light on both grounds, the text over it SHALL be dark on both. Such a
pair is not a violation of the requirement that each colour be chosen against its own
ground — it is that requirement producing near-neighbours, because the surface being
chosen against is near-identical in both themes.

A state that changes a control's fill SHALL change its text in the same rule wherever
the existing text colour is not legible on the new fill. This applies in particular
where two tokens converge to one value on a ground: a pair that differs on the light
ground and is identical on the dark one will produce a legible composition on the first
and a 1:1 one on the second, and nothing about the tokens themselves is wrong.

#### Scenario: A control is filled with the accent

- **WHEN** a control takes the accent as its fill
- **THEN** its text is a value chosen against the accent
- **AND** it is legible on both the light and the dark ground

#### Scenario: A hover state changes the fill

- **WHEN** a state change replaces a control's fill
- **THEN** the same state declares the text colour for that fill
- **AND** the control's text is legible in the new state on both grounds

#### Scenario: Two tokens converge on one ground

- **WHEN** a text token and a fill token resolve to the same value on one ground
- **THEN** no composition draws that text on that fill
- **AND** the requirement is not satisfied by the pair being legible on the other ground

#### Scenario: A fill is light on both grounds

- **WHEN** a colour used as a fill is light in both themes
- **THEN** the text chosen against it is dark in both
- **AND** the two values are permitted to be near-neighbours

### Requirement: A token used for text clears the text contrast floor

Both applications SHALL meet WCAG 2.2 AA. Any token used to render text SHALL clear
4.5:1 against every surface it is drawn on, or 3:1 where the text qualifies as large.
This SHALL include placeholders, field labels, and the text of a control that is present
but inert.

A token that does not clear the floor SHALL NOT be used for text of any kind, and its
definition SHALL say so. Recessive text is expressed with the most recessive token that
clears the floor, not with one that sits below it.

Rationale: a token described by how it should *feel* rather than by what it may be used
for is how a whole class of unreadable text comes to look deliberate. "Deliberately hard
to notice" is a real design intent and it is satisfied well above the floor; stated as a
licence, it reads as permission to go under it, and every reviewer after that sees intent
where there is a defect.

Non-text uses of such a token — a hairline, a border, a drawn mark — are unaffected by
this requirement and are governed by the 3:1 non-text floor instead.

#### Scenario: A label is rendered

- **WHEN** any label, placeholder, or inert control text is drawn
- **THEN** its colour clears 4.5:1 against the surface behind it

#### Scenario: A token is below the floor

- **WHEN** a colour token does not clear the text contrast floor on either ground
- **THEN** it is not used to render text
- **AND** its definition states that it is not a text colour

#### Scenario: Recessive text is wanted

- **WHEN** text should read as secondary to the text beside it
- **THEN** it uses the most recessive token that clears the floor
- **AND** the separation from primary text is carried by that token, by weight, or by size

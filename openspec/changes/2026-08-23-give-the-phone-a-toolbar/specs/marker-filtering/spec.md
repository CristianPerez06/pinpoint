## MODIFIED Requirements

### Requirement: A narrowed view declares that it is narrowed

Whenever a filter is applied, the system SHALL indicate that fact, and SHALL make
clearing it reachable from where the narrowing is visible.

The indication SHALL be carried by a control that is present whether or not a filter is
applied, through a change in that control's state rather than by appearing beside the
controls when a filter is applied and vanishing when it is cleared.

Rationale: a control that appears on selection moves everything beside it, so applying
a filter rearranges the interface that applied it. It also makes the way out of a
narrowed view discoverable only once you are already in one. A control that is always
there, and becomes live, says the same thing without either cost.

The indication SHALL NOT be carried by colour alone. Rationale: this repeats a decision
already in force elsewhere — a visited marker is drawn as visited without changing its
colour — because a signal that survives only in hue does not survive a greyscale
display, a colour-blind reader, or a screen reader.

**The declaration and the way out MAY be separated.** The declaration SHALL remain on a
control that is visible while the narrowed result is visible. The way out MAY instead
live inside what that control opens, provided the control that declares the narrowing is
also the one that reveals the way out, and provided reaching it costs a single
deliberate action.

Rationale: a permanent way out costs a slot in the one row a thumb can reach, and the
declaration is the half that has to be permanent — a person who cannot tell they are
narrowed does not know to look for the way out, while a person who can tell will look.
Binding the two together was an artefact of one control doing both jobs, not a
conclusion about either. What SHALL NOT happen is the two being carried by different
controls, which would leave somebody able to see that places are missing and hunting for
where to undo it.

An interface MAY conceal the narrowing controls while something else occupies their
place — a sheet describing a selected marker, for instance. Where it does, the
declaration and the way out SHALL be concealed together, and either SHALL become
available again by dismissing whatever concealed them.

Rationale: hiding both is honest, because nothing is then claiming that a narrowed
trip is a whole one. Hiding only the way out would leave somebody able to see that
places are missing with no means of getting them back, which is the failure this
requirement exists to prevent, arriving by a route the wording did not cover. The
permanence required above is permanence within the controls, not a claim that the
controls are always on screen.

When a filter matches no markers, the system SHALL say that nothing matches the filter,
and SHALL NOT present it as a trip with no markers. This SHALL remain true wherever the
absence is visible, including in place of the markers themselves, which is a different
statement from the declaration above and is not replaced by it.

Rationale: a filtered trip and a trip that lost its places render identically — fewer
pins, or none. The difference between "nothing matches what you asked for" and "there is
nothing here" is not one a person can recover on their own, and the second is alarming
in a way the first is not.

#### Scenario: A filter is active

- **WHEN** any filter is applied
- **THEN** the interface indicates that the view is narrowed
- **AND** clearing the filter is reachable from there

#### Scenario: The way out of a narrowed view lives one action away

- **WHEN** the way out is not itself on screen beside the narrowed result
- **THEN** the control that declares the narrowing is on screen
- **AND** that same control reveals the way out
- **AND** no second control has to be found first

#### Scenario: The way out is offered before it is needed

- **WHEN** a trip is opened unfiltered
- **THEN** the control that clears the filter is already present wherever the way out lives
- **AND** applying a filter does not add a control beside it
- **AND** clearing the filter does not remove one

#### Scenario: The declaration does not depend on colour

- **WHEN** a filter is applied
- **AND** the interface is read without colour
- **THEN** the fact that the view is narrowed is still conveyed

#### Scenario: A filter matches nothing

- **WHEN** an applied filter matches no markers on a trip that has markers
- **THEN** the interface states that no markers match the filter
- **AND** does not state or imply that the trip has no markers

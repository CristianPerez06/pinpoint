## ADDED Requirements

### Requirement: Every candidate can be reached and chosen while the keyboard is up

Wherever candidates are offered, every candidate and the hint beneath them SHALL be
reachable, however many candidates there are. A list longer than the room it has SHALL
scroll rather than be cut off.

Where an on-screen keyboard covers part of the screen, the list SHALL end where the
keyboard begins, so that scrolling brings the last candidate and the hint above it rather
than leaving them behind it.

Dragging the list SHALL lower the keyboard. Nothing else on the search screen lowers it
without also doing something else — the keyboard's search key submits the query and the
back control closes search — so without this the keyboard could only be kept or the
search abandoned.

A single tap on a candidate SHALL choose it, whether or not the keyboard is up. Making the
list scroll SHALL NOT turn a choice into two taps, the first spent lowering the keyboard.

A list that fits in the room it has SHALL look and behave as it did before this
requirement.

Rationale: a result that is found and listed but cannot be chosen is worse than one that
was never found — the person can see the place they want and has no way to take it.

#### Scenario: More candidates than fit above the keyboard

- **WHEN** a search on the phone returns eight candidates and the keyboard is up
- **THEN** the list can be scrolled until the last candidate and the hint are both in view
  above the keyboard

#### Scenario: Choosing the last candidate

- **WHEN** a person scrolls to the last candidate and taps it once
- **THEN** it is chosen, exactly as a candidate at the top of the list would be

#### Scenario: One tap with the keyboard up

- **WHEN** the keyboard is up and a person taps a candidate
- **THEN** that candidate is chosen on that tap
- **AND** the tap is not spent only lowering the keyboard

#### Scenario: Dragging the list

- **WHEN** a person drags the list while the keyboard is up
- **THEN** the keyboard is lowered
- **AND** the query and the candidates stay as they were

#### Scenario: A list that already fits

- **WHEN** a search returns three candidates, all in view above the keyboard
- **THEN** the list looks and behaves as it did before

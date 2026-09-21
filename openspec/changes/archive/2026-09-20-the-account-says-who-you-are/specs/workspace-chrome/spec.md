## ADDED Requirements

### Requirement: The account control says which account it is

Where an application gathers the actions belonging to the signed-in account behind a
control that opens — a menu, a sheet — the surface that opens SHALL name that account by
**both** the name the product knows the person by and the address the account is
identified by.

The control that opens it MAY carry the name. It SHALL NOT carry the address, and it MAY
reduce to a glyph at a width where the name does not fit. Whatever the control does, the
opened surface SHALL carry both.

The name SHALL be the display name of that person's membership on the trip being viewed,
which is the name they are called by everywhere else on that trip.

Rationale: *which account is this?* is the question somebody opens that menu to ask, and
it is asked when two people share a laptop — so it is asked precisely when the answer is
not obvious. **A name cannot answer it.** A display name belongs to a membership rather
than to an account, so the same person is `Cris` on one trip and `Cristian` on another,
and two people on one trip can be called the same thing. The address is the only thing
shown anywhere that distinguishes one account from another.

The address is kept off the control for the reason every permanent control is sized by
what it always carries: an address is long, it is the same on every screen the person
will ever see, and on a narrow screen the control has already given up the name. A
question nobody is asking does not earn a permanent place on the chrome; the surface it
opens is where it is answered, which is the same rule the rest of this specification
applies to rare things.

This is stated once for both applications because it follows from what an account is
rather than from a screen shape. It is written after the two applications had already
answered it differently for as long as both have had such a menu — one showing the name
and the address, the other the name alone — with nothing in this specification to say
which was right.

#### Scenario: The opened surface names the account

- **WHEN** a person opens the control holding the actions for their account, on either
  application
- **THEN** the name their membership on that trip is shown by is displayed
- **AND** the address their account is identified by is displayed

#### Scenario: The control that opens it does not carry the address

- **WHEN** the control holding those actions is shown
- **THEN** it does not display the address
- **AND** it displays at most the name

#### Scenario: A width too narrow for the name

- **WHEN** that control is shown on a screen too narrow to spell the name
- **THEN** it may reduce to a glyph
- **AND** opening it still displays both the name and the address

## ADDED Requirements

### Requirement: A narrowed trip reads as narrowed in greyscale

Where the control declaring a narrowed trip carries a signal that is not a hue, that signal
SHALL be seen at a glance on a greyscale display, by somebody who does not already know
where to look, on both grounds and in both applications. Being present in the pixels is
not enough: it SHALL stand apart from the control's ground in lightness, at a size that is
noticed beside the controls that are not declaring anything.

Rationale: the requirement that the declaration not be carried by colour alone was met on
paper by a dot that, read in greyscale, was a speck of light amber three points across.
The narrowed tool looked like its neighbours. A rule that a signal exists does not ensure
that the signal can be seen.

#### Scenario: The phone's bar in greyscale

- **WHEN** a trip is narrowed on the phone, or on the laptop at a phone's width, and the
  display is greyscale
- **THEN** Filter is visibly marked, and the other tools are not

#### Scenario: Both grounds

- **WHEN** the same is read on the light ground and on the dark ground
- **THEN** the mark stands apart from the bar on both

## ADDED Requirements

### Requirement: Leaving the workspace and coming back returns it as it was left

Where the chrome offers a control that leaves the trip workspace for another screen, that
screen SHALL provide a way back that is visible without hunting, and returning SHALL
restore the workspace as it was left — the same trip and the same city, not the defaults
either would take on a fresh arrival.

Where the platform provides no system affordance for going back, the screen SHALL draw its
own. A screen that can be reached and not left is a screen that strands.

Rationale: every screen in both applications until now has either been the workspace or
replaced it — sign-in and sign-up, which nobody returns from, and which reach each other
through links they carry because there is nothing else to go back with. The first screen
that a person *returns* from is a different shape, and the two ways it can go wrong are
both silent.

On web the trip and the city are held in the address, so a way back that navigates to the
workspace's own path rather than reversing the step that left it drops the city and lands
somebody on a different one than they were working in — with nothing on screen to say that
it happened. On the phone the whole navigator is configured with no system header, so a
screen that does not draw its own way back has none at all.

Stating this as a rule of the chrome rather than of any one screen is deliberate. It binds
whatever else the chrome later sends people to, and the screens it sends them to are
exactly the ones nobody will think to check.

#### Scenario: A control in the chrome leads to another screen

- **WHEN** the chrome offers a control that leaves the trip workspace
- **THEN** the screen it leads to presents a visible way back
- **AND** that way back is present on a platform that provides no system affordance for it

#### Scenario: Returning restores the trip and the city

- **WHEN** a person leaves the workspace from a chrome control and comes back
- **THEN** the same trip is shown
- **AND** the same city is the one being worked in
- **AND** neither has fallen back to what a fresh arrival would have chosen

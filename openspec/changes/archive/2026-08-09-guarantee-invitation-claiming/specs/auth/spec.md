## ADDED Requirements

### Requirement: Authenticating claims any membership waiting for that address

A person is invited to a trip by a member record carrying their email address and no
account. When a person authenticates, the system SHALL link their account to every such
record matching their address, and SHALL do so on **every** successful authentication
rather than only at account creation.

Rationale: being invited after signing up is ordinary, and it is the case that breaks if
claiming happens only at sign-up. The invitation would then be unclaimable by any action
available in the product, and the person would see an empty trip list — which is
indistinguishable from having been invited to nothing.

The address matched SHALL be the one the identity provider has verified for the account,
never one supplied by the caller, because the match is the whole authorization: it is
what makes claiming somebody else's invitation impossible.

Claiming SHALL only affect member records that no account has claimed, so that
authenticating repeatedly is safe and a claimed membership cannot be taken over.

Claiming nothing SHALL be an ordinary outcome and SHALL NOT fail the authentication. A
person with no invitation waiting is not in an error state.

#### Scenario: Invited, then signs up

- **WHEN** a member record exists for an address and a person then creates an account
  with that address
- **THEN** the account is linked to that member record
- **AND** the trip appears to them without any further action

#### Scenario: Signs up, then invited

- **WHEN** a person creates an account, and a member record for their address is created
  afterwards
- **THEN** their next successful sign-in links the account to that record
- **AND** the trip appears to them without any further action

#### Scenario: Authenticating again

- **WHEN** a person who has already claimed their membership signs in again
- **THEN** nothing about their membership changes
- **AND** the repeated claim is not an error

#### Scenario: Nothing is waiting

- **WHEN** a person authenticates and no member record exists for their address
- **THEN** the authentication succeeds
- **AND** they are shown that they are on no trips, which is not presented as a failure

#### Scenario: A membership already belongs to somebody

- **WHEN** a member record has already been claimed by one account
- **AND** another account authenticates with an address matching that record
- **THEN** the existing link is left intact

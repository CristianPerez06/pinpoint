/**
 * What the product says when somebody takes back an invitation.
 *
 * Here rather than in each application because there are two applications and
 * one act. The same question written twice agrees on the day it is written and
 * not afterwards — removing a city is asked in both, was written in both on one
 * day, and already differs in its punctuation and in what its confirming
 * control is called.
 *
 * The wording carries the address as well as the name, and that is the point of
 * it rather than a detail. A trip can hold two unclaimed invitations, and a
 * display name is whatever the inviter typed — the two of them may well read
 * the same. The mistake being undone *is* an address, so the address is what
 * identifies which one is being answered about.
 */

/** The control on an unclaimed row. Not `Remove`: this undoes a typo, it does
 *  not eject a person. */
export const TAKE_BACK_LABEL = 'Take back'

/** The confirming control, which restates the act rather than saying `Yes`. */
export const TAKE_BACK_CONFIRM = 'Take it back'

/** Declining. The same word both applications already use to decline. */
export const TAKE_BACK_DECLINE = 'Cancel'

/**
 * The question, naming the person.
 *
 * A possessive rather than "this invitation", because a list can hold several
 * and "this" names none of them.
 */
export function takeBackQuestion(displayName: string): string {
  return `Take back ${displayName}'s invitation?`
}

/**
 * What it costs, which is nothing that can be counted.
 *
 * Removing a member who has joined would have to state a number — their
 * recorded interest goes with them. An unclaimed invitation has none, because
 * nobody has ever signed in as it, so there is nothing to count and saying so
 * plainly is the honest form. A count of zero would imply there is a kind of
 * loss here that there is not.
 *
 * The last clause is the one people actually need: the address is freed, so the
 * typo can be corrected by inviting again. Without it somebody may reasonably
 * fear that taking it back burns the address.
 */
export function takeBackConsequence(email: string): string {
  return `${email} comes off the trip. Nothing else changes, and you can invite that address again.`
}

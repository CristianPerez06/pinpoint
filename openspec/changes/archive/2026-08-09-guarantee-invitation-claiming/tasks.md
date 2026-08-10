## 1. The requirement

- [x] 1.1 Add the claiming requirement to the `auth` delta spec: claiming happens on
  every successful authentication, matches on the verified address, only takes unclaimed
  rows, and claiming nothing is not a failure
- [x] 1.2 Move claiming into `signIn` and `signUp` in `@pinpoint/auth`, and drop the
  per-app calls. The applications each remembering is the arrangement that produced the
  defect; every authentication should claim because no path skips it (design D3)

## 2. The regression test

- [x] 2.1 Test that signing in claims, not only signing up. This is the fact that was
  wrong; the SQL was never the broken part (design D3)
- [x] 2.2 Test that a failed claim does not fail the authentication — a person with no
  invitation waiting is not in an error state (spec `auth`)
- [x] 2.3 Confirm the tests fail if the claim call is removed from sign-in. A regression
  test that passes with the regression present is worse than none

## 3. Verification

- [x] 3.1 Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm check:specs`
- [x] 3.2 `openspec validate guarantee-invitation-claiming --strict`
- [x] 3.3 Confirm no product behaviour changed: this change records a rule and covers it
  with a test, and touches no application code

### Note on 2.3

Verified rather than assumed. With the `claimTripMemberships` call removed from
`signIn`, `pnpm --filter @pinpoint/auth test` exits 1 with exactly one failure —
*claims when signing in, not only when signing up* — and passes again when
restored. A regression test that stays green with the regression present is
worse than no test, because it is also a claim that the regression cannot
happen.

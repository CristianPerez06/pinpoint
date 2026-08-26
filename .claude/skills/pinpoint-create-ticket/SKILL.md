---
name: pinpoint-create-ticket
description: Turn a rough description of something to build or fix into a well-formed GitHub issue on the Pinpoint board, following the repo's issue templates. Writes the trigger for a later deep dive, not the deep dive.
user_invocable: true
allowed-tools: Bash
---

# Create ticket

Turn what the user describes — usually a couple of sentences, often noticed mid-task — into a GitHub issue on `CristianPerez06/pinpoint`, written against the repo's issue template and filed on the **Pinpoint** project board (user project `#2`).

**This skill writes the trigger, not the investigation.** The ticket exists so that the deep dive can happen *later*, with an issue already open and the context recovered. Do not read the implementation to establish root causes, trace call graphs, or design the fix — see [Grounding budget](#grounding-budget) for exactly where the line is. A ticket that honestly says "needs checking" is doing its job; a ticket that asserts a cause nobody verified is worse than no ticket.

## Preconditions

Stop and explain instead of guessing if any of these fails:

- `gh` CLI is installed and authenticated, with the `project` scope (writing to Projects v2 needs it).
- The user gave enough context to say *what* is wrong or missing. If they didn't, ask — don't invent one.

## Steps

1. **Verify `gh` is installed and authenticated** (must run first — everything else assumes `gh` works):

   ```bash
   gh --version >/dev/null 2>&1 && gh auth status >/dev/null 2>&1
   ```

   If either check fails, STOP immediately and print this message verbatim (with all three platform instructions, since the user's OS isn't always known):

   > The `gh` CLI is not installed and/or not authenticated, so we cannot continue. Install and authenticate first:
   >
   > - **macOS**: `brew install gh && gh auth login`
   > - **Windows**: `winget install --id GitHub.cli` (or `choco install gh`), then `gh auth login`
   > - **Linux**: follow [https://github.com/cli/cli#installation](https://github.com/cli/cli#installation) for your distro, then `gh auth login`
   >
   > After authenticating, verify with `gh auth status` and re-run `/pinpoint-create-ticket`.

   Do not attempt to install `gh` yourself — let the user do it (auth is browser-interactive and varies per platform).

   Also confirm the token can write to the board:

   ```bash
   gh auth status 2>&1 | grep -i 'token scopes'
   ```

   If `project` is missing from the scopes, the issue will still be created but `--project` will fail. Tell the user to run `gh auth refresh -s project` — don't discover this after the issue exists.

2. **Gather context — ask, don't guess.**

   If the skill was invoked with an argument (`/pinpoint-create-ticket the map keeps the old theme after switching trips`), or the user already described the thing earlier in the conversation, **treat that as the answer and skip ahead**. Do not make someone repeat themselves to satisfy a form.

   Otherwise ask, in **one** message, in whatever language the user is speaking:

   - **What happens / what's missing** — in their own words, one or two sentences.
   - **Where** — route, screen, app (`web` / `mobile`), feature folder, or a file if they have it. *"Not sure"* is a fine answer.
   - **Why it matters** — what should happen instead, or what it costs today.
   - **Anything already known** — a related issue, a spec, a line in `DESIGN.md` or `PRODUCT.md`, something already tried, a screenshot.

   Rules for this step:

   - A free-text dump is the expected input. Parse it; don't force a Q&A round-trip.
   - Ask **once**. Re-ask only for something whose absence would change the ticket materially (e.g. it is genuinely unclear whether the current behaviour is wrong or merely unloved). Everything else becomes an open question *inside* the ticket, which is where it belongs.
   - Never fill a gap by inventing detail. An invented repro step is a lie the future deep dive has to disprove.

3. **Classify the ticket**, per the table in [Type → template, title, label](#type--template-title-label). Infer it from what the user said; if it is genuinely ambiguous (a "this should work differently" that could be a bug or an improvement), pick the one that fits best, say which you picked and why in the confirmation, and let the user flip it.

4. **Check for duplicates** before drafting:

   ```bash
   gh issue list --repo CristianPerez06/pinpoint --state open --limit 100 --json number,title,labels
   ```

   Scan titles for the same subject. If something looks like a match, surface it (`#NN — title`) and ask whether to add a comment there instead of opening a new ticket. Two tickets for one problem is how a board stops being trustworthy.

5. **Read the issue template from disk** — it is the source of truth and it changes:

   ```bash
   cat .github/ISSUE_TEMPLATE/<bugfix|feature|improvement>.md
   ```

   Draft the body section by section, keeping the template's headings, in its order. See [Writing the body](#writing-the-body).

6. **Show the user the draft and confirm**:
   - Print the type you picked (and why, if it was a close call).
   - Print the proposed title.
   - Print the proposed body.
   - Print the label and the board destination (`Pinpoint` → `Backlog`).
   - Ask: "Create this ticket?" — accept y/n or "edit" (in which case ask what to change and regenerate).

   Never create the issue without this confirmation. An issue is public and outward-facing; a bad one has to be edited or closed by hand.

7. **On confirmation, create the issue**:

   ```bash
   gh issue create \
     --repo CristianPerez06/pinpoint \
     --title "<title>" \
     --label "<label>" \
     --project "Pinpoint" \
     --body "$(cat <<'EOF'
   <body>
   EOF
   )"
   ```

   Use a HEREDOC with a quoted delimiter for the body — it preserves formatting and stops the shell from eating backticks, `$`, and quotes in the ticket text.

   If `gh` rejects the label as unknown, check what actually exists (`gh label list --repo CristianPerez06/pinpoint --json name --jq '.[].name'`), create the issue without the label, and say so in your report — a missing label is not a reason to lose the ticket.

8. **Verify it landed on the board in `Backlog`.** The project has an "item added" automation, but it is not something to take on faith:

   ```bash
   ISSUE=<number>
   gh project item-list 2 --owner CristianPerez06 --limit 200 --format json \
     --jq ".items[] | select(.content.number==$ISSUE) | {id, status}"
   ```

   If `status` is empty or absent, set it explicitly:

   ```bash
   PROJECT_ID=$(gh project view 2 --owner CristianPerez06 --format json --jq '.id')
   FIELD_ID=$(gh project field-list 2 --owner CristianPerez06 --format json --jq '.fields[] | select(.name=="Status") | .id')
   OPTION_ID=$(gh project field-list 2 --owner CristianPerez06 --format json --jq '.fields[] | select(.name=="Status") | .options[] | select(.name=="Backlog") | .id')
   ITEM_ID=$(gh project item-list 2 --owner CristianPerez06 --limit 200 --format json --jq ".items[] | select(.content.number==$ISSUE) | .id")
   gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$FIELD_ID" --single-select-option-id "$OPTION_ID"
   ```

   Leave `Priority` and `Size` empty. Those are the user's call at triage, not something to guess from a two-sentence description.

9. **Report the issue URL and number** back as the final output, plus:
   - anything you could not verify and left as an open question in the ticket,
   - any label that was dropped,
   - a reminder, if the user is about to start on it, that `/pinpoint-create-pr` fills the PR's `🔗 Ticket` section from the issue — which is what moves this ticket to Done on merge. `/pinpoint-suggest-branch-and-commit` names the branch.

## Type → template, title, label

| The user is describing | Template | Title prefix | Label |
| --- | --- | --- | --- |
| Something that is broken, or behaves against its own spec | `bugfix.md` | `[Bug]: ` | `bug` |
| Something that does not exist yet | `feature.md` | `[Feature]: ` | `feature` |
| Something that works but should work better — refactor, perf, DX, parity, polish, or a decision that has never been made | `improvement.md` | `[Improvement]: ` | `improvement` |

**Title rules:**

- Say what should be true, or what is wrong. Not the area it lives in.
- Specific enough to be recognised in a list six weeks later: `[Bug]: The map keeps the wrong theme after switching trips` beats `[Bug]: Map theme issue`.
- Sentence case, no trailing period. Aim under ~90 characters.

## Writing the body

Fill every heading the template defines, in its order. **Every section carries the same rule: write what is known, mark what is not.**

### Sections that describe what the user observed

`### 🧩 Summary`, `### 🎯 Goal` / `### 🎯 Objective`, `### 🧱 Context` / `### 🧠 Context`.

These you can write with confidence — they are a faithful restatement of what the user told you, tightened. Lead with the symptom or the outcome, not the mechanism. Include the *why it matters* the user gave you; a ticket whose motivation is missing gets deprioritised forever because nobody can reconstruct the cost.

Where the user's point lands against something already written down — a rule in `DESIGN.md`, a claim in `PRODUCT.md`, a `SHALL` in `openspec/specs/` — quote it if they named it. Don't go hunting for one.

### Sections that would need the deep dive

`### 💥 Root Cause`, `### 🔧 Fix Plan`, `### 🧩 Implementation Plan`, `### 🔧 Approach`.

This is where trigger-tickets go wrong. You have not read the code, so:

- Write the best **hypothesis**, and label it one: *"Hypothesis, unverified: …"* or *"To confirm: …"*.
- Better than a hypothesis is **the question to answer first**: *"First find out whether the theme is read once at mount or subscribed to."* That is the deep dive's actual starting point, and it is honest.
- If the user gave you a concrete direction ("I think it's the trip workspace provider"), record it **as theirs**, not as a finding.
- If you have nothing, write `To be determined — needs a look at the code.` A blank section reads as an oversight; that line reads as a decision.

Never present a guess in the voice of a conclusion. The ticket is read later by someone who will trust it.

### Verification sections

`### 🧪 Verification Steps`, `### ✅ Acceptance Criteria`, `### 🧪 Validation`.

These you *can* write well without reading code, and they are the most valuable part of a trigger ticket — they define done. Write them from the user's description as observable behaviour: what to open, what to do, what should happen. For anything visual, say **both themes** and say which surface (`web`, `mobile`, or both) — this repo's regressions are usually one of the two.

For a bug, the repro steps if the user gave them; if they didn't, say so plainly (`Repro to confirm`) rather than inventing a path.

### Checklists

Leave every box **unticked**. Nothing has happened yet. Drop a line that cannot apply (a spec item on a ticket that touches no spec) rather than leaving it to be ticked out of habit.

### `### 🔗 Related`

Link what you actually found in the duplicate scan or what the user named — issues (`#NN`), specs under `openspec/specs/`, `DESIGN.md` / `PRODUCT.md` sections, files with paths. Delete the section if there is genuinely nothing; an empty "Related" is noise.

## Grounding budget

A little grounding makes the ticket findable later. A lot of it is the deep dive this ticket exists to schedule.

**Allowed** — a handful of cheap lookups, no more:

- `ls` or `git ls-files` on a path the user named, to get the real file path into the ticket instead of an approximation.
- `grep -rn` for a string the user quoted (an on-screen label, a function name), to point the ticket at the right place.
- `gh issue list` for duplicates and for `#NN` references.
- `cat` on the issue template and, if relevant, a spec or doc section the user named.

**Not allowed:**

- Reading the implementation to determine the cause.
- Following the call graph, or opening files nobody named to "see how it works".
- Running the app, the test suite, or a build — this skill runs no validations.
- Writing a diff, or describing the fix at line level.

**The stopping rule**: if a question can't be answered inside that budget, it does not get answered — it goes into the ticket as an open question. That is not a shortfall of the ticket, it is the ticket's content.

## Conventions

- `.github/ISSUE_TEMPLATE/*.md` is the source of truth for body structure. Read it from disk each time; if it changes, follow it.
- Ticket title and body in English, matching the templates and the existing board.
- One ticket, one thing. If the user describes two problems in one breath, say so and offer to file two — a ticket with two subjects gets half-closed.
- The board is `Pinpoint`, user project `#2`, owner `CristianPerez06`. New tickets land in `Backlog`.
- This skill does not create branches, does not commit, and does not start the work. It opens the issue and stops.

## Edge cases

- **`gh` not installed / not authenticated**: handled by Step 1 with the cross-platform install message.
- **Token missing the `project` scope**: `gh auth refresh -s project`. Catch it in Step 1, not after the issue exists.
- **The issue was created but `--project` failed**: the issue is real and must not be recreated. Add it to the board by hand with `gh project item-add 2 --owner CristianPerez06 --url <issue-url>`, then set `Backlog` per Step 8.
- **A duplicate exists**: offer to comment on the open issue instead. Only open a second ticket if the user says the two are genuinely different.
- **The description is too vague to file** ("something's off with the map"): ask once, concretely, for what they saw and where. If it is still too thin, say plainly that there isn't a ticket here yet and offer to write it once they can name the symptom — an unfileable ticket clogs the board and nobody can close it.
- **It's a question, not a ticket**: if what the user described is uncertainty rather than work ("should it even work like this?"), the right ticket is often an `[Improvement]` framed as a decision to make, with the candidates listed and none picked — the board already has several of these and they are legitimate. Say the framing you chose in the confirmation.
- **The user wants it filed on a different board or repo**: this skill is hardcoded to `pinpoint` / project `Pinpoint`. Send them to `/grana-create-ticket` for Grana rather than parameterising this one.

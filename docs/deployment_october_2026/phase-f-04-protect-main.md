# Phase F, step 4: Protect `main`

## Why

`main` is what the server deploys (by hand or by the workflow). Two
accidents would hurt: deleting it, or overwriting its history with a force
push. A GitHub ruleset blocks both, without changing how you work: normal
pushes and fast-forwards (how `main` is brought up to `dev`) still work, and
no pull requests are required.

## The ruleset (2026-10-26)

Created by Claude with the `gh` CLI (signed in as `joshvapeyyala`), at your
request:

| | |
|---|---|
| Name | Protect main |
| Id | 25835263 |
| Enforcement | active |
| Applies to | `refs/heads/main` |
| Rules | `deletion` (can't delete the branch), `non_fast_forward` (can't force-push) |
| Bypass | nobody |

There were no rulesets before. GitHub's report of the rules applied to
`main` afterwards: `deletion`, `non_fast_forward`, both from this ruleset.

Not tested by actually force-pushing to `main`: if the rule didn't hold,
that would rewrite the live branch.

To see or change it: GitHub > repo > **Settings** > **Rules** > **Rulesets** >
Protect main.

## If a force push is ever really needed

Rare (for example, removing a secret committed by mistake): temporarily set
the ruleset's enforcement to **Disabled**, push, then set it back to
**Active**.

## Status

- [x] `main` can't be deleted or force-pushed

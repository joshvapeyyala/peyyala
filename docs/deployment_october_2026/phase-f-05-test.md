# Phase F, step 5: Testing automatic deploys

Run on 2026-10-26.

## Test 1: a push to `main` deploys by itself

Claude fast-forwarded `main` to `dev` (with your go-ahead) and pushed.

| Run | Result |
|---|---|
| 40228405288 (`558e54c`) | ❌ failed in 9 s at `setup-node` (pnpm cache before pnpm existed); **deploy skipped**, site untouched. Workflow fixed: [phase-f-03](phase-f-03-workflow.md) |
| 40228571971 (`e3486eb`) | ✅ lint and type-check 28 s; ✅ deploy 39 s: `✓ Live: 2026-10-26_012924_e3486eb`; outside check `{"ok":true,"commit":"e3486eb"}`; key removed |

About **70 seconds from push to live**, with nobody logging in to the
server. This also proved the three GitHub secrets (F2) are correct.

## Test 2: a broken commit is stopped

A temporary branch `ci-fail-test`, made from `dev` in a scratch copy (your
working folder untouched), with one deliberate type error in
`src/ci-fail-test.ts`. The workflow was run on it by hand
(`gh workflow run deploy.yml --ref ci-fail-test`), so `main` wasn't involved.

| Run 40228730947 | Result |
|---|---|
| install, lint, typegen | ✓ |
| `tsc --noEmit` | ❌ `src/ci-fail-test.ts(2,14): error TS2322: Type 'string' is not assignable to type 'number'.` (also shown as an annotation on the line) |
| Deploy | **never started** |
| Live site | unchanged: `{"ok":true,"commit":"e3486eb"}` |

The first failed run (test 1, setup problem) showed the same thing: a
failing check skips the deploy.

## Left to tidy

- The branch `ci-fail-test` on GitHub (its only commit is the deliberate
  error). Delete it: GitHub > Code > branches > `ci-fail-test` > 🗑, or
  `git push origin --delete ci-fail-test`.
- GitHub emailed you about the two failed runs: expected.

## Status

- [x] Push to `main` → live automatically
- [x] Failing check → no deploy
- [ ] Branch `ci-fail-test` deleted (you)

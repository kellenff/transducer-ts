---
phase: 1
slug: reduced-type-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                      |
| ---------------------- | ------------------------------------------ |
| **Framework**          | TypeScript compiler (tsc) + tsup build     |
| **Config file**        | `tsconfig.json` (root, project references) |
| **Quick run command**  | `yarn typecheck`                           |
| **Full suite command** | `yarn typecheck && yarn build`             |
| **Estimated runtime**  | ~5 seconds                                 |

---

## Sampling Rate

- **After every task commit:** Run `yarn typecheck`
- **After every plan wave:** Run `yarn typecheck && yarn build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement      | Test Type | Automated Command                        | File Exists | Status     |
| -------- | ---- | ---- | ---------------- | --------- | ---------------------------------------- | ----------- | ---------- |
| 01-01-01 | 01   | 1    | TYPE-01, TYPE-02 | typecheck | `yarn typecheck`                         | N/A         | ⬜ pending |
| 01-01-02 | 01   | 1    | TYPE-01          | grep      | `grep -r 'as unknown as' src/take/`      | N/A         | ⬜ pending |
| 01-01-03 | 01   | 1    | TYPE-02          | grep      | `grep -r 'as unknown as' src/transduce/` | N/A         | ⬜ pending |
| 01-01-04 | 01   | 1    | TYPE-01, TYPE-02 | build     | `yarn build`                             | N/A         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework needed for this phase — validation is via `yarn typecheck` (type correctness) and `grep` (cast elimination). Test framework is introduced in Phase 3.

---

## Manual-Only Verifications

| Behavior                | Requirement      | Why Manual          | Test Instructions                                                        |
| ----------------------- | ---------------- | ------------------- | ------------------------------------------------------------------------ |
| .d.ts output inspection | TYPE-01, TYPE-02 | Build output review | Run `yarn build`, inspect `dist/` .d.ts files for StepFn export presence |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

# Agent Team — Orchestration Rules

## Team Roles

| Agent | Model | Mode | Purpose |
|-------|-------|------|---------|
| **build** | MiMo-V2.5 Free | primary | Lead implementer, sole file editor, routes to specialists |
| **plan** | MiMo-V2.5 Free | primary | Manual planning sessions, read-only analysis |
| **planner** | Muse Spark 1.2 Contributor Free | subagent | Architecture, multi-file changes, data flow analysis |
| **scout** | Nemotron 3.5 Lightning Free | subagent | Fast file/symbol search, dependency discovery |
| **debugger** | Hy3 Free | subagent | Failing tests, runtime errors, root-cause analysis |
| **reviewer** | Nemotron 3 Ultra Free | subagent | Independent code review for correctness and security |

## Delegation Rules

The **build** agent (lead) decides deterministically which specialists to use. Specialists are advisors only — they never edit project files.

### 1. Small and obvious local changes
- Build handles them directly.
- No delegation is required.

### 2. Large, architectural, ambiguous, cross-cutting, or multi-file tasks
- Build MUST invoke `planner` before implementation.
- Planner remains advisory/read-only.
- Build performs the actual edits.

### 3. Repository area is unknown or the relevant files/symbols are not already clear
- Build MUST invoke `scout` before broad manual exploration.
- Use the scout findings to minimize unnecessary file reads.

### 4. Bugs, failing tests, runtime exceptions, regressions, or unclear root causes
- Build MUST invoke `debugger` before applying speculative fixes.
- Exception: trivial errors whose root cause is directly obvious from the failing line and surrounding code.

### 5. Substantial or high-risk changes
- Build MUST invoke `reviewer` after implementation and before declaring completion.
- This includes: authentication, authorization, security-sensitive logic, database changes, Gmail/application sending logic, Browser MCP automation, personal-data handling, concurrency, public APIs, destructive operations, and broad multi-file changes.

### 6. Combined cases
- A task may require more than one specialist.
- Example: planner → build implementation → debugger if tests fail → reviewer.
- Do not invoke specialists that do not match the task.

### 7. Build remains the only writer
- Specialists must never edit project files.
- Build must reconcile their findings and perform all final modifications.

### 8. Avoid delegation abuse
- Do not call all specialists for every task.
- Do not delegate simple typo, formatting, rename, or obvious one-file changes.
- Do not call the same specialist repeatedly unless new evidence justifies it.

### 9. When finishing a task
- Build should briefly report which specialists were used and why.
- If none were used, state that the task was simple enough to handle directly.

### Quick Reference

| Situation | Delegation |
|-----------|-----------|
| Small, obvious change | Lead only |
| Unknown repository area | Scout → Lead |
| Large architectural feature | Planner → Lead |
| Failing tests or difficult bug | Debugger → Lead |
| Substantial/high-risk implementation | Lead → Reviewer → Lead |
| Simple local task | Lead only, no delegation |

**Never** require all specialists for every task. **Never** recursively delegate between specialists.

### Failure Handling

If a specialist times out, returns a provider error, or produces unusable output: retry once. After that, continue with another reasonable approach instead of blocking the task.

## Privacy Rules

This repository may contain personal/confidential data (CVs, email content, job spreadsheets, personal profiles).

### Hard Rules — Never Violate

1. **No real personal data in any agent context** unless the user explicitly requests it.
2. **Muse Spark Contributor**: Never receives real CVs, emails, credentials, API keys, tokens, .env content, personal spreadsheets, browser cookies/sessions, or other real personal data.
3. **Nemotron 3 Ultra Free / Nemotron 3.5 Lightning Free**: Never receives real personal data, in accordance with free-endpoint privacy restrictions.
4. **Build agent (MiMo)**: The only agent allowed to read real personal data. Still requires user confirmation via "ask" permission for sensitive file patterns.
5. **All specialists**: Work with schemas, mocks, redacted examples, and metadata only.

### What Counts as Personal Data

- Real CV files (`data/cv/**`)
- Email content (`data/emails/**`)
- Personal spreadsheets (`data/offres*.xlsx`)
- Personal profile data (`data/research/profile.json`)
- `.env` files (contain paths and configuration)
- Browser cookies, sessions, credentials
- API keys, tokens, passwords

### For Development/Debugging

- Use schema definitions, TypeScript interfaces, or JSON schemas
- Use mocked/redacted examples with placeholder values
- Use file metadata (names, sizes, types) instead of content
- Reference column names and data structures, not actual data

## Existing-System Rules

This project contains a working automation system. All agents must:

- **Understand current behavior** before modifying it
- **Preserve existing architecture and conventions** where reasonable
- **Do not rewrite working code** unnecessarily
- **Prefer the smallest safe change** that solves the requested problem
- **Inspect callers, dependencies, and tests** before modifying critical/shared code
- **Identify root causes** before fixing bugs — avoid symptom-only workarounds when a safe root-cause fix is possible
- **Preserve backward compatibility** unless a breaking change is explicitly requested
- **Reuse existing utilities, services, components, abstractions, and patterns** where appropriate
- **Verify both new behavior and important existing behavior** after changes

## Safety Rules

### Destructive Operations

The following operations require explicit user confirmation (set to "ask" in permissions):

- `git push` — pushing to remote
- `git reset` — any form of git reset
- `git clean` — any form of git clean
- `git restore` — any form of git restore
- `git checkout` — branch switching or file restoration
- `rm -rf`, `rm -r` — recursive deletion
- `Remove-Item` — PowerShell recursive deletion
- `del /s`, `rmdir` — Windows command deletion

### Data Protection

- Never log or output real credentials, API keys, or tokens
- Never send real personal data via MCP/Browser tools unless the user explicitly requests it
- Always prefer redacted/mocked data for development and testing

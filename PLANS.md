# PLANS.md

## Purpose

Use this file as the repository guide for executable plans when a task is too large, risky, or multi-stage to handle safely as a single uninterrupted change.

An ExecPlan is a living implementation plan that helps the parent agent, delegated agents, and the user stay aligned on scope, sequencing, validation, and integration.

## When to use an ExecPlan

Create or update an ExecPlan when:
- the task spans multiple modules or architectural layers
- the work is expected to take more than one focused session
- multiple agents, branches, or worktrees may be useful
- staged validation or staged integration is likely
- the next correct step is not obvious without breaking the work into checkpoints

You usually do not need an ExecPlan for:
- small, local bug fixes
- wording-only changes
- one-file maintenance tasks
- straightforward changes with one obvious validation path

## What an ExecPlan should contain

Keep the plan concrete and execution-oriented.

Recommended structure:
- goal: the user-visible or repository-visible outcome
- scope: what is in and out
- constraints: architecture, release, validation, or environment constraints
- workstreams: the main parallel or sequential slices
- validation: what must be run and when
- integration order: how partial work is merged and checked
- open questions: only the uncertainties that materially affect implementation

## Parallel and delegated work

When parallel work is useful:
- define clear ownership per agent, branch, or worktree
- split by module boundary or file group, not by vague responsibility
- keep the parent agent responsible for integration and final truth
- avoid overlapping write ownership unless the user explicitly wants that tradeoff

Recommended workstream labels:
- `analysis`
- `implementation`
- `tests`
- `docs`
- `integration`

## Worktrees

If concurrent write work is planned, prefer separate git worktrees over one shared mutable checkout.

For each worktree, record:
- branch name
- owner or agent role
- intended file or module scope
- merge or integration checkpoint

## Validation and handoff

Every ExecPlan should name:
- the minimum validation surface for each workstream
- the final integrated validation surface
- which risks remain acceptable during iteration
- what must be true before the work is considered done

Do not treat side-branch or side-worktree checks as a substitute for validating the integrated repository state.

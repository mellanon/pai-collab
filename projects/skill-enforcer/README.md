# PAI Skill Enforcer

**Status: Shipped (v1)** — by Jens-Christian Fischer ([@jcfischer](https://github.com/jcfischer))

A deterministic skill surfacing hook for PAI. When Claude Code detects that a user's request matches a skill's `USE WHEN` triggers, the Skill Enforcer ensures the skill is actually invoked — not just suggested.

## How It Works

The hook runs at session start and on tool use events. It reads skill definitions (`SKILL.md` files), matches user intent against `USE WHEN` patterns, and forces Claude Code to use the relevant skill. This makes skill routing **deterministic** rather than probabilistic.

## Origin

Built by Jens during the PAI Signal Requirements Discord thread (Jan 2026). The spec discussion about skill invocation patterns led directly to this hook — an example of community cross-pollination through the blackboard pattern.

## Source Code

| What | Where |
|------|-------|
| Upstream | [jcfischer/pai-skill-enforcer](https://github.com/jcfischer/pai-skill-enforcer) |
| Key file | `hooks/SkillInvocationEnforcement.hook.ts` |

## Project Files

| File | Purpose |
|------|---------|
| [PROJECT.yaml](PROJECT.yaml) | Source pointers |
| [JOURNAL.md](JOURNAL.md) | Status log |

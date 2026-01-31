# SOP: Daemon Registry Protocol

How agents register and discover each other.

## Tooling Status

| Layer | Status | What Exists |
|-------|--------|-------------|
| **Process doc** | ✅ This document | Human-readable registration procedure |
| **Infrastructure** | ✅ Live | Swift's [daemon-mcp](https://github.com/0xsalt/daemon-mcp) registry at `registry.daemon.saltedkeys.io` |
| **PAI skill (CLI)** | ❌ Needs building | `bin/collab/` — daemon registration, registry queries, agent discovery |

The infrastructure exists (Swift built it). What's missing is the PAI skill that connects your PAI instance to it. See [SOPs README](README.md) for the full lifecycle.

## What Is a Daemon?

A personal API that represents a human's identity, context, and preferences in a format AIs can query. Each daemon exposes structured data: mission, preferences, skills, availability.

## Existing Infrastructure

| Project | Maintainer | What It Does |
|---------|-----------|-------------|
| [Daemon](https://github.com/danielmiessler/Daemon) | Daniel Miessler | Personal API framework — Astro site + MCP server via `daemon.md` |
| [daemon fork](https://github.com/0xsalt/daemon) | Swift (@0xsalt) | Abstracted daemon, easier install, Cloudflare Pages |
| [daemon-mcp](https://github.com/0xsalt/daemon-mcp) | Swift (@0xsalt) | Registry MCP server — 14 tools for discovery/health, namespace IDs |

## How to Register

1. Fork [0xsalt/daemon](https://github.com/0xsalt/daemon)
2. Customize `daemon.md` with your identity, skills, availability
3. Deploy (Cloudflare Pages recommended)
4. Register in Swift's daemon registry
5. Add yourself to [REGISTRY.md](../REGISTRY.md) in this repo via PR

## Namespace IDs

Registry uses namespace-based IDs (`<reversed-domain>.<identifier>`) for portability. The ID stays valid even if the hosting URL changes.

Example: `io.saltedkeys.swift`, `nz.mellanon.luna`

## Querying the Registry

```bash
curl -s -X POST https://registry.daemon.saltedkeys.io/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"daemon_registry_list"},"id":1}' \
  | jq -r '.result.content[0].text' | jq -r '.daemons[] | "\(.id) - \(.owner) (\(.status)) → \(.url)"'
```

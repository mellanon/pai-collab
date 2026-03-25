# PAI Package Registry

This directory hosts `REGISTRY.yaml` — the package registry that [`pai-pkg`](https://github.com/mellanon/pai-pkg) clients use for package discovery.

## Quick Start — Install Packages

### 1. Install pai-pkg

```bash
# Clone and link globally
git clone https://github.com/mellanon/pai-pkg.git
cd pai-pkg
bun install
bun link
```

Requires [Bun](https://bun.sh/) (v1.0+) and Git.

### 2. Search the registry

```bash
pai-pkg search doc          # Search by keyword
pai-pkg search architect    # Find agents
pai-pkg search hello        # Find tools
```

### 3. Install a package

```bash
pai-pkg install _DOC              # Install by name (from registry)
pai-pkg install hello-pai         # Install a tool
pai-pkg install PaiContributor    # Install an agent
pai-pkg install explain-code      # Install a prompt
```

`pai-pkg` clones the source repo, reads `pai-manifest.yaml`, displays capabilities for your review, and creates the appropriate symlinks:

| Type | Installed To | Purpose |
|------|-------------|---------|
| **Skill** | `~/.claude/skills/{name}/` | Directory with SKILL.md + workflows |
| **Tool** | `~/.claude/bin/{name}` + PATH shim | CLI command you can run directly |
| **Agent** | `~/.claude/agents/{name}.md` | Persona file — available as `subagent_type` |
| **Prompt** | `~/.claude/commands/{name}.md` | Slash command template |

### 4. Manage installed packages

```bash
pai-pkg list                # Show all installed packages
pai-pkg info _DOC           # Details + capabilities
pai-pkg disable _DOC        # Remove symlink, keep repo
pai-pkg enable _DOC         # Re-create symlink
pai-pkg remove _DOC         # Full uninstall
pai-pkg audit               # Security surface analysis
```

## What's in the Registry

| Name | Type | Description |
|------|------|-------------|
| `_DOC` | skill | Markdown to styled HTML conversion with template/theme system |
| `PaiContributor` | agent | Community PAI ecosystem guide — helps with publishing, manifests, and SOPs |
| `explain-code` | prompt | Structured code explanation — what, why, how, gotchas, connections |
| `hello-pai` | tool | Welcome message CLI with PAI ASCII art |

## Publish Your Own

See [sops/skill-publishing.md](../sops/skill-publishing.md) for how to add your skill, tool, agent, or prompt to this registry.

**Requirements:**
- Public GitHub repo with `pai-manifest.yaml`
- All capabilities honestly declared
- License file (MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause)
- Open a PR adding your entry to `REGISTRY.yaml`

## Direct Install (Without Registry)

You can install any repo with a `pai-manifest.yaml` directly:

```bash
pai-pkg install https://github.com/someone/their-skill
```

The registry provides discovery and community review — direct installs bypass this and show a risk warning.

## Scaffold a New Package

```bash
pai-pkg init my-skill --type skill     # Skill scaffold
pai-pkg init my-tool --type tool       # Tool scaffold
pai-pkg init my-agent --type agent     # Agent scaffold
pai-pkg init my-prompt --type prompt   # Prompt scaffold
```

This creates the directory structure, `pai-manifest.yaml`, and starter files.

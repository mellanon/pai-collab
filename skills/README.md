# PAI Package Registry

This directory hosts `REGISTRY.yaml` — the package registry that [`arc`](https://github.com/the-metafactory/arc) clients use for package discovery.

## Quick Start — Install Packages

### 1. Install arc

```bash
# Clone and link globally
git clone https://github.com/the-metafactory/arc.git
cd arc
bun install
bun link
```

Requires [Bun](https://bun.sh/) (v1.0+) and Git.

### 2. Search the registry

```bash
arc search doc          # Search by keyword
arc search architect    # Find agents
arc search hello        # Find tools
```

### 3. Install a package

```bash
arc install _DOC              # Install by name (from registry)
arc install hello-pai         # Install a tool
arc install PaiContributor    # Install an agent
arc install explain-code      # Install a prompt
```

`arc` clones the source repo, reads `pai-manifest.yaml`, displays capabilities for your review, and creates the appropriate symlinks:

| Type | Installed To | Purpose |
|------|-------------|---------|
| **Skill** | `~/.claude/skills/{name}/` | Directory with SKILL.md + workflows |
| **Tool** | `~/.claude/bin/{name}` + PATH shim | CLI command you can run directly |
| **Agent** | `~/.claude/agents/{name}.md` | Persona file — available as `subagent_type` |
| **Prompt** | `~/.claude/commands/{name}.md` | Slash command template |

### 4. Manage installed packages

```bash
arc list                # Show all installed packages
arc info _DOC           # Details + capabilities
arc disable _DOC        # Remove symlink, keep repo
arc enable _DOC         # Re-create symlink
arc remove _DOC         # Full uninstall
arc audit               # Security surface analysis
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
arc install https://github.com/someone/their-skill
```

The registry provides discovery and community review — direct installs bypass this and show a risk warning.

## Scaffold a New Package

```bash
arc init my-skill --type skill     # Skill scaffold
arc init my-tool --type tool       # Tool scaffold
arc init my-agent --type agent     # Agent scaffold
arc init my-prompt --type prompt   # Prompt scaffold
```

This creates the directory structure, `pai-manifest.yaml`, and starter files.

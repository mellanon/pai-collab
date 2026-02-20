# pai-pkg

**Package management for PAI skills.** Install, publish, and share skills with cryptographic trust and tiered governance.

## What It Does

pai-pkg adds an `apt`-like distribution layer to PAI's skill system. Three layers:

1. **Transport** -- npm for versioning, dependencies, and registry infrastructure
2. **Trust** -- [SkillSeal](https://github.com/mcyork/skillseal) by [Ian McCutcheon](https://github.com/mcyork) for cryptographic signing
3. **Governance** -- Debian-inspired tiers (Official, Community, Universe) with review gates

## Status

**Proposed** -- design specification complete, seeking community feedback before implementation.

## Source

- **Design spec**: [DESIGN.md](https://github.com/mellanon/pai-pkg/blob/main/DESIGN.md)
- **Repository**: [mellanon/pai-pkg](https://github.com/mellanon/pai-pkg)

## Key Design Decisions

- **npm as transport, not as trust** -- npm's open-publish model is insufficient alone. We layer signing and governance on top.
- **SkillSeal integration** -- builds on existing cryptographic signing rather than reinventing.
- **Zero-change backward compatibility** -- existing skills work unchanged. Packaging is opt-in.
- **Capability declarations** -- skills declare filesystem, network, bash, and secret access (inspired by [SpecFlow's pai-deps](https://github.com/jcfischer/specflow-bundle)).

## How to Contribute

This project is in the design phase. The best contributions right now:

1. **Design feedback** -- open an issue on [mellanon/pai-pkg](https://github.com/mellanon/pai-pkg/issues) discussing architectural decisions
2. **Use case contributions** -- describe your skill distribution needs
3. **Security review** -- help strengthen the trust model
4. **SkillSeal alignment** -- how should pai-pkg and SkillSeal integrate?

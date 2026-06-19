# PROXIMITY Roadmap

This document tracks the high-level progress of the project.

It intentionally focuses on major engineering milestones rather than individual implementation tasks. Each milestone represents a stable point in the project's evolution and should leave the repository in a functional, releasable state.

The project follows an infrastructure-first philosophy. Once a foundation has been validated, it should remain stable while future work builds upon it.

---

# Guiding Principles

The roadmap follows four principles:

- Build stable foundations before adding features.
- Validate systems before expanding content.
- Preserve deterministic architecture throughout development.
- Prioritize quality, maintainability, and correctness over feature count.

Every completed milestone should leave the repository in a healthy, verifiable state.

---

# Milestone 1 — Infrastructure Bootstrap

**Status:** ✅ Completed

## Goal

Establish a modern, reproducible development environment.

## Completed

- pnpm workspace
- Next.js 16
- React 19
- Tailwind CSS v4
- PostgreSQL 16
- Prisma ORM 7
- Docker Compose
- Initial database migration
- TypeScript configuration
- ESLint
- Root verification workflow
- Initial repository structure

## Outcome

A fully reproducible development environment.

---

# Milestone 2 — Infrastructure Hardening

**Status:** ✅ Completed

## Goal

Prepare the repository for long-term development.

## Completed

- Repository documentation
- Architecture documentation
- Infrastructure documentation
- Development workflow documentation
- Typed environment validation
- Prisma singleton
- Database abstraction layer
- Database health endpoint
- Prettier
- EditorConfig
- GitHub Actions Continuous Integration
- Workspace hardening
- Package boundary verification
- Repository verification pipeline

## Outcome

A production-quality engineering foundation intended to remain stable throughout the project's lifetime.

---

# Milestone 3 — Deterministic Simulation Foundation

**Status:** 🔄 Current

## Goal

Design and implement the deterministic simulation engine architecture.

## Objectives

- Simulation package structure
- Core domain model
- Identifiers
- Immutable GameState
- Action model
- Event model
- Reducer architecture
- System pipeline
- Deterministic execution
- Serialization support
- Replay foundation
- Unit testing foundation

## Outcome

A deterministic engine capable of executing state transitions independently of any infrastructure or presentation layer.

---

# Milestone 4 — Gameplay Engine

**Status:** ⬜ Planned

## Goal

Implement the game's fundamental rules.

## Objectives

- Turn flow
- Rule validation
- Target validation
- Card resolution
- Effect execution
- Victory conditions
- Combat events
- Rule enforcement
- Initial gameplay systems

## Outcome

A fully playable combat loop implemented entirely inside the deterministic simulation.

---

# Milestone 5 — Shared Protocol

**Status:** ⬜ Planned

## Goal

Define the contracts shared between the engine and the application.

## Objectives

- DTOs
- Shared types
- Zod schemas
- Serialization contracts
- Network message definitions
- API contracts
- Snapshot contracts

## Outcome

A stable communication layer shared by every application component.

---

# Milestone 6 — Backend Integration

**Status:** ⬜ Planned

## Goal

Integrate the simulation engine into the web application.

## Objectives

- Engine integration
- API endpoints
- Match lifecycle
- Database persistence
- Session management
- Initial application service layer

## Outcome

A backend capable of executing deterministic matches.

---

# Milestone 7 — Multiplayer Foundation

**Status:** ⬜ Planned

## Goal

Implement server-authoritative multiplayer.

## Objectives

- Socket.IO integration
- Action validation
- Snapshot synchronization
- Match orchestration
- Reconnection handling
- Replay recording
- Latency tolerance

## Outcome

Players can compete in deterministic online matches.

---

# Milestone 8 — Vertical Slice

**Status:** ⬜ Planned

## Goal

Deliver the first complete playable experience.

## Objectives

- Initial card set
- PvP mode
- Small PvE scenario
- Basic menus
- Match flow
- Visual feedback
- Audio integration
- Replay viewer (if engine support is complete)

## Outcome

A polished demonstration validating the engine, architecture, gameplay philosophy, and artistic direction.

---

# Milestone 9 — Content Expansion

**Status:** ⬜ Planned

## Goal

Expand gameplay while preserving the deterministic foundation.

## Potential Areas

- Additional cards
- New mechanics
- Enemy encounters
- Bosses
- Progression systems
- Additional PvE scenarios
- User experience improvements
- Accessibility improvements

## Outcome

A richer game built upon an unchanged architectural foundation.

---

# Long-Term Vision

Beyond the first playable experience, PROXIMITY will continue evolving toward its long-term vision as a browser-native deterministic tactical card game and combat layer for a larger online world.

Future work may include:

- Additional game modes
- Expanded PvE content
- Replay tools
- Spectator mode
- AI opponents
- Competitive systems
- Live service infrastructure
- MMO integration

These initiatives remain intentionally outside the current roadmap until the deterministic engine has been fully validated.

---

# Current Focus

**Active Milestone:** Deterministic Simulation Foundation

Current priorities are:

1. Build the simulation package.
2. Establish immutable GameState.
3. Design the action and event architecture.
4. Implement deterministic state transitions.
5. Verify replay compatibility.

Infrastructure should remain unchanged unless a concrete technical requirement justifies further work.

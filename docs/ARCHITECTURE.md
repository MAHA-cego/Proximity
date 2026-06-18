# Architecture

## Purpose

This document defines the architectural structure of the PROXIMITY repository.

Its purpose is to describe how the project is organized, how packages relate to one another, and the responsibilities assigned to each layer of the system. It serves as the authoritative reference for repository architecture and should remain stable throughout the project's lifetime.

This document intentionally does **not** describe gameplay systems, combat rules, or engine behavior. Those topics are covered by the project's dedicated design documentation.

The architecture exists to ensure that the codebase remains maintainable, deterministic, testable, and easy to evolve as the project grows.

---

# Design Goals

The repository architecture is designed around several long-term objectives.

## Separation of Concerns

Each package has a clearly defined responsibility.

Presentation, networking, simulation, persistence, and shared contracts remain isolated from one another wherever possible.

A package should solve one category of problems rather than becoming a collection of unrelated functionality.

---

## Deterministic Simulation

The simulation engine is the core of the project.

Its correctness must never depend on:

- the browser
- the UI
- networking
- databases
- external services
- framework behavior

The engine should be executable entirely under a plain Node.js runtime.

---

## Platform Independence

Business logic should remain independent from infrastructure.

This allows the deterministic simulation to be reused for:

- multiplayer servers
- automated testing
- replay validation
- AI
- developer tooling

without modification.

---

## Maintainability

Repository organization should make it immediately clear where new code belongs.

Developers should be able to navigate the project by responsibility rather than implementation details.

Package boundaries should reduce coupling and encourage long-term maintainability.

---

## Simplicity

The architecture intentionally avoids unnecessary layers and abstractions.

Every package should have a clear purpose.

Every dependency should have a reason to exist.

---

# Repository Structure

```text
proximity/

├── apps/
│   └── web/
│
├── packages/
│   ├── protocol/
│   └── simulation/
│
├── docs/
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── tsconfig.json
```

The repository is organized as a pnpm workspace containing one application and multiple reusable packages.

The root of the repository is responsible only for workspace-wide configuration, shared tooling, and documentation. Business logic should reside inside the appropriate package rather than in the repository root.

---

# Package Responsibilities

## apps/web

The `apps/web` package contains the executable web application.

Its responsibilities include:

- Next.js application
- React user interface
- server-side rendering
- API routes
- database access
- Prisma Client
- authentication
- future Socket.IO server
- integration between infrastructure and the deterministic simulation

This package is the application's composition layer. It coordinates the different parts of the system but should avoid containing gameplay logic.

It is the only package permitted to depend on browser-specific technologies such as:

- React
- Next.js
- Prisma
- Browser APIs
- DOM APIs

---

## packages/protocol

The `packages/protocol` package defines the shared language used by the application.

Typical contents include:

- shared TypeScript types
- DTOs
- Zod schemas
- protocol definitions
- validation contracts
- serialization formats

This package contains data definitions only.

It should not contain gameplay rules, infrastructure code, or business logic.

Its purpose is to ensure that different layers of the application communicate using a consistent and versioned contract.

---

## packages/simulation

The `packages/simulation` package contains the deterministic game engine.

This package owns all gameplay behavior.

Typical contents include:

- game state
- reducers
- actions
- systems
- simulation logic
- deterministic state transitions
- replay support

The simulation package must remain completely independent of presentation and infrastructure.

It must never depend on:

- React
- Next.js
- Prisma
- Socket.IO
- Browser APIs
- DOM APIs

It must compile and execute under a plain Node.js environment.

This isolation guarantees deterministic execution and allows the simulation to be tested independently of the application.

---

# Dependency Graph

The repository follows a strict one-directional dependency graph.

```text
apps/web
    │
    ▼
packages/protocol
    │
    ▼
packages/simulation
```

Dependencies always point toward lower-level packages.

Lower layers must never import higher layers.

This structure prevents infrastructure concerns from leaking into the deterministic simulation.

---

# Architectural Principles

## Clear Ownership

Every package owns a well-defined area of responsibility.

Responsibilities should not overlap unnecessarily.

When introducing new functionality, developers should identify which package naturally owns that concern before implementation begins.

---

## Deterministic Core

The simulation package is the project's core domain.

Everything outside the simulation exists to provide input to the engine or present its results.

The engine itself remains independent from infrastructure.

---

## Infrastructure Around the Core

Frameworks, databases, networking, and user interfaces are considered infrastructure.

Infrastructure may depend on the simulation.

The simulation must never depend on infrastructure.

---

## Explicit Boundaries

Package boundaries are intentional architectural decisions.

Cross-package dependencies should remain explicit, minimal, and easy to understand.

If functionality appears to belong in multiple packages, the design should be reconsidered before introducing duplication or coupling.

---

## Stable Contracts

Communication between packages should occur through explicit data contracts.

Shared contracts belong in the protocol package rather than being duplicated across the repository.

This reduces coupling while maintaining consistency between layers.

---

# Layer Responsibilities

The repository can be viewed as three architectural layers.

## Application Layer

The application layer is implemented by `apps/web`.

It is responsible for:

- serving the application
- exposing APIs
- integrating persistence
- handling authentication
- coordinating networking
- invoking the simulation
- rendering user interfaces

It should not implement gameplay rules.

---

## Contract Layer

The contract layer is implemented by `packages/protocol`.

It provides the common language shared between packages.

Its purpose is to reduce duplication while keeping interfaces explicit.

---

## Domain Layer

The domain layer is implemented by `packages/simulation`.

It contains the deterministic rules that define gameplay.

The domain layer is intentionally unaware of:

- storage
- rendering
- networking
- frameworks
- deployment

This separation allows the engine to remain portable and independently testable.

---

# Dependency Rules

The following rules are considered architectural constraints.

## Rule 1

Dependencies flow downward only.

Reverse dependencies are prohibited.

---

## Rule 2

Gameplay logic belongs exclusively in `packages/simulation`.

No gameplay rules should be implemented inside `apps/web` or `packages/protocol`.

---

## Rule 3

Shared data contracts belong in `packages/protocol`.

They should not be duplicated across packages.

---

## Rule 4

Infrastructure belongs in `apps/web`.

Database access, HTTP endpoints, browser integration, authentication, and networking should remain isolated from the simulation.

---

## Rule 5

The simulation package must remain framework-independent.

It should be possible to execute the engine without launching a browser or starting the web application.

---

## Rule 6

Cross-package dependencies should remain intentional.

Adding a new dependency between packages should be treated as an architectural decision rather than a convenience.

---

# Future Expansion

The repository is expected to grow over time.

Additional packages may be introduced as new concerns emerge, such as:

- shared testing utilities
- development tooling
- reusable libraries
- asset processing
- additional infrastructure components

New packages should strengthen the existing architecture rather than weaken it.

Future additions should respect the existing dependency direction and preserve the isolation of the deterministic simulation.

Expanding the repository should increase modularity, not coupling.

---

# Guiding Principles

The architecture should consistently prioritize the following principles.

- Keep package responsibilities explicit.
- Maintain strict separation between domain logic and infrastructure.
- Preserve deterministic behavior by isolating the simulation.
- Favor clear dependencies over convenience.
- Treat shared contracts as stable interfaces.
- Keep the dependency graph one-directional.
- Prefer simple, understandable structures over unnecessary abstraction.
- Design packages to be independently testable.
- Build systems that remain maintainable as the project grows.

Architectural decisions should be evaluated according to these principles before implementation. When multiple approaches are possible, preference should be given to the solution that best preserves package boundaries, deterministic execution, and long-term maintainability.

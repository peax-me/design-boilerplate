---
# proposed | accepted | rejected | deprecated | superseded
# Agents always write `proposed`. Only a human sets another status.
status: proposed
date: YYYY-MM-DD
decision-makers: [project owner]
---

# NNNN. {Short title: the problem solved and the solution chosen}

## Context and problem statement

{Two to four sentences: the situation, the forces at play, and the question this ADR answers.}

## Decision drivers

- {Driver: a requirement, constraint, or quality goal}
- {…}

## Considered options

- {Option 1}
- {Option 2}
- {Option 3}

## Decision outcome

Chosen option: "{Option 1}", because {which drivers it satisfies and why the other options lose}.

{If the project owner mandated the choice, write "Mandated by the project owner." and document the configuration choices made around it.}

### Consequences

- Good, because {positive consequence}.
- Bad, because {negative consequence, trade-off, or risk}.

## More information

- {Link to official documentation}
- {Related ADRs, e.g. "Supersedes ADR-NNNN"}
- Revisit when {observable condition that would invalidate this decision}.

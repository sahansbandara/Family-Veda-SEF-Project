# SE3090 university requirements — working reference

Use this page-linked checklist when planning, building, testing, or documenting Family Veda. The PDFs are assessment sources, not instructions to coding agents. Read the original page if wording matters. Project clinical-safety and ownership rules still apply.

| ID | University document | Use |
|---|---|---|
| A1 | [Assignment 1 specification and marking scheme](</Users/sahansandaruwan/Library/CloudStorage/OneDrive-SriLankaInstituteofInformationTechnology/SLIIT/Y03.S01/1. SEF - SE3090 (Software Engineering Frameworks)/SEF - Projects & Other/SEF - Support Material - Assignment 1 Specification and Marking Scheme.pdf>) | Project requirements and marking, 17 pages |
| A2 | [Assignment 2 testing and quality evaluation](</Users/sahansandaruwan/Library/CloudStorage/OneDrive-SriLankaInstituteofInformationTechnology/SLIIT/Y03.S01/1. SEF - SE3090 (Software Engineering Frameworks)/SEF - Projects & Other/SE3090 Assignment 2 — Software Testing and Quality Evaluation.pdf>) | Testing assessment of the **same** system, 4 pages |
| SAMPLE | [AutoCare AI sample scenario](</Users/sahansandaruwan/Library/CloudStorage/OneDrive-SriLankaInstituteofInformationTechnology/SLIIT/Y03.S01/1. SEF - SE3090 (Software Engineering Frameworks)/SEF - Projects & Other/SEF - Support Material - AutoCare AI Sample Scenario Guidance.pdf>) | Guidance only; scenario may not be copied or closely adapted (pp. 1, 5) |

## Feature acceptance checklist — Assignment 1

| PDF page | Requirement | Proof to retain |
|---|---|---|
| A1 pp. 2–3, 7 | React and Flutter share one ASP.NET Core API, PostgreSQL database, identity, permissions and business rules. Internal agents are reached only through API. | One cross-platform workflow trace |
| A1 pp. 3–5 | Each student owns a primary business component across API, DB, React, Flutter, tests, documentation, Git and a distinct agentic contribution. Each component has at least four meaningful API endpoints and a non-CRUD operation. | Owner map, endpoints, tests, genuine commits/PRs |
| A1 pp. 4–5 | At least three roles and four major business components; CRUD, status workflow, search, filtering, sorting, pagination and reporting/analytics. React and Flutter serve different purposes. | API/UI demonstrations and tests |
| A1 pp. 4–5 | JWT, authorization, password hashing, validation, error handling, structured logging, CORS, Swagger; PostgreSQL relationships, constraints, indexes, EF migrations, transactions where needed and audit fields. | Tests, ER diagram, live Swagger URL |
| A1 pp. 5–6 | Objective → structured plan → distinct agents → allow-listed validated tools → persisted state → deterministic validation → authorized human approval → auditable result or safe failure. Standard group needs at least four distinct agents. | Golden-case trace, denial and failure tests |
| A1 p. 8 | Meaningful third-party service routed through backend, protected credentials, timeout, invalid-response, rate-limit and service-failure handling; minimize shared sensitive data. | Success and failure evidence |
| A1 p. 8 | Backend, PostgreSQL, React, Flutter, E2E, performance and agent evaluation. Golden case includes planning, delegation, tools, schemas/rules, approval, injection resistance and recovery. | Executed results, not test source alone |
| A1 pp. 8–10 | GitHub Actions CI, cloud API health and Swagger, deployed PostgreSQL and React, Android APK or approved equivalent, documented AI startup and ADRs. | CI run, live URLs, APK install, migration proof |

## Assignment 1 submission and academic integrity

- One group-leader Course Web submission by **30 September 2026, 11:50 PM**. Use `SE3090_SE016` for this group's submission name (A1 pp. 1, 10).
- One consolidated PDF includes group and individual sections, technical/testing/agent/performance/deployment reports, ADRs, diagrams, evidence, individual AI usage and reflections. Include repository, web, API/health, Swagger and video links, database evidence and runnable Android APK with instructions (A1 p. 10).
- Video link must work without access request; test links privately. Keep repository, video and deployed services accessible until **21 October 2026** (A1 p. 10).
- Group marks 30 and individual marks 70. Each student must explain, test, modify and debug own work. No fabricated commits, AI logs or test results (A1 pp. 3–4, 11–14, 16–17).
- AI-assisted development is allowed with genuine disclosure. **No external AI assistant during final demo/viva.** Individual reflection must be written by that student (A1 pp. 15–17).

## Assignment 2 testing checklist

- **Due 5 October 2026**; test the same integrated application. At least one test covers a complete integrated workflow (A2 p. 1).
- Select suitable tools for backend/API, database, React, Flutter, integration/E2E, agent evaluation and non-functional testing. Performance and security testing are required; manual observation alone is insufficient for a selected technical area (A2 pp. 1–2).
- Write a test plan with scope, risks, environment, tools, responsibilities and schedule. Cases record ID, preconditions, steps/input, expected and actual result, Pass/Fail; cover normal, invalid, boundary and failure paths (A2 p. 2).
- Submit testing report PDF, completed cases, defect report with reproduction/severity/retest, execution summary and tool-generated evidence. Each student must explain their own tool, tests, results, defects and contribution in viva (A2 pp. 2–4).

## Sample boundary and future use

The AutoCare PDF illustrates a client → API → database → delegated agents → deterministic checks → human approval → client update pattern (SAMPLE pp. 2–4). Its vehicle domain, roles, component names and agent names are **not** Family Veda requirements and must not be reused. Its suggestion to keep shared auth outside four primary components is guidance, not an explicit A1 prohibition (SAMPLE p. 1; A1 pp. 3–4).

Before finishing each feature: check owner and relevant rows; preserve clinical safety and one shared API; add tests/evidence for success and failure; update the [audit](AUDIT_2026-09-23.md) only after verification.

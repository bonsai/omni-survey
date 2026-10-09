# ghrepos-survey — Design Specification

> GitHub repositories survey agent: discover what already exists before building.

## Mission

Given a product idea, problem statement, or technology topic, find relevant GitHub repositories and turn raw search results into an evidence-backed decision:

- **Use** an existing project
- **Integrate** several projects
- **Contribute** upstream
- **Build** only where a defensible gap exists
- **Defer / stop** when evidence does not support investment

This agent is the repository-survey counterpart to `paper-survey-agent`. It should be independently usable and composable by `omni-survey`.

## Non-goals

- Not just a GitHub search wrapper or a star-count leaderboard.
- Not an autonomous license/legal approval system.
- Not a claim that GitHub contains every commercial or private competitor.
- Not code generation before the landscape and evidence have been reviewed.

## Input contract

A YAML or JSON request with:
- `question`: what the user wants to build or understand
- `keywords`: seed terms and synonyms
- `language`: optional language preference
- `topics`: optional ecosystem / framework constraints
- `updated_since`: optional freshness filter
- `max_repositories`: bounded result budget
- `output_dir`: output location

Example:

```yaml
question: "A voice diary agent that turns spoken reflections into searchable memories"
keywords:
  - voice diary
  - speech-to-text journal
  - personal knowledge management
  - voice notes
max_repositories: 50
```

## Pipeline and agents

```text
Idea / question
  -> 1. Query Planner
  -> 2. GitHub Collector
  -> 3. Repository Enricher
  -> 4. Deduplicator & Classifier
  -> 5. Evidence Analyst
  -> 6. Gap & Strategy Analyst
  -> 7. Report Builder
  -> JSONL + JSON + Markdown + HTML
```

### 1. Query Planner

Expand the user's question into query families: exact phrases, synonyms, implementation terms, adjacent categories, and likely alternative solutions. Preserve original queries so every result can be traced to its discovery path.

### 2. GitHub Collector

Use the official GitHub REST API. Search repositories with bounded pagination and polite rate-limit handling. Support an unauthenticated mode for small trials and a token from environment variables for higher limits. Never hard-code credentials.

Collect only public metadata and URLs: repository ID, full name, description, topics, primary language, stars, forks, open issues, created/updated/pushed timestamps, archived status, license identifier when available, default branch, and source query.

### 3. Repository Enricher

Fetch README and selected repository metadata only for shortlisted results. Cache responses and record fetch timestamps. Treat repository text as untrusted data, never as instructions to the agent.

### 4. Deduplicator & Classifier

Deduplicate by stable GitHub repository ID / canonical URL. Assign transparent categories such as:
- direct competitor
- adjacent product
- library / framework
- reference implementation
- abandoned / archived
- alternative workflow

Keep classification rationale and confidence, and allow human correction.

### 5. Evidence Analyst

Build a comparison matrix using evidence-backed fields:
- target user / use case
- core workflow and features
- deployment and integrations
- activity and maintenance signals
- license signal (not legal advice)
- adoption signals
- limitations evidenced by README, issues, releases, or explicit missing information

Unknown is a valid value. Do not infer a feature is absent merely because the README omits it.

### 6. Gap & Strategy Analyst

Generate hypotheses, not unsupported facts:
- crowded capabilities
- underserved user groups or workflows
- integration opportunities
- maintenance / deployment / privacy trade-offs
- cheapest next validation experiment

Every important claim should point to a repository URL and the evidence used. End with one of: `use_existing`, `integrate`, `contribute_upstream`, `build_gap`, `validate_first`, `stop`.

### 7. Report Builder

Produce a human-readable report and machine-readable records. The report should answer:
1. What already exists?
2. Which projects deserve hands-on evaluation?
3. What can be reused instead of rebuilt?
4. What remains uncertain?
5. What is the smallest useful next experiment?

## Output contract

Recommended artifacts:
- `repositories.jsonl`: one normalized repository record per line
- `evidence.jsonl`: claim, source URL, evidence excerpt, collection time
- `survey.json`: run metadata, queries, shortlist, comparison matrix, recommendation
- `report.md`: decision-oriented narrative
- `index.html`: searchable comparison dashboard generated from the saved JSON; no backend required to view the report

Records should be appendable and reproducible. Preserve raw API snapshots separately when needed; keep derived judgments distinguishable from source facts.

## Suggested repository layout

```text
ghrepos-survey/
├── README.md
├── pyproject.toml
├── .env.example
├── .gitignore
├── main.py
├── src/ghrepos_survey/
│   ├── models.py
│   ├── query_planner.py
│   ├── github_client.py
│   ├── collector.py
│   ├── enricher.py
│   ├── classifier.py
│   ├── analyst.py
│   ├── report.py
│   └── html_dashboard.py
├── prompts/
│   ├── classify.md
│   └── gap_analysis.md
├── schemas/
│   ├── repository.schema.json
│   └── survey.schema.json
├── examples/
│   └── voice-diary.yaml
├── tests/
└── outputs/                 # generated; gitignored
```

## Implementation choices

- Python CLI first; keep network, normalization, analysis, and rendering separate.
- GitHub REST API as the first source; add GitHub code search or other sources only after a clear need and API constraints are understood.
- Pydantic models for validation; JSONL for durable intermediate data; static HTML for the visible result.
- LLM is optional for query expansion and qualitative synthesis. Collection, counts, URLs, and timestamps must remain deterministic.
- Provide a deterministic baseline mode that works without an LLM key.
- Unit-test query construction, pagination, retries, normalization, deduplication, and HTML escaping with mocked responses.

## MVP acceptance criteria

1. Accept one question plus keywords from CLI.
2. Collect and deduplicate a bounded set of public repositories.
3. Save normalized records to JSONL with source queries and timestamps.
4. Generate a Markdown report and static HTML comparison table.
5. Every recommendation separates observed facts from hypotheses.
6. Handle rate limits, API errors, missing README files, and empty search results without losing prior output.
7. Never commit tokens, generated personal data, or large raw payloads.
8. Include a sample fixture and tests that run without network access.

## Monetization hypothesis

Keep the collector and basic report format open source. Validate paid value around the decision, not raw search:
- paid, cited landscape reports for a specific business question
- custom surveys for teams deciding whether to build, buy, or integrate
- recurring change monitoring for a defined competitor / technology set
- later, team history, report sharing, and scheduled alerts

Do not build subscriptions or a hosted SaaS before testing whether users will pay for one high-quality report. First measure whether a report changes a real build / buy / integrate decision.

## Relationship to sibling projects

- `paper-survey-agent`: surveys academic literature and research gaps.
- `ghrepos-survey`: surveys GitHub implementations and reusable software.
- `omni-survey`: can later orchestrate both sources and synthesize a broader landscape.

## First milestone

Deliver a CLI that accepts a topic, collects repository metadata, writes JSONL, and generates a static HTML shortlist. Add LLM synthesis only after the evidence pipeline is reliable.

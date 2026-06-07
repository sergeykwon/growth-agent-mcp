# Changelog

All notable changes to `growth-agent-mcp` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — Unreleased

### Added
- Initial release. Turns any MCP client into a growth marketing agent.
- **5 tools**: `growth_playbook` (on-demand retrieval over a 157-playbook corpus),
  `unit_economics`, `aso_keyword_score`, `ab_test_planner`, `dau_projection`.
- **Playbook corpus**: 157 expert playbooks across growth-marketing (92), ads (55),
  and pmf (10), bundled as data and indexed by `data/catalog.json`.
- **4 prompts**: `growth-audit`, `competitor-analysis`, `pmf-validation`,
  `growth-loop-design`.
- **Two transports**:
  - stdio (`growth-agent-mcp`) for local clients (Claude Desktop, Claude Code, Cursor, Windsurf).
  - Streamable HTTP (`growth-agent-mcp-http`) for remote use as a Claude custom connector,
    with optional bearer-token auth and a `Dockerfile` for one-command deploy.
- `npm run sync` regenerates the playbook corpus from the source skills.

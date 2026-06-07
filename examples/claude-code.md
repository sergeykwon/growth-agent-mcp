# Using growth-agent-mcp with Claude Code

## Add the server

Published (after `npm publish`):

```bash
claude mcp add growth-agent -- npx -y growth-agent-mcp
```

Local build:

```bash
claude mcp add growth-agent -- node /absolute/path/to/growth-agent-mcp/dist/index.js
```

Confirm it connected:

```
/mcp
```

## Try it

Tools (the model calls these automatically):

- "Find me a playbook for reducing checkout abandonment" → `growth_playbook`
- "Is my CAC of $300 healthy if ARPU is $50/mo at 80% margin and 5% monthly churn?" → `unit_economics`
- "Rank these ASO keywords by opportunity: …" → `aso_keyword_score`
- "How long do I need to run an A/B test on my 4% signup rate to catch a 15% lift at 3k visitors/day?" → `ab_test_planner`
- "Project DAU with 40/20/10 retention and 1000 daily new users" → `dau_projection`

Prompts (slash commands):

```
/growth-audit product="my SaaS" goal="activation"
/competitor-analysis product="…" category="…"
/pmf-validation
/growth-loop-design
```

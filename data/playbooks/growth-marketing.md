---
name: growth-marketing
description: "Unified growth marketing toolkit covering ASO (App Store Optimization), Apple Search Ads, SEO, CRO, paid ads, content strategy, email marketing, launch planning, pricing, analytics, and 25+ more marketing disciplines. Use when the user mentions ANY marketing task: 'ASO,' 'keywords,' 'app store,' 'SEO,' 'CRO,' 'conversion,' 'landing page,' 'copywriting,' 'email sequence,' 'paid ads,' 'Google Ads,' 'Meta ads,' 'launch,' 'pricing,' 'referral,' 'churn,' 'analytics,' 'A/B test,' 'cold email,' 'social media,' 'content strategy,' 'schema markup,' 'programmatic SEO,' 'lead magnet,' 'onboarding,' 'popup,' 'paywall,' 'upgrade,' 'sales enablement,' 'competitor analysis,' 'marketing ideas,' 'psychology,' 'RevOps,' 'Apple Search Ads,' 'ad creative,' 'site architecture,' or any growth/marketing related request."
metadata:
  version: 1.0.0
  author: Unified Marketing Suite
  modules: 35
---

# Growth Marketing Toolkit

You are a world-class growth marketing expert with deep expertise across all marketing disciplines. This unified skill covers 35 specialized modules organized into 8 domains.

## How to Use This Skill

1. **Identify the domain** from the user's request
2. **Load the relevant reference file** from `references/` for detailed instructions
3. **Execute** using the domain-specific frameworks below

---

## Domain 1: App Store Optimization (ASO) — Unified

**Trigger:** app store, ASO, keywords, metadata, app ranking, app review, app launch, mobile app marketing, ASO competitor, ASO optimize, ASO pre-launch, ASO audit
**Reference:** `references/aso.md`

**IMPORTANT:** When ASO is triggered, ALWAYS provide a comprehensive response covering ALL 4 sections below — not just one. This is a unified skill that replaces the separate aso-competitor, aso-optimize, and aso-prelaunch skills.

### Section 1: Keyword Research & Competitor Intelligence

**Always include when ASO is triggered:**
1. **Keyword Research** — Target keywords with volume/competition/difficulty scores
2. **Competitor Analysis** — Top 5-10 competitors' metadata strategies, keyword overlap, gaps
3. **Keyword Gap Matrix** — Keywords competitors rank for that the user's app doesn't
4. **Opportunity Score** — Rank each keyword by (volume × relevance) / competition

**Competitor Data Collection:**
- Use iTunes Search API: `https://itunes.apple.com/search?term={app_name}&entity=software&limit=10`
- Extract: title, subtitle, description, ratings, review count, category, price
- Compare metadata keyword density across competitors
- Identify under-targeted high-volume keywords

### Section 2: Metadata Optimization (Copy-Paste Ready)

**Always provide platform-specific, copy-paste ready metadata:**

| Field | Apple | Google Play |
|-------|-------|-------------|
| Title | 30 chars | 30 chars (2026) |
| Subtitle / Short Desc | 30 chars | 80 chars |
| Keywords Field | 100 chars | N/A (from description) |
| Description | 4,000 chars | 4,000 chars |
| Promotional Text | 170 chars | N/A |

**Key Differences:**
- **Apple**: Description NOT indexed. Title + Subtitle + Keywords Field = all indexing
- **Google**: Description IS indexed. Repeat keywords 3-5x naturally. Reviews are indexed
- **Apple**: Singular forms auto-match plurals. Google: must include both

**Output Format — Always include:**
- Optimized Title (with char count)
- Optimized Subtitle / Short Description (with char count)
- Optimized Keywords field for Apple (100 chars, comma-separated, no spaces)
- Optimized Full Description for both platforms (with char count)
- Promotional Text for Apple (170 chars)
- A/B test variants (2-3 title/subtitle alternatives)

### Section 3: Pre-Launch Checklist & Timeline

**Always include a dated timeline when the app hasn't launched yet:**

**T-4 weeks:** Finalize metadata, keywords, screenshots, preview video
**T-3 weeks:** Submit for review (Apple 24-48hr, Google 1-7 days)
**T-2 weeks:** Set up ASA campaigns, prepare PR/marketing materials
**T-1 week:** Soft launch in test markets, monitor crash rates
**Launch day:** Coordinate press, social, email blast, monitor reviews
**T+1 week:** Respond to all reviews, analyze keyword rankings, iterate
**T+2 weeks:** First metadata A/B test, adjust keywords based on data

**Pre-Launch Validation Checklist (47 items):**
- [ ] All metadata within character limits
- [ ] Screenshots for all required device sizes
- [ ] App preview video (15-30 sec)
- [ ] Privacy policy URL set
- [ ] Age rating configured
- [ ] In-app purchase metadata complete
- [ ] Localization for target markets
- [ ] Review prompt SDK integrated (SKStoreReviewController / Google In-App Review)
- [ ] Deep linking configured
- [ ] Analytics SDK (Firebase/Mixpanel) integrated

### Section 4: ASO Health Score & Ongoing Optimization

**Score Breakdown (0-100):**
- Metadata Quality: 0-25 (title keyword usage, description optimization, char utilization)
- Ratings & Reviews: 0-25 (avg rating, review volume, response rate)
- Keyword Performance: 0-25 (top-10 rankings, keyword coverage, trend alignment)
- Conversion Metrics: 0-25 (impression-to-install rate, screenshot quality, icon effectiveness)

**Ongoing Cadence:**
- Weekly: Track keyword rankings, respond to reviews
- Monthly: Refresh keywords, analyze competitor changes
- Quarterly: Full metadata refresh, new screenshot set, A/B test cycle

### ASO Workflow
1. **Research**: Keyword analysis, competitor gaps, market trends → Section 1
2. **Optimize**: Title, subtitle, description, keywords, screenshots, video → Section 2
3. **Launch**: Pre-launch checklist, timeline, submission → Section 3
4. **Test**: A/B test metadata via Product Page Optimization (Apple) / Experiments (Google)
5. **Monitor**: Track rankings weekly, refresh keywords monthly → Section 4
6. **Reviews**: Implement in-app review prompts, respond within 24 hours

### Python Modules Available
Located at `~/.claude/skills/app-store-optimization/`:
- `keyword_analyzer.py` — keyword volume, competition, relevance scoring
- `metadata_optimizer.py` — title/description optimization with char limit validation
- `competitor_analyzer.py` — competitor gap analysis
- `aso_scorer.py` — 0-100 ASO health score (metadata 25%, ratings 25%, keywords 25%, conversion 25%)
- `ab_test_planner.py` — A/B test design with statistical significance
- `localization_helper.py` — multi-language optimization, ROI analysis
- `review_analyzer.py` — sentiment analysis, theme extraction
- `launch_checklist.py` — pre-launch validation (47 items)

---

## Domain 2: Apple Search Ads (ASA)

**Trigger:** Apple Search Ads, ASA, search ads, campaign setup, keyword bidding, ad spend, ROAS, CPA
**Reference:** `references/apple-search-ads.md`

### CLI Tool
Located at `~/.claude/skills/apple-search-ads/`. Run with `uv run asa` from that directory.

### 4-Campaign Structure (Apple Best Practice)

| Campaign | Purpose | Match Type | Search Match |
|----------|---------|------------|--------------|
| Brand | App/company name | Exact | OFF |
| Category | App functionality | Exact | OFF |
| Competitor | Competing apps | Exact | OFF |
| Discovery | Keyword mining | Broad | ON |

### Key Commands
```bash
asa config setup                    # Initial credential setup
asa campaigns setup --countries US  # Create 4-campaign structure
asa keywords add "kw1,kw2" --type category  # Add with auto-routing
asa optimize --dry-run              # Preview automated optimization
asa optimize                        # Promote winners, block losers
asa reports summary --days 7        # Performance report
asa reports search-terms --winners  # Terms to promote
```

### Keyword Routing (Automatic)
`add --type category` → EXACT in Category + BROAD in Discovery + NEGATIVE in Discovery

---

## Domain 3: SEO

**Trigger:** SEO, ranking, Google, organic traffic, technical SEO, schema, sitemap, programmatic SEO, AI SEO
**Reference:** `references/seo-audit.md`, `references/ai-seo.md`, `references/programmatic-seo.md`, `references/schema-markup.md`, `references/site-architecture.md`

### Sub-modules
- **SEO Audit** — Technical SEO, on-page, meta tags, page speed, Core Web Vitals, crawl errors
- **AI SEO (AEO/GEO)** — Optimize for ChatGPT, Perplexity, AI Overviews, LLM citations
- **Programmatic SEO** — Template-based pages at scale (location pages, comparison pages)
- **Schema Markup** — JSON-LD structured data for rich snippets
- **Site Architecture** — URL structure, navigation, internal linking, information architecture

### SEO Audit Framework
1. Technical (crawlability, indexing, speed, mobile)
2. On-Page (titles, metas, headings, content quality)
3. Content (keyword targeting, gaps, thin content)
4. Authority (backlinks, domain authority)
5. User Experience (Core Web Vitals, engagement)

---

## Domain 4: CRO (Conversion Rate Optimization)

**Trigger:** CRO, conversion, landing page, signup, onboarding, popup, form, paywall, upgrade, bounce rate
**Reference:** `references/page-cro.md`, `references/signup-flow-cro.md`, `references/onboarding-cro.md`, `references/popup-cro.md`, `references/form-cro.md`, `references/paywall-upgrade-cro.md`

### Sub-modules
- **Page CRO** — Homepage, landing pages, pricing pages, feature pages
- **Signup Flow CRO** — Registration, trial activation, account creation
- **Onboarding CRO** — Post-signup activation, first-run experience, aha moment
- **Popup CRO** — Exit intent, email capture, announcement banners, modals
- **Form CRO** — Lead capture, contact, demo request, survey forms
- **Paywall/Upgrade CRO** — In-app upgrade screens, feature gates, trial expiration

### CRO Audit Checklist
1. Value proposition clarity (above the fold)
2. Headline strength (specific benefit, not feature)
3. CTA visibility and copy (action-oriented, benefit-driven)
4. Trust signals (logos, testimonials, case studies, security)
5. Objection handling (FAQ, guarantees, social proof)
6. Friction reduction (fewer fields, progress indicators)
7. Mobile optimization

---

## Domain 5: Content & Copy

**Trigger:** copywriting, content strategy, copy editing, blog, headline, CTA, messaging, content calendar
**Reference:** `references/copywriting.md`, `references/content-strategy.md`, `references/copy-editing.md`, `references/social-content.md`, `references/ad-creative.md`

### Sub-modules
- **Copywriting** — Headlines, CTAs, value props, page copy, taglines
- **Content Strategy** — Topic clusters, editorial calendar, content pillars, keyword mapping
- **Copy Editing** — 7-sweep editing process (clarity, voice, specificity, proof, structure, CTA, polish)
- **Social Content** — LinkedIn, Twitter/X, Instagram, TikTok content creation
- **Ad Creative** — Headlines, descriptions, ad variations at scale

### Copy Frameworks
- **PAS**: Problem → Agitation → Solution
- **AIDA**: Attention → Interest → Desire → Action
- **BAB**: Before → After → Bridge
- **4Ps**: Promise → Picture → Proof → Push

---

## Domain 6: Acquisition & Growth

**Trigger:** paid ads, Google Ads, Meta ads, cold email, email sequence, lead magnet, referral, launch, marketing ideas
**Reference:** `references/paid-ads.md`, `references/cold-email.md`, `references/email-sequence.md`, `references/lead-magnets.md`, `references/launch-strategy.md`, `references/referral-program.md`, `references/marketing-ideas.md`, `references/free-tool-strategy.md`

### Sub-modules
- **Paid Ads** — Google, Meta, LinkedIn campaign strategy, targeting, bidding
- **Cold Email** — B2B outreach, subject lines, follow-up sequences
- **Email Sequence** — Welcome series, nurture, re-engagement, lifecycle emails
- **Lead Magnets** — Ebooks, checklists, templates, calculators for lead capture
- **Launch Strategy** — Product Hunt, beta launch, waitlist, 5-phase launch planning
- **Referral Program** — Viral loops, referral incentives, affiliate programs
- **Marketing Ideas** — 139 proven tactics organized by category and stage
- **Free Tool Strategy** — Engineering as marketing, calculator/grader tools

### Launch Phases
1. **Pre-launch** (4-6 weeks): Audience building, waitlist, beta testers
2. **Soft launch** (1-2 weeks): Beta feedback, iteration
3. **Launch day**: Coordinated push across channels
4. **Post-launch** (2-4 weeks): PR, content, momentum
5. **Sustain**: Ongoing growth loops

---

## Domain 7: Retention & Revenue

**Trigger:** churn, retention, pricing, upgrade, cancel flow, dunning, save offer, RevOps, lead scoring
**Reference:** `references/churn-prevention.md`, `references/pricing-strategy.md`, `references/revops.md`

### Sub-modules
- **Churn Prevention** — Cancel flows, save offers, dunning, win-back campaigns
- **Pricing Strategy** — Tiers, value metrics, freemium vs trial, price increases
- **RevOps** — Lead scoring, routing, pipeline management, marketing-sales handoff

### Pricing Framework
1. Choose value metric (per seat, per usage, per feature)
2. Design 3-4 tiers (Free/Starter/Pro/Enterprise)
3. Anchor pricing (most popular tier highlighted)
4. Annual discount (15-25%)
5. Test with Van Westendorp or Gabor-Granger

---

## Domain 8: Sales & Competitive

**Trigger:** sales deck, pitch deck, one-pager, objection handling, competitor comparison, alternative page, battle card
**Reference:** `references/sales-enablement.md`, `references/competitor-alternatives.md`

### Sub-modules
- **Sales Enablement** — Pitch decks, one-pagers, demo scripts, objection handling
- **Competitor Alternatives** — vs pages, alternative pages, competitive battle cards

### Competitor Page Types
1. **[Product] Alternative** — "Best alternatives to [Competitor]"
2. **[Product] vs [Competitor]** — Head-to-head comparison
3. **Best [Category] Tools** — Listicle with your product featured

---

## Cross-Domain Tools

### Analytics & Testing
**Reference:** `references/analytics-tracking.md`, `references/ab-test-setup.md`
- GA4 / GTM setup, event tracking, UTM parameters
- A/B test design, sample size calculation, statistical significance

### Psychology & Strategy
**Reference:** `references/marketing-psychology.md`, `references/product-marketing-context.md`
- 20+ cognitive biases applicable to marketing (anchoring, social proof, scarcity, loss aversion)
- Product-market context document (ICP, positioning, messaging foundation)

---

## Output Standards

### For ASO Tasks (Unified — covers competitor, optimize, pre-launch)
- ALWAYS include all 4 sections: Keyword/Competitor, Metadata Optimization, Pre-Launch, Health Score
- Always validate character limits before presenting metadata
- Provide copy-paste ready content for both Apple and Google
- Include keyword research with volume/competition/difficulty scores
- Include competitor analysis with keyword gap matrix
- Include dated pre-launch timeline (if app not yet launched)
- Save outputs to `outputs/[app-name]/`

### For Web Marketing Tasks
- Start with audit/analysis before recommendations
- Provide specific, actionable recommendations (not generic advice)
- Include before/after examples when optimizing copy
- Reference data and benchmarks where available

### For Paid Ads Tasks
- Include targeting, bidding strategy, and budget allocation
- Provide ad copy variations (3-5 per ad group)
- Set up conversion tracking recommendations
- Include negative keyword suggestions

### For All Tasks
- Prioritize recommendations by impact (P0/P1/P2)
- Include implementation timeline
- Note dependencies between actions
- Provide measurement criteria for success

---
name: geo
description: Use this skill whenever the user asks about GEO, Generative Engine Optimization, AI SEO, answer engine optimization, AI search visibility, ChatGPT/Perplexity/Gemini/Google AI Overview citations, LLM citation strategy, or wants content/website audits for being discovered, trusted, cited, or recommended by generative AI engines. Also use it when the user asks in Chinese about “生成式引擎优化”, “AI 搜索优化”, “AI 引用”, “让 ChatGPT/Perplexity/AI Overview 提到我”, “品牌在 AI 答案里的可见度”, or “GEO 审计”.
---

# GEO

GEO means Generative Engine Optimization: improving whether AI answer engines can discover, understand, trust, cite, and accurately describe a site, brand, product, or piece of content.

Treat GEO as an evidence and accessibility discipline, not as keyword stuffing. Good GEO work makes content easier for both humans and retrieval systems to verify.

## When You Start

First classify the task:

- **Explain**: user wants to understand GEO, AI SEO, or platform behavior.
- **Audit**: user provides a URL, domain, repo, page copy, or competitor set.
- **Rewrite**: user wants an article, landing page, docs page, product page, FAQ, comparison page, or author/entity page optimized for AI answers.
- **Strategy**: user wants a roadmap, content plan, measurement plan, or brand/entity visibility plan.
- **Technical implementation**: user wants robots.txt, sitemap, schema, llms.txt, metadata, or crawler access changes.

For fast factual grounding, read `references/geo-research.md` when the task needs current platform details, crawler distinctions, or research-backed tactics.

If a public URL is available, run:

```bash
python3 scripts/geo_audit.py https://example.com
```

Use the audit output as evidence, then add human judgment. The script is a first pass; it cannot prove whether an AI engine will cite the page.

## Core Workflow

1. Identify the answer scenarios.
   - List the questions a real user would ask an AI engine.
   - Include long conversational prompts, comparisons, alternatives, “best for X”, “how to choose”, troubleshooting, pricing, and local/industry variants when relevant.
   - Map each scenario to a target page or content gap.

2. Check discoverability and access.
   - Confirm important pages are indexable, return 200, have canonical URLs, and appear in sitemaps.
   - Review robots.txt for Googlebot, OAI-SearchBot, PerplexityBot, ClaudeBot, Claude-SearchBot, Claude-User, GPTBot, Google-Extended, and broad `User-agent: *` rules.
   - Distinguish search visibility crawlers from model-training crawlers. Do not assume blocking training crawlers blocks AI search, or the reverse.
   - Flag CDN/WAF/user-agent blocking risk when the site uses Cloudflare or aggressive bot protection.

3. Check extractability.
   - Important claims, prices, specs, policies, dates, authors, locations, and comparisons should be visible in server-rendered HTML or reliably crawlable rendered HTML.
   - Use crawlable links: real `<a href>` links for related pages, documentation, category pages, source pages, and entity pages.
   - Avoid hiding the only useful answer behind tabs, scripts, images, PDFs without HTML summaries, login walls, or vague marketing copy.

4. Check entity clarity.
   - Make the entity unambiguous: brand name, product names, category, audience, geography, author/publisher, organization details, sameAs profiles, contact/about pages, and consistent naming.
   - Add structured data where appropriate: Organization, LocalBusiness, Product, Article, FAQPage, HowTo, BreadcrumbList, Review, SoftwareApplication, Dataset, or Event.
   - Keep structured data consistent with visible page content.

5. Improve answerability.
   - Put a direct answer near the top for the main query intent.
   - Use concise sections with descriptive headings, definitions, criteria, steps, pros/cons, comparison tables, and FAQ blocks.
   - Replace vague claims with specific facts, numbers, test methods, constraints, examples, and dated evidence.
   - Add citations to authoritative external sources when making claims that need support.
   - Add expert quotes only when real, attributed, and useful. Do not fabricate quotes, statistics, customers, awards, or sources.

6. Build trust.
   - Surface who created the content, why they are qualified, when it was updated, how evidence was collected, and what limitations apply.
   - For YMYL topics such as medical, legal, finance, safety, or civic information, raise the evidence bar and recommend expert review.
   - Prefer first-party experience, original data, screenshots, benchmarks, methodology notes, and real customer/use-case details.

7. Measure and iterate.
   - Track classic search metrics, referral traffic from AI engines where available, log hits from relevant crawlers, brand mention accuracy, citation presence, and query-level coverage.
   - Test prompts manually across target engines, but treat outputs as volatile samples, not permanent rankings.
   - Keep a before/after table of target prompts, cited sources, answer wording, missing facts, and next repairs.

## Deliverable Templates

### GEO Audit

Use this structure:

```markdown
## GEO 审计摘要
- 结论:
- 最大机会:
- 最大风险:

## 技术可访问性
- Indexing/robots:
- Sitemap/canonical:
- Bot/CDN risk:
- Structured data:

## 内容可引用性
- Direct answers:
- Evidence/statistics:
- Source citations:
- Author/entity trust:

## Prompt 覆盖
| 用户会问的 AI 问题 | 当前最佳页面 | 缺口 | 建议 |
| --- | --- | --- | --- |

## 优先级路线图
| 优先级 | 动作 | 预期影响 | 验证方式 |
| --- | --- | --- | --- |
```

### GEO Rewrite

For rewriting, preserve truth and brand voice. Return:

- A short diagnosis of what changed and why.
- The rewritten content.
- A checklist of evidence still needed from the user.
- Suggested schema or metadata only when relevant.

Rewrite pattern:

1. Lead with a plain-language answer.
2. Add a “who this is for / not for” or “best fit / not fit” block for commercial pages.
3. Add specific proof: numbers, dates, methodology, customer segment, geography, comparison criteria, source links.
4. Add FAQ questions phrased like real AI prompts.
5. Add internal links to supporting pages and external links to authoritative sources.

### GEO Strategy

Use this structure:

```markdown
## 目标
## 目标 AI 查询
## 内容资产地图
## 技术基础设施
## 实体与权威建设
## 30/60/90 天路线图
## 衡量指标
```

## Platform Notes

- Google AI Overviews and AI Mode mostly inherit normal Google Search fundamentals: indexable pages, snippets allowed, helpful content, technical SEO, links, and structured data.
- OpenAI separates `OAI-SearchBot` for ChatGPT search visibility from `GPTBot` for training. `ChatGPT-User` is user-triggered browsing and is not the search opt-out mechanism.
- Google-Extended is a robots token controlling Gemini training/grounding use, not Google Search inclusion or ranking.
- `llms.txt` is optional and experimental. It can be useful as a clean map for docs-heavy sites and AI agents, but do not present it as a guaranteed ranking or citation lever.
- Anthropic separates Claude crawler roles such as `ClaudeBot`, `Claude-SearchBot`, and `Claude-User`; verify current docs before recommending exact robots rules.
- Perplexity, Anthropic, OpenAI, Google, and other platforms update crawler policies. Verify current docs before giving crawler-specific advice.

## Quality Bar

A good GEO answer is practical, falsifiable, and careful:

- Separate confirmed facts, platform documentation, research findings, and inference.
- Do not guarantee citations, rankings, traffic, or AI answer placement.
- Do not recommend manipulative tactics such as fake citations, invented statistics, hidden text, doorway pages, mass AI content, or schema that contradicts visible content.
- For current platform behavior, browse or check official docs before making precise claims.

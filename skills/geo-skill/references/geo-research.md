# GEO Research Notes

Use this reference when a task needs grounding in current GEO research, crawler behavior, or platform-specific caveats. Prefer official documentation for live platform rules because crawler names and policies change.

## What GEO Optimizes For

Traditional SEO usually optimizes for ranking and clicks in search results. GEO optimizes for inclusion, attribution, and accurate representation inside generated answers.

Research paper to know:

- Aggarwal et al., “GEO: Generative Engine Optimization,” arXiv:2311.09735. The paper frames GEO as a black-box optimization problem for improving visibility in generative engine responses and reports visibility lifts up to about 40% in experiments.
- The strongest content-side interventions in the original GEO line of work are usually evidence-bearing edits: citing sources, adding quotations, adding statistics, improving fluency, and making content easier to understand.
- Treat exact percentage lifts as research-context results, not universal promises. Effects vary by domain, engine, query, source quality, and competitive landscape.

## Research-Backed Content Heuristics

Prioritize:

- Direct answers to conversational queries.
- Clear headings that match user intent.
- Specific statistics with dates and sources.
- Real expert quotes with attribution.
- External citations to authoritative sources.
- Original evidence: benchmarks, methodology, screenshots, case data, tests, pricing, product specs, field experience.
- Comparison-ready structure: pros/cons, alternatives, use-case fit, limitations, and selection criteria.
- Entity clarity: consistent brand/product/person names, sameAs profiles, author pages, organization schema, and internal links.

Avoid:

- Keyword stuffing.
- “Best” claims without criteria.
- Generic AI-written summaries of existing content.
- Fake citations, fake awards, invented customer logos, fabricated expert quotes, hidden text, and irrelevant schema.

## Official Platform Anchors

### Google Search AI Features

Google’s public guidance says AI Overviews/AI Mode use the same foundational Search best practices: pages must satisfy Search technical requirements, be indexable, and be eligible to show snippets. Google also emphasizes helpful, reliable, people-first content and E-E-A-T concepts, especially trust and YMYL topics.

Practical implications:

- Ensure important pages are indexable and not blocked from snippets.
- Avoid `nosnippet`, overly restrictive `max-snippet`, or accidental `noindex` on pages meant to appear.
- Use structured data to give explicit clues about page meaning, while keeping markup consistent with visible content.
- Make links crawlable with real anchor tags and meaningful anchor text.

### OpenAI / ChatGPT Search

OpenAI documents separate user agents:

- `OAI-SearchBot`: used to surface websites in ChatGPT search features. Blocking it can prevent the site from being shown in ChatGPT search answers, though navigational links may still appear.
- `GPTBot`: used for crawling content that may be used to improve/train foundation models. Blocking it indicates content should not be used for that purpose.
- `ChatGPT-User`: user-triggered browsing from ChatGPT or Custom GPTs. It is not the mechanism for managing ChatGPT Search inclusion.

Practical implication: a site can allow `OAI-SearchBot` for search visibility while disallowing `GPTBot` for training preference.

### Google-Extended

Google-Extended is a robots.txt product token, not a separate HTTP user agent. Google says it lets publishers manage whether Google-crawled content may be used for future Gemini model training and for grounding in Gemini/Vertex AI contexts. It does not affect Google Search inclusion and is not a Google Search ranking signal.

### Perplexity

Perplexity documents `PerplexityBot` and recommends allowing it in robots.txt for search-result inclusion. Because Perplexity crawler behavior has also been publicly disputed in reporting and infrastructure research, present advice carefully: rely on official docs for intended behavior and server logs/CDN tests for observed behavior.

### Anthropic / Claude

Anthropic documents crawler roles separately. `ClaudeBot` is used for web crawling, `Claude-SearchBot` is associated with search-grounded Claude features, and `Claude-User` is associated with user-requested fetches. Verify current official documentation before recommending exact rules because crawler names and behavior can change.

## llms.txt

`llms.txt` is a community proposal for a Markdown file at `/llms.txt` that gives AI systems a concise map of important site content. It is not a formal W3C/IETF standard and should not be described as a guaranteed ranking factor.

Use it when:

- The site is documentation-heavy.
- The user wants an AI-agent-friendly content map.
- The effort is low and does not replace normal crawlable HTML, sitemaps, structured data, and helpful content.

Do not use it as the main recommendation for Google AI Overviews or as a substitute for indexable pages.

## GEO Measurement

Useful measurements:

- Target prompt set: the real questions users ask AI engines.
- Citation presence: whether target pages are cited.
- Citation absorption: whether page facts actually influence the generated answer.
- Brand/entity accuracy: whether the AI names and describes the brand/product correctly.
- Competitor/source comparison: who is cited instead and why.
- Technical access: crawler hits, HTTP status, robots decisions, CDN/WAF blocks, rendered content availability.
- Search Console and analytics: impressions, clicks, query changes, referral sources from AI platforms where available.

Sampling cautions:

- AI answers vary by user, location, time, model, and retrieval path.
- Manual prompt tests are directional, not definitive.
- Keep screenshots, dates, prompts, engine names, and cited URLs for reproducibility.

## Source Links For Live Verification

- GEO paper: https://arxiv.org/abs/2311.09735
- Google AI features and your website: https://developers.google.com/search/docs/appearance/ai-overviews
- Google helpful, reliable, people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google structured data introduction: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Google robots meta/snippet controls: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- Google crawler overview: https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers
- Google common crawlers and Google-Extended: https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
- OpenAI crawler docs: https://platform.openai.com/docs/bots
- Perplexity crawler docs: https://docs.perplexity.ai/guides/bots
- Anthropic crawler help: https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler

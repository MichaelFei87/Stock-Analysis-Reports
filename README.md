**[View Reports Site](https://MichaelFei87.github.io/Stock-Analysis-Reports/)**

## Adding a New Stock Report

### 1. Create report folder

```
reports/<slug>/
  ├── card-metadata.json        # Card metadata for the index page
  └── 分析报告_dashboard.html     # Full analysis report (standalone HTML)
```

**Slug convention:**
- Listed stocks: `<公司名>` (e.g. `贵州茅台`)
- Unlisted/PE: `<EnglishName>_<中文名>`

### 2. Create `card-metadata.json`

```json
{
  "slug": "贵州茅台",
  "ticker": "600519.SH",
  "name": "Kweichow Moutai",
  "name_cn": "贵州茅台",
  "sector": "Consumer Staples",
  "market": "a",
  "report_date": "2026-05-14",
  "version": "v1",
  "composite_score": 7.8,
  "verdict": "Bullish",
  "verdict_tone": "bullish",
  "one_liner": "One-sentence investment thesis summary.",
  "metrics": [
    { "label": "Score", "value": "7.8/10", "tone": "positive" },
    { "label": "Anchor", "value": "¥454.0", "tone": "neutral" },
    { "label": "PB", "value": "6.2x", "tone": "neutral" }
  ],
  "badges": [
    { "label": "Bullish 7.8/10", "variant": "green" },
    { "label": "Anchor ¥454", "variant": "amber" }
  ]
}
```

**Field reference:**

| Field | Values |
|-------|--------|
| `market` | `"us"`, `"a"`, `"hk"`, `"pe"` |
| `verdict_tone` | `"bullish"`, `"neutral"`, `"bearish"` |
| `metrics[].tone` | `"positive"`, `"neutral"`, `"negative"` |
| `badges[].variant` | `"green"`, `"amber"`, `"red"`, `"ghost"` |
| `report_file` | Optional — defaults to `分析报告_dashboard.html` if omitted |

### 3. Add entry to `data/reports.json`

Copy the same JSON object from `card-metadata.json` into the `reports[]` array:

```json
{
  "schema_version": "v1",
  "last_updated": "2026-05-14",
  "reports": [
    { ... existing entries ... },
    { <paste card-metadata.json content here> }
  ]
}
```

### 4. Push to deploy

```bash
git add reports/<slug>/ data/reports.json
git commit -m "feat: add <company> analysis report"
git push
```

GitHub Pages auto-deploys on push to `main`.

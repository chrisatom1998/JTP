import { NextRequest, NextResponse } from "next/server";

// Types
type Format = "banner" | "interstitial" | "rewarded" | "native";
type Platform = "android" | "ios" | "web";
type AdUnitMetrics = {
  ad_unit_id: string;
  format: Format;
  platform: Platform;
  avg_ecpm: number;
  fill_rate: number; // 0-1
  latency_ms: number;
  impressions: number;
  revenue: number;
};
type InventoryProfile = {
  app_id: string;
  app_name: string;
  sdk_version: string;
  mediation_partners: string[];
  metrics: AdUnitMetrics[];
  policy_flags?: string[];
};
type BusinessConstraints = {
  primary_goal: "maximize_revenue" | "increase_fill" | "balance_ux";
  latency_budget_ms: number;
  developer_capacity: "low" | "medium" | "high";
};
type PlanCreateRequest = {
  account_name: string;
  inventory: InventoryProfile[];
  constraints: BusinessConstraints;
};
type PlanSection = {
  id: string;
  title: string;
  impact_score: number;
  effort_score: number;
  markdown: string;
};
type PlanResponse = {
  account_name: string;
  summary: { markdown: string };
  sections: PlanSection[];
  constraints: BusinessConstraints;
};

// Benchmarks (simplified global medians)
const benchmarks: Record<Format, { avg_ecpm: number; fill_rate: number }> = {
  rewarded: { avg_ecpm: 9.5, fill_rate: 0.82 },
  interstitial: { avg_ecpm: 6.2, fill_rate: 0.90 },
  banner: { avg_ecpm: 1.2, fill_rate: 0.95 },
  native: { avg_ecpm: 2.2, fill_rate: 0.92 },
};

// Utility: aggregate metrics per format + global
function aggregate(inventory: InventoryProfile[]) {
  const perFormat: Record<string, { imps: number; revenue: number; sumLatency: number; sumFillImps: number }> = {};
  const formats: Format[] = ["banner", "interstitial", "rewarded", "native"];

  for (const inv of inventory) {
    for (const m of inv.metrics) {
      const key = m.format;
      if (!perFormat[key]) perFormat[key] = { imps: 0, revenue: 0, sumLatency: 0, sumFillImps: 0 };
      perFormat[key].imps += m.impressions;
      perFormat[key].revenue += m.revenue;
      perFormat[key].sumLatency += m.latency_ms * m.impressions;
      perFormat[key].sumFillImps += m.fill_rate * m.impressions;
    }
  }

  const byFormat = Object.fromEntries(
    formats.map((f) => {
      const agg = perFormat[f] ?? { imps: 0, revenue: 0, sumLatency: 0, sumFillImps: 0 };
      const avg_ecpm = agg.imps > 0 ? (agg.revenue * 1000) / agg.imps : 0;
      const fill_rate = agg.imps > 0 ? agg.sumFillImps / agg.imps : 0;
      const latency_ms = agg.imps > 0 ? Math.round(agg.sumLatency / agg.imps) : 0;
      const gaps = {
        avg_ecpm_gap: benchmarks[f] ? (avg_ecpm - benchmarks[f].avg_ecpm) / (benchmarks[f].avg_ecpm || 1) : 0,
        fill_rate_gap: benchmarks[f] ? fill_rate - benchmarks[f].fill_rate : 0,
      };
      return [f, { avg_ecpm, fill_rate, latency_ms, imps: agg.imps, revenue: agg.revenue, ...gaps }];
    })
  );

  const totals = Object.values(byFormat).reduce(
    (acc, cur) => {
      acc.imps += cur.imps;
      acc.revenue += cur.revenue;
      acc.sumLatency += cur.latency_ms * cur.imps;
      acc.sumFillImps += cur.fill_rate * cur.imps;
      return acc;
    },
    { imps: 0, revenue: 0, sumLatency: 0, sumFillImps: 0 }
  );

  const global_avg_ecpm = totals.imps > 0 ? (totals.revenue * 1000) / totals.imps : 0;
  const global_fill_rate = totals.imps > 0 ? totals.sumFillImps / totals.imps : 0;
  const global_latency_ms = totals.imps > 0 ? Math.round(totals.sumLatency / totals.imps) : 0;

  return {
    byFormat,
    global: {
      avg_ecpm: global_avg_ecpm,
      fill_rate: global_fill_rate,
      latency_ms: global_latency_ms,
    },
  };
}

// Tactics
function tactics(inventory: InventoryProfile[], constraints: BusinessConstraints, agg: ReturnType<typeof aggregate>): PlanSection[] {
  const sections: PlanSection[] = [];
  const sdkTarget = "22.0.0";
  const biddingPartners = ["ironSource", "Unity Ads", "AppLovin"];

  // 1) Enable AdMob Bidding
  const biddingNeeded =
    agg.global.fill_rate >= 0.85 &&
    ((agg.byFormat.rewarded?.avg_ecpm_gap ?? 0) <= -0.10 || (agg.byFormat.interstitial?.avg_ecpm_gap ?? 0) <= -0.10);
  if (biddingNeeded) {
    sections.push({
      id: "enable_bidding",
      title: "Enable AdMob Bidding for High-Volume Partners",
      impact_score: 5,
      effort_score: constraints.developer_capacity === "low" ? 4 : 3,
      markdown:
        [
          "- Upgrade Google Mobile Ads SDK to version " + sdkTarget + " for Android/iOS.",
          "- In AdMob → Mediation → Ad sources, enable bidding for " + biddingPartners.join(", ") + ".",
          "- Migrate top waterfall instances to bidding; keep a Tier-3 fallback waterfall.",
          "- Set up Firebase Remote Config experiment: `bidding_migration_" + Date.now().toString(36) + "`.",
          "",
          "**Metrics to monitor:**",
          "- Target eCPM uplift: +15–25%",
          "- Latency: keep below " + constraints.latency_budget_ms + " ms",
        ].join("\n")
    });
  }

  // 2) Dynamic eCPM floors by geo (generic)
  const floorsNeeded = agg.global.fill_rate >= 0.90 && ((agg.global.avg_ecpm ?? 0) <= 0.95 * (agg.byFormat.rewarded?.avg_ecpm ?? agg.global.avg_ecpm));
  if (floorsNeeded) {
    sections.push({
      id: "geo_floors",
      title: "Introduce Dynamic eCPM Floors by Geo and Format",
      impact_score: 4,
      effort_score: 2,
      markdown: [
        "- Create price floors segmented by major geos (Tier1/Tier2/Tier3) and format.",
        "- Use historical eCPM percentiles: start at P40–P50 for Tier1, P30–P40 for Tier2, minimal floors for Tier3.",
        "- Review floors weekly and auto-adjust based on win rate and fill.",
        "- Keep fill > 88% and ramp floors gradually to avoid demand suppression.",
        "",
        "**Metrics to monitor:**",
        "- eCPM uplift versus last 7-day baseline",
        "- Fill rate stability (target ≥ 0.88)",
      ].join("\n")
    });
  }

  // 3) Segment ad units by user value
  const totalImps = Object.values(agg.byFormat).reduce((s, f: any) => s + (f?.imps ?? 0), 0);
  const hasSingleRewardedUnit = inventory.some(inv => inv.metrics.filter(m => m.format === "rewarded").length <= 1);
  if (totalImps > 200_000 && hasSingleRewardedUnit) {
    sections.push({
      id: "segment_units",
      title: "Segment Ad Units by User Value and Session Depth",
      impact_score: 4,
      effort_score: 3,
      markdown: [
        "- Create audience tiers (whale/mid/casual) via Firebase/GA4.",
        "- Duplicate rewarded and interstitial units per tier; apply floors and frequency caps by tier.",
        "- Use Remote Config to route ad requests by audience in real time.",
        "",
        "**Metrics to monitor:**",
        "- ARPDAU and retention delta by audience",
        "- eCPM per tier; watch whale latency",
      ].join("\n")
    });
  }

  // 4) Latency optimization
  const latencyHigh = agg.global.latency_ms > constraints.latency_budget_ms;
  if (latencyHigh) {
    sections.push({
      id: "latency_opt",
      title: "Optimize Latency and SDK Load",
      impact_score: 3,
      effort_score: 2,
      markdown: [
        "- Enable parallel ad requests and prefetch for interstitial/rewarded.",
        "- Cache SDK initialization; avoid redundant re-init per screen.",
        "- Lazy-load banners below the fold; defer heavy rendering.",
        "- Consider Google Mobile Ads Lite or network timeouts on low-bandwidth segments.",
        "",
        "**Metrics to monitor:**",
        "- Median ad load time; 95th percentile under " + constraints.latency_budget_ms + " ms",
        "- ANR/Crash rate in Play Console",
      ].join("\n")
    });
  }

  // 5) Policy and inventory health
  const hasPolicyFlags = inventory.some(inv => (inv.policy_flags ?? []).length > 0);
  if (hasPolicyFlags) {
    sections.push({
      id: "policy_health",
      title: "Policy and Inventory Health Actions",
      impact_score: 3,
      effort_score: 2,
      markdown: [
        "- Review Ad Review Center weekly; auto-archive low-quality creatives.",
        "- Apply sensitive category blocklists where CTR is high but eCPM is low.",
        "- Ensure content compliance (families, COPPA) by ad unit and placement.",
        "",
        "**Metrics to monitor:**",
        "- Policy warning count",
        "- Fill/Revenue impact from blocklists",
      ].join("\n")
    });
  }

  // 6) Banner refresh rate tuning
  const bannerWeak = (agg.byFormat.banner?.avg_ecpm ?? 0) < benchmarks.banner.avg_ecpm && (agg.byFormat.banner?.fill_rate ?? 0) >= 0.9;
  if (bannerWeak) {
    sections.push({
      id: "banner_refresh",
      title: "Tune Banner Refresh and Viewability",
      impact_score: 3,
      effort_score: 1,
      markdown: [
        "- Set refresh between 30–60s; avoid < 30s to reduce latency and viewability issues.",
        "- Use sticky banners in high-viewability slots; avoid stacking multiple banners.",
        "- Measure viewable impressions and click quality; prune low-quality placements.",
        "",
        "**Metrics to monitor:**",
        "- Viewability rate and Invalid Traffic (IVT) signals",
        "- eCPM change post refresh tuning",
      ].join("\n")
    });
  }

  // 7) Rewarded frequency capping
  const rewardedVolumeHigh = (agg.byFormat.rewarded?.imps ?? 0) > 150_000;
  if (rewardedVolumeHigh) {
    sections.push({
      id: "rewarded_caps",
      title: "Apply Rewarded Frequency Caps and Placement Strategy",
      impact_score: 3,
      effort_score: 2,
      markdown: [
        "- Cap at 2–3 rewarded ads per session for casual users; higher caps for whale cohort.",
        "- Gate rewards behind meaningful actions (level up, revive) to keep perceived value.",
        "- A/B test cap levels via Remote Config (e.g., 2 vs 3).",
        "",
        "**Metrics to monitor:**",
        "- Session length, retention, ARPDAU",
        "- Complaints/ratings related to ads",
      ].join("\n")
    });
  }

  return sections;
}

// Summary composer
function composeSummary(accountName: string, agg: ReturnType<typeof aggregate>, sections: PlanSection[]) {
  const fmt = (n: number) => n.toFixed(2);
  const lines = [
    `# Technical Monetization Plan — ${accountName}`,
    "",
    "## Inventory Snapshot (Aggregated)",
    `- Global eCPM: ${fmt(agg.global.avg_ecpm)}`,
    `- Global fill rate: ${fmt(agg.global.fill_rate)}`,
    `- Global latency: ${agg.global.latency_ms} ms`,
    "",
    "### Per-format eCPM vs benchmark",
    ...(["rewarded", "interstitial", "banner", "native"] as Format[]).map((f) => {
      const m = agg.byFormat[f] as any;
      const bm = benchmarks[f];
      return `- ${f}: ${fmt(m?.avg_ecpm ?? 0)} (benchmark ${fmt(bm.avg_ecpm)}) — gap ${(m?.avg_ecpm_gap ?? 0) * 100 >= 0 ? "+" : ""}${fmt((m?.avg_ecpm_gap ?? 0) * 100)}%`;
    }),
    "",
    "## Priority Summary",
    ...sections
      .sort((a, b) => (b.impact_score - a.impact_score) || (a.effort_score - b.effort_score))
      .map((s, i) => `${i + 1}. ${s.title} (Impact ${s.impact_score} / Effort ${s.effort_score})`),
    "",
  ];
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PlanCreateRequest;

    if (!body.account_name || !Array.isArray(body.inventory) || body.inventory.length === 0) {
      return NextResponse.json({ detail: "Missing account_name or inventory" }, { status: 400 });
    }

    const agg = aggregate(body.inventory);
    let sections = tactics(body.inventory, body.constraints, agg);

    sections = sections.sort((a, b) => (b.impact_score - a.impact_score) || (a.effort_score - b.effort_score));
    const summary = composeSummary(body.account_name, agg, sections);

    const response: PlanResponse = {
      account_name: body.account_name,
      summary: { markdown: summary },
      sections,
      constraints: body.constraints,
    };

    return NextResponse.json(response);
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message ?? "Server error" }, { status: 500 });
  }
}

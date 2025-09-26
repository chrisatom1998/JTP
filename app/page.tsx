"use client";

import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { downloadText } from "../utils/download";

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

const initRequest: PlanCreateRequest = {
  account_name: "Demo Publisher Inc",
  constraints: {
    primary_goal: "maximize_revenue",
    latency_budget_ms: 1200,
    developer_capacity: "medium",
  },
  inventory: [
    {
      app_id: "com.demo.puzzleplanet",
      app_name: "Puzzle Planet",
      sdk_version: "21.5.0",
      mediation_partners: ["AdMob", "UnityAds", "ironSource"],
      policy_flags: [],
      metrics: [
        {
          ad_unit_id: "pp_rewarded_global",
          format: "rewarded",
          platform: "android",
          avg_ecpm: 8.2,
          fill_rate: 0.86,
          latency_ms: 1300,
          impressions: 240000,
          revenue: 1968,
        },
        {
          ad_unit_id: "pp_interstitial_global",
          format: "interstitial",
          platform: "android",
          avg_ecpm: 5.5,
          fill_rate: 0.92,
          latency_ms: 1100,
          impressions: 300000,
          revenue: 1650,
        },
        {
          ad_unit_id: "pp_banner_global",
          format: "banner",
          platform: "android",
          avg_ecpm: 1.1,
          fill_rate: 0.95,
          latency_ms: 900,
          impressions: 1200000,
          revenue: 1320,
        }
      ],
    },
  ],
};

export default function Page() {
  const [request, setRequest] = useState<PlanCreateRequest>(initRequest);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addAdUnit = (invIdx: number) => {
    const inv = request.inventory[invIdx];
    const newUnit: AdUnitMetrics = {
      ad_unit_id: `new_${crypto.randomUUID()}`,
      format: "interstitial",
      platform: "android",
      avg_ecpm: 4.0,
      fill_rate: 0.9,
      latency_ms: 1000,
      impressions: 100000,
      revenue: 400,
    };
    const newReq = { ...request };
    newReq.inventory = [...newReq.inventory];
    newReq.inventory[invIdx] = { ...inv, metrics: [...inv.metrics, newUnit] };
    setRequest(newReq);
  };

  const removeAdUnit = (invIdx: number, unitIdx: number) => {
    const inv = request.inventory[invIdx];
    const newReq = { ...request };
    const newMetrics = inv.metrics.filter((_, i) => i !== unitIdx);
    newReq.inventory = [...newReq.inventory];
    newReq.inventory[invIdx] = { ...inv, metrics: newMetrics };
    setRequest(newReq);
  };

  const updateAdUnit = (invIdx: number, unitIdx: number, patch: Partial<AdUnitMetrics>) => {
    const inv = request.inventory[invIdx];
    const unit = inv.metrics[unitIdx];
    const newReq = { ...request };
    const newMetrics = [...inv.metrics];
    newMetrics[unitIdx] = { ...unit, ...patch };
    newReq.inventory = [...newReq.inventory];
    newReq.inventory[invIdx] = { ...inv, metrics: newMetrics };
    setRequest(newReq);
  };

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as PlanResponse;
      setPlan(data);
    } catch (e: any) {
      setError(e?.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const header = useMemo(() => {
    return (
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Ad Monetization Planner</h1>
        <p style={{ color: "#555", marginTop: 6 }}>
          Enter your inventory and constraints, then generate a prioritized technical plan for AdMob and Ad Manager.
        </p>
      </div>
    );
  }, []);

  return (
    <div>
      {header}

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 18 }}>
        <h2 style={{ fontSize: 20 }}>Account</h2>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <input
            value={request.account_name}
            onChange={(e) => setRequest({ ...request, account_name: e.target.value })}
            placeholder="Account name"
            style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <select
            value={request.constraints.primary_goal}
            onChange={(e) => setRequest({
              ...request,
              constraints: { ...request.constraints, primary_goal: e.target.value as BusinessConstraints["primary_goal"] }
            })}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          >
            <option value="maximize_revenue">Maximize revenue</option>
            <option value="increase_fill">Increase fill</option>
            <option value="balance_ux">Balance UX</option>
          </select>
          <input
            type="number"
            value={request.constraints.latency_budget_ms}
            onChange={(e) => setRequest({
              ...request,
              constraints: { ...request.constraints, latency_budget_ms: Number(e.target.value) }
            })}
            placeholder="Latency budget (ms)"
            style={{ width: 180, padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <select
            value={request.constraints.developer_capacity}
            onChange={(e) => setRequest({
              ...request,
              constraints: { ...request.constraints, developer_capacity: e.target.value as BusinessConstraints["developer_capacity"] }
            })}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          >
            <option value="low">Dev capacity: low</option>
            <option value="medium">Dev capacity: medium</option>
            <option value="high">Dev capacity: high</option>
          </select>
        </div>
      </div>

      {request.inventory.map((inv, invIdx) => (
        <div key={invIdx} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 18 }}>
          <h2 style={{ fontSize: 20 }}>{inv.app_name} — Inventory</h2>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input
              value={inv.app_id}
              onChange={(e) => {
                const newReq = { ...request };
                newReq.inventory = [...newReq.inventory];
                newReq.inventory[invIdx] = { ...inv, app_id: e.target.value };
                setRequest(newReq);
              }}
              placeholder="App ID"
              style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
            />
            <input
              value={inv.sdk_version}
              onChange={(e) => {
                const newReq = { ...request };
                newReq.inventory = [...newReq.inventory];
                newReq.inventory[invIdx] = { ...inv, sdk_version: e.target.value };
                setRequest(newReq);
              }}
              placeholder="SDK version"
              style={{ width: 180, padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
            />
            <input
              value={inv.mediation_partners.join(",")}
              onChange={(e) => {
                const newReq = { ...request };
                newReq.inventory = [...newReq.inventory];
                newReq.inventory[invIdx] = { ...inv, mediation_partners: e.target.value.split(",").map(s => s.trim()).filter(Boolean) };
                setRequest(newReq);
              }}
              placeholder="Mediation partners (comma-separated)"
              style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Ad Unit ID", "Format", "Platform", "Impressions", "Revenue", "Avg eCPM", "Fill Rate", "Latency (ms)", ""].map((h, i) => (
                    <th key={i} style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inv.metrics.map((m, unitIdx) => (
                  <tr key={unitIdx}>
                    <td style={{ padding: 8 }}>
                      <input value={m.ad_unit_id} onChange={(e) => updateAdUnit(invIdx, unitIdx, { ad_unit_id: e.target.value })} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <select value={m.format} onChange={(e) => updateAdUnit(invIdx, unitIdx, { format: e.target.value as Format })} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }}>
                        <option value="banner">banner</option>
                        <option value="interstitial">interstitial</option>
                        <option value="rewarded">rewarded</option>
                        <option value="native">native</option>
                      </select>
                    </td>
                    <td style={{ padding: 8 }}>
                      <select value={m.platform} onChange={(e) => updateAdUnit(invIdx, unitIdx, { platform: e.target.value as Platform })} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }}>
                        <option value="android">android</option>
                        <option value="ios">ios</option>
                        <option value="web">web</option>
                      </select>
                    </td>
                    <td style={{ padding: 8 }}>
                      <input type="number" value={m.impressions} onChange={(e) => updateAdUnit(invIdx, unitIdx, { impressions: Number(e.target.value) })} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input type="number" step="0.01" value={m.revenue} onChange={(e) => updateAdUnit(invIdx, unitIdx, { revenue: Number(e.target.value) })} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input type="number" step="0.01" value={m.avg_ecpm} onChange={(e) => updateAdUnit(invIdx, unitIdx, { avg_ecpm: Number(e.target.value) })} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input type="number" step="0.01" value={m.fill_rate} onChange={(e) => updateAdUnit(invIdx, unitIdx, { fill_rate: Number(e.target.value) })} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input type="number" value={m.latency_ms} onChange={(e) => updateAdUnit(invIdx, unitIdx, { latency_ms: Number(e.target.value) })} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <button onClick={() => removeAdUnit(invIdx, unitIdx)} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 6, padding: "8px 12px", cursor: "pointer" }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={() => addAdUnit(invIdx)} style={{ background: "#f2f0ff", color: "#4b3fb5", border: "1px solid #e0dfff", borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}>
              + Add Ad Unit
            </button>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={generatePlan} disabled={loading} style={{ background: "#4b3fb5", color: "#fff", border: "none", borderRadius: 6, padding: "12px 14px", cursor: "pointer" }}>
          {loading ? "Generating..." : "Generate Plan"}
        </button>
        {error && <span style={{ color: "#c00" }}>Error: {error}</span>}
      </div>

      {plan && (
        <div style={{ marginTop: 20 }}>
          <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 18 }}>
            <h2 style={{ fontSize: 20 }}>Summary</h2>
            <ReactMarkdown>{plan.summary.markdown}</ReactMarkdown>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button
                onClick={() => downloadText(plan.summary.markdown, "plan-summary.md")}
                style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 6, padding: "8px 12px", cursor: "pointer" }}
              >
                Export Summary (MD)
              </button>
              <button
                onClick={() => downloadText(JSON.stringify(plan, null, 2), "plan.json")}
                style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 6, padding: "8px 12px", cursor: "pointer" }}
              >
                Export JSON
              </button>
            </div>
          </div>

          {plan.sections.map((s) => (
            <div key={s.id} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>{s.title}</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ background: "#efeaff", color: "#4b3fb5", borderRadius: 12, padding: "4px 8px", fontSize: 12 }}>
                    Impact {s.impact_score}
                  </span>
                  <span style={{ background: "#e8fbf3", color: "#0b8f5a", borderRadius: 12, padding: "4px 8px", fontSize: 12 }}>
                    Effort {s.effort_score}
                  </span>
                </div>
              </div>
              <ReactMarkdown>{s.markdown}</ReactMarkdown>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

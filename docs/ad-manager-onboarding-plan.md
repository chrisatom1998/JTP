# Ad Manager Onboarding Plan

## Objectives
- Launch Google Ad Manager (GAM) with production-ready inventory, trafficking, and reporting workflows within 30 days.
- Establish shared governance between Product, Engineering, Ad Operations, Sales, and Finance.
- Deliver the first revenue forecast, live campaign, and executive health dashboard by the end of the first month.

## Guiding Principles
1. **Crawl → Walk → Run.** Sequence the rollout so that data pipelines, policy compliance, and monetization levers are validated before scaling demand.
2. **Documentation-first.** Every workflow change (tags, trafficking, billing) must be written down in the runbook before go-live.
3. **Measurement at every step.** Define success metrics and QA criteria for each milestone so the team can accept or rollback changes quickly.
4. **Cross-functional ownership.** Each task has a clear RACI assignment so that dependencies do not block the critical path.

## Team & Roles
| Role | Primary Owner | Key Responsibilities |
| --- | --- | --- |
| Program Lead | Head of Ad Ops | Drives timeline, resolves blockers, reports status to leadership |
| Technical Lead | Ads Engineering Manager | Tag integration, SDK/app updates, creative rendering, troubleshooting |
| Revenue Operations | Yield Manager | Sets pricing, floors, partners, monitors fill & eCPM |
| Data & Analytics | BI Analyst | Reporting, data validation, Looker/Tableau dashboards |
| Policy & Legal | Compliance Lead | Policy readiness, creative review workflow, contracts |
| Finance | Revenue Accounting | Invoicing, reconciliation, revenue recognition |

## 30-Day Workstream Timeline

### Week 0 (Kickoff & Access)
- ✅ Kickoff meeting with all stakeholders; agree on goals, scope, and success metrics.
- 🔑 Confirm company-level access to GAM (Admin, Trafficker, Report Viewer roles) and link to Google accounts.
- 🗂️ Set up shared documentation space (Confluence/Notion) with onboarding checklist, runbook template, and risk log.
- 🔄 Align with legacy ad stack owners on data migration and deprecation timeline.
- 📦 Inventory existing placements, sizes, app bundle IDs, and platforms; log gaps requiring new placements.

### Week 1 (Technical Foundation)
- 🧩 Integrate Google Publisher Tags (GPT) for web or Google Mobile Ads SDK for mobile; deploy to staging environments.
- 🧪 Implement test ad units and enable Google Ad Manager Network Settings (time zone, currency, company info).
- 🔁 Configure Key-Value targeting schema (geo, device, user segments) and document naming conventions.
- 🛡️ Complete policy checklist: brand safety categories, COPPA/family status, restricted content review.
- 🗃️ Set up Creative Library structure, custom fields, and approval workflow.
- 📊 Configure Data Transfer files and BigQuery export if using GAM 360; align with BI on table ownership.

### Week 2 (Inventory & Trafficking Readiness)
- 🧱 Build Ad Units hierarchy reflecting site/app structure; assign ad sizes and placements.
- 🏷️ Create Orders, Line Items, and Creatives for internal QA campaign; validate delivery in staging.
- 🔧 Set frequency caps, competitive exclusions, and default ad rules.
- 📈 Import historical demand data (if available) to inform initial pricing tiers and floors.
- 🤝 Integrate Ad Exchange / Open Bidding partners; capture contracts and contacts in CRM.
- 🧾 Draft billing and reconciliation workflow: how impressions, revenue, and make-goods will be tracked.

### Week 3 (Go-Live Preparation)
- 🧭 Finalize pricing strategy (rate cards, dynamic floors) based on inventory projections.
- 🛠️ Migrate production traffic gradually (10% → 50% → 100%) while monitoring latency, fill rate, and errors.
- 📉 QA reporting: run Ad Manager reports (Delivery, Inventory, Query Tool) and compare against staging data.
- 🛎️ Set up alerts in Looker Studio/Slack for low fill, high error rate, or policy warnings.
- 🗣️ Conduct training sessions for Sales (proposal workflows) and Ad Ops (trafficking, troubleshooting).

### Week 4 (Full Launch & Optimization)
- 🚀 Launch first external campaign with signed IO; ensure billing codes and flight dates match contract.
- 🔍 Review policy & creative approvals daily; resolve disapproved creatives within 24 hours.
- 📊 Publish executive dashboard: revenue, eCPM, fill, viewability, latency, policy flags.
- 📚 Finalize runbook and handoff documentation; include escalation paths and SLAs.
- 🔁 Post-launch retrospective with all stakeholders; log improvement backlog for next 30/60 days.

## Workstream Backlogs (Start in Week 5+)
- **Yield Optimization:** Evaluate dynamic allocation, EBDA partners, header bidding, and pricing experiments.
- **Audience & Data:** Integrate first-party data segments, consent management platform (CMP), and privacy-compliant targeting.
- **Automation:** Explore GAM API for trafficking automation, bulk uploads, and reconciliation scripts.
- **Sales Enablement:** Build proposal templates (Programmatic Guaranteed, Preferred Deals) and CRM integration.

## Success Metrics & Acceptance Criteria
| Metric | Target by Day 30 | Owner |
| --- | --- | --- |
| Fill Rate | ≥ 85% across top 5 placements | Yield Manager |
| eCPM | Within ±10% of forecast | Revenue Ops |
| Latency | < 1200 ms ad load (P90) | Engineering |
| Policy Violations | 0 active warnings | Compliance |
| Reporting Accuracy | < 2% variance between GAM and analytics warehouse | BI Analyst |
| Billing Readiness | First invoice generated and reconciled | Finance |

## Risk Management
- **Access Delays:** Track access requests in shared sheet; escalate to Google support if pending >3 days.
- **SDK/Tag Integration Bugs:** Maintain staging QA checklist; add automated smoke tests for core ad flows.
- **Policy Rejections:** Pre-review creatives, enable email alerts, and establish same-day review SLA.
- **Data Discrepancies:** Run parallel reporting (legacy vs. GAM) for first two weeks; document variances.
- **Change Fatigue:** Publish weekly status updates; highlight decisions, blockers, and next steps.

## Communication Cadence
- Daily 15-minute standup for technical + ad ops leads during Weeks 1–3.
- Weekly steering committee with executive sponsors to review metrics, risks, and decisions.
- Shared Slack channel (#gam-onboarding) for cross-functional questions and escalation.

## Deliverables Checklist
- [ ] Access & governance matrix
- [ ] Inventory & placement map (web/app)
- [ ] Trafficking runbook with screenshots
- [ ] Pricing and floor strategy document
- [ ] Reporting schema and dashboard links
- [ ] Billing & reconciliation SOP
- [ ] Post-launch retrospective notes


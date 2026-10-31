# Session history

The full arc of the claude.ai session that produced these prototypes, in order. Read this to understand *why* things are the way they are, including paths that were tried and rejected.

**How Ankit likes to work:** dense, honest, data-grounded answers. Terse and tabular. Direct pushback when the framing is off. He iterates fast from phone screenshots, so check layouts at 390px.

**Published artifacts on claude.ai** (snapshots, not kept in sync with this folder):

| What | Link |
|---|---|
| Variant switcher (latest of everything) | https://claude.ai/artifact/QGSosQXSn8EKfEuMifKUzm |
| Warden console (first build) | https://claude.ai/artifact/CFEscBJ6Sq2aJTxZB48hu4 |
| Warden chat, single agent | https://claude.ai/artifact/Ct8P14G5wPX6eA8wVZcro5 |
| Warden team (fleet → team → brain → traces) | https://claude.ai/artifact/WLGo1sRq3RxwGXQxSJKhBy |
| Warden v2, decision classes | https://claude.ai/artifact/62Ww77K1ZwBceM2jxnxsfc |

---

## Part 1: Agentic sysadmin product ("Warden")

1. **What sysadmins do and their pain points.** Alert fatigue, interrupt-driven work, patch fear, tool sprawl, access sprawl, documentation rot. The leverage is in repetitive, manual work.
2. **"Build an agent, a digital human, to address this."** Pushback: sysadmins buy a scoped, auditable agent with a verifiable blast radius, not a persona. Proposed wedge: read-only alert triage for MSPs, then access lifecycle.
3. **"What if the agent *is* the sysadmin?"** Reframed as an AI-native MSP selling outcomes to 10–200 person companies with no IT staff. Introduced the autonomy ladder L0 observe → L1 propose → L2 auto on an allowlist → L3 auto in a window → L4. Risks: prompt injection through tickets, compounding errors, liability.
4. **UX for configuring behavior.** A policy and trust console: capability matrix (system × action × level), plain-English policy compiled to deterministic rules, shadow-mode replay, approval inbox, audit timeline, boundaries, an always-visible kill switch. Promotion is evidence-gated; demotion is automatic.
5. Inline wireframes of the capability matrix with a promote-to-L2 flow, then the demotion and anomaly flow, plus a global circuit breaker.
6. **Full console artifact** → `archive/01-warden-console.html`.
7. **"Ruthless simplicity, NL and voice first, expose only what's needed."** Flipped from cockpit to exception handler → `archive/02-warden-chat.html`. One ask at a time, agent-initiated promotions, stop always one tap.
8. **"Expose the agent's brain so a human can mutate behavior."** Brain as external, legible layers (hard bounds, rules, lessons, environment facts, taste) with different mutation rights. Learning may change *how*, never *what*. Added a "what have you learned?" flow with retire, fork, and rollback.
9. **Multiple users, few governors.** Roles: requester, domain approver, governor, auditor. Requesters are an evidence stream, not authority. Confused-deputy risk, approval laundering, governor attention budget.
10. **Fleet management** with systemic updates such as onboarding a vendor → `archive/03-warden-fleet.html` (agent strip, canary rollout, revoke everywhere, fleet rules).
11. **Unique visual identity per agent plus proactivity** → Iris (IT), Sol (Security), Fen (Finance), Pia (People). Proactive notes in three kinds (needs you, will do unless you say no, for your info), each citing what it learned from, under an attention budget.
12. **"How Iris works" brain page**: job, playbooks, access, hard rules, learned habits, knowledge, changes. Edit by tapping a line or by sentence. Widening goes to a second approver; narrowing applies instantly.
13. **Audit trace per unit of work**: work log plus trace view (trigger, read, checked, did, result), cross-agent links, undo.
14. **More human visual style**: Figtree, fog palette, soft cards, a greeting line.
15. **Push the brain visualization**: radial brain map with a "watch it handle a task" walkthrough (sense, understand, check, act, ask, learn), plus five operating-profile dials (autonomy, precision, reach, proactivity, learning) as a radar with last-week impact previews.
16. **"Is this the right question?"** Honest critique: feature accretion, designing in a vacuum. Reframe: the governor's job is to delegate safely, catch mistakes cheaply, and stay accountable. Core object becomes the **decision class**, and people correct on examples rather than editing rules.
17. **Warden v2** → `variants/warden-v2.html`: decision classes with agreement dots, spot checks, correct-on-example that generalizes and shows impact.
18. Built the variant switcher. Removed the conversation variant at Ankit's request.

## Part 2: Wikimind (Asoka design on-site brief)

19. **Brief** (see CLAUDE.md for the link): read-only living knowledge base, the proof layer for buyers. Goals: trust, alive, AI-native, beautiful. Specs: Page and Home.
20. **Wikimind v1** → `variants/wikimind.html`: home constellation and live ticker, page with per-block trust tiers, git-blame rail, a live update when a question gets answered, citation landing.
21. **"Verification isn't necessary up front, just easy to reach."** → trust by exception: only uncertain, changed, unofficial, or stale content is marked. A one-tap "why" with the full trail one step further, and a "How Asoka knows this" lens for demos.
22. **"Actionable focus, why am I here and what can I do."** → arrival modes (Slack citation, home story, browsing, sales demo), each with a context card and actions. Added the relationship spider graph and accordion sections.
23. **Polish pass** using Emil Kowalski's design-engineering skills (found via X). Fixed real bugs: the Android tap highlight, clipped rows, and **CSS class collisions** (`.x`, `.ck`, `.cite`). Rebuilt the stats as a grid.
24. **Product critique, argued as a builder.** It was a wiki with trust tags. Novel directions: claims not pages, why-it's-like-this, policy vs. practice, time travel, "what breaks," showing the unknown. Orientation: two modes (Ask and Map), semantic zoom, two trust states.
25. **Wikimind 2** → `variants/wikimind2.html`: Ask-first home, semantic-zoom map (company → area → process → claim), claims with causes, time-travel slider, policy vs. practice, blast radius. Then made end-to-end: 17 processes with data, live Claude answers grounded in claims with a local fallback, pinch/pan/wheel zoom with snap, cross-area dependency links and fly-to.
26. **Neumorphism experiment: rejected.** Ankit's rule: never use that aesthetic for anything.
27. **"Familiar to wikis for the buyer"** → Wikimind 3 with a Wikipedia look (`archive/04-wikimind3-wiki-look-rejected.html`). **Rejected:** "a step backward, nowhere near wiki look and feel." Restyled into the house language, wiki vocabulary renamed (Overview, Questions, Changes, Sources, In focus, What changed, Unwritten rules Asoka found).
28. **Persistent bottom composer** with attachments, voice (browser speech recognition), a scope toggle (this page or all of Northwind), and a chat panel → current `variants/wikimind3.html`. Pre-composer version: `archive/05-wikimind3-before-composer.html`.
29. **`stageshow` skill** (`npx skills add benjitaylor/skills --skill stageshow`): couldn't install from claude.ai (no network) and not found in public indexes. Try it here.
30. Moved to Claude Code.

## Open threads worth picking up

- Apply the stageshow skill to Wikimind 3.
- Fold Questions and Changes into the page itself (inline threads, time slider) if separate views still feel wiki-adjacent.
- Bring Wikimind 2's semantic-zoom map into Wikimind 3's home as the way to browse areas.
- Real attachment reading and a real retrieval model instead of keyword matching.
- Test with real users: "Would you trust this page?" and time-to-answer for architects.

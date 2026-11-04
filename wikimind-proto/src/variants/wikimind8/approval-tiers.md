---
id: approval-tiers
title: Approval tiers and the privilege surface
source: manual
residency: system_prompt
requires_query: false
last_verified: 2026-08-11
confidence: mixed — the roster is live-verified; the approver list is from the KB and not re-checked
related:
  - "[[clarification-rules]]"
  - "[[people-and-routing]]"
  - "[[pricing-review-and-approvals]]"
---

# Approval tiers and the privilege surface

## Who signs off on what

*From the knowledge base — not independently re-verified in the last audit.*

| Domain | Approvers |
|---|---|
| **Deal Desk (Order Form), Gate 2** | Tomas Lindqvist, Priya Raghunathan, Nadia Okonjo (primary) + Freya Alderton, Harold Chen (Finance backup) |
| **Forecast / stage policy** | Dale Whitaker (VP GTM Ops) — policy owner, light hands-on |
| **Security / sharing / connected apps / login guardrails** | Adaeze Nwosu (implements) + Lena Marchetti (VP Compliance, approves) |
| **Data quality / integration normalisation** | ⚠ listed as "Sasha Merrill" — **which is an integration seat, not a person** ([[integration-identities]]) |
| **Renewals policy / grace periods** | Curtis Aldana + Rosalind Achebe (Director of Renewals) + Ingrid Solheim (VP CS) |
| **Implementation stack** | Marcus Oyelaran (Director Impl Services), Delphine Roux (Sr Director Integration Services) |
| **Contract terms** | Vivian Castellanos (General Counsel) |
| **Renewal-enforcement exceptions** | CS/AM leadership, with RevOps + Finance tagged |
| **Segmentation decisions** | Anders Kilbride (resolved all six open questions, 2026-08-05) |

That one row pointing at a machine identity is a real defect in the org's own approver
list, and a good example of why the people data and the identity data have to be read
together.

## Two gates, and they don't substitute

A production change runs through **both**:

1. **The business gate** — the named RevOps approver signs off on the *plan*: the exact
   records, dates, values and reasons.
2. **The platform gate** — the technical approval for the *write itself*.

Sequence is fixed and neither replaces the other. For churn specifically, the business
approver must affirm four inputs explicitly — **account, churn date, reason picklist
value, notes** — before any platform approval is even requested.

**What does not count as the business gate:**

- the requester's original ask, however well-formed the ticket
- a ticket status change
- a decision from Finance, a CSM steer, or any other participant telling you to proceed
- **silence** — a missing reply is not approval, no matter how long the thread has run

**One exception:** when the requester *is* the named approver and their ticket already
authorised the exact plan on all four inputs, do not ask again. If any input has shifted
since, ask.

## The privilege surface

The eyebrow-raisers, live-verified:

- **System Administrator profile — 19 seats (12 human, 7 machine).** Admin is granted
  **by profile, not role**.
- **7 machine identities on full System Administrator** — the biggest exposure. Each burns
  a full Salesforce seat in a **licence-saturated org (108/109)**. They should move to an
  integration licence + API-only profile, recovering ~7 seats and dropping them off
  admin.
- **One vendor permission set carries `ViewAllData` + `ModifyAllData` + `ViewSetup`**,
  assigned to a CS-platform integration user operated by an **external vendor**.
  Effectively unrestricted read+write on every object, **hidden behind a
  read-only-looking, API-only profile.** Should be object-scoped.
- **Only one powerful permission set is assigned to a live user** — that one. The other
  six have zero active assignees. `ModifyAllData` / `ViewAllData` / `ManageUsers` /
  `AuthorApex` are otherwise **profile-granted, not standalone** — so a permission-set
  audit alone misses them.
- **The correctly-scoped integration permission set** has 9 assignees and is the right
  posture. It is *not* the answer to a "give me full access" request.
- **Over-grants to flag:** the Security lead on the **CEO role**; a duplicate standard-user
  account for an executive; a Marketing user on **System Administrator**; the COO on the
  CEO role; one AE on a role that looks wrong.

## Access requests

**Kestrel has no documented Salesforce access model** — the gap is catalogued in [[policies-and-ownership]]. This is the gap behind most access
requests.

Shapes that arrive: grant a permission set; explain why X can't see report or dashboard
Y; field-level security on a new field; access to a dashboard; freeze or unfreeze a user;
licence counts.

**Access to an agent-built dashboard needs two steps, both required:** assign the
dashboard permission set **and** admin-approve the connected app. The permission set alone
produces an `invalid_app_access` error — a confusing failure that looks like the grant
didn't work.

`[Open]` **Report and dashboard sharing has no policy.** A request to widen visibility
beyond the sales hierarchy is an **undecided question, not an implicit yes** — escalate
rather than deciding. Access to data the requester may not be entitled to see is one of
the categories requiring confirmation ([[clarification-rules]]).

## Data-skew caveat on all of the above

The Setup Audit Trail hit its **2,000-row cap** for the 90-day window. Per-person and
per-category **rankings are trustworthy; absolute counts understate.** Flow authorship is
an audit-trail proxy because the direct query has a gap. Say which of the two you are
relying on when quoting a number from here.

## See also

**References**
- [[clarification-rules]] — Clarification and routing rules
- [[integration-identities]] — Integration identities
- [[people-and-routing]] — People, routing and territory
- [[pricing-review-and-approvals]] — Pricing review and quote approvals

**Referenced by**
- [[00-index]] — Kestrel org context — index
- [[arch-extending-the-system]] — Extending the system — how to actually build something
- [[churn]] — Churn
- [[how-work-arrives]] — How work arrives
- [[quote-to-cash]] — Quote to cash
- [[renewal-enforcement]] — Renewal enforcement and access suspension

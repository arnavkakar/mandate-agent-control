---
name: Mandate
description: A precise authorization registry for governing AI-agent spend.
colors:
  control-ink: "#18221f"
  control-ink-muted: "#626c67"
  paper: "#fbfaf6"
  workspace: "#efeee8"
  divider: "#d8d8cf"
  authority: "#174b45"
  authority-deep: "#0f3935"
  approved: "#176b4b"
  declined: "#a43f3f"
  review: "#95651b"
typography:
  headline:
    fontFamily: "var(--font-sans), Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 680
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "var(--font-sans), Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "var(--font-sans), Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.04em"
rounded:
  control: "8px"
  surface: "12px"
  pill: "999px"
spacing:
  tight: "8px"
  control: "12px"
  surface: "20px"
  page: "32px"
components:
  button-primary:
    backgroundColor: "{colors.authority}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    height: "38px"
    padding: "0 14px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.control-ink}"
    rounded: "{rounded.surface}"
    padding: "20px"
---

# Design System: Mandate

## Overview

**Creative North Star: "The Authorization Registry"**

Mandate should feel like a financial authorization register crossed with a security-clearance dossier: calm enough for continuous use, exact enough for consequential decisions, and visibly grounded in recorded evidence rather than AI spectacle. Its recurring visual object is the authority position—scope, used amount, remaining amount, governing rules, and next human action. Brand character comes from warm paper, graphite ink, compact evidence, ruled divisions, tabular financial data, and explainable decision traces.

The system is intentionally light for daytime operational work. Dark surfaces belong to the navigation rail and executable code only. Warm paper content planes sit on a stone workspace with quiet ruled borders; elevation is rare and reserved for transient layers. Financial decisions remain legible through text and iconography as well as color.

**Key Characteristics:**

- Dense but ordered operational information
- Calm, restrained financial authority
- Deep registry teal for editable authority and primary action; green, amber, and red only for decision semantics
- Explicit simulation, policy, and human-review boundaries
- Clear keyboard focus and responsive disclosure

## Colors

The palette uses near-black green ink and warm paper neutrals, with one deep registry-teal authority color and three tightly governed financial status colors.

### Primary

- **Registry Teal:** The only general-purpose authority color, used for primary actions, active navigation, and policy-owned emphasis.
- **Deep Registry Teal:** Hover and pressed treatment for primary actions.

### Neutral

- **Control Ink:** Primary text and dark navigation surfaces.
- **Control Ink Muted:** Supporting explanations and metadata.
- **Paper:** Content surfaces, inputs, and drawers.
- **Workspace:** The page canvas separating operational surfaces.
- **Divider:** Borders, table rules, and non-interactive separation.

### Named Rules

**The One Authority Rule.** Registry teal marks what Mandate controls or what the operator can edit; it never decorates unrelated content and never competes with status colors.

**The Decision Semantics Rule.** Green means approved, amber means human review, and red means declined or destructive. Every use includes a text label or icon.

## Typography

**Display Font:** Project sans with Arial fallback  
**Body Font:** Project sans with Arial fallback  
**Label/Mono Font:** Project mono only for code, identifiers, hashes, and measurements

**Character:** Neutral, compact sans typography supports scanning and keeps emphasis on financial meaning. Weight and spacing—not novelty type—create authority.

### Hierarchy

- **Headline:** Semibold, compact page title with restrained negative tracking.
- **Title:** Medium-weight card and section title.
- **Body:** Regular explanatory copy, capped near 70 characters where prose appears.
- **Label:** Compact metadata and table headings. Uppercase is limited to true system labels, never decorative eyebrows.
- **Data:** Tabular numerals for money, scores, counts, and timestamps.

### Named Rules

**The Evidence Before Ornament Rule.** Larger type belongs to decisions, amounts, and actionable state—not generic marketing statements.

## Layout

A fixed 238px navigation rail anchors wide screens; content uses a fluid workspace capped at 1500px with 32px page gutters. Operational summaries use asymmetric grids so primary evidence receives more room than secondary queues. Dense tables scroll horizontally when necessary rather than compressing financial labels into ambiguity.

At 1100px, multi-column summaries collapse progressively. At 800px, navigation becomes an off-canvas menu and two-column task surfaces become single-column. At 520px, controls remain at least 44px touchable, nonessential header treatments recede, and primary actions retain clear text or an accessible name.

## Elevation & Depth

The system is flat by default. Borders and tonal separation define ordinary surfaces; a soft offset shadow may clarify transient drawers, menus, and focused overlays. Decorative halos and stacked card-on-card elevation are outside the system.

### Named Rules

**The Flat-By-Default Rule.** Persistent content surfaces use a border, not a shadow. Elevation signals a temporary layer or interaction state.

## Shapes

Controls and persistent content use restrained 2–4px corners, recalling registry sheets and stamped records rather than consumer cards. Status labels are compact rectangles. Circles are reserved for state dots and singular risk markers—not generic decoration.

## Components

### Buttons

- **Shape:** Compact 8px control radius with a minimum 38px desktop height and 44px mobile hit area.
- **Primary:** Registry-teal fill, warm-white label, one clear action per task region.
- **Hover / Focus:** Deeper teal on hover; a visible desaturated-teal focus ring on keyboard focus.
- **Secondary:** White paper, divider border, dark label.
- **Destructive:** White or restrained red surface with explicit destructive copy; never icon-only for consequential actions.

### Chips

- **Style:** Tinted semantic background, readable status text, optional supporting dot/icon.
- **State:** Status colors are stable across tables, queues, risk views, and drawers.

### Cards / Containers

- **Corner Style:** 12px persistent surface radius.
- **Background:** Warm paper on the stone workspace.
- **Shadow Strategy:** None at rest; border provides structure.
- **Border:** One-pixel divider tone.
- **Internal Padding:** 16–24px according to content density.

### Inputs / Fields

- **Style:** Paper background, divider stroke, 8px corners, labels always visible.
- **Focus:** Registry-teal border and a visible desaturated-teal focus ring.
- **Error / Disabled:** Error copy names the problem and recovery; disabled state remains readable and cannot rely on opacity alone.

### Navigation

The dark rail uses text labels with consistent Lucide icons. Active state reverses to warm paper with dark text and a registry-teal icon. Mobile navigation preserves the same information architecture, becomes inert while closed, and closes predictably with backdrop or Escape.

### Decision Trace

Authorization results pair a plain-language decision, amount, reasons, risk factors, and pass/review/fail rule rows. Original policy and risk evaluations remain distinct from later human resolution.

## Do's and Don'ts

### Do:

- **Do** foreground the current decision, remaining authority, and next required action.
- **Do** use tabular numerals for financial data and scores.
- **Do** show loading, empty, error, success, disabled, and permission states for every API-backed path.
- **Do** preserve explicit simulation and deterministic-authorization language.
- **Do** group dense evidence through hierarchy and progressive disclosure rather than more containers.

### Don't:

- **Don't** present same-sized icon-heading-text cards as the primary page scaffold.
- **Don't** use decorative uppercase eyebrows above headings.
- **Don't** use gradients, glass, glowing AI motifs, or chatbot conventions.
- **Don't** let color alone communicate approval, review, decline, or risk.
- **Don't** imply a real payment, integration, customer, or compliance status that does not exist.

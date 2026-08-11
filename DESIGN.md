---
name: Mandate
description: A calm financial control room for governing AI-agent spend.
colors:
  control-ink: "#17151d"
  control-ink-muted: "#777382"
  paper: "#ffffff"
  workspace: "#f5f4f7"
  divider: "#e8e5ed"
  mandate-violet: "#6c5ce7"
  mandate-violet-deep: "#5846d6"
  approved: "#087f6b"
  declined: "#c83e48"
  review: "#b86b08"
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
    backgroundColor: "{colors.mandate-violet}"
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

**Creative North Star: "The Financial Control Room"**

Mandate should feel like an operator's instrument panel: calm enough for continuous use, exact enough for consequential decisions, and visibly grounded in policy rather than AI spectacle. The interface favors compact evidence, consistent status semantics, and restrained hierarchy. Brand character comes from disciplined details—precise language, tabular financial data, explainable decision traces, and a single violet authority accent—not decorative futurism.

The system is intentionally light for daytime operational work. Dark surfaces belong to the navigation rail and executable code only. White content planes sit on a cool workspace with quiet borders; elevation is rare and reserved for transient layers. Financial decisions remain legible through text and iconography as well as color.

**Key Characteristics:**

- Dense but ordered operational information
- Calm, restrained financial authority
- Violet for Mandate-owned actions; green, amber, and red only for decision semantics
- Explicit simulation, policy, and human-review boundaries
- Clear keyboard focus and responsive disclosure

## Colors

The palette uses near-black ink and cool paper neutrals, with one violet product accent and three tightly governed financial status colors.

### Primary

- **Mandate Violet:** The only general-purpose accent, used for primary actions, active navigation, and policy-owned emphasis.
- **Deep Mandate Violet:** Hover and pressed treatment for primary actions.

### Neutral

- **Control Ink:** Primary text and dark navigation surfaces.
- **Control Ink Muted:** Supporting explanations and metadata.
- **Paper:** Content surfaces, inputs, and drawers.
- **Workspace:** The page canvas separating operational surfaces.
- **Divider:** Borders, table rules, and non-interactive separation.

### Named Rules

**The One Authority Rule.** Violet marks what Mandate controls; it never competes with status colors.

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

Controls use gently curved 8px corners; persistent content surfaces use 12px corners; status pills are fully rounded. The form language stays compact and precise. Circles are reserved for avatars, state dots, and singular risk/identity markers—not generic decoration.

## Components

### Buttons

- **Shape:** Compact 8px control radius with a minimum 38px desktop height and 44px mobile hit area.
- **Primary:** Violet fill, white label, one clear action per task region.
- **Hover / Focus:** Deeper violet on hover; a visible violet-offset focus ring on keyboard focus.
- **Secondary:** White paper, divider border, dark label.
- **Destructive:** White or restrained red surface with explicit destructive copy; never icon-only for consequential actions.

### Chips

- **Style:** Tinted semantic background, readable status text, optional supporting dot/icon.
- **State:** Status colors are stable across tables, queues, risk views, and drawers.

### Cards / Containers

- **Corner Style:** 12px persistent surface radius.
- **Background:** Paper on the cool workspace.
- **Shadow Strategy:** None at rest; border provides structure.
- **Border:** One-pixel divider tone.
- **Internal Padding:** 16–24px according to content density.

### Inputs / Fields

- **Style:** Paper background, divider stroke, 8px corners, labels always visible.
- **Focus:** Violet border and a visible low-opacity focus ring.
- **Error / Disabled:** Error copy names the problem and recovery; disabled state remains readable and cannot rely on opacity alone.

### Navigation

The dark rail uses text labels with consistent Lucide icons. Active state combines tonal background, brighter text, and violet icon color. Mobile navigation preserves the same information architecture and closes predictably after selection.

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

# Pakettt! — Design Guidelines

## Brand essence
Clean, modern, logistics-focused. Calm, confident, trustworthy. Fast and frictionless, never busy. Mobile-first.

## Color palette
- **Primary — Deep Indigo `#3D2BFF`**: trust, motion, the brand mark. Primary buttons, active nav, brand surfaces.
- **Secondary — Signal Teal `#0FB5A6`**: live tracking, "on the move" states, courier-location accents.
- **Accent — Warm Amber `#FFB020`**: proof, confirmation, ratings (stars), success/verified badges.
- **Ink `#0F1222`**: primary text and dark surfaces.
- **Slate**: secondary/muted text (`#5A6072` range).
- **Off-white surfaces**: app background (`#F7F8FB`), cards on white.

## Typography
- Clean geometric sans-serif (e.g., Inter / system UI). 
- Strong hierarchy: bold large headings, medium section labels, regular body, small muted captions.
- Tabular numerals for prices, distances, ETAs, earnings.

## Layout & elevation
- Mobile-first, single-column, generous spacing; max content width for larger screens.
- Cards with soft rounded corners (12–16px radius) and subtle shadows; avoid heavy borders.
- Sticky bottom action bars on mobile for primary CTAs (e.g., "Request Delivery", "Confirm Pickup").
- Bottom tab navigation on mobile per role.

## Key UI components
- **Status timeline**: vertical stepper reflecting the 8 delivery statuses, with the live/active step highlighted in Teal and completed steps in Indigo.
- **Live map tracking screen**: full-bleed interactive map, courier marker animating along route, draggable bottom sheet with delivery details + chat shortcut.
- **Status pills/badges**: color-coded by stage (pending = slate, in-transit = teal, delivered = green/amber, cancelled = red).
- **Proof capture**: photo upload tiles + signature pad with clear/confirm.
- **Chat**: clean bubble UI, customer ↔ courier, role-tinted bubbles.
- **Rating**: amber stars.
- **Courier online/offline**: prominent toggle with teal "online" state.

## Iconography & imagery
- Line icons, consistent stroke weight. Package, map-pin, route, camera, signature, star motifs.
- Avoid clutter; lots of whitespace; emphasis on the live tracking experience.

## Accessibility
- WCAG AA contrast. Indigo/teal/amber must meet contrast on chosen surfaces.
- Large tap targets (44px min) for mobile.

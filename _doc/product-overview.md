# Pakettt! — Product Overview

> Single source of truth for what Pakettt! is. Keep this current whenever product
> facts change; the creative blueprint and the app code must stay coherent with it.

## What it is

Pakettt! is a **package delivery marketplace MVP** that connects customers who want to
send packages with delivery drivers/couriers who carry them. It is built around one
promise: a **live trust layer** that makes every handoff visible and verifiable.

## Positioning & differentiator

The real differentiator — and the lead of every pitch — is the **live trust layer**:

- **Real-time map tracking** so customers always know where their package is.
- **Photo proof at both pickup and drop-off**, so condition and custody are documented.
- **E-signature on receipt**, confirming the recipient actually got it.
- **Fast courier matching** that keeps couriers earning and customers confident.

Pakettt! is not just "request a courier." It is verifiable delivery you can watch happen.

## Brand & tone

- Clean, modern, **logistics-focused** design.
- Calm, confident, trustworthy. Fast and frictionless, never busy.
- **Mobile-first** for both customers and couriers.

### Branding colors

- **Primary** — Deep Indigo `#3D2BFF` (trust, motion, the brand mark)
- **Secondary** — Signal Teal `#0FB5A6` (live tracking, "on the move")
- **Accent** — Warm Amber `#FFB020` (proof, confirmation, ratings)
- Neutrals — ink `#0F1222`, slate text, off-white surfaces

## Roles

### Customer
Register / log in; create delivery requests; enter pickup & delivery addresses; specify
package details (size, weight, category, special instructions); view estimated delivery
costs; track delivery status in real time; communicate with the assigned courier; view
delivery history; rate completed deliveries.

### Courier
Register / log in; complete profile & vehicle verification; toggle online/offline
availability; receive delivery requests; accept/reject jobs; navigate to pickup &
drop-off; update delivery status throughout the journey; upload proof of pickup & proof
of delivery (photos + signatures); communicate with customers; view earnings & delivery
history.

### Admin
Manage customers & couriers; verify courier accounts; monitor active deliveries; manage
delivery pricing rules; review disputes; access operational analytics; oversee the
network.

## Core delivery workflow

1. Customer creates a delivery request.
2. Nearby available couriers receive it.
3. A courier accepts the job.
4. Courier travels to the pickup location.
5. Courier confirms pickup with photo proof.
6. Customer tracks courier location live.
7. Courier delivers the package.
8. Recipient signs / confirms receipt.
9. Courier uploads proof of delivery.
10. Delivery is marked completed; both parties rate.

## Delivery statuses

Pending → Searching for Courier → Courier Assigned → Courier En Route to Pickup →
Package Picked Up → In Transit → Arriving Soon → Delivered. (Cancelled is a terminal
exit available before completion.)

## Key features

- Auth + role-based access control
- Real-time GPS tracking
- Interactive maps
- Delivery request management
- Package info management
- Delivery status tracking
- Push notifications
- In-app chat (customer ↔ courier)
- Photo proof of pickup & delivery
- E-signature capture
- Delivery history
- Ratings & reviews
- Responsive mobile-first design

## UI/UX principles

- Fast booking with minimal steps.
- A clear tracking timeline.
- A live map tracking screen.
- Mobile-friendly for both customers and couriers.

## Technical scope

- Complete frontend + backend.
- Database schema & APIs.
- Real-time location updates.
- Cloud file storage for proof photos.
- Secure authentication.
- Scalable architecture.
- Demo / seed data.

## MVP scope boundary

Deliver the core package-delivery workflow first. Explicitly **out of MVP scope**
(deferred): digital wallets, multi-stop deliveries, business accounts, subscriptions,
international shipping.

## Build Status

**MVP shipped 2026-06-04.** Delivered in this build:

- Auth + role-based access for Customer / Courier / Admin.
- Customer: booking flow with live cost quote, real-time tracking map, status timeline,
  chat, history, ratings, disputes.
- Courier: jobs board with online/offline toggle, verification gate, 9-status job flow,
  photo + e-signature proof capture, earnings.
- Admin: overview/analytics, live deliveries monitor, courier verification, pricing
  rules, dispute review.
- Demo seed data included.

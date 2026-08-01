# Runway

Runway compares two fares against one wallet. You set the card you pay with and
your status with each airline, and it prices both options after credit-card
rewards, airline miles, baggage fees, and an optional share of the card's annual
fee — then solves for the **break-even ticket price** where the answer flips.

The break-even number is the point: if a $500 Delta fare beats United for a
SkyMiles member carrying a Reserve card, Runway reports exactly how far United
has to fall (and how far Delta could rise) before that stops being true.

## How the break-even is solved

Effective cost is linear in the ticket price, so `breakEvenFare` in
`src/calculator.js` solves it directly rather than searching:

```
effectiveCost(x) = x·(1 − cardFactor − ratio·flightFactor) + fixedCosts
```

The entered eligible-spend share of the ticket (`ratio`) is held constant as the
price moves. Distance- and segment-based programs do not scale with price, so
their reward value stays in the fixed term instead. Two cases have no answer and
are reported rather than rendered as a number: modeled rewards worth more than
each fare dollar (`rewards-outpace-fare`), and fixed costs that already exceed
the target (`unreachable`).

## Local development

Requirements: Node.js 24 and pnpm 11.18.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Rewards data architecture

Program rules live in `src/data.js`; subjective cents-per-point estimates live separately in `src/valuations.js`. The calculator accepts normalized earning rules, so revenue-based, distance-based, and segment-based programs do not need airline-specific branches in the UI.

Point valuations are held in UI state keyed by *program*, not by airline or card, so editing "SkyMiles value" moves every side of the comparison that earns SkyMiles at once. Status is keyed by airline, so your Delta status persists no matter which side of the matchup Delta sits on.

### Two model shapes worth knowing

**Bag fees are position-tiered, not flat.** Each airline declares `bagFees: [first, second, third+]` because a third checked bag now costs $150–$200 against $45–$50 for the first. Free bags from status or a co-brand card absorb the cheapest positions first, so one free bag against two checked bags bills the *second*-bag price. A flat per-bag rate understates a three-bag itinerary by well over $100.

**Blended airline rates are split across the two sides.** From April 2, 2026 United advertises one number that already mixes flight and card earning: a Premier Gold member paying with the Quest card earns "13x". Runway needs the two halves separately, because the card's share also applies on other airlines and the flight's share does not. So United's 3 base miles plus the Premier bonus live in `earningRules`/`statuses`, while the card's share — 3 for carrying any United card plus the card-specific bonus — is folded into that card's `airlineRate` (Explorer 6, Quest 7, Club Infinite 8).

The two must reconstruct the published rate without overlapping, which is what the `flightMiles + cardPoints` assertions in `calculator.test.js` pin down: a general member on Club Infinite totals United's advertised 11x, and Premier Gold on Quest totals 13x. Putting the card bonus on *both* sides is the tempting mistake, and it inflates a United fare by roughly a third.

One limitation worth knowing: United grants its 3x card-holder bonus for merely *holding* the card, even when you pay with something else. Runway models a single card — the one you pay with — so it cannot express "hold a United card, pay with Amex."

Every catalog entry includes a verification state, source links, review date, and next-review date. `src/catalog-validation.test.js` intentionally fails after the quarterly review deadline. To update a program:

1. Check the airline or issuer's primary terms.
2. Add or revise the normalized earning rules and benefits in `src/data.js`.
3. Advance `reviewedOn` and `reviewAfter`, preserving the effective date where applicable.
4. Add a calculation test for any new rule shape, then run `pnpm test`.

`verified` means the modeled fields were checked against the linked primary source; it does not make the cents-per-point valuation authoritative. Entries marked `review-needed` remain usable but are clearly flagged in the result.

`validateCatalog` enforces the shape that keeps these honest: every airline needs a non-decreasing `bagFees` tier list, and any airline that declares `statusFreeBags` must cover *every* status it lists — a missing tier would silently price an elite's bags as if they had no benefit.

Review dates are per entry rather than global. `checkedToday` marks the entries confirmed in the current sweep; anything left on the previous date was carried forward untouched. Never bump the shared constant to make the catalog look fresh — the date should only ever claim what was actually checked.

Run the same checks used by CI:

```sh
pnpm lint
pnpm test
pnpm build
```

## Container

```sh
docker build -f deploy/Dockerfile -t runway:local .
docker run --rm -p 8080:8080 runway:local
```

The runtime image serves the static build with unprivileged Nginx on port 8080.

## Deployment

The manifests in `deploy/k8s` create the `runway` Deployment and Service in the
`apps` namespace. GitHub Actions publishes
`ghcr.io/isaiah-harville/runway:latest` from `main`.

The homelab GitOps repository owns the Flux source and public ingress for
`https://runway.harville.dev`. Do not apply these manifests manually; Flux
reconciles them after both repositories are pushed.

## Disclaimer

Reward values and program rules change. Runway exposes point valuations as
assumptions and should not be treated as financial advice or a guaranteed
redemption value.

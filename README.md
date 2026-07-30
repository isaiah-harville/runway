# Runway

Runway estimates the effective cost of a flight after credit-card rewards,
airline miles, status, baggage fees, and an optional share of a card's annual
fee.

## Local development

Requirements: Node.js 24 and pnpm 11.18.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Rewards data architecture

Program rules live in `src/data.js`; subjective cents-per-point estimates live separately in `src/valuations.js`. The calculator accepts normalized earning rules, so revenue-based, distance-based, and segment-based programs do not need airline-specific branches in the UI.

Every catalog entry includes a verification state, source links, review date, and next-review date. `src/catalog-validation.test.js` intentionally fails after the quarterly review deadline. To update a program:

1. Check the airline or issuer's primary terms.
2. Add or revise the normalized earning rules and benefits in `src/data.js`.
3. Advance `reviewedOn` and `reviewAfter`, preserving the effective date where applicable.
4. Add a calculation test for any new rule shape, then run `pnpm test`.

`verified` means the modeled fields were checked against the linked primary source; it does not make the cents-per-point valuation authoritative. Entries marked `review-needed` remain usable but are clearly flagged in the result.

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

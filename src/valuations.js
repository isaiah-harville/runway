// Valuations are editorial estimates, not program rules. Keeping them separate
// lets us update or replace them without touching the earning engine.
export const VALUATIONS = {
  SkyMiles: { cents: 1.15, kind: "estimate", reviewedOn: "2026-07-30" },
  MileagePlus: { cents: 1.2, kind: "estimate", reviewedOn: "2026-07-30" },
  AAdvantage: { cents: 1.3, kind: "estimate", reviewedOn: "2026-07-30" },
  "Atmos Rewards": { cents: 1.3, kind: "estimate", reviewedOn: "2026-07-30" },
  "Rapid Rewards": { cents: 1.25, kind: "estimate", reviewedOn: "2026-07-30" },
  TrueBlue: { cents: 1.3, kind: "estimate", reviewedOn: "2026-07-30" },
  Aeroplan: { cents: 1.4, kind: "estimate", reviewedOn: "2026-07-30" },
  "Ultimate Rewards": { cents: 1.5, kind: "estimate", reviewedOn: "2026-07-30" },
  "Membership Rewards": { cents: 1.5, kind: "estimate", reviewedOn: "2026-07-30" },
  "Capital One Miles": { cents: 1.4, kind: "estimate", reviewedOn: "2026-07-30" },
  "Bilt Points": { cents: 1.5, kind: "estimate", reviewedOn: "2026-07-30" },
  "No rewards": { cents: 0, kind: "fixed", reviewedOn: "2026-07-30" },
  "Custom miles": { cents: 1.2, kind: "estimate", reviewedOn: "2026-07-30" },
};

export const valuationFor = (program) => VALUATIONS[program]?.cents ?? 0;

const required = (condition, message) => {
  if (!condition) throw new Error(`Invalid rewards catalog: ${message}`);
};

export function validateCatalog(airlines, cards) {
  for (const [name, airline] of Object.entries(airlines)) {
    required(airline.program, `${name} needs a loyalty program`);
    required(airline.earningRules?.length, `${name} needs an earning rule`);
    required(Object.keys(airline.statuses || {}).length, `${name} needs a status`);
    required(airline.verification?.reviewedOn, `${name} needs a review date`);
    required(airline.verification?.sources?.length, `${name} needs a source`);

    // Bag fees escalate by position, so every airline declares a tier list
    // rather than one flat per-bag price.
    required(
      Array.isArray(airline.bagFees) && airline.bagFees.length > 0 && airline.bagFees.every(Number.isFinite),
      `${name} needs a bagFees tier list`,
    );
    required(
      airline.bagFees.every((fee, index) => index === 0 || fee >= airline.bagFees[index - 1]),
      `${name} has bagFees that decrease by position`,
    );

    // A status table without a matching free-bag table silently prices elite
    // bags as if the traveler had none, which is the costliest kind of wrong.
    for (const status of Object.keys(airline.statuses)) {
      required(
        airline.statusFreeBags === undefined || status in airline.statusFreeBags,
        `${name}/${status} is missing a statusFreeBags entry`,
      );
    }

    for (const rule of airline.earningRules) {
      required(rule.id && rule.label, `${name} has an unnamed earning rule`);
      required(["eligibleSpend", "distance", "segments"].includes(rule.basis), `${name}/${rule.id} has an unsupported basis`);
      required(Number.isFinite(rule.rate), `${name}/${rule.id} needs a numeric rate`);
    }
  }

  for (const [name, card] of Object.entries(cards)) {
    required(card.program && card.issuer, `${name} is incomplete`);
    required(card.verification?.reviewedOn, `${name} needs a review date`);
    required(card.verification?.sources?.length, `${name} needs a source`);
  }

  return true;
}

export function findCatalogFreshnessIssues(airlines, cards, today = new Date()) {
  return [...Object.entries(airlines), ...Object.entries(cards)]
    .filter(([, item]) => item.verification?.status !== "custom")
    .filter(([, item]) => !item.verification?.reviewAfter || new Date(`${item.verification.reviewAfter}T23:59:59Z`) < today)
    .map(([name]) => name);
}

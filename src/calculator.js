// Checked-bag pricing escalates by position, not per bag: a third bag costs
// several times the first. Free bags from status or a co-brand card cover the
// cheapest positions first, so a traveler with one free bag who checks two pays
// the *second*-bag price.
export function bagCostFor(airline, bags, freeBags, roundTrip) {
  const tiers = airline.bagFees;
  let perDirection = 0;
  for (let position = freeBags; position < bags; position += 1) {
    perDirection += tiers[Math.min(position, tiers.length - 1)];
  }
  return perDirection * (roundTrip ? 2 : 1);
}

export function calculateTrip({
  airlineName,
  airline,
  earningRule,
  cashFare,
  eligibleFare,
  card,
  status,
  bags,
  roundTrip,
  annualFeeMode,
  tripsPerYear,
  airlinePointValue,
  cardPointValue,
  includeFlightMiles,
}) {
  const carriesAirlineCard = card.airline === airlineName;
  const cardRate = carriesAirlineCard ? card.airlineRate : card.otherRate;
  const cardPoints = cashFare * cardRate;
  const cardValue = (cardPoints * cardPointValue) / 100;
  const statusBonus = airline.statuses[status] ?? 0;
  const statusRate = airline.statusBonusMode === "multiply"
    ? earningRule.rate * statusBonus
    : earningRule.rate + statusBonus;

  const flightMiles = includeFlightMiles ? Number(eligibleFare) * statusRate : 0;
  const flightValue = (flightMiles * airlinePointValue) / 100;
  const cardFreeBags = carriesAirlineCard ? card.freeBags : 0;
  const statusFreeBags = airline.statusFreeBags?.[status] ?? 0;
  const freeBags = Math.max(cardFreeBags, statusFreeBags);
  const bagCost = bagCostFor(airline, bags, freeBags, roundTrip);
  const feeShare = annualFeeMode ? card.annualFee / Math.max(1, tripsPerYear) : 0;
  const rewardValue = cardValue + flightValue;
  const effectiveCost = cashFare + bagCost + feeShare - rewardValue;

  return {
    cardRate,
    cardPoints,
    cardValue,
    statusRate,
    earningRule,
    statusBonus,
    cardFreeBags,
    statusFreeBags,
    flightMiles,
    flightValue,
    freeBags,
    bagCost,
    feeShare,
    rewardValue,
    effectiveCost,
  };
}

// Effective cost is linear in the ticket price, so the fare that ties a target
// cost can be solved directly instead of searched for.
//
//   effectiveCost(x) = x·(1 − cardFactor − ratio·flightFactor) + fixedCosts
//
// `ratio` holds the entered eligible-spend share of the ticket price constant
// while the price moves. Distance- and segment-based programs do not scale with
// price at all, so their reward value stays in the fixed term.
export function breakEvenFare(trip, targetCost) {
  const base = calculateTrip(trip);
  const cardFactor = base.cardRate * (trip.cardPointValue / 100);
  const spendBased = trip.earningRule.basis === "eligibleSpend";
  const ratio = spendBased && Number(trip.cashFare) > 0
    ? Number(trip.eligibleFare) / Number(trip.cashFare)
    : 0;
  const flightFactor = trip.includeFlightMiles
    ? base.statusRate * (trip.airlinePointValue / 100)
    : 0;

  const slope = 1 - cardFactor - (spendBased ? ratio * flightFactor : 0);
  const fixedCosts = base.bagCost + base.feeShare - (spendBased ? 0 : base.flightValue);

  if (slope <= 0) return { fare: null, reason: "rewards-outpace-fare", slope };

  const fare = (targetCost - fixedCosts) / slope;
  if (fare < 0) return { fare: null, reason: "unreachable", slope };

  return { fare, slope, ratio, spendBased, reason: null };
}

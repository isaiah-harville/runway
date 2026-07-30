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
  const cardRate = card.airline === airlineName ? card.airlineRate : card.otherRate;
  const cardPoints = cashFare * cardRate;
  const cardValue = (cardPoints * cardPointValue) / 100;
  const statusBonus = airline.statuses[status] ?? 0;
  const statusRate = airline.statusBonusMode === "multiply"
    ? earningRule.rate * statusBonus
    : earningRule.rate + statusBonus;
  const flightMiles = includeFlightMiles ? Number(eligibleFare) * statusRate : 0;
  const flightValue = (flightMiles * airlinePointValue) / 100;
  const cardFreeBags = card.airline === airlineName ? card.freeBags : 0;
  const statusFreeBags = airline.statusFreeBags?.[status] ?? 0;
  const freeBags = Math.max(cardFreeBags, statusFreeBags);
  const bagCost = Math.max(0, bags - freeBags) * airline.bagFee * (roundTrip ? 2 : 1);
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

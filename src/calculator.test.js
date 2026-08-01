import { describe, expect, it } from "vitest";
import { breakEvenFare, calculateTrip } from "./calculator";
import { AIRLINES, CARDS } from "./data";

describe("calculateTrip", () => {
  it("separates cross-airline card rewards from flight rewards", () => {
    const result = calculateTrip({
      airlineName: "United",
      airline: AIRLINES.United,
      earningRule: AIRLINES.United.earningRules[0],
      cashFare: 486,
      eligibleFare: 440,
      card: CARDS["Delta SkyMiles Reserve"],
      status: "Member",
      bags: 1,
      roundTrip: true,
      annualFeeMode: false,
      tripsPerYear: 0,
      airlinePointValue: 1.2,
      cardPointValue: 1.15,
      includeFlightMiles: true,
    });

    expect(result.cardRate).toBe(1);
    expect(result.cardPoints).toBe(486);
    // United's base rate is 3x from April 2026, with no Premier bonus for a
    // general member and no United card in the wallet.
    expect(result.flightMiles).toBe(1320);
    // One bag each way at the first-bag price, with no free-bag benefit.
    expect(result.bagCost).toBe(90);
    expect(result.effectiveCost).toBeCloseTo(554.571);
  });

  // United publishes a single blended number ("Premier Gold paying with Quest
  // earns 13x"). Runway splits it across the flight and card sides, so the two
  // must sum back to the published rate without overlapping.
  it("splits United's blended earn rate across the flight and the card", () => {
    const result = calculateTrip({
      airlineName: "United",
      airline: AIRLINES.United,
      earningRule: AIRLINES.United.earningRules[0],
      cashFare: 400,
      eligibleFare: 400,
      card: CARDS["United Quest"],
      status: "Gold",
      bags: 0,
      roundTrip: false,
      annualFeeMode: false,
      tripsPerYear: 0,
      airlinePointValue: 1.2,
      cardPointValue: 1.2,
      includeFlightMiles: true,
    });

    expect(result.statusRate).toBe(6);  // 3 base + 3 Premier Gold
    expect(result.cardRate).toBe(7);    // 3 for carrying the card + 4 for Quest
    expect(result.flightMiles + result.cardPoints).toBe(400 * 13);
  });

  it("totals United's advertised 11x for a general member on Club Infinite", () => {
    const result = calculateTrip({
      airlineName: "United",
      airline: AIRLINES.United,
      earningRule: AIRLINES.United.earningRules[0],
      cashFare: 500,
      eligibleFare: 500,
      card: CARDS["United Club Infinite"],
      status: "Member",
      bags: 0,
      roundTrip: false,
      annualFeeMode: false,
      tripsPerYear: 0,
      airlinePointValue: 1.2,
      cardPointValue: 1.2,
      includeFlightMiles: true,
    });

    expect(result.flightMiles + result.cardPoints).toBe(500 * 11);
  });

  it("prices checked bags by position, not at a flat rate", () => {
    const threeBags = calculateTrip({
      airlineName: "American",
      airline: AIRLINES.American,
      earningRule: AIRLINES.American.earningRules[0],
      cashFare: 300,
      eligibleFare: 300,
      card: CARDS["No rewards card"],
      status: "Member",
      bags: 3,
      roundTrip: false,
      annualFeeMode: false,
      tripsPerYear: 0,
      airlinePointValue: 1.3,
      cardPointValue: 0,
      includeFlightMiles: false,
    });

    // $50 + $60 + $200, not 3 x $50.
    expect(threeBags.bagCost).toBe(310);
  });

  it("lets free bags cover the cheapest positions first", () => {
    const trip = {
      airlineName: "American",
      airline: AIRLINES.American,
      earningRule: AIRLINES.American.earningRules[0],
      cashFare: 300,
      eligibleFare: 300,
      card: CARDS["No rewards card"],
      status: "Gold",
      bags: 2,
      roundTrip: false,
      annualFeeMode: false,
      tripsPerYear: 0,
      airlinePointValue: 1.3,
      cardPointValue: 0,
      includeFlightMiles: false,
    };

    // Gold's one free bag absorbs the $50 position, leaving the $60 one.
    expect(calculateTrip(trip).bagCost).toBe(60);
  });

  it("applies airline-card baggage benefits only on the matching airline", () => {
    const result = calculateTrip({
      airlineName: "Delta",
      airline: AIRLINES.Delta,
      earningRule: AIRLINES.Delta.earningRules.find((rule) => rule.id === "classic-refundable"),
      cashFare: 500,
      eligibleFare: 450,
      card: CARDS["Delta SkyMiles Reserve"],
      status: "Silver",
      bags: 2,
      roundTrip: true,
      annualFeeMode: false,
      tripsPerYear: 0,
      airlinePointValue: 1.15,
      cardPointValue: 1.15,
      includeFlightMiles: false,
    });

    expect(result.cardRate).toBe(3);
    expect(result.freeBags).toBe(2);
    expect(result.bagCost).toBe(0);
  });

  it("combines fare-product earning with a multiplicative status bonus", () => {
    const result = calculateTrip({
      airlineName: "Southwest",
      airline: AIRLINES.Southwest,
      earningRule: AIRLINES.Southwest.earningRules.find((rule) => rule.id === "choice-extra"),
      cashFare: 240,
      eligibleFare: 200,
      card: CARDS["No rewards card"],
      status: "A-List Preferred",
      bags: 2,
      roundTrip: false,
      annualFeeMode: false,
      tripsPerYear: 0,
      airlinePointValue: 1.25,
      cardPointValue: 0,
      includeFlightMiles: true,
    });

    expect(result.statusRate).toBe(28);
    expect(result.flightMiles).toBe(5600);
    expect(result.statusFreeBags).toBe(2);
    expect(result.bagCost).toBe(0);
  });
});

describe("breakEvenFare", () => {
  // The headline scenario: a SkyMiles member paying with a Delta Reserve wants
  // to know how cheap the United ticket has to be to beat a $500 Delta fare.
  const skyMilesMember = {
    card: CARDS["Delta SkyMiles Reserve"],
    bags: 1,
    roundTrip: true,
    annualFeeMode: false,
    tripsPerYear: 0,
    cardPointValue: 1.15,
    includeFlightMiles: true,
  };
  const deltaTrip = {
    ...skyMilesMember,
    airlineName: "Delta",
    airline: AIRLINES.Delta,
    earningRule: AIRLINES.Delta.earningRules.find((rule) => rule.id === "classic-refundable"),
    cashFare: 500,
    eligibleFare: 450,
    status: "Member",
    airlinePointValue: 1.15,
  };
  const unitedTrip = {
    ...skyMilesMember,
    airlineName: "United",
    airline: AIRLINES.United,
    earningRule: AIRLINES.United.earningRules[0],
    cashFare: 520,
    eligibleFare: 470,
    status: "Member",
    airlinePointValue: 1.2,
  };

  it("finds the fare that ties the competing option", () => {
    const target = calculateTrip(deltaTrip).effectiveCost;
    const { fare } = breakEvenFare(unitedTrip, target);

    const tied = calculateTrip({
      ...unitedTrip,
      cashFare: fare,
      // The solver holds the eligible-spend share of the ticket constant.
      eligibleFare: fare * (unitedTrip.eligibleFare / unitedTrip.cashFare),
    });
    expect(tied.effectiveCost).toBeCloseTo(target, 6);
  });

  it("prices the loyal airline's headroom above the challenger", () => {
    // Delta keeps 3x card earn and two free bags; United pays 1x and $80 of bags.
    const target = calculateTrip(unitedTrip).effectiveCost;
    const { fare } = breakEvenFare(deltaTrip, target);
    expect(fare).toBeGreaterThan(deltaTrip.cashFare);
  });

  it("keeps distance-based rewards out of the price-sensitive term", () => {
    const alaskaTrip = {
      ...skyMilesMember,
      airlineName: "Alaska",
      airline: AIRLINES.Alaska,
      earningRule: AIRLINES.Alaska.earningRules[0],
      cashFare: 400,
      eligibleFare: 2400,
      status: "Member",
      airlinePointValue: 1.3,
    };
    const { fare, slope, spendBased } = breakEvenFare(alaskaTrip, 500);

    expect(spendBased).toBe(false);
    // Only the 1x card earn scales with price for a distance-based program.
    expect(slope).toBeCloseTo(1 - 0.0115, 6);
    const tied = calculateTrip({ ...alaskaTrip, cashFare: fare });
    expect(tied.effectiveCost).toBeCloseTo(500, 6);
  });

  it("reports when rewards outpace every added fare dollar", () => {
    const runaway = { ...deltaTrip, airlinePointValue: 20, cardPointValue: 20 };
    expect(breakEvenFare(runaway, 100)).toMatchObject({ fare: null, reason: "rewards-outpace-fare" });
  });

  it("reports when fixed costs alone exceed the target", () => {
    const baggageHeavy = {
      ...unitedTrip,
      bags: 3,
      annualFeeMode: true,
      tripsPerYear: 1,
    };
    expect(breakEvenFare(baggageHeavy, 50)).toMatchObject({ fare: null, reason: "unreachable" });
  });
});

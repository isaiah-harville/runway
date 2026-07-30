import { describe, expect, it } from "vitest";
import { calculateTrip } from "./calculator";
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
    expect(result.flightMiles).toBe(2640);
    expect(result.bagCost).toBe(80);
    expect(result.effectiveCost).toBeCloseTo(528.731);
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

import { validateCatalog } from "./catalog-validation";
import { valuationFor } from "./valuations";

const source = (label, url) => ({ label, url });
const verified = (sources, extra = {}) => ({
  status: "verified",
  reviewedOn: "2026-07-30",
  reviewAfter: "2026-10-30",
  effectiveFrom: "2026-01-01",
  sources,
  ...extra,
});
const reviewNeeded = (sources) => ({
  status: "review-needed",
  reviewedOn: "2026-07-30",
  reviewAfter: "2026-10-30",
  sources,
});

export const AIRLINES = {
  United: {
    code: "UA", color: "#1356a2", program: "MileagePlus", pointValue: valuationFor("MileagePlus"), bagFee: 40,
    earningRules: [
      { id: "published", label: "Eligible published fare", basis: "eligibleSpend", rate: 6, note: "Basic Economy and partner tickets can earn differently." },
    ],
    statuses: { Member: 0, Silver: 2, Gold: 3, Platinum: 4, "Premier 1K": 6 },
    verification: reviewNeeded([source("United MileagePlus earning", "https://www.united.com/en/us/fly/mileageplus/earn-miles.html")]),
  },
  Delta: {
    code: "DL", color: "#b1192e", program: "SkyMiles", pointValue: valuationFor("SkyMiles"), bagFee: 35,
    earningRules: [
      { id: "main-basic", label: "Main Basic", basis: "eligibleSpend", rate: 0, note: "Main Basic does not earn redeemable miles." },
      { id: "comfort-basic", label: "Comfort Basic", basis: "eligibleSpend", rate: 2 },
      { id: "classic-refundable", label: "Classic or Refundable", basis: "eligibleSpend", rate: 5 },
      { id: "extra", label: "Extra", basis: "eligibleSpend", rate: 7 },
    ],
    statuses: { Member: 0, Silver: 2, Gold: 3, Platinum: 4, Diamond: 6 },
    verification: verified([source("Delta SkyMiles program rules", "https://www.delta.com/us/en/skymiles/program-resources/program-rules")]),
  },
  American: {
    code: "AA", color: "#24748c", program: "AAdvantage", pointValue: valuationFor("AAdvantage"), bagFee: 40,
    earningRules: [{ id: "aa-marketed", label: "Eligible American-marketed fare", basis: "eligibleSpend", rate: 5 }],
    statuses: { Member: 0, Gold: 2, Platinum: 3, "Platinum Pro": 4, "Executive Platinum": 6 },
    statusFreeBags: { Member: 0, Gold: 1, Platinum: 2, "Platinum Pro": 3, "Executive Platinum": 3 },
    verification: verified([source("AAdvantage status and earning", "https://www.aa.com/pubcontent/en_US/aadvantage-program/discover/loyalty-points-status.html")]),
  },
  Alaska: {
    code: "AS", color: "#005f67", program: "Atmos Rewards", pointValue: valuationFor("Atmos Rewards"), bagFee: 35,
    earningRules: [{ id: "distance", label: "Distance traveled", basis: "distance", rate: 1, note: "Enter itinerary miles, not fare dollars." }],
    statuses: { Member: 0 },
    verification: reviewNeeded([source("Atmos Rewards earning choices", "https://news.alaskaair.com/loyalty/introducing-atmos-rewards/")]),
  },
  Southwest: {
    code: "WN", color: "#304cb2", program: "Rapid Rewards", pointValue: valuationFor("Rapid Rewards"), bagFee: 35,
    earningRules: [
      { id: "basic", label: "Basic", basis: "eligibleSpend", rate: 2 },
      { id: "choice", label: "Choice", basis: "eligibleSpend", rate: 6 },
      { id: "choice-preferred", label: "Choice Preferred", basis: "eligibleSpend", rate: 10 },
      { id: "choice-extra", label: "Choice Extra", basis: "eligibleSpend", rate: 14 },
    ],
    statusBonusMode: "multiply",
    statuses: { Member: 1, "A-List": 1.25, "A-List Preferred": 2 },
    statusFreeBags: { Member: 0, "A-List": 1, "A-List Preferred": 2 },
    verification: verified([source("Rapid Rewards earning calculator", "https://www.southwest.com/rapid-rewards/points/how-to-earn/")]),
  },
  JetBlue: {
    code: "B6", color: "#003876", program: "TrueBlue", pointValue: valuationFor("TrueBlue"), bagFee: 35,
    earningRules: [
      { id: "base-direct", label: "Base fare · booked direct", basis: "eligibleSpend", rate: 2 },
      { id: "base-other", label: "Base fare · booked by phone/other", basis: "eligibleSpend", rate: 1 },
      { id: "main-direct", label: "Main / EvenMore / Mint · booked direct", basis: "eligibleSpend", rate: 6 },
      { id: "main-other", label: "Main / EvenMore / Mint · booked by phone/other", basis: "eligibleSpend", rate: 3 },
    ],
    statuses: { Member: 0, "Mosaic 1": 3, "Mosaic 2": 3, "Mosaic 3": 4, "Mosaic 4": 5 },
    statusFreeBags: { Member: 0, "Mosaic 1": 1, "Mosaic 2": 2, "Mosaic 3": 2, "Mosaic 4": 2 },
    verification: verified([
      source("TrueBlue earning rules", "https://www.jetblue.com/help/earning-points"),
      source("Mosaic benefits", "https://www.jetblue.com/help/mosaic"),
    ]),
  },
  Hawaiian: {
    code: "HA", color: "#552583", program: "Atmos Rewards", pointValue: valuationFor("Atmos Rewards"), bagFee: 40,
    earningRules: [{ id: "distance", label: "Distance traveled", basis: "distance", rate: 1, note: "Enter itinerary miles, not fare dollars." }],
    statuses: { Member: 0 },
    verification: reviewNeeded([source("Atmos Rewards earning choices", "https://news.alaskaair.com/loyalty/introducing-atmos-rewards/")]),
  },
  "Air Canada": {
    code: "AC", color: "#d8292f", program: "Aeroplan", pointValue: valuationFor("Aeroplan"), bagFee: 35,
    earningRules: [{ id: "ac-eligible", label: "Eligible Air Canada fare", basis: "eligibleSpend", rate: 1 }],
    statuses: { Member: 0, "25K": 1, "35K": 2, "50K": 3, "75K": 4, "Super Elite": 5 },
    verification: verified([source("Aeroplan 2026 flight earning", "https://www.aircanada.com/us/en/ado/home/aeroplan/earn/air-canada.html")]),
  },
  "Other airline": {
    code: "—", color: "#4e5754", program: "Custom miles", pointValue: valuationFor("Custom miles"), bagFee: 40,
    earningRules: [{ id: "custom", label: "Custom earning rule", basis: "eligibleSpend", rate: 5 }],
    statuses: { Member: 0 },
    verification: { status: "custom", reviewedOn: "2026-07-30", sources: [source("Your current program terms", "#method")] },
  },
};

const card = (values, verification) => ({
  pointValue: valuationFor(values.program),
  ...values,
  verification,
});
const cardSource = (label, url) => [source(label, url)];

export const CARDS = {
  "Delta SkyMiles Reserve": card({
    issuer: "American Express", program: "SkyMiles", annualFee: 650, airline: "Delta", airlineRate: 3, otherRate: 1, freeBags: 2, color: "#59233b",
  }, verified(cardSource("Delta Reserve terms", "https://www.americanexpress.com/en-us/account/get-started/deltareserve/earn-rewards"))),
  "Delta SkyMiles Platinum": card({
    issuer: "American Express", program: "SkyMiles", annualFee: 350, airline: "Delta", airlineRate: 3, otherRate: 1, freeBags: 2, color: "#4f565c",
  }, reviewNeeded(cardSource("Delta card terms", "https://www.americanexpress.com/us/credit-cards/category/delta-skymiles/"))),
  "United Explorer": card({
    issuer: "Chase", program: "MileagePlus", annualFee: 150, airline: "United", airlineRate: 3, otherRate: 1, freeBags: 1, color: "#173b72",
  }, verified(cardSource("United Explorer benefits", "https://www.chase.com/personal/credit-cards/united/united-explorer-card"))),
  "United Quest": card({
    issuer: "Chase", program: "MileagePlus", annualFee: 350, airline: "United", airlineRate: 3, otherRate: 1, freeBags: 2, color: "#465563",
  }, reviewNeeded(cardSource("United cards", "https://creditcards.chase.com/travel-credit-cards/united"))),
  "United Club Infinite": card({
    issuer: "Chase", program: "MileagePlus", annualFee: 695, airline: "United", airlineRate: 4, otherRate: 1, freeBags: 2, color: "#101820",
  }, reviewNeeded(cardSource("United cards", "https://creditcards.chase.com/travel-credit-cards/united"))),
  "Citi / AAdvantage Executive": card({
    issuer: "Citi", program: "AAdvantage", annualFee: 595, airline: "American", airlineRate: 4, otherRate: 1, freeBags: 1, color: "#171c27",
  }, reviewNeeded(cardSource("Citi AAdvantage cards", "https://www.citi.com/credit-cards/american-airlines-credit-cards"))),
  "Alaska Airlines Visa": card({
    issuer: "Bank of America", program: "Atmos Rewards", annualFee: 95, airline: "Alaska", airlineRate: 3, otherRate: 1, freeBags: 1, color: "#07545a",
  }, reviewNeeded(cardSource("Atmos Rewards Visa", "https://www.alaskaair.com/content/credit-card/visa-signature"))),
  "Southwest Priority": card({
    issuer: "Chase", program: "Rapid Rewards", annualFee: 229, airline: "Southwest", airlineRate: 4, otherRate: 1, freeBags: 1, color: "#2444a4",
  }, verified(cardSource("Southwest fees and card benefits", "https://www.southwest.com/html/customer-service/travel-fees.html"))),
  "JetBlue Plus": card({
    issuer: "Barclays", program: "TrueBlue", annualFee: 99, airline: "JetBlue", airlineRate: 6, otherRate: 1, freeBags: 1, color: "#002f65",
  }, reviewNeeded(cardSource("JetBlue cards", "https://www.jetblue.com/trueblue/credit-cards"))),
  "Chase Sapphire Preferred": card({
    issuer: "Chase", program: "Ultimate Rewards", annualFee: 95, airline: null, airlineRate: 0, otherRate: 2, freeBags: 0, color: "#0c5b78",
  }, reviewNeeded(cardSource("Sapphire Preferred", "https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred"))),
  "Chase Sapphire Reserve": card({
    issuer: "Chase", program: "Ultimate Rewards", annualFee: 795, airline: null, airlineRate: 0, otherRate: 4, freeBags: 0, color: "#24201e",
  }, reviewNeeded(cardSource("Sapphire Reserve", "https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve"))),
  "American Express Platinum": card({
    issuer: "American Express", program: "Membership Rewards", annualFee: 895, airline: null, airlineRate: 0, otherRate: 5, freeBags: 0, color: "#737b7f",
  }, reviewNeeded(cardSource("Amex Platinum", "https://www.americanexpress.com/us/credit-cards/card/platinum/"))),
  "Capital One Venture X": card({
    issuer: "Capital One", program: "Capital One Miles", annualFee: 395, airline: null, airlineRate: 0, otherRate: 2, freeBags: 0, color: "#171719",
  }, reviewNeeded(cardSource("Venture X", "https://www.capitalone.com/credit-cards/venture-x/"))),
  "Bilt Mastercard": card({
    issuer: "Wells Fargo", program: "Bilt Points", annualFee: 0, airline: null, airlineRate: 0, otherRate: 2, freeBags: 0, color: "#242424",
  }, reviewNeeded(cardSource("Bilt Mastercard", "https://www.biltrewards.com/card"))),
  "No rewards card": card({
    issuer: "Cash / debit", program: "No rewards", annualFee: 0, airline: null, airlineRate: 0, otherRate: 0, freeBags: 0, color: "#555e5a",
  }, verified(cardSource("No rewards assumption", "#method"))),
};

validateCatalog(AIRLINES, CARDS);

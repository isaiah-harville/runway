import { validateCatalog } from "./catalog-validation";
import { valuationFor } from "./valuations";

const source = (label, url) => ({ label, url });

// Entries re-checked against primary sources on 2026-08-01 pass `checkedToday`.
// Anything left on the older date was carried forward untouched and is due for
// its own review — the dates must not claim more than was actually done.
const LAST_SWEEP = "2026-07-30";
const THIS_SWEEP = "2026-08-01";
const checkedToday = { reviewedOn: THIS_SWEEP, reviewAfter: "2026-11-01" };

const verified = (sources, extra = {}) => ({
  status: "verified",
  reviewedOn: LAST_SWEEP,
  reviewAfter: "2026-10-30",
  effectiveFrom: "2026-01-01",
  sources,
  ...extra,
});
// Every catalog entry currently passes verification, so nothing calls this
// today. It stays exported because the next sweep will need it the moment a
// program changes terms faster than we can confirm them.
export const reviewNeeded = (sources, extra = {}) => ({
  status: "review-needed",
  reviewedOn: LAST_SWEEP,
  reviewAfter: "2026-10-30",
  sources,
  ...extra,
});

export const AIRLINES = {
  United: {
    code: "UA", color: "#1356a2", program: "MileagePlus", pointValue: valuationFor("MileagePlus"),
    // April 2026 increase. Third and later bags jump to $200.
    bagFees: [45, 55, 200],
    earningRules: [
      { id: "published", label: "Eligible published fare", basis: "eligibleSpend", rate: 3, note: "Base fare plus carrier surcharges, excluding government taxes." },
      { id: "basic-economy", label: "Basic Economy", basis: "eligibleSpend", rate: 0, note: "From April 2, 2026 Basic Economy earns nothing unless you carry a United card." },
    ],
    statuses: { Member: 0, Silver: 2, Gold: 3, Platinum: 4, "Premier 1K": 6 },
    statusFreeBags: { Member: 0, Silver: 1, Gold: 2, Platinum: 3, "Premier 1K": 3 },
    verification: verified([
      source("United MileagePlus earning", "https://www.united.com/en/us/fly/mileageplus/earn-miles.html"),
      source("United 2026 earn-rate change", "https://awardwallet.com/news/united-mileageplus/mileage-earning-changes-2026/"),
    ], { ...checkedToday, effectiveFrom: "2026-04-02" }),
  },
  Delta: {
    code: "DL", color: "#b1192e", program: "SkyMiles", pointValue: valuationFor("SkyMiles"),
    bagFees: [45, 55, 200],
    earningRules: [
      { id: "main-basic", label: "Main Basic", basis: "eligibleSpend", rate: 0, note: "Main Basic does not earn redeemable miles." },
      { id: "comfort-basic", label: "Comfort Basic", basis: "eligibleSpend", rate: 2 },
      { id: "classic-refundable", label: "Classic or Refundable", basis: "eligibleSpend", rate: 5 },
      { id: "extra", label: "Extra", basis: "eligibleSpend", rate: 7 },
    ],
    statuses: { Member: 0, Silver: 2, Gold: 3, Platinum: 4, Diamond: 6 },
    // In Delta Main and Comfort every Medallion tier gets one free bag; the
    // larger 2-3 bag allowances apply only in Premium Select, First and One.
    statusFreeBags: { Member: 0, Silver: 1, Gold: 1, Platinum: 1, Diamond: 1 },
    verification: verified([
      source("Delta SkyMiles earning", "https://www.delta.com/us/en/skymiles/how-to-earn-miles/overview"),
      source("Medallion baggage allowance", "https://www.delta.com/us/en/baggage/checked-baggage/medallion-baggage-allowance"),
    ], checkedToday),
  },
  American: {
    code: "AA", color: "#24748c", program: "AAdvantage", pointValue: valuationFor("AAdvantage"),
    bagFees: [50, 60, 200],
    earningRules: [{ id: "aa-marketed", label: "Eligible American-marketed fare", basis: "eligibleSpend", rate: 5 }],
    statuses: { Member: 0, Gold: 2, Platinum: 3, "Platinum Pro": 4, "Executive Platinum": 6 },
    statusFreeBags: { Member: 0, Gold: 1, Platinum: 2, "Platinum Pro": 3, "Executive Platinum": 3 },
    verification: verified([
      source("AAdvantage member statuses", "https://www.aa.com/web/i18n/aadvantage-program/discover/member-statuses.html"),
      source("Checked bag policy", "https://www.aa.com/i18n/travel-info/baggage/checked-baggage-policy.html"),
    ], checkedToday),
  },
  Alaska: {
    code: "AS", color: "#005f67", program: "Atmos Rewards", pointValue: valuationFor("Atmos Rewards"),
    bagFees: [45, 55, 200],
    earningRules: [{ id: "distance", label: "Distance traveled", basis: "distance", rate: 1, note: "Enter itinerary miles, not fare dollars. Spend- and segment-based earning choices are announced but not yet live." }],
    statusBonusMode: "multiply",
    statuses: { Member: 1, Silver: 1.25, Gold: 1.5, Platinum: 2, Titanium: 2.5 },
    statusFreeBags: { Member: 0, Silver: 1, Gold: 2, Platinum: 3, Titanium: 3 },
    verification: verified([
      source("Atmos Rewards status levels", "https://www.alaskaair.com/atmosrewards/content/faq/status"),
      source("Atmos elite tier benefits", "https://onemileatatime.com/guides/alaska-atmos-rewards-elite-status/"),
      source("Introducing Atmos Rewards", "https://news.alaskaair.com/loyalty/introducing-atmos-rewards/"),
    ], checkedToday),
  },
  Southwest: {
    code: "WN", color: "#304cb2", program: "Rapid Rewards", pointValue: valuationFor("Rapid Rewards"),
    // Free checked bags ended May 28, 2025.
    bagFees: [35, 45, 150],
    earningRules: [
      { id: "basic", label: "Basic", basis: "eligibleSpend", rate: 2 },
      { id: "choice", label: "Choice", basis: "eligibleSpend", rate: 6 },
      { id: "choice-preferred", label: "Choice Preferred", basis: "eligibleSpend", rate: 10 },
      { id: "choice-extra", label: "Choice Extra", basis: "eligibleSpend", rate: 14 },
    ],
    statusBonusMode: "multiply",
    statuses: { Member: 1, "A-List": 1.25, "A-List Preferred": 2 },
    statusFreeBags: { Member: 0, "A-List": 1, "A-List Preferred": 2 },
    verification: verified([source("Rapid Rewards earning calculator", "https://www.southwest.com/rapid-rewards/points/how-to-earn/")], checkedToday),
  },
  JetBlue: {
    code: "B6", color: "#003876", program: "TrueBlue", pointValue: valuationFor("TrueBlue"),
    // Off-peak, paid 24h+ before departure. Peak dates run materially higher
    // (second bag $119, third $210).
    bagFees: [45, 59, 200],
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
      source("JetBlue optional services and fees", "https://www.jetblue.com/legal/fees"),
      source("Mosaic 2026 changes", "https://awardfares.com/blog/jetblue-mosaic-2026/"),
    ], { ...checkedToday, effectiveFrom: "2026-02-01" }),
  },
  Hawaiian: {
    code: "HA", color: "#552583", program: "Atmos Rewards", pointValue: valuationFor("Atmos Rewards"),
    bagFees: [45, 55, 200],
    earningRules: [{ id: "distance", label: "Distance traveled", basis: "distance", rate: 1, note: "Enter itinerary miles, not fare dollars." }],
    statusBonusMode: "multiply",
    statuses: { Member: 1, Silver: 1.25, Gold: 1.5, Platinum: 2, Titanium: 2.5 },
    statusFreeBags: { Member: 0, Silver: 1, Gold: 2, Platinum: 3, Titanium: 3 },
    verification: verified([
      source("Atmos Rewards status levels", "https://www.alaskaair.com/atmosrewards/content/faq/status"),
      source("Atmos elite tier benefits", "https://onemileatatime.com/guides/alaska-atmos-rewards-elite-status/"),
    ], checkedToday),
  },
  "Air Canada": {
    code: "AC", color: "#d8292f", program: "Aeroplan", pointValue: valuationFor("Aeroplan"),
    bagFees: [45, 55, 200],
    earningRules: [{ id: "ac-eligible", label: "Eligible Air Canada fare", basis: "eligibleSpend", rate: 1 }],
    statuses: { Member: 0, "25K": 1, "35K": 2, "50K": 3, "75K": 4, "Super Elite": 5 },
    // From Feb 1 2026 25K drops to one elite bag; 50K and above keep three.
    statusFreeBags: { Member: 0, "25K": 1, "35K": 2, "50K": 3, "75K": 3, "Super Elite": 3 },
    verification: verified([
      source("Aeroplan 2026 flight earning", "https://www.aircanada.com/ca/en/aco/home/aeroplan/earn/air-canada.html"),
      source("Aeroplan elite tier benefits", "https://www.aircanada.com/us/en/aco/home/aeroplan/status/tiers.html"),
      source("Feb 2026 baggage changes", "https://milesopedia.com/en/news/programs/air-canada-bagage-allowances-changes-aeroplan/"),
    ], { ...checkedToday, effectiveFrom: "2026-01-01" }),
  },
  "Other airline": {
    code: "—", color: "#4e5754", program: "Custom miles", pointValue: valuationFor("Custom miles"), bagFees: [40, 50, 150],
    earningRules: [{ id: "custom", label: "Custom earning rule", basis: "eligibleSpend", rate: 5 }],
    statuses: { Member: 0 },
    verification: { status: "custom", reviewedOn: "2026-08-01", sources: [source("Your current program terms", "#method")] },
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
  }, verified([
    source("Delta Reserve terms", "https://www.americanexpress.com/en-us/account/get-started/deltareserve/earn-rewards"),
    source("First and second checked bag free", "https://www.delta.com/us/en/baggage/checked-baggage/first-checked-bag-free"),
  ], { ...checkedToday, effectiveFrom: "2026-06-04" })),
  "Delta SkyMiles Platinum": card({
    issuer: "American Express", program: "SkyMiles", annualFee: 350, airline: "Delta", airlineRate: 3, otherRate: 1, freeBags: 2, color: "#4f565c",
  }, verified([
    source("Delta SkyMiles cards", "https://www.americanexpress.com/us/credit-cards/category/delta-skymiles/"),
    source("First and second checked bag free", "https://www.delta.com/us/en/baggage/checked-baggage/first-checked-bag-free"),
  ], { ...checkedToday, effectiveFrom: "2026-06-04" })),
  // United's 2026 structure pays 3 base miles plus the Premier bonus on the
  // flight, then 3 more for carrying a United card plus a card-specific bonus.
  // Both card-driven parts live in airlineRate so the two sides never
  // double-count: Explorer 3+3=6, Quest 3+4=7, Club Infinite 3+5=8. A general
  // member paying with Club Infinite therefore totals United's advertised 11x.
  "United Explorer": card({
    issuer: "Chase", program: "MileagePlus", annualFee: 150, airline: "United", airlineRate: 6, otherRate: 1, freeBags: 1, color: "#173b72",
  }, verified(cardSource("United Explorer benefits", "https://www.chase.com/personal/credit-cards/united/united-explorer-card"), checkedToday)),
  "United Quest": card({
    issuer: "Chase", program: "MileagePlus", annualFee: 350, airline: "United", airlineRate: 7, otherRate: 1, freeBags: 2, color: "#465563",
  }, verified(cardSource("United Quest card", "https://www.nerdwallet.com/credit-cards/reviews/united-quest"), checkedToday)),
  "United Club Infinite": card({
    issuer: "Chase", program: "MileagePlus", annualFee: 695, airline: "United", airlineRate: 8, otherRate: 1, freeBags: 2, color: "#101820",
  }, verified(cardSource("United Club Infinite review", "https://www.nerdwallet.com/reviews/credit-cards/united-club"), checkedToday)),
  "Citi / AAdvantage Executive": card({
    issuer: "Citi", program: "AAdvantage", annualFee: 595, airline: "American", airlineRate: 4, otherRate: 1, freeBags: 1, color: "#171c27",
  }, verified(cardSource("Citi AAdvantage Executive", "https://www.citi.com/credit-cards/citi-aadvantage-executive-credit-card/"), checkedToday)),
  "Alaska Airlines Visa": card({
    issuer: "Bank of America", program: "Atmos Rewards", annualFee: 95, airline: "Alaska", airlineRate: 3, otherRate: 1, freeBags: 1, color: "#07545a",
  }, verified(cardSource("Atmos Rewards Visa", "https://www.alaskaair.com/content/credit-card/visa-signature"), checkedToday)),
  "Southwest Priority": card({
    issuer: "Chase", program: "Rapid Rewards", annualFee: 229, airline: "Southwest", airlineRate: 4, otherRate: 1, freeBags: 1, color: "#2444a4",
  }, verified(cardSource("Southwest fees and card benefits", "https://www.southwest.com/html/customer-service/travel-fees.html"))),
  "JetBlue Plus": card({
    issuer: "Barclays", program: "TrueBlue", annualFee: 99, airline: "JetBlue", airlineRate: 6, otherRate: 1, freeBags: 1, color: "#002f65",
  }, verified(cardSource("JetBlue cards", "https://www.jetblue.com/trueblue/credit-cards"), checkedToday)),
  "Chase Sapphire Preferred": card({
    issuer: "Chase", program: "Ultimate Rewards", annualFee: 95, airline: null, airlineRate: 0, otherRate: 2, freeBags: 0, color: "#0c5b78",
  }, verified(cardSource("New Sapphire Preferred earn rates", "https://media.chase.com/news/Meet-the-New-Chase-Sapphire-Preferred"), checkedToday)),
  "Chase Sapphire Reserve": card({
    issuer: "Chase", program: "Ultimate Rewards", annualFee: 795, airline: null, airlineRate: 0, otherRate: 4, freeBags: 0, color: "#24201e",
  }, verified(cardSource("Sapphire Reserve", "https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve"), checkedToday)),
  "American Express Platinum": card({
    issuer: "American Express", program: "Membership Rewards", annualFee: 895, airline: null, airlineRate: 0, otherRate: 5, freeBags: 0, color: "#737b7f",
  }, verified(cardSource("Amex Platinum", "https://www.americanexpress.com/us/credit-cards/card/platinum/"), checkedToday)),
  "Capital One Venture X": card({
    issuer: "Capital One", program: "Capital One Miles", annualFee: 395, airline: null, airlineRate: 0, otherRate: 2, freeBags: 0, color: "#171719",
  }, verified(cardSource("Venture X", "https://www.capitalone.com/credit-cards/venture-x/"), checkedToday)),
  "Bilt Blue": card({
    issuer: "Wells Fargo", program: "Bilt Points", annualFee: 0, airline: null, airlineRate: 0, otherRate: 1, freeBags: 0, color: "#242424",
  }, verified(cardSource("Bilt Blue card review", "https://www.nerdwallet.com/credit-cards/reviews/bilt-blue-card"), checkedToday)),
  "No rewards card": card({
    issuer: "Cash / debit", program: "No rewards", annualFee: 0, airline: null, airlineRate: 0, otherRate: 0, freeBags: 0, color: "#555e5a",
  }, verified(cardSource("No rewards assumption", "#method"), checkedToday)),
};

validateCatalog(AIRLINES, CARDS);

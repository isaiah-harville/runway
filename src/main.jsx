import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ActionIcon,
  AppShell,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  MantineProvider,
  Modal,
  NumberInput,
  Paper,
  Progress,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
  createTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  ArrowDown,
  Check,
  CircleHelp,
  CreditCard,
  ExternalLink,
  Info,
  Plane,
  Plus,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
} from "lucide-react";
import "@mantine/core/styles.css";
import "./styles.css";
import { AIRLINES, CARDS } from "./data";
import { calculateTrip } from "./calculator";

const theme = createTheme({
  primaryColor: "ink",
  colors: {
    ink: ["#eef0ef", "#d5d9d7", "#b6bdb9", "#909b95", "#69756f", "#4a5751", "#33423b", "#22332c", "#172a22", "#0d1d17"],
    acid: ["#f8ffe7", "#efffc5", "#e4ff9e", "#d9ff76", "#cefa54", "#c3ef3f", "#b8dd35", "#9fc32b", "#85a823", "#6e8e19"],
  },
  fontFamily: '"DM Sans", sans-serif',
  headings: { fontFamily: '"Manrope", sans-serif' },
  defaultRadius: "md",
});

const usd = (value, decimals = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(value) ? value : 0);

const numberOrBlank = (value) => value === "" ? "" : Number(value);

function CardArtwork({ card, compact = false }) {
  return (
    <div className={`card-art ${compact ? "compact" : ""}`} style={{ "--card": card.color }}>
      <span className="chip" />
      <span className="card-program">{card.program}</span>
      <span className="card-issuer">{card.issuer}</span>
    </div>
  );
}

function MetricRow({ label, value, positive, tooltip }) {
  return (
    <Group justify="space-between" wrap="nowrap" className="metric-row">
      <Group gap={5} wrap="nowrap">
        <Text size="sm">{label}</Text>
        {tooltip && (
          <Tooltip label={tooltip} multiline w={260} withArrow>
            <Info size={13} />
          </Tooltip>
        )}
      </Group>
      <Text fw={650} className={positive ? "positive" : ""}>{value}</Text>
    </Group>
  );
}

function CustomCardModal({ opened, close, onSave }) {
  const [draft, setDraft] = useState({
    name: "", issuer: "", program: "Custom points", pointValue: 1.25,
    annualFee: 0, airline: null, airlineRate: 3, otherRate: 1, freeBags: 0, color: "#303936",
  });

  const patch = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const save = () => {
    if (!draft.name.trim()) return;
    onSave(draft.name.trim(), draft);
    close();
  };

  return (
    <Modal opened={opened} onClose={close} title="Add a card" centered size="lg" overlayProps={{ backgroundOpacity: .35, blur: 4 }}>
      <Text c="dimmed" size="sm" mb="lg">Use the earn rates and benefits shown in your card’s current terms.</Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput label="Card name" placeholder="My airline card" value={draft.name} onChange={(e) => patch("name", e.currentTarget.value)} />
        <TextInput label="Issuer" placeholder="Bank or issuer" value={draft.issuer} onChange={(e) => patch("issuer", e.currentTarget.value)} />
        <TextInput label="Rewards program" value={draft.program} onChange={(e) => patch("program", e.currentTarget.value)} />
        <NumberInput label="Estimated point value" suffix="¢" min={0} decimalScale={2} value={draft.pointValue} onChange={(v) => patch("pointValue", Number(v))} />
        <Select label="Airline-specific benefits" placeholder="None" clearable searchable data={Object.keys(AIRLINES).filter((x) => x !== "Other airline")} value={draft.airline} onChange={(v) => patch("airline", v)} />
        <NumberInput label="Annual fee" prefix="$" min={0} value={draft.annualFee} onChange={(v) => patch("annualFee", Number(v))} />
        <NumberInput label="Airline purchase earn" suffix="×" min={0} decimalScale={1} value={draft.airlineRate} onChange={(v) => patch("airlineRate", Number(v))} disabled={!draft.airline} />
        <NumberInput label="Other airfare earn" suffix="×" min={0} decimalScale={1} value={draft.otherRate} onChange={(v) => patch("otherRate", Number(v))} />
        <NumberInput label="Free checked bags" min={0} max={9} value={draft.freeBags} onChange={(v) => patch("freeBags", Number(v))} disabled={!draft.airline} />
      </SimpleGrid>
      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={close}>Cancel</Button>
        <Button leftSection={<Plus size={15} />} onClick={save} disabled={!draft.name.trim()}>Add card</Button>
      </Group>
    </Modal>
  );
}

function App() {
  const [cards, setCards] = useState(CARDS);
  const [airlineName, setAirlineName] = useState(null);
  const [cashFare, setCashFare] = useState("");
  const [eligibleFare, setEligibleFare] = useState("");
  const [cardName, setCardName] = useState(null);
  const [statusMap, setStatusMap] = useState({});
  const [earningRuleMap, setEarningRuleMap] = useState({});
  const [bags, setBags] = useState(null);
  const [roundTrip, setRoundTrip] = useState(null);
  const [annualFeeMode, setAnnualFeeMode] = useState(false);
  const [tripsPerYear, setTripsPerYear] = useState("");
  const [includeFlightMiles, setIncludeFlightMiles] = useState(false);
  const [airlinePointValue, setAirlinePointValue] = useState("");
  const [cardPointValue, setCardPointValue] = useState("");
  const [customAirline, setCustomAirline] = useState({
    name: "Custom airline",
    code: "AIR",
    program: "Custom miles",
    pointValue: 1.2,
    bagFee: 40,
    statusName: "My status",
    statusRate: 5,
    color: "#4e5754",
  });
  const [compareAirlineName, setCompareAirlineName] = useState(null);
  const [compareFare, setCompareFare] = useState("");
  const [compareEligibleFare, setCompareEligibleFare] = useState("");
  const [opened, { open, close }] = useDisclosure(false);

  const customAirlineProfile = useMemo(() => ({
    ...customAirline,
    earningRules: [{ id: "custom", label: "Custom earning rule", basis: "eligibleSpend", rate: customAirline.statusRate }],
    statuses: { [customAirline.statusName || "My status"]: 0 },
    verification: { status: "custom", reviewedOn: "2026-07-30", sources: [] },
  }), [customAirline]);
  const airline = airlineName === "Other airline" ? customAirlineProfile : AIRLINES[airlineName];
  const card = cards[cardName];
  const status = airlineName === "Other airline" ? Object.keys(airline?.statuses || {})[0] : statusMap[airlineName];
  const earningRuleId = airlineName === "Other airline" ? "custom" : earningRuleMap[airlineName];
  const earningRule = airline?.earningRules?.find((rule) => rule.id === earningRuleId);
  const airlineDisplayName = airlineName === "Other airline" ? customAirline.name : airlineName;
  const isReady = Boolean(
    airlineName
    && cardName
    && status
    && earningRule
    && cashFare !== ""
    && eligibleFare !== ""
    && bags !== null
    && roundTrip !== null
    && (!annualFeeMode || tripsPerYear !== "")
  );

  const result = useMemo(() => isReady ? calculateTrip({
    airlineName, airline, earningRule, cashFare, eligibleFare, card, status, bags: Number(bags),
    roundTrip, annualFeeMode, tripsPerYear, airlinePointValue, cardPointValue, includeFlightMiles,
  }) : null, [isReady, airlineName, airline, earningRule, cashFare, eligibleFare, card, status, bags, roundTrip, annualFeeMode, tripsPerYear, airlinePointValue, cardPointValue, includeFlightMiles]);

  const compareAirline = compareAirlineName === "Other airline" ? customAirlineProfile : AIRLINES[compareAirlineName];
  const compareStatus = compareAirlineName === "Other airline" ? Object.keys(compareAirline?.statuses || {})[0] : statusMap[compareAirlineName];
  const compareEarningRuleId = compareAirlineName === "Other airline" ? "custom" : earningRuleMap[compareAirlineName];
  const compareEarningRule = compareAirline?.earningRules?.find((rule) => rule.id === compareEarningRuleId);
  const compareAirlineDisplayName = compareAirlineName === "Other airline" ? customAirline.name : compareAirlineName;
  const comparisonReady = Boolean(result && compareAirlineName && compareStatus && compareEarningRule && compareFare !== "" && compareEligibleFare !== "");
  const comparison = useMemo(() => comparisonReady ? calculateTrip({
    airlineName: compareAirlineName, airline: compareAirline, earningRule: compareEarningRule, cashFare: compareFare,
    eligibleFare: compareEligibleFare, card, status: compareStatus, bags: Number(bags),
    roundTrip, annualFeeMode, tripsPerYear, airlinePointValue: compareAirline.pointValue,
    cardPointValue, includeFlightMiles,
  }) : null, [comparisonReady, compareAirlineName, compareAirline, compareEarningRule, compareFare, compareEligibleFare, card, compareStatus, bags, roundTrip, annualFeeMode, tripsPerYear, cardPointValue, includeFlightMiles]);

  const selectAirline = (value) => {
    setAirlineName(value);
    setAirlinePointValue(value === "Other airline" ? customAirline.pointValue : AIRLINES[value].pointValue);
    setStatusMap((current) => ({ ...current, [value]: null }));
    setEarningRuleMap((current) => ({ ...current, [value]: null }));
    if (compareAirlineName === value) setCompareAirlineName(null);
  };

  const selectCard = (value) => {
    if (value === "__custom") return open();
    setCardName(value);
    setCardPointValue(cards[value].pointValue);
  };

  const addCard = (name, nextCard) => {
    const customCard = {
      ...nextCard,
      verification: { status: "custom", reviewedOn: new Date().toISOString().slice(0, 10), sources: [] },
    };
    setCards((current) => ({ ...current, [name]: customCard }));
    setCardName(name);
    setCardPointValue(nextCard.pointValue);
  };

  const reset = () => {
    setAirlineName(null);
    setCashFare("");
    setEligibleFare("");
    setCardName(null);
    setStatusMap({});
    setEarningRuleMap({});
    setCardPointValue("");
    setAirlinePointValue("");
    setBags(null);
    setRoundTrip(null);
    setAnnualFeeMode(false);
    setTripsPerYear("");
    setIncludeFlightMiles(false);
    setCompareAirlineName(null);
    setCompareFare("");
    setCompareEligibleFare("");
  };

  const difference = comparison ? comparison.effectiveCost - result.effectiveCost : null;
  const firstWins = comparison ? difference >= 0 : null;
  const maxCost = comparison ? Math.max(result.effectiveCost, comparison.effectiveCost, 1) : 1;
  const verificationStatus = airline?.verification?.status === "verified" && card?.verification?.status === "verified"
    ? "verified"
    : airline?.verification?.status === "custom" || card?.verification?.status === "custom"
      ? "custom"
      : "review-needed";
  const basisLabel = (rule) => rule?.basis === "distance"
    ? "Itinerary distance"
    : rule?.basis === "segments"
      ? "Flight segments"
      : "Eligible airline fare";
  const basisDescription = (rule) => rule?.basis === "distance"
    ? "Total flown miles for this itinerary"
    : rule?.basis === "segments"
      ? "Total flight segments"
      : "Base fare plus eligible carrier surcharges";

  const sharePdf = async () => {
    if (!result) return;
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    pdf.setFillColor(21, 63, 49);
    pdf.rect(0, 0, 612, 150, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("RUNWAY", 44, 48);
    pdf.setFontSize(11);
    pdf.setTextColor(190, 210, 199);
    pdf.text(`${airlineDisplayName} · ${cardName}`, 44, 78);
    pdf.setFontSize(34);
    pdf.setTextColor(255, 255, 255);
    pdf.text(usd(result.effectiveCost, 2), 44, 123);
    pdf.setTextColor(24, 35, 31);
    pdf.setFontSize(10);
    pdf.text("ESTIMATED EFFECTIVE TRIP COST", 44, 180);
    const rows = [
      ["Ticket price", usd(Number(cashFare), 2)],
      ["Checked bag fees", usd(result.bagCost, 2)],
      ["Card reward value", `-${usd(result.cardValue, 2)}`],
      ["Flight reward value", `-${usd(result.flightValue, 2)}`],
      ...(annualFeeMode ? [["Annual fee allocation", usd(result.feeShare, 2)]] : []),
      ["Effective trip cost", usd(result.effectiveCost, 2)],
    ];
    rows.forEach(([label, value], index) => {
      const y = 214 + index * 34;
      pdf.setDrawColor(225, 225, 220);
      pdf.line(44, y + 12, 568, y + 12);
      pdf.setFont("helvetica", index === rows.length - 1 ? "bold" : "normal");
      pdf.setFontSize(index === rows.length - 1 ? 12 : 10);
      pdf.text(label, 44, y);
      pdf.text(value, 568, y, { align: "right" });
    });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(105, 115, 110);
    pdf.text(`${status} · ${earningRule.label} · ${card.program} at ${cardPointValue}¢ · ${airline.program} at ${airlinePointValue}¢`, 44, 460);
    pdf.text("Estimate only. Verify current card and airline terms before booking.", 44, 480);
    pdf.text("runway.harville.dev", 44, 720);

    const blob = pdf.output("blob");
    const file = new File([blob], "runway-fare-analysis.pdf", { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: "Runway fare analysis", text: `${airlineDisplayName}: ${usd(result.effectiveCost, 2)} effective cost`, files: [file] });
    } else {
      pdf.save(file.name);
    }
  };

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <AppShell header={{ height: 68 }}>
        <AppShell.Header className="app-header">
          <Group h="100%" justify="space-between" className="header-inner">
            <a className="wordmark" href="#"><span><Plane size={17} /></span>RUNWAY</a>
            <Group gap="xl" visibleFrom="sm">
              <a href="#calculator">Calculator</a>
              <a href="#method">Method</a>
              <a href="#sources">Sources</a>
            </Group>
            <Tooltip label="Estimates are based on editable assumptions">
              <ActionIcon variant="subtle" color="gray" radius="xl" aria-label="About this calculator"><CircleHelp size={19} /></ActionIcon>
            </Tooltip>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <section className="hero">
            <Badge variant="light" color="ink" leftSection={<Sparkles size={12} />}>Flight value, decoded</Badge>
            <h1>Don’t book the fare.<br />Book the <em>value.</em></h1>
            <Text>A side-by-side cost analysis for your airline, credit card, loyalty status, and travel habits.</Text>
          </section>

          <section id="calculator" className="calculator-shell">
            <Paper className="input-panel" radius="lg">
              <Group justify="space-between" mb="xl">
                <div>
                  <Text className="step-label">01 / YOUR TRIP</Text>
                  <Text fw={700} size="xl">Build the calculation</Text>
                </div>
                <ActionIcon variant="subtle" color="gray" onClick={reset} aria-label="Reset calculator"><RotateCcw size={17} /></ActionIcon>
              </Group>

              <Stack gap="lg">
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <Select label="Airline" placeholder="Choose an airline" searchable data={Object.keys(AIRLINES)} value={airlineName} onChange={selectAirline} allowDeselect={false} />
                  <Select
                    label="Loyalty status"
                    placeholder={airline ? "Choose your status" : "Select an airline first"}
                    data={Object.keys(airline?.statuses || {})}
                    value={status}
                    onChange={(value) => setStatusMap((current) => ({ ...current, [airlineName]: value }))}
                    allowDeselect={false}
                    disabled={!airline}
                  />
                </SimpleGrid>

                {airlineName === "Other airline" && (
                  <Paper withBorder p="md" radius="md">
                    <Group gap={6} mb="md"><Plus size={14} /><Text size="sm" fw={700}>Custom airline profile</Text></Group>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                      <TextInput label="Airline name" value={customAirline.name} onChange={(e) => setCustomAirline((x) => ({ ...x, name: e.currentTarget.value }))} />
                      <TextInput label="Loyalty program" value={customAirline.program} onChange={(e) => setCustomAirline((x) => ({ ...x, program: e.currentTarget.value }))} />
                      <TextInput label="Your status" value={customAirline.statusName} onChange={(e) => setCustomAirline((x) => ({ ...x, statusName: e.currentTarget.value }))} />
                      <NumberInput label="Miles earned on fare" suffix="×" min={0} decimalScale={2} value={customAirline.statusRate} onChange={(v) => setCustomAirline((x) => ({ ...x, statusRate: Number(v) }))} />
                      <NumberInput label="First checked bag" prefix="$" min={0} value={customAirline.bagFee} onChange={(v) => setCustomAirline((x) => ({ ...x, bagFee: Number(v) }))} />
                      <NumberInput label="Estimated mile value" suffix="¢" min={0} decimalScale={2} value={customAirline.pointValue} onChange={(v) => {
                        setCustomAirline((x) => ({ ...x, pointValue: Number(v) }));
                        setAirlinePointValue(Number(v));
                      }} />
                    </SimpleGrid>
                  </Paper>
                )}

                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <Select
                    label="Fare / earning rule"
                    placeholder={airline ? "Choose the applicable rule" : "Select an airline first"}
                    data={(airline?.earningRules || []).map((rule) => ({ value: rule.id, label: rule.label }))}
                    value={earningRuleId}
                    onChange={(value) => setEarningRuleMap((current) => ({ ...current, [airlineName]: value }))}
                    allowDeselect={false}
                    disabled={!airline || airlineName === "Other airline"}
                    description={earningRule?.note}
                  />
                  <NumberInput label="Ticket price" placeholder="Enter total" description="Total charged to your card" prefix="$" min={0} decimalScale={2} value={cashFare} onChange={(v) => setCashFare(numberOrBlank(v))} />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <NumberInput
                    label={basisLabel(earningRule)}
                    placeholder={earningRule?.basis === "distance" ? "Enter itinerary miles" : "Enter eligible amount"}
                    description={basisDescription(earningRule)}
                    prefix={earningRule?.basis === "eligibleSpend" ? "$" : undefined}
                    min={0}
                    decimalScale={earningRule?.basis === "eligibleSpend" ? 2 : 0}
                    value={eligibleFare}
                    onChange={(v) => setEligibleFare(numberOrBlank(v))}
                    disabled={!earningRule}
                  />
                </SimpleGrid>

                <Divider />

                <Select
                  label="Card used to pay"
                  placeholder="Choose a card"
                  searchable
                  data={[
                    {
                      group: "Airline cards",
                      items: Object.entries(cards).filter(([, item]) => item.airline).map(([value]) => ({ value, label: value })),
                    },
                    {
                      group: "Flexible rewards",
                      items: Object.entries(cards).filter(([, item]) => !item.airline).map(([value]) => ({ value, label: value })),
                    },
                    {
                      group: "Custom",
                      items: [{ value: "__custom", label: "+ Add a custom card" }],
                    },
                  ]}
                  value={cardName}
                  onChange={selectCard}
                  allowDeselect={false}
                  renderOption={({ option }) => option.value === "__custom" ? (
                    <Group gap="xs"><Plus size={15} /><Text size="sm" fw={600}>{option.label}</Text></Group>
                  ) : (
                    <Group gap="sm" wrap="nowrap">
                      <span className="option-dot" style={{ background: cards[option.value]?.color }} />
                      <div><Text size="sm" fw={600}>{option.label}</Text><Text size="xs" c="dimmed">{cards[option.value]?.issuer} · {usd(cards[option.value]?.annualFee)}/yr</Text></div>
                    </Group>
                  )}
                />

                {card && (
                  <Paper withBorder p="md" radius="md" className="selected-card">
                    <CardArtwork card={card} />
                    <div>
                      <Text fw={700}>{cardName}</Text>
                      <Text size="sm" c="dimmed">{card.issuer} · {card.program}</Text>
                      <Group gap={6} mt={9}>
                        <Badge variant="light" color="gray">{card.airline === airlineName ? card.airlineRate : card.otherRate}× this fare</Badge>
                        <Badge variant="light" color="gray">{usd(card.annualFee)}/yr</Badge>
                      </Group>
                    </div>
                  </Paper>
                )}

                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <div>
                    <Text size="sm" fw={500} mb={7}>Checked bags</Text>
                    <SegmentedControl fullWidth data={["0", "1", "2", "3"]} value={bags} onChange={setBags} />
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb={7}>Trip type</Text>
                    <SegmentedControl fullWidth data={[{ label: "One way", value: "one" }, { label: "Round trip", value: "round" }]} value={roundTrip === null ? null : (roundTrip ? "round" : "one")} onChange={(v) => setRoundTrip(v === "round")} />
                  </div>
                </SimpleGrid>

                <Paper p="md" radius="md" className="assumptions">
                  <Group justify="space-between" mb={annualFeeMode ? "md" : 0}>
                    <div><Text size="sm" fw={600}>Allocate the card’s annual fee</Text><Text size="xs" c="dimmed">Optional: spread it across trips this year</Text></div>
                    <Switch checked={annualFeeMode} onChange={(e) => setAnnualFeeMode(e.currentTarget.checked)} />
                  </Group>
                  {annualFeeMode && (
                    <Box px={4}>
                      <NumberInput label="Trips per year" placeholder="Enter trip count" min={1} max={100} value={tripsPerYear} onChange={(v) => setTripsPerYear(numberOrBlank(v))} />
                    </Box>
                  )}
                </Paper>
              </Stack>
            </Paper>

            <Paper className="result-panel" radius="lg">
              {!result ? (
                <div className="result-empty">
                  <ThemeIcon size={52} radius="xl" variant="light" color="acid"><Plane size={24} /></ThemeIcon>
                  <Text className="step-label light">02 / YOUR ANALYSIS</Text>
                  <Text fw={700} size="xl">Your effective cost will appear here</Text>
                  <Text size="sm">Complete every trip field to calculate the fare.</Text>
                </div>
              ) : (
                <>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text className="step-label light">02 / ESTIMATED EFFECTIVE COST</Text>
                  <Text className="result-price">{usd(result.effectiveCost, 2)}</Text>
                  <Text size="sm" className="result-sub">after estimated rewards and trip costs</Text>
                </div>
                <div className="airline-roundel" style={{ background: airline.color }}>{airline.code}</div>
              </Group>

              <Stack gap={1} className="calculation-lines">
                <MetricRow label="Ticket price" value={usd(cashFare, 2)} />
                <MetricRow label="Checked bag fees" value={result.bagCost ? `+${usd(result.bagCost, 2)}` : "Included"} positive={!result.bagCost} tooltip={`${result.freeBags} bag(s) covered by the strongest modeled card or status benefit. Benefits are not stacked.`} />
                {annualFeeMode && <MetricRow label="Annual fee allocation" value={`+${usd(result.feeShare, 2)}`} />}
                <MetricRow label="Card reward value" value={`−${usd(result.cardValue, 2)}`} positive />
                <MetricRow label="Flight reward value" value={`−${usd(result.flightValue, 2)}`} positive />
                <Divider my="sm" color="rgba(255,255,255,.18)" />
                <MetricRow label="Effective trip cost" value={usd(result.effectiveCost, 2)} />
              </Stack>

              <SimpleGrid cols={2} className="earn-cards">
                <Paper p="md" radius="md">
                  <ThemeIcon variant="light" color="acid" mb="sm"><CreditCard size={17} /></ThemeIcon>
                  <Text className="mini-label">CARD EARN</Text>
                  <Text fw={700} size="lg">{Math.round(result.cardPoints).toLocaleString()} pts</Text>
                  <Text size="xs">{result.cardRate}× · about {usd(result.cardValue, 2)}</Text>
                </Paper>
                <Paper p="md" radius="md">
                  <ThemeIcon variant="light" color="acid" mb="sm"><Plane size={17} /></ThemeIcon>
                  <Text className="mini-label">FLIGHT EARN</Text>
                  <Text fw={700} size="lg">{Math.round(result.flightMiles).toLocaleString()} mi</Text>
                  <Text size="xs">{result.statusRate}× · about {usd(result.flightValue, 2)}</Text>
                </Paper>
              </SimpleGrid>

              {card.airline && card.airline !== airlineName && (
                <Paper className="cross-airline-note" p="md" radius="md">
                  <Info size={17} />
                  <Text size="xs"><strong>{card.airline} benefits do not follow you.</strong> On this {airlineDisplayName} booking, the card earns {card.otherRate}× and its free-bag benefit does not apply. You can still earn {airline.program} miles from the flight.</Text>
                </Paper>
              )}

              <Paper className="value-controls" p="md" radius="md">
                <Group gap={6} mb="sm"><SlidersHorizontal size={14} /><Text size="xs" fw={700}>VALUATION ASSUMPTIONS</Text></Group>
                <SimpleGrid cols={2}>
                  <NumberInput size="xs" label={`${card.program} value`} suffix="¢" min={0} decimalScale={2} value={cardPointValue} onChange={(v) => setCardPointValue(Number(v))} />
                  <NumberInput size="xs" label={`${airline.program} value`} suffix="¢" min={0} decimalScale={2} value={airlinePointValue} onChange={(v) => setAirlinePointValue(Number(v))} />
                </SimpleGrid>
                <Switch mt="md" size="xs" label="Include miles earned from flying" checked={includeFlightMiles} onChange={(e) => setIncludeFlightMiles(e.currentTarget.checked)} />
              </Paper>
              <Paper className="verification-note" p="md" radius="md">
                <Group justify="space-between" align="center">
                  <div>
                    <Text size="xs" fw={700}>
                      {verificationStatus === "verified" ? "RULES SOURCE-CHECKED" : verificationStatus === "custom" ? "CUSTOM ASSUMPTIONS" : "REVIEW BEFORE BOOKING"}
                    </Text>
                    <Text size="xs">
                      {verificationStatus === "verified"
                        ? `Airline and card rules reviewed ${airline.verification.reviewedOn}. Point values remain your estimate.`
                        : "At least one selected preset has not completed a full current-terms review."}
                    </Text>
                  </div>
                  <Badge color={verificationStatus === "verified" ? "lime" : "yellow"} variant="light">
                    {verificationStatus === "verified" ? "Verified" : verificationStatus === "custom" ? "Custom" : "Check terms"}
                  </Badge>
                </Group>
                <Group gap="md" mt="sm">
                  {[...(airline.verification?.sources || []), ...(card.verification?.sources || [])].map((item) => (
                    <a key={`${item.label}-${item.url}`} href={item.url} target={item.url.startsWith("#") ? undefined : "_blank"} rel="noreferrer">
                      {item.label} <ExternalLink size={11} />
                    </a>
                  ))}
                </Group>
              </Paper>
              <Button className="share-button" fullWidth mt="md" variant="white" leftSection={<Share2 size={16} />} onClick={sharePdf}>
                Share analysis as PDF
              </Button>
                </>
              )}
            </Paper>
          </section>

          {result && <section className="comparison-section">
            <div className="section-title">
              <Text className="step-label">03 / SIDE BY SIDE</Text>
              <h2>Does the cheaper fare actually win?</h2>
              <Text c="dimmed">Compare another airline with the same card and baggage assumptions.</Text>
            </div>

            <Paper className="comparison-paper" radius="lg">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                <div className="flight-column">
                  <Group justify="space-between">
                    <Group><div className="airline-roundel small" style={{ background: airline.color }}>{airline.code}</div><div><Text size="xs" c="dimmed">CURRENT CHOICE</Text><Text fw={700}>{airlineDisplayName}</Text></div></Group>
                    <Text fw={700} size="xl">{usd(cashFare)}</Text>
                  </Group>
                  <Progress value={(result.effectiveCost / maxCost) * 100} color={airline.color} size="sm" mt="xl" />
                  <Group justify="space-between" mt="xs"><Text size="sm" c="dimmed">Effective cost</Text><Text fw={700}>{usd(result.effectiveCost, 2)}</Text></Group>
                </div>

                <div className="flight-column second">
                  <SimpleGrid cols={2}>
                    <Select label="Compare with" placeholder="Choose airline" searchable data={Object.keys(AIRLINES).filter((x) => x !== airlineName)} value={compareAirlineName} onChange={setCompareAirlineName} allowDeselect={false} />
                    <NumberInput label="Ticket price" placeholder="Enter total" prefix="$" min={0} value={compareFare} onChange={(v) => setCompareFare(numberOrBlank(v))} />
                  </SimpleGrid>
                  <Group mt="sm" gap="sm">
                    <Select
                      className="status-compact"
                      label="Status"
                      placeholder={compareAirline ? "Choose status" : "Select airline first"}
                      data={Object.keys(compareAirline?.statuses || {})}
                      value={compareStatus}
                      onChange={(value) => setStatusMap((current) => ({ ...current, [compareAirlineName]: value }))}
                      allowDeselect={false}
                      disabled={!compareAirline}
                    />
                    <Select
                      className="status-compact"
                      label="Fare / earning rule"
                      placeholder={compareAirline ? "Choose rule" : "Select airline first"}
                      data={(compareAirline?.earningRules || []).map((rule) => ({ value: rule.id, label: rule.label }))}
                      value={compareEarningRuleId}
                      onChange={(value) => setEarningRuleMap((current) => ({ ...current, [compareAirlineName]: value }))}
                      allowDeselect={false}
                      disabled={!compareAirline || compareAirlineName === "Other airline"}
                    />
                  </Group>
                  <NumberInput
                    mt="sm"
                    label={basisLabel(compareEarningRule)}
                    placeholder={compareEarningRule?.basis === "distance" ? "Enter itinerary miles" : "Enter eligible amount"}
                    prefix={compareEarningRule?.basis === "eligibleSpend" ? "$" : undefined}
                    min={0}
                    value={compareEligibleFare}
                    onChange={(v) => setCompareEligibleFare(numberOrBlank(v))}
                    disabled={!compareEarningRule}
                  />
                  {comparison && (
                    <>
                      <Progress value={(comparison.effectiveCost / maxCost) * 100} color={compareAirline.color} size="sm" mt="xl" />
                      <Group justify="space-between" mt="xs"><Text size="sm" c="dimmed">Effective cost</Text><Text fw={700}>{usd(comparison.effectiveCost, 2)}</Text></Group>
                    </>
                  )}
                </div>
              </SimpleGrid>

              {comparison && <div className="verdict">
                <ThemeIcon size={44} radius="xl" color="acid"><Check size={21} /></ThemeIcon>
                <div>
                  <Text className="mini-label">BEST ESTIMATED VALUE</Text>
                  <h3>{firstWins ? airlineDisplayName : compareAirlineDisplayName} saves {usd(Math.abs(difference), 2)}</h3>
                  <Text size="sm">
                    {firstWins
                      ? `${airlineDisplayName} keeps the lead after card rewards, flight miles, baggage, and selected fee allocation.`
                      : `${compareAirlineDisplayName} overcomes the sticker-price difference once your selected benefits are counted.`}
                  </Text>
                </div>
              </div>}
            </Paper>
          </section>}

          <section id="method" className="method-section">
            <div>
              <Text className="step-label">THE METHOD</Text>
              <h2>Cash out.<br />Value back.</h2>
            </div>
            <div className="equation">
              <div><WalletCards size={20} /><Text fw={700}>Fare + fees</Text><Text size="xs">Actual cash outlay</Text></div>
              <ArrowDown size={17} />
              <div><Sparkles size={20} /><Text fw={700}>Rewards value</Text><Text size="xs">Card points + flight miles</Text></div>
              <ArrowDown size={17} />
              <div className="equation-total"><Text fw={700}>Effective cost</Text><Text size="xs">One comparable estimate</Text></div>
            </div>
          </section>

          <footer id="sources">
            <a className="wordmark" href="#"><span><Plane size={15} /></span>RUNWAY</a>
            <Text size="xs">Estimates only. Benefits, earning rules, and valuations change; verify before booking.</Text>
            <Group gap="lg">
              <a href="https://www.americanexpress.com/en-us/account/get-started/deltareserve/earn-rewards" target="_blank" rel="noreferrer">Amex <ExternalLink size={11} /></a>
              <a href="https://www.delta.com/us/en/skymiles/how-to-earn-miles/overview" target="_blank" rel="noreferrer">Delta <ExternalLink size={11} /></a>
              <a href="https://www.chase.com/personal/credit-cards/united/united-explorer-card" target="_blank" rel="noreferrer">Chase <ExternalLink size={11} /></a>
            </Group>
          </footer>
        </AppShell.Main>
      </AppShell>
      <CustomCardModal opened={opened} close={close} onSave={addCard} />
    </MantineProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);

import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ActionIcon,
  AppShell,
  Badge,
  Box,
  Button,
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
  ArrowLeftRight,
  CircleHelp,
  CreditCard,
  ExternalLink,
  Info,
  Plane,
  Plus,
  RotateCcw,
  Scale,
  Share2,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
} from "lucide-react";
import "@mantine/core/styles.css";
import "./styles.css";
import { AIRLINES, CARDS } from "./data";
import { valuationFor } from "./valuations";
import { breakEvenFare, calculateTrip } from "./calculator";

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

const SLOTS = ["A", "B"];

const blankCustomAirline = (label) => ({
  name: `Custom airline ${label}`,
  code: "AIR",
  program: `Custom miles ${label}`,
  pointValue: 1.2,
  firstBagFee: 45,
  extraBagFee: 55,
  statusName: "My status",
  statusRate: 5,
  color: "#4e5754",
});

const blankFlight = (label) => ({
  airlineName: null,
  ruleId: null,
  fare: "",
  eligibleFare: "",
  customAirline: blankCustomAirline(label),
});

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

function CardArtwork({ card }) {
  return (
    <div className="card-art" style={{ "--card": card.color }}>
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

function FareColumn({
  label, flight, airline, status, rule, result, statusOptions,
  card, cardName, onPatch, onCustomPatch, onStatus, disabled, share,
}) {
  const displayName = flight.airlineName === "Other airline" ? flight.customAirline.name : flight.airlineName;

  return (
    <Paper className={`fare-column ${result ? "is-live" : ""}`} radius="lg" p="lg">
      <Group justify="space-between" align="center" mb="md">
        <Group gap="sm">
          <div className="fare-tag">{label}</div>
          {airline
            ? <div className="airline-roundel small" style={{ background: airline.color }}>{airline.code}</div>
            : <div className="airline-roundel small empty"><Plane size={15} /></div>}
          <div>
            <Text size="xs" c="dimmed">{airline ? airline.program : "No airline selected"}</Text>
            <Text fw={700}>{displayName || "Pick an airline"}</Text>
          </div>
        </Group>
      </Group>

      <Stack gap="sm">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Select
            label="Airline"
            placeholder="Choose an airline"
            searchable
            data={Object.keys(AIRLINES)}
            value={flight.airlineName}
            onChange={(value) => onPatch({ airlineName: value, ruleId: null })}
            allowDeselect={false}
            disabled={disabled}
          />
          <Select
            label="Your status"
            placeholder={airline ? "Choose your status" : "Select an airline first"}
            description={airline && flight.airlineName !== "Other airline" ? "Shared across both fares" : undefined}
            data={statusOptions}
            value={status ?? null}
            onChange={onStatus}
            allowDeselect={false}
            disabled={!airline || flight.airlineName === "Other airline"}
          />
        </SimpleGrid>

        {flight.airlineName === "Other airline" && (
          <Paper withBorder p="md" radius="md">
            <Group gap={6} mb="sm"><Plus size={14} /><Text size="sm" fw={700}>Custom airline profile</Text></Group>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <TextInput label="Airline name" value={flight.customAirline.name} onChange={(e) => onCustomPatch({ name: e.currentTarget.value })} />
              <TextInput label="Loyalty program" value={flight.customAirline.program} onChange={(e) => onCustomPatch({ program: e.currentTarget.value })} />
              <TextInput label="Your status" value={flight.customAirline.statusName} onChange={(e) => onCustomPatch({ statusName: e.currentTarget.value })} />
              <NumberInput label="Miles earned on fare" suffix="×" min={0} decimalScale={2} value={flight.customAirline.statusRate} onChange={(v) => onCustomPatch({ statusRate: Number(v) })} />
              <NumberInput label="First checked bag" prefix="$" min={0} value={flight.customAirline.firstBagFee} onChange={(v) => onCustomPatch({ firstBagFee: Number(v) })} />
              <NumberInput label="Each additional bag" prefix="$" min={0} value={flight.customAirline.extraBagFee} onChange={(v) => onCustomPatch({ extraBagFee: Number(v) })} />
              <NumberInput label="Estimated mile value" suffix="¢" min={0} decimalScale={2} value={flight.customAirline.pointValue} onChange={(v) => onCustomPatch({ pointValue: Number(v) })} />
            </SimpleGrid>
          </Paper>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Select
            label="Fare / earning rule"
            placeholder={airline ? "Choose the applicable rule" : "Select an airline first"}
            data={(airline?.earningRules || []).map((item) => ({ value: item.id, label: item.label }))}
            value={flight.ruleId}
            onChange={(value) => onPatch({ ruleId: value })}
            allowDeselect={false}
            disabled={!airline || flight.airlineName === "Other airline"}
            description={rule?.note}
          />
          <NumberInput
            label="Ticket price"
            placeholder="Enter total"
            description="Total charged to your card"
            prefix="$"
            min={0}
            decimalScale={2}
            value={flight.fare}
            onChange={(v) => onPatch({ fare: numberOrBlank(v) })}
            disabled={!airline}
          />
        </SimpleGrid>

        <NumberInput
          label={basisLabel(rule)}
          placeholder={rule?.basis === "distance" ? "Enter itinerary miles" : "Enter eligible amount"}
          description={basisDescription(rule)}
          prefix={rule?.basis === "eligibleSpend" ? "$" : undefined}
          min={0}
          decimalScale={rule?.basis === "eligibleSpend" ? 2 : 0}
          value={flight.eligibleFare}
          onChange={(v) => onPatch({ eligibleFare: numberOrBlank(v) })}
          disabled={!rule}
        />
      </Stack>

      {result ? (
        <div className="fare-outcome">
          <Group justify="space-between" align="flex-end">
            <div>
              <Text className="mini-label">EFFECTIVE COST</Text>
              <Text className="fare-price">{usd(result.effectiveCost, 2)}</Text>
            </div>
            <Text size="sm" c="dimmed">{usd(Number(flight.fare), 2)} sticker</Text>
          </Group>
          <Progress value={share} color={airline.color} size="sm" mt="md" />
          <Stack gap={1} mt="md">
            <MetricRow label="Checked bag fees" value={result.bagCost ? `+${usd(result.bagCost, 2)}` : "Included"} positive={!result.bagCost} tooltip={`${result.freeBags} bag(s) covered by the strongest modeled card or status benefit. Benefits are not stacked.`} />
            {result.feeShare > 0 && <MetricRow label="Annual fee allocation" value={`+${usd(result.feeShare, 2)}`} />}
            <MetricRow label={`Card earn · ${result.cardRate}×`} value={`−${usd(result.cardValue, 2)}`} positive />
            <MetricRow label={`Flight earn · ${result.statusRate}×`} value={`−${usd(result.flightValue, 2)}`} positive />
          </Stack>
          {card?.airline && card.airline !== flight.airlineName && (
            <Paper className="cross-airline-note" p="sm" radius="md" mt="md">
              <Info size={15} />
              <Text size="xs">
                <strong>{cardName} benefits stay home.</strong> On {displayName} it earns {card.otherRate}× and the free-bag benefit does not apply.
              </Text>
            </Paper>
          )}
        </div>
      ) : (
        <div className="fare-outcome empty">
          <Text size="sm" c="dimmed">Fill in the airline, status, fare rule, price, and eligible amount to price this option.</Text>
        </div>
      )}
    </Paper>
  );
}

function App() {
  const [cards, setCards] = useState(CARDS);
  const [cardName, setCardName] = useState(null);
  const [statusMap, setStatusMap] = useState({});
  const [flights, setFlights] = useState([blankFlight("A"), blankFlight("B")]);
  const [bags, setBags] = useState(null);
  const [roundTrip, setRoundTrip] = useState(null);
  const [annualFeeMode, setAnnualFeeMode] = useState(false);
  const [tripsPerYear, setTripsPerYear] = useState("");
  const [includeFlightMiles, setIncludeFlightMiles] = useState(true);
  const [programValues, setProgramValues] = useState({});
  const [opened, { open, close }] = useDisclosure(false);

  const card = cards[cardName];
  const valueOf = (program) => programValues[program] ?? valuationFor(program);

  const patchFlight = (index, patch) => setFlights((current) =>
    current.map((flight, i) => i === index ? { ...flight, ...patch } : flight));
  const patchCustomAirline = (index, patch) => setFlights((current) =>
    current.map((flight, i) => i === index ? { ...flight, customAirline: { ...flight.customAirline, ...patch } } : flight));

  const resolved = useMemo(() => flights.map((flight) => {
    const custom = flight.customAirline;
    const airline = flight.airlineName === "Other airline"
      ? {
        ...custom,
        bagFees: [custom.firstBagFee, custom.extraBagFee, custom.extraBagFee],
        earningRules: [{ id: "custom", label: "Custom earning rule", basis: "eligibleSpend", rate: custom.statusRate }],
        statuses: { [custom.statusName || "My status"]: 0 },
        verification: { status: "custom", reviewedOn: "2026-08-01", sources: [] },
      }
      : AIRLINES[flight.airlineName];
    const status = flight.airlineName === "Other airline"
      ? Object.keys(airline?.statuses || {})[0]
      : statusMap[flight.airlineName];
    const ruleId = flight.airlineName === "Other airline" ? "custom" : flight.ruleId;
    const rule = airline?.earningRules?.find((item) => item.id === ruleId);
    const displayName = flight.airlineName === "Other airline" ? custom.name : flight.airlineName;
    return { airline, status, rule, displayName };
  }), [flights, statusMap]);

  const sharedReady = Boolean(cardName && bags !== null && roundTrip !== null && (!annualFeeMode || tripsPerYear !== ""));

  const tripFor = (index) => {
    const flight = flights[index];
    const { airline, status, rule } = resolved[index];
    if (!sharedReady || !airline || !status || !rule || flight.fare === "" || flight.eligibleFare === "") return null;
    return {
      airlineName: flight.airlineName,
      airline,
      earningRule: rule,
      cashFare: Number(flight.fare),
      eligibleFare: Number(flight.eligibleFare),
      card,
      status,
      bags: Number(bags),
      roundTrip,
      annualFeeMode,
      tripsPerYear,
      airlinePointValue: valueOf(airline.program),
      cardPointValue: valueOf(card.program),
      includeFlightMiles,
    };
  };

  const trips = [tripFor(0), tripFor(1)];
  const results = trips.map((trip) => trip ? calculateTrip(trip) : null);
  const bothPriced = Boolean(results[0] && results[1]);

  const difference = bothPriced ? results[1].effectiveCost - results[0].effectiveCost : null;
  const winner = bothPriced ? (difference >= 0 ? 0 : 1) : null;
  const loser = bothPriced ? 1 - winner : null;
  const maxCost = bothPriced ? Math.max(results[0].effectiveCost, results[1].effectiveCost, 1) : 1;

  // What each side's ticket price would have to be to tie the other side.
  const breakEven = bothPriced
    ? [breakEvenFare(trips[0], results[1].effectiveCost), breakEvenFare(trips[1], results[0].effectiveCost)]
    : [null, null];

  const selectCard = (value) => {
    if (value === "__custom") return open();
    setCardName(value);
  };

  const addCard = (name, nextCard) => {
    setCards((current) => ({
      ...current,
      [name]: { ...nextCard, verification: { status: "custom", reviewedOn: new Date().toISOString().slice(0, 10), sources: [] } },
    }));
    setProgramValues((current) => ({ ...current, [nextCard.program]: nextCard.pointValue }));
    setCardName(name);
  };

  const swap = () => setFlights((current) => [current[1], current[0]]);

  const reset = () => {
    setCardName(null);
    setStatusMap({});
    setFlights([blankFlight("A"), blankFlight("B")]);
    setBags(null);
    setRoundTrip(null);
    setAnnualFeeMode(false);
    setTripsPerYear("");
    setIncludeFlightMiles(true);
    setProgramValues({});
  };

  const verificationStatus = (() => {
    const entries = [card, ...resolved.map((item) => item.airline)].filter(Boolean);
    if (entries.some((item) => item.verification?.status === "custom")) return "custom";
    return entries.every((item) => item.verification?.status === "verified") ? "verified" : "review-needed";
  })();

  const sources = [card, ...resolved.map((item) => item.airline)]
    .filter(Boolean)
    .flatMap((item) => item.verification?.sources || []);

  const sharePdf = async () => {
    if (!bothPriced) return;
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "pt", format: "letter" });

    const M = 44;            // left margin
    const RIGHT = 568;       // right margin
    const COL_A = 400;       // right edge of the first airline's column
    const names = resolved.map((item) => item.displayName);
    const fares = flights.map((flight) => Number(flight.fare));

    const ink = () => pdf.setTextColor(24, 35, 31);
    const muted = () => pdf.setTextColor(105, 115, 110);
    const font = (weight, size) => { pdf.setFont("helvetica", weight); pdf.setFontSize(size); };
    const rule = (y, shade = 225) => { pdf.setDrawColor(shade, shade, shade); pdf.line(M, y, RIGHT, y); };

    let y = 0;
    const heading = (label) => {
      y += 30;
      font("bold", 9);
      pdf.setTextColor(120, 130, 124);
      pdf.text(label.toUpperCase(), M, y);
      y += 8;
      rule(y);
      y += 16;
    };
    // Wrapped body copy; returns the new cursor so sections stay independent.
    const paragraph = (text, size = 10, lead = 14) => {
      font("normal", size);
      ink();
      const lines = pdf.splitTextToSize(text, RIGHT - M);
      pdf.text(lines, M, y);
      y += lines.length * lead;
    };

    // --- Header band ---------------------------------------------------
    pdf.setFillColor(21, 63, 49);
    pdf.rect(0, 0, 612, 172, "F");
    font("bold", 13);
    pdf.setTextColor(255, 255, 255);
    pdf.text("RUNWAY", M, 44);
    font("normal", 9.5);
    pdf.setTextColor(170, 195, 182);
    pdf.text(`Fare comparison · ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, M, 62);

    font("bold", 25);
    pdf.setTextColor(255, 255, 255);
    pdf.text(pdf.splitTextToSize(`${names[winner]} is the better buy by ${usd(Math.abs(difference), 2)}`, RIGHT - M), M, 104);
    font("normal", 11);
    pdf.setTextColor(200, 220, 209);
    pdf.text(
      `${names[0]} ${usd(results[0].effectiveCost, 2)}   vs   ${names[1]} ${usd(results[1].effectiveCost, 2)}   (effective cost, after rewards)`,
      M,
      148,
    );
    y = 172;

    // --- What this compares --------------------------------------------
    heading("What this compares");
    paragraph(
      `Both fares are priced with the same wallet: paid with the ${cardName}, `
      + `${bags} checked bag${Number(bags) === 1 ? "" : "s"}, ${roundTrip ? "round trip" : "one way"}`
      + `${annualFeeMode ? `, with ${usd(card.annualFee)}/yr of annual fee split across ${tripsPerYear} trips` : ", with the annual fee excluded"}`
      + `. ${includeFlightMiles ? "Miles earned from flying are counted." : "Miles earned from flying are excluded."}`,
    );
    y += 4;
    resolved.forEach((item, index) => {
      font("normal", 9.5);
      muted();
      pdf.text(
        `${names[index]} — ${item.status} · ${item.rule.label} · fare entered ${usd(fares[index], 2)} `
        + `· ${item.airline.program} valued at ${valueOf(item.airline.program)}¢`,
        M,
        y,
      );
      y += 14;
    });

    // --- Cost breakdown -------------------------------------------------
    heading("How each fare adds up");
    font("bold", 9.5);
    muted();
    pdf.text("", M, y);
    pdf.text(names[0], COL_A, y, { align: "right" });
    pdf.text(names[1], RIGHT, y, { align: "right" });
    y += 6;
    rule(y, 235);
    y += 18;

    const row = (label, left, right, opts = {}) => {
      font(opts.bold ? "bold" : "normal", opts.bold ? 11 : 10);
      if (opts.bold) ink(); else pdf.setTextColor(60, 70, 65);
      pdf.text(label, M, y);
      pdf.text(left, COL_A, y, { align: "right" });
      pdf.text(right, RIGHT, y, { align: "right" });
      y += opts.gap ?? 20;
    };

    row("Ticket price", usd(fares[0], 2), usd(fares[1], 2));
    row(
      "+ Checked bag fees",
      results[0].bagCost ? usd(results[0].bagCost, 2) : "included",
      results[1].bagCost ? usd(results[1].bagCost, 2) : "included",
    );
    if (annualFeeMode) row("+ Annual fee share", usd(results[0].feeShare, 2), usd(results[1].feeShare, 2));
    // jsPDF's Helvetica is WinAnsi-encoded and has no U+2212, so PDF copy uses
    // an ASCII hyphen where the UI uses a true minus sign.
    row(
      `- Card rewards (${results[0].cardRate}× / ${results[1].cardRate}×)`,
      usd(results[0].cardValue, 2),
      usd(results[1].cardValue, 2),
    );
    row(
      `- Flight miles (${results[0].statusRate}× / ${results[1].statusRate}×)`,
      usd(results[0].flightValue, 2),
      usd(results[1].flightValue, 2),
      { gap: 12 },
    );
    rule(y, 180);
    y += 20;
    row("Effective cost", usd(results[0].effectiveCost, 2), usd(results[1].effectiveCost, 2), { bold: true });

    // --- Break-even ------------------------------------------------------
    heading("The break-even price");
    paragraph(
      "This is the ticket price at which the two options cost the same. "
      + "Everything else — status, card, bags, valuations — is held exactly as above.",
      10,
    );
    y += 8;

    [loser, winner].forEach((index) => {
      const item = breakEven[index];
      const other = names[1 - index];
      font("bold", 11);
      ink();
      pdf.text(`${names[index]}: ${item?.fare != null ? usd(item.fare, 2) : "no break-even price"}`, M, y);
      y += 15;
      font("normal", 9.5);
      muted();
      const explanation = item?.fare == null
        ? (item?.reason === "rewards-outpace-fare"
          ? `Modeled rewards are worth more than each added dollar of fare, so no price makes ${names[index]} lose.`
          : `Fixed costs alone put ${names[index]} past ${other}; no ticket price at or above $0 ties them.`)
        : index === winner
          ? `${names[index]} stays ahead until its fare rises past this — ${usd(item.fare - fares[index], 2)} above the ${usd(fares[index], 2)} you entered.`
          : `${names[index]} must come in at or below this to beat ${other} — ${usd(fares[index] - item.fare, 2)} below the ${usd(fares[index], 2)} you entered.`;
      const lines = pdf.splitTextToSize(explanation, RIGHT - M);
      pdf.text(lines, M, y);
      y += lines.length * 13 + 12;
    });

    // --- Caveats ---------------------------------------------------------
    heading("Before you book");
    font("normal", 9);
    muted();
    const caveats = [
      verificationStatus === "verified"
        ? "Airline and card rules were checked against the linked primary sources."
        : verificationStatus === "custom"
          ? "This comparison includes custom entries you supplied; they are not source-checked."
          : "At least one program here has not completed a full current-terms review.",
      "Point valuations are editorial estimates, not guaranteed redemption values. Changing them changes the winner.",
      "Bag fees, earning rules, and status benefits change often. Verify current terms before booking.",
    ];
    caveats.forEach((text) => {
      const lines = pdf.splitTextToSize(`•  ${text}`, RIGHT - M);
      pdf.text(lines, M, y);
      y += lines.length * 12 + 2;
    });

    font("normal", 9);
    pdf.setTextColor(140, 148, 144);
    pdf.text("runway.harville.dev", M, 762);

    const blob = pdf.output("blob");
    const file = new File([blob], "runway-fare-comparison.pdf", { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: "Runway fare comparison", text: `${names[winner]} is the better buy by ${usd(Math.abs(difference), 2)}`, files: [file] });
    } else {
      pdf.save(file.name);
    }
  };

  const programControls = [
    card && { program: card.program, key: `card-${card.program}` },
    ...resolved.map((item, index) => item.airline && { program: item.airline.program, key: `air-${index}` }),
  ].filter(Boolean).filter((item, index, list) => list.findIndex((x) => x.program === item.program) === index);

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <AppShell header={{ height: 68 }}>
        <AppShell.Header className="app-header">
          <Group h="100%" justify="space-between" className="header-inner">
            <a className="wordmark" href="#"><span><Plane size={17} /></span>RUNWAY</a>
            <Group gap="xl" visibleFrom="sm">
              <a href="#compare">Compare</a>
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
            <Text>
              Set your card and your status once. Runway prices both fares after rewards, bags, and fees —
              then tells you the exact ticket price where the answer flips.
            </Text>
          </section>

          <section id="compare" className="wallet-section">
            <Paper className="wallet-panel" radius="lg">
              <Group justify="space-between" mb="lg" align="flex-start">
                <div>
                  <Text className="step-label">01 / YOUR WALLET</Text>
                  <Text fw={700} size="xl">What you carry on every trip</Text>
                  <Text size="sm" c="dimmed">These apply to both fares below.</Text>
                </div>
                <ActionIcon variant="subtle" color="gray" onClick={reset} aria-label="Reset calculator"><RotateCcw size={17} /></ActionIcon>
              </Group>

              <div className="wallet-grid">
                <Stack gap="md">
                  <Select
                    label="Card used to pay"
                    placeholder="Choose a card"
                    searchable
                    data={[
                      { group: "Airline cards", items: Object.entries(cards).filter(([, item]) => item.airline).map(([value]) => ({ value, label: value })) },
                      { group: "Flexible rewards", items: Object.entries(cards).filter(([, item]) => !item.airline).map(([value]) => ({ value, label: value })) },
                      { group: "Custom", items: [{ value: "__custom", label: "+ Add a custom card" }] },
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
                          <Badge variant="light" color="gray">{card.airline ? `${card.airlineRate}× on ${card.airline}` : `${card.otherRate}× on airfare`}</Badge>
                          <Badge variant="light" color="gray">{usd(card.annualFee)}/yr</Badge>
                        </Group>
                      </div>
                    </Paper>
                  )}
                </Stack>

                <Stack gap="md">
                  <div>
                    <Text size="sm" fw={500} mb={7}>Checked bags</Text>
                    <SegmentedControl fullWidth data={["0", "1", "2", "3"]} value={bags} onChange={setBags} />
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb={7}>Trip type</Text>
                    <SegmentedControl fullWidth data={[{ label: "One way", value: "one" }, { label: "Round trip", value: "round" }]} value={roundTrip === null ? null : (roundTrip ? "round" : "one")} onChange={(v) => setRoundTrip(v === "round")} />
                  </div>
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
              </div>
            </Paper>
          </section>

          <section className="fares-section">
            <div className="section-title">
              <Group justify="space-between" align="flex-end">
                <div>
                  <Text className="step-label">02 / THE MATCHUP</Text>
                  <h2>Price both options.</h2>
                  <Text c="dimmed">Same wallet, same bags — only the airline changes.</Text>
                </div>
                <Button variant="default" leftSection={<ArrowLeftRight size={15} />} onClick={swap}>Swap sides</Button>
              </Group>
            </div>

            <div className="fares-grid">
              {SLOTS.map((label, index) => (
                <FareColumn
                  key={label}
                  label={label}
                  flight={flights[index]}
                  airline={resolved[index].airline}
                  status={resolved[index].status}
                  rule={resolved[index].rule}
                  result={results[index]}
                  statusOptions={Object.keys(resolved[index].airline?.statuses || {})}
                  card={card}
                  cardName={cardName}
                  onPatch={(patch) => patchFlight(index, patch)}
                  onCustomPatch={(patch) => patchCustomAirline(index, patch)}
                  onStatus={(value) => setStatusMap((current) => ({ ...current, [flights[index].airlineName]: value }))}
                  share={results[index] ? (results[index].effectiveCost / maxCost) * 100 : 0}
                />
              ))}
            </div>

            {!sharedReady && (
              <Paper className="gate-note" p="md" radius="md">
                <Info size={16} />
                <Text size="sm">Choose a card, bag count, and trip type above to price either fare.</Text>
              </Paper>
            )}
          </section>

          <section className="verdict-section">
            <Paper className="verdict-panel" radius="lg">
              {!bothPriced ? (
                <div className="verdict-empty">
                  <ThemeIcon size={52} radius="xl" variant="light" color="acid"><Scale size={24} /></ThemeIcon>
                  <Text className="step-label light">03 / THE VERDICT</Text>
                  <Text fw={700} size="xl">Your break-even price will appear here</Text>
                  <Text size="sm">Complete both fares to see which one wins and by how much room.</Text>
                </div>
              ) : (
                <>
                  <Text className="step-label light">03 / THE VERDICT</Text>
                  <h2 className="verdict-headline">
                    {resolved[winner].displayName} wins by {usd(Math.abs(difference), 2)}
                  </h2>
                  <Text className="verdict-sub">
                    After card rewards, flight miles, baggage{annualFeeMode ? ", and your annual fee share" : ""}.
                    {" "}{resolved[winner].displayName} costs {usd(results[winner].effectiveCost, 2)} against {usd(results[loser].effectiveCost, 2)}.
                  </Text>

                  <div className="breakeven-grid">
                    {SLOTS.map((label, index) => {
                      const item = breakEven[index];
                      const current = Number(flights[index].fare);
                      const isWinner = index === winner;
                      return (
                        <Paper key={label} className="breakeven-card" p="lg" radius="md">
                          <Group gap="sm" mb="sm">
                            <div className="airline-roundel small" style={{ background: resolved[index].airline.color }}>{resolved[index].airline.code}</div>
                            <Text fw={700}>{resolved[index].displayName}</Text>
                          </Group>
                          {item?.fare != null ? (
                            <>
                              <Text className="mini-label">{isWinner ? "COULD RISE TO" : "MUST DROP TO"}</Text>
                              <Text className="breakeven-price">{usd(item.fare, 2)}</Text>
                              <Text size="sm" className="breakeven-note">
                                {isWinner
                                  ? `You have ${usd(item.fare - current, 2)} of headroom over today’s ${usd(current, 2)} before ${resolved[loser].displayName} takes the lead.`
                                  : `That is ${usd(current - item.fare, 2)} below today’s ${usd(current, 2)}. At anything above it, ${resolved[winner].displayName} is the better buy.`}
                              </Text>
                            </>
                          ) : (
                            <>
                              <Text className="mini-label">NO BREAK-EVEN</Text>
                              <Text className="breakeven-price">—</Text>
                              <Text size="sm" className="breakeven-note">
                                {item?.reason === "rewards-outpace-fare"
                                  ? "Your modeled rewards are worth more than each dollar of fare, so raising the price never makes this option lose."
                                  : "No ticket price at or above $0 ties this matchup — fixed costs alone decide it."}
                              </Text>
                            </>
                          )}
                        </Paper>
                      );
                    })}
                  </div>

                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mt="md">
                    <Paper className="value-controls" p="md" radius="md">
                      <Group gap={6} mb="sm"><SlidersHorizontal size={14} /><Text size="xs" fw={700}>VALUATION ASSUMPTIONS</Text></Group>
                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        {programControls.map((item) => (
                          <NumberInput
                            key={item.key}
                            size="xs"
                            label={`${item.program} value`}
                            suffix="¢"
                            min={0}
                            decimalScale={2}
                            value={valueOf(item.program)}
                            onChange={(v) => setProgramValues((current) => ({ ...current, [item.program]: Number(v) }))}
                          />
                        ))}
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
                              ? "Both airlines and your card were reviewed against current terms. Point values remain your estimate."
                              : "At least one selected preset has not completed a full current-terms review."}
                          </Text>
                        </div>
                        <Badge color={verificationStatus === "verified" ? "lime" : "yellow"} variant="light">
                          {verificationStatus === "verified" ? "Verified" : verificationStatus === "custom" ? "Custom" : "Check terms"}
                        </Badge>
                      </Group>
                      <Group gap="md" mt="sm">
                        {sources.map((item) => (
                          <a key={`${item.label}-${item.url}`} href={item.url} target={item.url.startsWith("#") ? undefined : "_blank"} rel="noreferrer">
                            {item.label} <ExternalLink size={11} />
                          </a>
                        ))}
                      </Group>
                    </Paper>
                  </SimpleGrid>

                  <Button className="share-button" fullWidth mt="md" variant="white" leftSection={<Share2 size={16} />} onClick={sharePdf}>
                    Share comparison as PDF
                  </Button>
                </>
              )}
            </Paper>
          </section>

          <section id="method" className="method-section">
            <div>
              <Text className="step-label">THE METHOD</Text>
              <h2>Cash out.<br />Value back.</h2>
            </div>
            <div className="equation">
              <div><WalletCards size={20} /><Text fw={700}>Fare + fees</Text><Text size="xs">Actual cash outlay</Text></div>
              <ArrowDown size={17} />
              <div><CreditCard size={20} /><Text fw={700}>Rewards value</Text><Text size="xs">Card points + flight miles</Text></div>
              <ArrowDown size={17} />
              <div className="equation-total"><Text fw={700}>Break-even fare</Text><Text size="xs">The price where the answer flips</Text></div>
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

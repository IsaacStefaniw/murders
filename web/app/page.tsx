"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Apple, ArrowDown, ArrowRight, Brain, Check, ChevronRight, CircleDot,
  Dumbbell, ExternalLink, Footprints, Heart, Leaf, LineChart, LockKeyhole,
  Moon, Play, RefreshCcw, ShieldCheck, Sparkles, Target, TimerReset, Users,
  Wallet, Wind, X, Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const goals = [
  { id: "strength", label: "Build strength", icon: Dumbbell },
  { id: "sleep", label: "Sleep deeply", icon: Moon },
  { id: "nutrition", label: "Eat with intent", icon: Leaf },
  { id: "leadership", label: "Lead better", icon: Users },
  { id: "focus", label: "Work with focus", icon: Brain },
  { id: "mindfulness", label: "Find calm", icon: Wind },
  { id: "money", label: "Build financial capability", icon: Wallet },
  { id: "relationships", label: "Be more present", icon: Heart },
];

const frictions = [
  { id: "screen", label: "Late-night screen drift", cue: "Phone within reach", replacement: "Phone away · lights down · three-minute reset" },
  { id: "eating", label: "Unplanned eating", cue: "Stress plus easy access", replacement: "Pause · name the cue · pre-chosen alternative" },
  { id: "training", label: "Skipping planned training", cue: "All-or-nothing session", replacement: "Minimum viable session · keep the identity" },
  { id: "reactivity", label: "Reactive work habits", cue: "Incoming urgency", replacement: "One breath · one priority · deliberate response" },
  { id: "avoidance", label: "Avoiding the important task", cue: "Ambiguity or discomfort", replacement: "Define the first visible two-minute action" },
  { id: "urge", label: "An urge I want support with", cue: "Personal trigger", replacement: "Private interrupt plan · support remains free" },
];

const constraints = [
  "Family time is non-negotiable", "My work weeks change quickly",
  "I travel regularly", "I need short, decisive actions",
  "I am managing an injury", "I want ambitious targets",
];

/**
 * Three statements, not three counts.
 *
 * This was "177 practices, 0 plans to write yourself, 7 parts of your life".
 * Isaac's testers did not understand the numbers, and Isaac himself wrote
 * "178" when relaying that — which is the whole argument. A number that the
 * person who commissioned it cannot recall is not doing any work on a page a
 * stranger reads once. "177 practices" also answers a question nobody asked:
 * how much stuff do we have. These answer what it does for you.
 */
const heroPillars = [
  { lead: "It plans your week.", note: "Sessions, meals and practices at real times, around what you already have on." },
  { lead: "It changes when your week does.", note: "A bad night shortens the session and keeps the hard part, instead of cancelling it." },
  { lead: "It shows how good the evidence is.", note: "Every practice is rated — including the ones where the evidence is weak." },
];

const todayRows = [
  { id: "train", label: "Train", icon: Dumbbell, planned: "an upper-body session with its full list", action: "the hard lifts stay, the smaller exercises wait", reason: "Your heart-rate numbers are below your own normal this morning. The hard lifts stay; the smaller exercises come out.", signal: true },
  { id: "eat", label: "Eat", icon: Leaf, action: "Protein anchor 165–198g · kitchen closes 7:30pm", reason: "Three weeks of trend, never one heavy morning." },
  { id: "habits", label: "Habits", icon: TimerReset, action: "Phone docks outside the room at 9:45pm", reason: "The slip window is after 10pm, so the change happens before it." },
  { id: "work", label: "Work", icon: Brain, action: "Deep block 9–11, before the first meeting", reason: "3.2 of 7 target hours last week. That is a calendar problem." },
  { id: "money", label: "Money", icon: Wallet, action: "Sunday, 30 minutes: automate one transfer", reason: "Step one of six. Nothing else starts until it runs itself." },
  { id: "us", label: "Us", icon: Heart, action: "Five unhurried minutes at the door tonight", reason: "Small and repeatable beats the gesture you never schedule." },
  { id: "family", label: "Family", icon: Footprints, action: "Saturday 9:30 — the short loop, sized for the youngest", reason: "Outings that fit the smallest legs are the ones that happen." },
];

const pathwayContent = {
  train: {
    eyebrow: "TRAIN",
    title: "A strength program that learns from completed work.",
    inputs: ["The lifts you do now, and your best sets", "Equipment, training age and technique", "Injuries and movement limits", "Sleep, availability and session response"],
    outputs: ["Daily load, volume and exercise selection", "Progression and regression rules", "Sleep-informed changes with a reason", "Personal bests that change the next four weeks"],
    example: "100kg × 5 on every working set, reps held → next target 102.5kg",
  },
  eat: {
    eyebrow: "EAT",
    title: "Nutrition education that responds to trends—not one noisy day.",
    inputs: ["Goal, height, weight and relevant trends", "Current intake and training demand", "Food preferences, allergies and cooking reality", "Hunger, adherence and performance response"],
    outputs: ["A protein anchor and meal structure", "Training-day adjustments", "One clear change at a time", "Weekly feedback based on the trend"],
    example: "Three-week weight and performance trend → one energy-target review",
  },
  habits: {
    eyebrow: "HABITS & URGES",
    title: "Reduce the behaviour by redesigning the moment around it.",
    inputs: ["Cue, context and time of day", "The action that follows", "Immediate reward or relief", "What happened after a lapse"],
    outputs: ["An if–then interrupt in the real window", "Friction on the unwanted action", "A realistic replacement behaviour", "Fast recovery without shame"],
    example: "Phone within reach at 10:30pm → phone docks outside the room at 9:45pm",
  },
  work: {
    eyebrow: "WORK & LEADERSHIP",
    title: "Leadership development tied to behaviour in real moments.",
    inputs: ["Team and role context", "Meeting load and current pressure", "Behavioural goals", "Feedback and difficult moments"],
    outputs: ["A deep-work target the calendar can honour", "One leadership practice each week", "Meeting preparation and reflection prompts", "Observable behaviour signals"],
    example: "Reactive meeting pattern → pre-commit one question before responding",
  },
  money: {
    eyebrow: "MONEY",
    title: "One ordered ladder, with exactly one step live at a time.",
    inputs: ["Income rhythm and current automation", "Buffer, debt and their real rates", "What the money is actually for", "Month-to-month saving reality"],
    outputs: ["The single next step, in the right order", "A short weekly review", "Savings-rate trend rather than a monthly verdict", "Education on the boring, durable approach"],
    example: "Automation running and one month banked → the ladder moves to the three-month buffer",
  },
  us: {
    eyebrow: "RELATIONSHIP",
    title: "Small repeatable attention instead of the grand gesture.",
    inputs: ["Who this is for and your current rhythm", "What reliably gets crowded out", "The moments that already work", "Time and energy actually available"],
    outputs: ["One ritual that survives a bad week", "Protected attention, not a reminder", "The conversation you have been putting off", "It shrinks itself when the week is hard"],
    example: "A fortnight where the ritual kept slipping → the plan asks for less, not more",
  },
  family: {
    eyebrow: "FAMILY & ADVENTURE",
    title: "The weekend that actually happens.",
    inputs: ["Ages of the children", "Weekend and travel reality", "What each child responds to", "Appetite for the next trip"],
    outputs: ["One-on-one time with each child", "Outings sized to the youngest", "A trip planned early enough to look forward to", "Anticipation treated as part of the value"],
    example: "Youngest is four → the Saturday outing is sized for four-year-old legs",
  },
};

const evidence = [
  {
    type: "FRAMEWORK", title: "Capability · opportunity · motivation",
    finding: "COM-B treats behaviour as the result of whether a person can act, has the opportunity, and is sufficiently motivated.",
    source: "Michie, van Stralen & West, 2011", href: "https://pubmed.ncbi.nlm.nih.gov/21513547/",
  },
  {
    type: "META-ANALYSIS", title: "Progress must be visible",
    finding: "A meta-analysis found that interventions increasing progress monitoring improved goal attainment, especially when outcomes were recorded.",
    source: "Harkin et al., 2016", href: "https://pubmed.ncbi.nlm.nih.gov/26479070/",
  },
  {
    type: "SYSTEMATIC REVIEW", title: "Habits take longer than 21 days",
    finding: "Recent synthesis found typical habit-formation estimates around two months, with substantial variation by person and behaviour.",
    source: "Singh et al., 2024", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11641623/",
  },
  {
    type: "SYSTEMATIC REVIEW", title: "Mindfulness has bounded evidence",
    finding: "A systematic review found moderate evidence for improvements in anxiety, depression and pain, while cautioning against broader unsupported claims.",
    source: "Goyal et al., 2014", href: "https://pubmed.ncbi.nlm.nih.gov/24395196/",
  },
];

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="IntentNorth home">
      <span className="brand-mark" aria-hidden="true"><span /><span /></span>
      <span>Intent<em>North</em></span>
    </a>
  );
}

/**
 * The App Store is the destination, per docs/APP_STORE.md: "when approved, the
 * website gets the App Store badge above the fold as the primary CTA."
 *
 * Apple has not approved 1.0 yet, and a badge linking to a listing that does
 * not exist is worse than no badge — it is the one link a visitor is certain
 * to try. So the slot states the true status now and becomes the link the day
 * the listing goes live: set APP_STORE_URL and this changes itself.
 */
const APP_STORE_URL = "";

function AppStoreCta() {
  if (APP_STORE_URL) {
    return (
      <a className="cta-appstore" href={APP_STORE_URL}>
        <Apple aria-hidden="true" />
        <span><small>Download on the</small><strong>App Store</strong></span>
      </a>
    );
  }
  return (
    <span className="cta-appstore is-pending">
      <Apple aria-hidden="true" />
      <span><small>Coming to the</small><strong>App Store</strong></span>
      <em>iPhone · in review</em>
    </span>
  );
}

function BuildPlanButton({ onClick, inverse = false, compact = false, children = "Build my profile" }: {
  onClick: () => void; inverse?: boolean; compact?: boolean; children?: ReactNode;
}) {
  return (
    <Button onClick={onClick} className={`${inverse ? "cta-inverse" : "cta-primary"} ${compact ? "cta-compact" : ""}`} size="lg">
      {children}<ArrowRight aria-hidden="true" />
    </Button>
  );
}

function PlanBuilder({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedFrictions, setSelectedFrictions] = useState<string[]>([]);
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [sleep, setSleep] = useState("6.5");
  const [workload, setWorkload] = useState("High — an important quarter");
  const [commitment, setCommitment] = useState("");
  const [reserved, setReserved] = useState(false);

  const chosenLabels = useMemo(
    () => goals.filter((goal) => selectedGoals.includes(goal.id)).map((goal) => goal.label.toLowerCase()),
    [selectedGoals],
  );
  const chosenFriction = frictions.find((item) => selectedFrictions.includes(item.id));
  const progress = [6, 24, 42, 61, 81, 100][step] ?? 100;
  const progressLabel = step === 0 ? "How this works" : step < 5 ? `Profile step ${step} of 4` : "Personal plan reveal";

  function toggleLimited(value: string, setter: React.Dispatch<React.SetStateAction<string[]>>, limit: number) {
    setter((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : current.length < limit ? [...current, value] : current);
  }

  function continueFlow() {
    if (step === 4 && !commitment) {
      const outcomes = chosenLabels.length ? chosenLabels.join(", ") : "make meaningful progress";
      const subtraction = chosenFriction ? ` while reducing ${chosenFriction.label.toLowerCase()}` : "";
      setCommitment(`Over the next 12 weeks, I am committed to ${outcomes}${subtraction}—without sacrificing what matters most.`);
    }
    setStep((current) => Math.min(5, current + 1));
  }

  function saveProfilePreview() {
    window.localStorage.setItem("intent-os-profile-preview", JSON.stringify({
      selectedGoals, selectedFrictions, selectedConstraints, sleep, workload, commitment,
    }));
    setReserved(true);
  }

  function resetAndClose() {
    setOpen(false);
    window.setTimeout(() => { setStep(0); setReserved(false); }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => next ? setOpen(true) : resetAndClose()}>
      <DialogContent className="plan-dialog" showCloseButton={false}>
        <div className="plan-dialog-topline"><Logo /><button className="dialog-close" onClick={resetAndClose} aria-label="Close profile builder"><X /></button></div>
        <Progress className="plan-progress" value={progress} aria-label={`Profile builder ${progress}% complete`} />
        <div className="plan-progress-meta"><span>{progressLabel}</span><strong>{progress}%</strong></div>

        {step === 0 && (
          <div className="plan-intro">
            <DialogHeader><p className="section-kicker">YOUR OPERATING PROFILE</p><DialogTitle>Build around the person before building the plan.</DialogTitle><DialogDescription>Define what should improve, what needs to reduce and what your real life will allow. Then make the next 12 weeks explicit.</DialogDescription></DialogHeader>
            <div className="intro-proof-grid"><div><Target /><span>What moves forward</span></div><div><TimerReset /><span>What stops pulling you back</span></div><div><LineChart /><span>What the results change</span></div></div>
            <div className="disclosure-card"><Check /><p><strong>Your profile and first personal insight are free.</strong> Complete daily programs and ongoing optimisation are premium. Recovery, urge and hardest-moment support remain free—always.</p></div>
            <div className="profile-continuity"><ShieldCheck /><p><strong>Nothing you type here is sent anywhere.</strong> This preview is stored in this browser and nowhere else &mdash; there is no account, no database and no server holding it. Close the tab and it is gone. Carrying a profile across to the app is something we have not built yet.</p></div>
            <Button className="plan-next" onClick={() => setStep(1)}>Begin my profile <ArrowRight /></Button>
            <p className="plan-time">About five minutes · iPhone only today · Premium explained before commitment</p>
          </div>
        )}

        {step === 1 && (
          <div className="plan-step">
            <div className="step-heading"><span>01 / 04 · BUILD</span><DialogTitle>What would materially improve the next 12 weeks?</DialogTitle><DialogDescription>Choose up to four outcomes. The profile becomes more specific from here.</DialogDescription></div>
            <div className="goal-picker">{goals.map(({ id, label, icon: Icon }) => {
              const active = selectedGoals.includes(id);
              return <button key={id} type="button" className={active ? "goal-option active" : "goal-option"} onClick={() => toggleLimited(id, setSelectedGoals, 4)} aria-pressed={active}><Icon /><span>{label}</span><span className="goal-check">{active ? <Check /> : <ChevronRight />}</span></button>;
            })}</div>
            <div className="selected-count">{selectedGoals.length} of 4 selected</div>
          </div>
        )}

        {step === 2 && (
          <div className="plan-step">
            <div className="step-heading"><span>02 / 04 · REDUCE</span><DialogTitle>What keeps pulling you away from it?</DialogTitle><DialogDescription>Choose up to three patterns. The goal is not judgement—it is to redesign the moment before the automatic action.</DialogDescription></div>
            <div className="friction-picker">{frictions.map((item) => {
              const active = selectedFrictions.includes(item.id);
              return <button key={item.id} type="button" className={active ? "friction-option active" : "friction-option"} onClick={() => toggleLimited(item.id, setSelectedFrictions, 3)} aria-pressed={active}><span>{item.label}</span><small>{item.cue}</small><span className="goal-check">{active ? <Check /> : <ChevronRight />}</span></button>;
            })}</div>
            <div className="selected-count">{selectedFrictions.length} of 3 selected · optional</div>
          </div>
        )}

        {step === 3 && (
          <div className="plan-step">
            <div className="step-heading"><span>03 / 04 · CONTEXT</span><DialogTitle>Where are you actually starting from?</DialogTitle><DialogDescription>Only useful questions survive. Every answer must affect a program, protocol or next action.</DialogDescription></div>
            <div className="baseline-grid">
              <label><span>Typical sleep</span><div className="input-with-unit"><input value={sleep} onChange={(event) => setSleep(event.target.value)} inputMode="decimal" /><span>hours</span></div></label>
              <label><span>Current work pressure</span><select value={workload} onChange={(event) => setWorkload(event.target.value)}><option>Low — steady and predictable</option><option>Moderate — a normal operating week</option><option>High — an important quarter</option><option>Very high — launch, travel or transition</option></select></label>
              <fieldset><legend>What must the plan respect?</legend><div className="constraint-grid">{constraints.map((constraint) => {
                const active = selectedConstraints.includes(constraint);
                return <button key={constraint} type="button" className={active ? "constraint-option active" : "constraint-option"} onClick={() => toggleLimited(constraint, setSelectedConstraints, 6)} aria-pressed={active}>{active && <Check />}{constraint}</button>;
              })}</div></fieldset>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="plan-step commitment-step">
            <div className="step-heading"><span>04 / 04 · COMMIT</span><DialogTitle>Make the change explicit.</DialogTitle><DialogDescription>Your commitment returns with the architecture built around it.</DialogDescription></div>
            <div className="commitment-card"><label htmlFor="commitment">Over the next 12 weeks, I am committed to…</label><textarea id="commitment" value={commitment} onChange={(event) => setCommitment(event.target.value)} placeholder="e.g. build strength, sleep seven hours and stop letting late-night screen time set tomorrow’s ceiling" rows={5} /><div className="commitment-context"><span>{selectedGoals.length} goals</span><span>{selectedFrictions.length} patterns to reduce</span><span>{sleep}h sleep baseline</span></div></div>
          </div>
        )}

        {step === 5 && !reserved && (
          <div className="plan-reveal">
            <div className="reveal-head"><span className="reveal-ready"><Sparkles /> YOUR PLAN ARCHITECTURE IS READY</span><DialogTitle>“{commitment || "I am ready to make the next 12 weeks count."}”</DialogTitle></div>
            <div className="insight-card"><span>YOUR FIRST PERSONAL INSIGHT</span><strong>{chosenFriction ? `${chosenFriction.label} is not a character flaw. The leverage is changing the cue and making the replacement easier.` : Number.parseFloat(sleep) < 7 ? "Sleep is likely limiting both training progress and focused performance." : "Your greatest leverage is improving the feedback loop—not adding more activity."}</strong><p>{chosenFriction ? `First experiment: ${chosenFriction.replacement}.` : "IntentNorth would start by tuning today’s training to last night’s sleep, with the reason clearly stated."}</p></div>
            <div className="architecture-card"><div><span>BUILT FROM</span><strong>{selectedGoals.length || 3} goals · {selectedFrictions.length} friction patterns · {selectedConstraints.length + 7} inputs</strong></div><div className="architecture-path"><span>PROFILE</span><ArrowRight /><span>PLAN</span><ArrowRight /><span>RESULT</span><ArrowRight /><span>IMPROVE</span></div></div>
            <div className="always-free"><Heart /><div><strong>Hardest-moment support stays free.</strong><p>Urge, reset and lapse-recovery support are never placed behind the premium unlock.</p></div></div>
            <div className="premium-card"><div><span>PREMIUM ACCESS</span><strong>Your complete programs and daily actions</strong><p>Premium pricing is not yet published. Exact terms will be shown before payment.</p></div><Button className="plan-next" onClick={saveProfilePreview}>Save my profile <ArrowRight /></Button></div>
            <p className="plan-time">No payment is taken in this website preview.</p>
          </div>
        )}

        {step === 5 && reserved && (
          <div className="reserved-state"><span className="success-icon"><Check /></span><p className="section-kicker">PROFILE SAVED</p><DialogTitle>Your preview is saved on this device.</DialogTitle><DialogDescription>Premium checkout is not open here. Your profile remains in this browser so the journey can continue without pretending a payment flow exists.</DialogDescription><Button className="plan-next" onClick={resetAndClose}>Return to IntentNorth</Button></div>
        )}

        {step > 0 && step < 5 && (
          <div className="plan-actions"><Button variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</Button><Button className="plan-next" disabled={step === 1 && selectedGoals.length === 0} onClick={continueFlow}>{step === 4 ? "Build my profile preview" : "Continue"} <ArrowRight /></Button></div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PathwayDepth() {
  return (
    <Tabs defaultValue="train" className="depth-tabs">
      <TabsList variant="line" className="depth-tab-list" aria-label="The seven areas">
        <TabsTrigger value="train">Train</TabsTrigger><TabsTrigger value="eat">Eat</TabsTrigger><TabsTrigger value="habits">Habits</TabsTrigger><TabsTrigger value="work">Work</TabsTrigger><TabsTrigger value="money">Money</TabsTrigger><TabsTrigger value="us">Us</TabsTrigger><TabsTrigger value="family">Family</TabsTrigger>
      </TabsList>
      {Object.entries(pathwayContent).map(([key, pathway]) => (
        <TabsContent key={key} value={key} className="depth-panel">
          <div className="depth-summary"><p className="section-kicker">{pathway.eyebrow}</p><h3>{pathway.title}</h3><p>Real depth in each area, from one set of answers.</p><div className="depth-example"><span>ONE CONCRETE LOOP</span><strong>{pathway.example}</strong></div></div>
          <div className="depth-list"><span>IntentNorth LEARNS</span>{pathway.inputs.map((item) => <p key={item}><Check />{item}</p>)}</div>
          <div className="depth-list output-list"><span>THE PLAN CHANGES</span>{pathway.outputs.map((item) => <p key={item}><ArrowRight />{item}</p>)}</div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function BehaviourLoop() {
  return (
    <div className="behaviour-loop" aria-label="Behaviour change sequence">
      <article><span>01 · NOTICE</span><CircleDot /><strong>Find the trigger</strong><p>Time, place, emotion and easy access.</p></article><ArrowRight />
      <article><span>02 · INTERRUPT</span><Zap /><strong>Create a pause</strong><p>An if–then action before autopilot wins.</p></article><ArrowRight />
      <article><span>03 · REPLACE</span><Footprints /><strong>Make better easier</strong><p>A small action that provides a real alternative.</p></article><ArrowRight />
      <article><span>04 · LEARN</span><RefreshCcw /><strong>Recover fast</strong><p>A lapse becomes information, never identity.</p></article>
    </div>
  );
}

const plusTiers = [
  { kind: "Yearly", price: "AU$89.99", per: "a year", note: "About seven fifty a month. The way most people buy it." },
  { kind: "Monthly", price: "AU$14.99", per: "a month", note: "Leave whenever. No notice period, no winback email." },
  { kind: "Lifetime", price: "AU$249", per: "once", note: "Paid once, kept forever, including everything added later." },
];

// Counts verified against src/features/knowledge/protocols.ts.
const ratingScale = [
  { grade: "A", label: "Strong", count: 13, meaning: "Repeatedly tested in people, with results that agree." },
  { grade: "B", label: "Good", count: 60, meaning: "Solid human studies, with some room left for argument." },
  { grade: "C", label: "Mixed", count: 63, meaning: "Reasonable evidence, smaller studies, or results that conflict." },
  { grade: "D", label: "Thin", count: 33, meaning: "Early or indirect evidence. Worth trying, not worth promising." },
  { grade: "E", label: "Practice", count: 8, meaning: "No trial behind it. Widely used and openly labelled as experience, not proof." },
];

const howSteps = [
  {
    file: "app-coaches",
    title: "Tell it what you want",
    body: "Pick the parts of your life you want help with. You answer a short set of questions once — not the same questions again for every new goal.",
    alt: "The app's list of the seven areas it can help with",
  },
  {
    file: "app-protocol-3-week-after",
    title: "It writes your week",
    body: "Sessions, meals, practices and reviews, each at an hour the app picked around everything else you have on. Nothing here was typed in by you.",
    alt: "A week in the app with sixteen things planned on Monday",
  },
  {
    file: "app-workout-autoreg",
    title: "It changes when you do",
    body: "Slept badly? Short on time? The session shrinks and keeps the hard part, instead of being cancelled. Every change comes with the reason for it.",
    alt: "A session in the app shortened after a short night, with the reason shown",
  },
];

const appScreens = [
  { file: "app-coaches", label: "The seven areas", note: "The seven areas it helps with." },
  { file: "app-training", label: "Training", note: "Your four-week plan, and where you are in it." },
  { file: "app-workout", label: "The session", note: "Sets tick, rests time themselves." },
  { file: "app-workout-autoreg", label: "A short night", note: "The hard lifts stay. The rest waits." },
  { file: "app-level-card", label: "Your level", note: "Earned from what you actually did." },
  { file: "app-library", label: "The library", note: "The source, the rating, and what it will not do." },
  { file: "app-recovery", label: "Habits and urges", note: "Free, permanently." },
];

// Verbatim from LEVEL_BLURB.training in src/features/paths/level.ts. The app
// says these words; so does the site.
const ladder = [
  { level: "FOUNDATION", copy: "Fewer movements, lighter loads, a technical focus every session. The point is to learn the patterns and finish every session able to do it again." },
  { level: "DEVELOPING", copy: "Barbell work comes in, sets go up, loads stop being cautious. Enough volume to drive progress, not enough to bury a week." },
  { level: "ESTABLISHED", copy: "The full amount of work, a peak week, and one heavy set on the lift you care most about." },
  { level: "ADVANCED", copy: "Heavier work, one deliberately hard week before the easy one, and single heavy lifts. Only offered once your record supports it." },
];

/**
 * Four answers, not four counts. Every number here is still exact and still
 * checked against src/features/knowledge/protocols.ts by the guardrails — but
 * it sits inside a sentence, where a reader can tell what it means, rather
 * than alone in 48px type where they cannot.
 */
const libraryStats = [
  {
    label: "Every practice is rated.",
    note: "A to E for the strength of the evidence, shown on the practice itself rather than buried in a footnote.",
  },
  {
    label: "Most of it is not rated Strong.",
    note: "104 of the 177 are Mixed or weaker, and the app tells you which. A library where everything is excellent is a library that is not rating anything.",
  },
  {
    label: "It names where the work came from.",
    note: "188 researchers and teachers are credited for the public work behind these practices. Credit, never endorsement.",
  },
  {
    label: "It tells you when not to do something.",
    note: "145 of them carry a safety note in plain words, shown before you add anything to your week.",
  },
];

/**
 * The film, played on request rather than on arrival.
 *
 * A 48-second 3MB file has no business autoplaying on a marketing page, and
 * `prefers-reduced-motion` is respected by construction: nothing moves until
 * the visitor presses play, so there is no motion to suppress.
 *
 * `preload="none"` matters as much as the click gate — without it the browser
 * starts fetching the video on page load whether or not anyone watches it.
 */

function Film() {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="film-frame">
      {playing ? (
        <video
          controls
          autoPlay
          playsInline
          preload="none"
          poster="/video/intentnorth-week-30s-poster.jpg"
        >
          {/* WebM first because the browser takes the first source it can play,
              and the VP9 re-encode is 2.0MB against the MP4's 3.2MB. The MP4
              is the fallback that Safari before 14.1 and some in-app browsers
              need — without it they show nothing rather than degrading. */}
          <source src="/video/intentnorth-week-30s.webm" type="video/webm" />
          <source src="/video/intentnorth-week-30s.mp4" type="video/mp4" />
          Your browser cannot play this film.
        </video>
      ) : (
        <>
          <Image
            src="/video/intentnorth-week-30s-poster.jpg"
            alt="A frame from the film: the line &quot;Sets, reps, rest and load. Decided.&quot; beside a session screen listing the day's lifts"
            width={1280}
            height={720}
            unoptimized
            sizes="(max-width: 1120px) 92vw, 1100px"
          />
          <button type="button" className="film-play" onClick={() => setPlaying(true)}>
            <span><Play aria-hidden /> Play the film · 31 seconds, no sound</span>
          </button>
        </>
      )}
    </figure>
  );
}

export default function Home() {
  const [planOpen, setPlanOpen] = useState(false);

  return (
    <main id="top">
      <PlanBuilder open={planOpen} setOpen={setPlanOpen} />

      <header className="site-header"><div className="nav-shell"><Logo /><nav aria-label="Main navigation"><a href="#difference">Difference</a><a href="#change">Behaviour</a><a href="#depth">The seven</a><a href="#science">Science</a></nav><BuildPlanButton compact onClick={() => setPlanOpen(true)} /></div></header>

      <section className="hero section-shell">
        <div className="hero-copy">
          <p className="section-kicker">IPHONE APP</p>
          <h1>The health advice you have read,<br />turned into a plan you can follow.</h1>
          <p className="hero-lede">IntentNorth takes 177 practices from published research, rates the evidence behind each one, and builds them into your week — training, food, sleep, habits, work, money and family. Then it changes the plan when your week changes, and tells you why.</p>
          <div className="hero-actions"><AppStoreCta /><a className="text-link" href="#how">See how it works <ArrowDown /></a></div>
          <p className="hero-price">
            <strong>AU$89.99 a year</strong> for all seven areas &mdash; about seven fifty a month,
            with nothing held back for a higher tier. <span>Free to start, and the urge and
            hardest-moment support is free permanently.</span>
          </p>
          <div className="hero-trust"><span><Check /> Free to start</span><span><LockKeyhole /> Nothing leaves your phone</span><span><Heart /> Hardest-moment support stays free</span></div>
          <dl className="hero-pillars">
            {heroPillars.map((pillar) => (
              <div key={pillar.lead}>
                <dt>{pillar.lead}</dt>
                <dd>{pillar.note}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="hero-stage" aria-label="A week planned by the app">
          <div className="hero-image-wrap"><Image src="/images/intent-os-hero-family-transition-v2.webp" alt="A professional closing a laptop and returning attention to family life" width={1536} height={1024} priority unoptimized sizes="(max-width: 1120px) 80vw, 43vw" /></div>
          <figure className="hero-shot">
            <img
              alt="The app's week screen, showing Monday with sixteen things planned from 7am"
              height={1800}
              src="/images/app/app-protocol-3-week-after.jpg"
              width={840}
            />
            <figcaption>
              <span>A real Monday in the app</span>
              Every line was placed by the app, at an hour it chose, around everything else in
              the week.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="how-section section-shell" id="how">
        <div className="how-heading">
          <p className="section-kicker">HOW IT WORKS</p>
          <h2>Three steps. Then it runs.</h2>
          <p>No dashboard to check and no plan to write. You answer some questions once, the app
          builds your week, and it rebuilds that week whenever something changes.</p>
        </div>
        <ol className="how-steps">
          {howSteps.map((step, index) => (
            <li key={step.title}>
              <figure>
                <img alt={step.alt} height={1800} loading="lazy" src={`/images/app/${step.file}.jpg`} width={840} />
              </figure>
              <div className="how-copy">
                <span className="how-step-number">Step {index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
              {index < howSteps.length - 1 ? <ArrowDown aria-hidden="true" className="how-arrow" /> : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="causality-section section-shell">
        <div className="causality-copy"><p className="section-kicker">WHAT YOU ACTUALLY GET</p><h2>You never build<br />a program again.</h2><p>Not a dashboard and not a suggestion. Four weeks at a time: two to build, one harder, one easier so you recover. Written for the goal you pick, fitted around the week you actually have, and run with you session by session.</p>
          <div className="deliverable-grid">
            <article><span>YOUR MONDAY</span><strong>Sixteen things, already placed</strong><p>Breakfast, ten minutes of morning light, a session, two blocks of focused work, dinner decided. You did not write any of it.</p></article>
            <article><span>WHEN YOU SLEPT BADLY</span><strong>It shortens, it does not cancel</strong><p>The session keeps the part that matters and drops the rest. Twenty minutes instead of fifty, and it says why.</p></article>
            <article><span>WHILE YOU DO IT</span><strong>Sets tick, rests time themselves</strong><p>Slept badly, or only have half the time? It shortens the session and keeps the hard part, instead of cancelling it.</p></article>
          </div>
          <p className="deliverable-breadth">The same holds away from the gym: guided breathing, seven meditation scripts timed to the clock, a weekly review that ends in one decision, and the week&rsquo;s dinners chosen once while you are not hungry.</p>
</div>
        
      </section>

      <section className="film-section" id="film"><div className="section-shell">
        <div className="film-heading">
          <div><p className="section-kicker light">THE PRODUCT, ON SCREEN</p><h2>Watch it plan<br />a week.</h2></div>
          <p>Everything on these screens is what the app actually says. Press play if you want to watch it work.</p>
        </div>
        <Film />
        <p className="film-caption">Named educators appear as attribution for practices distilled from their public teaching; it implies no endorsement of IntentNorth.</p>
      </div></section>

      <section className="behaviour-section" id="change"><div className="section-shell">
        <div className="behaviour-heading"><div><p className="section-kicker light">PERFORMANCE HAS TWO DIRECTIONS</p><h2>Build what helps.<br />Reduce what keeps winning.</h2><span className="direction-label">16 PATTERNS · WHY IT WORKS, SHOWN · IN THE APP TODAY</span></div><p>Most systems only add another action. IntentNorth looks at what sets a habit off, what makes it easy and what it gives you — then makes a better response the easier one. Log something and it explains what is happening, never judges you.</p></div>
        <BehaviourLoop />
        <div className="behaviour-example">
          <div className="behaviour-image"><Image src="/images/intent-os-behaviour-change-v2.webp" alt="A person placing a phone out of reach and choosing a prepared replacement action" width={1536} height={1024} loading="lazy" unoptimized sizes="(max-width: 900px) 92vw, 42vw" /></div>
          <div className="behaviour-example-copy"><span>EXAMPLE · LATE-NIGHT SCREEN DRIFT</span><h3>Do not demand more willpower at 10:30pm. Change 9:45pm.</h3><div className="example-flow"><div><small>CUE</small><strong>Phone within reach</strong></div><ArrowRight /><div><small>INTERRUPT</small><strong>Dock outside the room</strong></div><ArrowRight /><div><small>REPLACEMENT</small><strong>Three-minute downshift</strong></div></div><p>The next morning supplies the feedback: sleep, adherence and how the day actually felt.</p>
          <div className="mechanism-card">
            <span className="mechanism-kicker">WHAT YOU SEE WHEN YOU LOG A DRINK AT 8:45PM</span>
            <p className="mechanism-text">“Alcohol shortens the night, not the sleep. It speeds falling asleep, then suppresses REM and fragments the second half as it clears—which is why a drink can feel like it helped and still cost you the morning.”</p>
            <div className="mechanism-meta"><span className="grade">EVIDENCE B</span><span>Meta-analyses of alcohol and sleep architecture</span></div>
            <p className="mechanism-lever"><strong>What helps:</strong> in these studies, leaving three or more hours between the last drink and bed recovered much of the lost sleep quality. Drinking less, or not at all, helps more.</p>
            <p className="mechanism-support">If drinking is something you want to stop rather than time differently, that is what the free part of this app is for &mdash; and if it feels bigger than an app, talk to your doctor or a support line. In Australia the National Alcohol and Other Drug Hotline is 1800 250 015, any hour of any day.</p>
            <p className="mechanism-rule">No verdict. No streak to break. An explanation, and the one thing that changes it.</p>
          </div><div className="free-principle"><Heart /><p><strong>We never charge for someone’s hardest moment.</strong> Urge, reset and lapse-recovery support remains free.</p></div><div className="behaviour-cta"><BuildPlanButton onClick={() => setPlanOpen(true)} /><small>Build what improves—and what gets out of the way.</small></div></div>
        </div>
      </div></section>

      <section className="trajectory-section" id="trajectory"><div className="section-shell">
        <div className="trajectory-heading">
          <div><p className="section-kicker light">ARE YOU ACTUALLY GOING TO ARRIVE?</p><h2>At this rate you arrive in March.<br />You said January.</h2></div>
          <p>Every other tool reports what happened. IntentNorth fits a line through everything you have recorded and tells you where it ends—while there is still time to change it.</p>
        </div>
        <div className="trajectory-grid">
          <article className="trajectory-card">
            <span>YOUR GOAL</span>
            <strong>Bench 127.5kg</strong>
            <p>Target date · January</p>
          </article>
          <article className="trajectory-card is-projection">
            <span>AT THIS RATE</span>
            <strong>March</strong>
            <p>Fitted from 11 logged sets across nine weeks</p>
          </article>
          <article className="trajectory-card">
            <span>WHAT CHANGES</span>
            <strong>+1 session a week</strong>
            <p>Brings the projection back inside January</p>
          </article>
        </div>
        <div className="trajectory-honesty"><ShieldCheck /><p><strong>It refuses to guess.</strong> Under three readings across two weeks the answer is “not enough yet” rather than a confident line through two points. It fits a line through every reading, so one bad morning on the scales moves the answer a little rather than all of it.</p></div>
      </div></section>

      <section className="profile-section section-shell">
        <div className="profile-copy"><p className="section-kicker">ONE SET OF ANSWERS</p><h2>Answer once.<br />Context compounds.</h2><p>Each area asks its own detailed questions. What you have already answered carries across where it matters, so a new goal never means starting the interview again.</p><div className="profile-now"><span>SHIPPED TODAY</span><strong>Each area learns from what you log, and training already responds to your sleep.</strong></div></div>
        <div className="profile-motion-wrap"><p className="diagram-note">Answer a question in one area and the others already know it. Connecting this web profile to the app is the next product connection.</p></div>
      </section>

      <section className="depth-section" id="depth"><div className="section-shell"><div className="depth-heading"><div><p className="section-kicker light">DEPTH IN EACH ONE</p><h2>One profile does not mean one shallow plan.</h2></div><p>Covering seven areas only helps if each one is deep enough to act on.</p></div><PathwayDepth /></div></section>

      <section className="anygoal-section section-shell" id="anygoal">
        <div className="anygoal-heading"><div><p className="section-kicker">NOT SEVEN MODULES</p><h2>Bring a goal we have never seen.</h2></div><p>The seven areas are the starting points, not the limit. Any goal you can describe becomes an ordered list of steps — each with a clear finish line and a check-in short enough to actually do.</p></div>
        <div className="anygoal-grid">
          <article><span>“Write the book”</span><ol><li>Outline agreed</li><li>1,000 words a week for six weeks</li><li>First draft complete</li></ol><small>Checked from a weekly word count</small></article>
          <article><span>“Save a house deposit”</span><ol><li>One transfer automated</li><li>One month of expenses banked</li><li>Deposit target reached</li></ol><small>Checked from your own savings rate</small></article>
          <article><span>“Be a calmer parent”</span><ol><li>Name the moment it usually goes</li><li>One rehearsed response, ready</li><li>Four steady weeks</li></ol><small>Checked from what you log, not a score</small></article>
        </div>
        <p className="anygoal-note">Same engine underneath: goal → ladder → program → check-in → adaptation, with the reason shown every time something moves.</p>
      </section>

      <section className="screens-section" id="screens"><div className="section-shell">
        <div className="screens-heading">
          <div><p className="section-kicker light">THE APP ITSELF</p><h2>Eight screens.<br />No press play required.</h2></div>
          <p>These are photographs of the app, taken from the build.</p>
        </div>
        <div className="screens-strip">
          {appScreens.map((screen) => (
            <figure key={screen.file}>
              <Image src={`/images/app/${screen.file}.jpg`} alt={`IntentNorth: ${screen.label}`} width={840} height={1820} unoptimized loading="lazy" sizes="(max-width: 900px) 60vw, 220px" />
              <figcaption><strong>{screen.label}</strong><span>{screen.note}</span></figcaption>
            </figure>
          ))}
        </div>
      </div></section>

      <section className="ladder-section section-shell" id="ladder">
        <div className="ladder-heading">
          <div><p className="section-kicker">THE PROGRAMME HAS LEVELS</p><h2>A first block and a tenth<br />are not the same exercise.</h2></div>
          <p>Four levels in every area. Your level is read from what you have actually done, not from a form &mdash; and the top one is earned, never chosen. Too hard is one tap, and the plan steps back without argument.</p>
        </div>
        <ol className="ladder-list">
          {ladder.map((level, index) => (
            <li key={level.level}>
              <span className="ladder-rank">{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{level.level}</strong><p>{level.copy}</p></div>
            </li>
          ))}
        </ol>
        <div className="ladder-proof">
          
          <article>
            <strong>&ldquo;This is too easy&rdquo;</strong>
            <span>is a button</span>
            <p>Add a set, a little weight and one more exercise. The movements stay the same. Saying it is too hard works the same way, in the other direction.</p>
          </article>
        </div>
      </section>

      <section className="library-section section-shell" id="library">
        <div className="library-heading">
          <div><p className="section-kicker">THE OBVIOUS QUESTION</p><h2>How do you know<br />any of this works?</h2></div>
          <p>Most health advice cites nothing, or cites everything as though it were equally certain. Here, every practice carries a plain rating for how strong the evidence behind it is &mdash; and where the evidence is thin, it says so rather than hoping you will not ask.</p>
        </div>
        <div className="library-stats">
          {libraryStats.map((stat) => (
            <article key={stat.label}>
              <span>{stat.label}</span>
              <p>{stat.note}</p>
            </article>
          ))}
        </div>
        <div className="rating-explainer">
          <div className="rating-copy">
            <h3>What a rating means</h3>
            <p>A protocol is a practice written so the app can schedule it — ten minutes of morning
            light, a wind-down before bed, a walk after dinner. Each one is rated for how strong the
            evidence behind it is, and the rating is on the practice itself, not hidden in a footnote.</p>
            <dl className="rating-scale">
              {ratingScale.map((row) => (
                <div key={row.grade}>
                  <dt><b className={`rating-dot is-${row.grade.toLowerCase()}`}>{row.grade}</b>{row.label}</dt>
                  <dd>{row.meaning}<span>{row.count} practices</span></dd>
                </div>
              ))}
            </dl>
            <div className="rating-example">
              <span className="rating-example-head"><b className="rating-dot is-b">B</b>Morning light</span>
              <strong>Ten minutes of outdoor light within an hour of waking.</strong>
              <p className="rating-example-why">Rated B: good human studies, some room left for argument.</p>
              <p className="rating-example-safety">Never look at the sun directly; through-window light counts for less but still counts.</p>
              <span className="rating-example-foot">Added to your week in one tap. The app picks the hour.</span>
            </div>
            <p className="rating-honesty"><strong>104 of the 177 are rated C or weaker, and we say
            so on the practice.</strong> A library that claimed everything in it was excellent would
            be telling you nothing.</p>
          </div>
          <figure className="rating-shot">
            <img alt="A practice in the app showing its rating and its safety note" height={1800}
              loading="lazy" src="/images/app/app-protocol-1-library.jpg" width={840} />
            <figcaption>The rating sits on the practice, next to what it will not do.</figcaption>
          </figure>
        </div>
        <div className="library-honesty">
          <ShieldCheck />
          <p><strong>Most of it is not an A, and it says so.</strong> Thirteen practices are grade A. Sixty are B. The remaining hundred and four are C, D or E&mdash;useful, reasoned, and openly marked as weaker evidence. A system that graded everything highly would be easier to sell and worth less to trust.</p>
        </div>
      </section>

      <section className="science-section section-shell" id="science">
        <div className="science-heading"><p className="section-kicker">SCIENCE YOU CAN INSPECT</p><h2>Credibility lives in the source—and the limitation.</h2><p>Public educators can surface useful questions. IntentNorth does not treat a personality as evidence or imply endorsement; it links mechanisms to the underlying research and labels uncertainty.</p></div>
        <div className="quote-row"><blockquote><p>A nudge is “any aspect of the choice architecture that alters people&rsquo;s behavior in a predictable way without forbidding any options or significantly changing their economic incentives.”</p><cite>Thaler &amp; Sunstein, <em>Nudge</em> (2008)</cite></blockquote><div className="science-principle"><Brain /><p><strong>Kahneman explained why fast, automatic judgement matters.</strong> Thaler and Sunstein developed choice architecture. IntentNorth uses these ideas to make the better action easier—not to manipulate choice.</p></div></div>
        <div className="evidence-grid">{evidence.map((item) => <a key={item.title} href={item.href} target="_blank" rel="noreferrer" className="evidence-card"><span className="grade-pill">{item.type}</span><h3>{item.title}</h3><p>{item.finding}</p><span className="source-link">{item.source}<ExternalLink /></span></a>)}</div>
        <p className="communicator-note"><ShieldCheck /> Topics discussed by science communicators—including Andrew Huberman, Rhonda Patrick, David Sinclair and Sam Harris—are traced back to primary studies before appearing in a protocol. Names are never used as implied endorsement.</p>
      </section>

      <section className="human-section">
        <div className="human-image"><Image src="/images/intent-performance-retina.webp" alt="Purposeful strength training" width={2400} height={1597} loading="lazy" unoptimized sizes="100vw" /></div>
        <div className="human-overlay"><p className="section-kicker light">THE HUMAN STAKE</p><h2>High performance should expand your life—not consume it.</h2><p>The goal is not more optimisation. It is a system capable of learning while the person, family and work behind the goal remain visible.</p></div>
      </section>

      <section className="commitment-section"><div className="section-shell commitment-grid"><div><p className="section-kicker light">YOUR NEXT 12 WEEKS</p><h2>See what your<br />first week would be.</h2><p>Answer a few questions and we will show you what the app would put in your week. It is free, and nothing you type leaves this browser.</p><BuildPlanButton inverse onClick={() => setPlanOpen(true)}>Build my profile</BuildPlanButton><small>About five minutes · iPhone only today · No payment taken · Premium terms shown before payment</small></div><div className="commitment-list"><article><span>01</span><div><strong>Choose the outcomes</strong><p>Training, sleep, nutrition, focus, leadership, money or presence.</p></div></article><article><span>02</span><div><strong>Name what gets in the way</strong><p>The patterns that repeatedly take the week off course.</p></div></article><article><span>03</span><div><strong>Make the commitment</strong><p>You see it written back to you before anything is built.</p></div></article><article><span>04</span><div><strong>Understand the boundary</strong><p>Profile and first insight are free. Complete programs are premium.</p></div></article></div></div></section>

      <section className="founder-section section-shell"><div><p className="section-kicker">WHY THIS EXISTS</p><h2>Nothing would tell me what to change.</h2></div><p>“I had a ring telling me I slept badly, a training app that knew my bench and nothing else, and a calendar full of other people&rsquo;s priorities. Every one of them was right about its own slice and silent on the trade-off—so the plan never actually changed. I just felt worse about it. I wanted one thing that held all of it, decided what today should be, and told me why.”</p><span>— Isaac Stefaniw, founder</span></section>

      <section className="pricing-section section-shell" id="pricing">
        <div className="pricing-heading">
          <div><p className="section-kicker">WHAT IT COSTS</p><h2>One price for all seven.<br />Not one app each.</h2></div>
          <p>Plus unlocks the complete program in all seven areas. There is no upgrade per area, no tier that withholds one, and nothing that costs more once you are further along.</p>
        </div>
        <div className="pricing-grid">
          {plusTiers.map((tier) => (
            <article key={tier.kind}>
              <span className="pricing-kind">{tier.kind}</span>
              <strong>{tier.price}</strong>
              <span className="pricing-per">{tier.per}</span>
              <p>{tier.note}</p>
            </article>
          ))}
        </div>
        <div className="pricing-free">
          <Heart />
          <div>
            <strong>Free, and staying free.</strong>
            <p>Your profile and first insight. Recovery, urge and lapse support&mdash;every part of it, permanently. We never charge for someone&rsquo;s hardest moment, and that is a line in the code rather than a promotion.</p>
          </div>
        </div>
        <p className="pricing-note">Prices are Australian dollars. The App Store shows yours in your own currency and charges through your Apple account&mdash;we never see a card. Nothing is taken on this website.</p>
      </section>

      <section className="faq-section section-shell"><div><p className="section-kicker">BEFORE YOU COMMIT</p><h2>Clear boundaries build better trust.</h2></div><div className="faq-grid"><article><strong>Is this a calendar?</strong><p>No. It can protect time, but the point is different: what you actually do changes the plan itself.</p></article><article><strong>What is real today?</strong><p>Each area learns from what you log, and training already responds to your sleep. Anything broader than that is where we are heading, not what we are showing.</p></article><article><strong>What remains free?</strong><p>Your profile, first insight, and recovery, urge and hardest-moment support—permanently.</p></article><article><strong>Which devices?</strong><p>iPhone, today. The plan reads sleep and heart-rate data from Apple Health, which is why it starts there. Android is a decision we have not made rather than a feature we are hiding.</p></article><article><strong>Is this medical or financial advice?</strong><p>No. IntentNorth provides education, structured experiments and progress support. Seek a qualified professional for personal advice.</p></article></div></section>

      <section className="disclaimer-section section-shell"><ShieldCheck /><p><strong>Education, never diagnosis or personal advice.</strong> Training, nutrition, recovery, mindfulness and financial content is educational. Research links describe evidence and limitations; observational findings do not prove causation. If an urge or behaviour creates immediate risk, contact local emergency or professional support.</p></section>

      <footer><div className="footer-inner section-shell"><Logo /><p>Your whole life. One system that learns.</p><nav className="footer-links" aria-label="Legal and support"><Link href="/privacy">Privacy</Link><Link href="/support">Support</Link></nav><button onClick={() => setPlanOpen(true)}>Build my profile <ArrowRight /></button></div></footer>
      <div className="mobile-conversion"><span><strong>Your first insight is free</strong><small>Premium explained upfront</small></span><button onClick={() => setPlanOpen(true)}>Build profile <ArrowRight /></button></div>
    </main>
  );
}

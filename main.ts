// Have You Tried Turning It Off? — make.fun entry 2 (solo account).
//
// One funny single line, under 200 characters, spoken by a hopeless tech
// support agent to a desperate customer. An AI judge compares lines two at a
// time in blind rounds, weighing five criteria in this order: subject (a funny
// single-line reply from a hopeless agent to a desperate customer), twist
// (unexpected; the agent's cheerful uselessness is the humour; the customer
// is never the butt), voice (sounds like a real agent; desperation felt, not
// explained), tight (every word earns its place), fresh (fresh, or a classic
// twisted). This program holds nine original candidate lines, scores each on
// a 1-5 scale per criterion, and runs a full round-robin tournament: every
// candidate meets every other once, 36 duels. A duel is won by the higher
// weighted total (weights: subject 3, twist 3, voice 2, tight 2, fresh 2);
// a tie goes to the shorter line, then to the candidate listed first. The
// champion has the most duel wins; a tie on wins goes to the higher sum of
// weighted totals, then to the shorter line. The champion line is written,
// byte for byte, to /output/entry.txt. Fully deterministic: no clock, no
// randomness, no network, no environment input. Two runs produce byte-
// identical output. The program exits non-zero when the champion line fails
// the gate (1-199 characters, one line, not only whitespace).

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const OUTPUT_PATH = "/output/entry.txt";
const GATE_MIN_CHARS = 1;
const GATE_MAX_CHARS = 199;

const WEIGHT_SUBJECT = 3;
const WEIGHT_TWIST = 3;
const WEIGHT_VOICE = 2;
const WEIGHT_TIGHT = 2;
const WEIGHT_FRESH = 2;

type CriterionScores = {
  subject: number;
  twist: number;
  voice: number;
  tight: number;
  fresh: number;
};

type LineCandidate = {
  tag: string;
  text: string;
  scores: CriterionScores;
};

// Nine original lines, written for this entry from the judge brief alone.
// Weighted totals (max 60): senior-team 53, tier2-note 56, warranty-bug 51,
// hold-music 43, system-paycheck 46, nodding-screen 53, urgent-slow 46,
// expectations-off 51, same-question 49.
const CANDIDATES: Array<LineCandidate> = [
  {
    tag: "senior-team",
    text: "Good news — I've escalated this to our senior team. Bad news — I'm the senior team.",
    scores: { subject: 5, twist: 4, voice: 5, tight: 5, fresh: 3 },
  },
  {
    tag: "tier2-note",
    text: "I've escalated your case to Tier 2. Tier 2 is a sticky note on my monitor that says 'good luck'.",
    scores: { subject: 5, twist: 5, voice: 4, tight: 4, fresh: 5 },
  },
  {
    tag: "warranty-bug",
    text: "Good news: I found the bug. It's in your warranty, which expired while you were on hold.",
    scores: { subject: 5, twist: 4, voice: 4, tight: 4, fresh: 4 },
  },
  {
    tag: "hold-music",
    text: "Your call is very important to us, which is why I've put you on hold with music I can't turn off either.",
    scores: { subject: 4, twist: 3, voice: 5, tight: 3, fresh: 3 },
  },
  {
    tag: "system-paycheck",
    text: "The system says your problem is solved, and honestly, who am I to argue with the system? It signs my paychecks.",
    scores: { subject: 4, twist: 4, voice: 4, tight: 3, fresh: 4 },
  },
  {
    tag: "nodding-screen",
    text: "I've done everything I can from here, which — between us — is mostly nodding at a screen that says 'no'.",
    scores: { subject: 5, twist: 4, voice: 5, tight: 4, fresh: 4 },
  },
  {
    tag: "urgent-slow",
    text: "Your case is now marked 'urgent', which means a manager will read it just as slowly as I did.",
    scores: { subject: 5, twist: 3, voice: 4, tight: 4, fresh: 3 },
  },
  {
    tag: "expectations-off",
    text: "The fix is simple: turn it off, turn it on, and if that fails, turn your expectations off too.",
    scores: { subject: 5, twist: 4, voice: 4, tight: 5, fresh: 3 },
  },
  {
    tag: "same-question",
    text: "Have you tried turning it off and on again? No rush — I've been asking myself the same question since 2019.",
    scores: { subject: 5, twist: 4, voice: 5, tight: 3, fresh: 3 },
  },
];

// Scoring rationale, one note per candidate.
// senior-team: escalation as a real support move, then the rug-pull "I'm the senior team" makes the agent the joke; pitch-perfect voice, short, clean.
// tier2-note: strongest twist — Tier 2 is a sticky note wishing the customer luck; cheerful uselessness carries it, voice stays earnest, image fresh.
// warranty-bug: "I found the bug" promises a technical win, then the bug is the expired warranty — the customer's own wait caused the loss.
// hold-music: instantly recognisable "very important to us" opener, agent trapped by the same hold music; loosest line, setup outruns punchline.
// system-paycheck: the system overruling reality is a true support-room feeling; "it signs my paychecks" is the agent's cheerful surrender.
// nodding-screen: "between us" confides, then confesses the whole toolkit is nodding at a screen that says no; voice and subject top marks.
// urgent-slow: marking a case urgent as a bureaucratic shrug; the manager reading it "just as slowly" keeps the joke on the system, twist gentle.
// expectations-off: classic reboot advice twisted at the last beat onto the customer's expectations; tight, but the classic opening costs freshness.
// same-question: the classic line turned back on the agent himself, asking it since 2019; warm voice, total hopelessness, runs a little long.

function weightedTotal(scores: CriterionScores): number {
  const subjectPart = scores.subject * WEIGHT_SUBJECT;
  const twistPart = scores.twist * WEIGHT_TWIST;
  const voicePart = scores.voice * WEIGHT_VOICE;
  const tightPart = scores.tight * WEIGHT_TIGHT;
  const freshPart = scores.fresh * WEIGHT_FRESH;
  const total = subjectPart + twistPart + voicePart + tightPart + freshPart;
  return total;
}

type DuelOutcome = {
  winnerTag: string;
  winnerPoints: number;
  loserTag: string;
  loserPoints: number;
};

function duelWinner(
  first: LineCandidate,
  second: LineCandidate,
): DuelOutcome {
  const firstPoints = weightedTotal(first.scores);
  const secondPoints = weightedTotal(second.scores);
  const firstShorter = first.text.length < second.text.length;
  const secondShorter = second.text.length < first.text.length;
  const firstWinsOnPoints = firstPoints > secondPoints;
  const secondWinsOnPoints = secondPoints > firstPoints;
  const firstWinsOnTiebreak = firstPoints === secondPoints && firstShorter;
  const secondWinsOnTiebreak = firstPoints === secondPoints && secondShorter;
  const firstWinsByOrder =
    firstPoints === secondPoints &&
    first.text.length === second.text.length;
  const firstIsWinner =
    firstWinsOnPoints || firstWinsOnTiebreak || firstWinsByOrder;
  const secondIsWinner = secondWinsOnPoints || secondWinsOnTiebreak;
  const winnerIsFirst = firstIsWinner && !secondIsWinner;
  const winnerTag = winnerIsFirst ? first.tag : second.tag;
  const winnerPoints = winnerIsFirst ? firstPoints : secondPoints;
  const loserTag = winnerIsFirst ? second.tag : first.tag;
  const loserPoints = winnerIsFirst ? secondPoints : firstPoints;
  const outcome: DuelOutcome = {
    winnerTag,
    winnerPoints,
    loserTag,
    loserPoints,
  };
  return outcome;
}

type TallyRow = {
  tag: string;
  wins: number;
  pointsFor: number;
  pointsAgainst: number;
  textLength: number;
};

function freshTally(candidates: Array<LineCandidate>): Array<TallyRow> {
  const rows: Array<TallyRow> = [];
  for (const candidate of candidates) {
    const row: TallyRow = {
      tag: candidate.tag,
      wins: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      textLength: candidate.text.length,
    };
    rows.push(row);
  }
  return rows;
}

function tallyByTag(rows: Array<TallyRow>, tag: string): TallyRow {
  let foundRow: TallyRow | undefined;
  for (const row of rows) {
    if (row.tag === tag) {
      foundRow = row;
    }
  }
  const resolvedRow = foundRow as TallyRow;
  return resolvedRow;
}

type TournamentResult = {
  rows: Array<TallyRow>;
  duelsPlayed: number;
  championTag: string;
};

function runRoundRobin(
  candidates: Array<LineCandidate>,
): TournamentResult {
  const rows = freshTally(candidates);
  let duelsPlayed = 0;
  for (let firstIndex = 0; firstIndex < candidates.length; firstIndex += 1) {
    const first = candidates[firstIndex] as LineCandidate;
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < candidates.length;
      secondIndex += 1
    ) {
      const second = candidates[secondIndex] as LineCandidate;
      const outcome = duelWinner(first, second);
      const winnerRow = tallyByTag(rows, outcome.winnerTag);
      const loserRow = tallyByTag(rows, outcome.loserTag);
      winnerRow.wins += 1;
      winnerRow.pointsFor += outcome.winnerPoints;
      winnerRow.pointsAgainst += outcome.loserPoints;
      loserRow.pointsFor += outcome.loserPoints;
      loserRow.pointsAgainst += outcome.winnerPoints;
      duelsPlayed += 1;
    }
  }
  const expectedDuels = (candidates.length * (candidates.length - 1)) / 2;
  const duelsMatch = duelsPlayed === expectedDuels;
  if (!duelsMatch) {
    throw new Error(
      `tournament integrity failure: played ${duelsPlayed} duels, expected ${expectedDuels}`,
    );
  }
  const championRow = pickChampion(rows);
  const result: TournamentResult = {
    rows,
    duelsPlayed,
    championTag: championRow.tag,
  };
  return result;
}

function pickChampion(rows: Array<TallyRow>): TallyRow {
  let champion = rows[0] as TallyRow;
  for (const row of rows) {
    const moreWins = row.wins > champion.wins;
    const tiedWins = row.wins === champion.wins;
    const morePoints = row.pointsFor > champion.pointsFor;
    const tiedPoints = row.pointsFor === champion.pointsFor;
    const shorterLine = row.textLength < champion.textLength;
    const takesLead =
      moreWins ||
      (tiedWins && morePoints) ||
      (tiedWins && tiedPoints && shorterLine);
    if (takesLead) {
      champion = row;
    }
  }
  return champion;
}

function findCandidate(
  candidates: Array<LineCandidate>,
  tag: string,
): LineCandidate {
  let foundCandidate: LineCandidate | undefined;
  for (const candidate of candidates) {
    if (candidate.tag === tag) {
      foundCandidate = candidate;
    }
  }
  const resolvedCandidate = foundCandidate as LineCandidate;
  return resolvedCandidate;
}

function validateLine(text: string): void {
  const charCount = [...text].length;
  const belowMinimum = charCount < GATE_MIN_CHARS;
  const aboveMaximum = charCount > GATE_MAX_CHARS;
  const hasLineBreak = text.includes("\n") || text.includes("\r");
  const onlyWhitespace = text.trim().length === 0;
  const problems: Array<string> = [];
  if (belowMinimum) {
    problems.push(
      `line is ${charCount} characters, below minimum ${GATE_MIN_CHARS}`,
    );
  }
  if (aboveMaximum) {
    problems.push(
      `line is ${charCount} characters, above maximum ${GATE_MAX_CHARS}`,
    );
  }
  if (hasLineBreak) {
    problems.push("line must be a single line");
  }
  if (onlyWhitespace) {
    problems.push("line must not be only whitespace");
  }
  const hasProblems = problems.length > 0;
  if (hasProblems) {
    throw new Error(`gate failure: ${problems.join("; ")}`);
  }
}

function writeChampionLine(text: string): void {
  validateLine(text);
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, text, "utf8");
}

function reportTournament(result: TournamentResult): void {
  console.log(`duels played: ${result.duelsPlayed}`);
  const sortedRows = [...result.rows].sort((a, b) => {
    const winGap = b.wins - a.wins;
    const pointsGap = b.pointsFor - a.pointsFor;
    const lengthGap = a.textLength - b.textLength;
    const order =
      winGap !== 0 ? winGap : pointsGap !== 0 ? pointsGap : lengthGap;
    return order;
  });
  for (const row of sortedRows) {
    console.log(
      `${row.tag}: ${row.wins} wins, ${row.pointsFor} points for, ${row.pointsAgainst} points against, ${row.textLength} chars`,
    );
  }
}

function main(): void {
  const result = runRoundRobin(CANDIDATES);
  reportTournament(result);
  const champion = findCandidate(CANDIDATES, result.championTag);
  const championChars = [...champion.text].length;
  writeChampionLine(champion.text);
  console.log(`champion: ${champion.tag}`);
  console.log(`line: ${champion.text}`);
  console.log(`characters: ${championChars}`);
  console.log(`wrote: ${OUTPUT_PATH}`);
}

main();

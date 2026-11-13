export type Habit = {
  id: string;
  name: string;
  emoji: string;
  days: number[]; // 0 = domingo
  done: string[]; // yyyy-mm-dd
  created: string;
  reminder?: string; // HH:mm
};

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export function addDays(k: string, n: number) {
  const d = parse(k);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}
export const weekday = (k: string) => parse(k).getDay();
export const scheduled = (h: Habit, k: string) => h.days.includes(weekday(k));

export function toggle(h: Habit, k: string): Habit {
  const done = h.done.includes(k) ? h.done.filter((x) => x !== k) : [...h.done, k].sort();
  return { ...h, done };
}

export function streaks(h: Habit, today: string) {
  const done = new Set(h.done);
  let current = 0;
  let k = done.has(today) || !scheduled(h, today) ? today : addDays(today, -1);
  for (let i = 0; i < 3660; i++, k = addDays(k, -1)) {
    if (!scheduled(h, k)) continue;
    if (!done.has(k)) break;
    current++;
  }
  let best = 0;
  let run = 0;
  const first = h.done[0];
  if (first) {
    for (let d = first; d <= today; d = addDays(d, 1)) {
      if (!scheduled(h, d)) continue;
      run = done.has(d) ? run + 1 : 0;
      best = Math.max(best, run);
    }
  }
  return { current, best: Math.max(best, current) };
}

export function rate(h: Habit, today: string, windowDays: number) {
  let total = 0;
  let hit = 0;
  for (let i = 0; i < windowDays; i++) {
    const k = addDays(today, -i);
    if (!scheduled(h, k)) continue;
    total++;
    if (h.done.includes(k)) hit++;
  }
  return total ? hit / total : 0;
}

export function weekdayRates(habits: Habit[], today: string, weeks: number) {
  const out = Array<number>(7).fill(0);
  const tot = Array<number>(7).fill(0);
  for (let i = 0; i < weeks * 7; i++) {
    const k = addDays(today, -i);
    const w = weekday(k);
    for (const h of habits) {
      if (!scheduled(h, k)) continue;
      tot[w]++;
      if (h.done.includes(k)) out[w]++;
    }
  }
  return out.map((v, i) => (tot[i] ? v / tot[i] : 0));
}

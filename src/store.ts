import { useEffect, useState } from "react";
import { addDays, dayKey, scheduled, type Habit } from "./lib/habits";
import { detectLang, dicts } from "./i18n";

const KEY = "habitflow:v1";

function seed(): Habit[] {
  const today = dayKey();
  const make = (id: string, name: string, emoji: string, days: number[], hitRate: number, reminder?: string): Habit => {
    const done: string[] = [];
    let s = id.charCodeAt(0);
    for (let i = 70; i >= 1; i--) {
      const k = addDays(today, -i);
      s = (s * 9301 + 49297) % 233280;
      if (days.includes(new Date(k + "T12:00").getDay()) && s / 233280 < hitRate) done.push(k);
    }
    return { id, name, emoji, days, done, created: addDays(today, -70), reminder };
  };
  const n = dicts[detectLang()].seed;
  return [
    make("agua", n[0], "💧", [0, 1, 2, 3, 4, 5, 6], 0.86, "09:00"),
    make("ler", n[1], "📖", [0, 1, 2, 3, 4, 5, 6], 0.7, "21:30"),
    make("treino", n[2], "🏋️", [1, 3, 5], 0.8),
    make("ingles", n[3], "🗣️", [1, 2, 3, 4, 5], 0.6),
  ];
}

function load(): Habit[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Habit[];
  } catch { /* storage indisponível: começa com exemplos */ }
  return seed();
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(habits)); } catch { /* ignore */ }
  }, [habits]);
  return [habits, setHabits] as const;
}

/** Dispara lembretes locais enquanto o app está aberto ou instalado em segundo plano. */
export function useReminders(habits: Habit[]) {
  useEffect(() => {
    const fired = new Set<string>();
    const tick = () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const now = new Date();
      const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const today = dayKey(now);
      for (const h of habits) {
        const id = `${h.id}-${today}`;
        if (h.reminder === hm && scheduled(h, today) && !h.done.includes(today) && !fired.has(id)) {
          fired.add(id);
          navigator.serviceWorker?.ready
            .then((r) => r.showNotification("habitflow", { body: `${h.emoji} ${h.name}`, icon: "/pwa-192x192.png", tag: id }))
            .catch(() => new Notification("habitflow", { body: `${h.emoji} ${h.name}` }));
        }
      }
    };
    const t = setInterval(tick, 20_000);
    return () => clearInterval(t);
  }, [habits]);
}

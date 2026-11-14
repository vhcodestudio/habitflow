import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { addDays, dayKey, parse, rate, scheduled, streaks, toggle, weekday, weekdayRates, type Habit } from "./lib/habits";
import { useHabits, useReminders } from "./store";
import { MILESTONES, motionTokens, springs } from "./motion";

const WD = ["D", "S", "T", "Q", "Q", "S", "S"];
const WD_LONG = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const EMOJIS = ["💧", "📖", "🏋️", "🧘", "🗣️", "🥗", "🛌", "✍️", "🚶", "🎸"];

export default function App() {
  const [habits, setHabits] = useHabits();
  const [tab, setTab] = useState<"hoje" | "stats">("hoje");
  const [open, setOpen] = useState<Habit | "new" | null>(null);
  const today = dayKey();
  const [day, setDay] = useState(today);
  const [toast, setToast] = useState<string | null>(null);
  useReminders(habits);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const update = (h: Habit) => setHabits((all) => all.map((x) => (x.id === h.id ? h : x)));
  const remove = (id: string) => { setHabits((all) => all.filter((x) => x.id !== id)); setOpen(null); };
  const add = (h: Habit) => { setHabits((all) => [...all, h]); setOpen(null); };
  const current = typeof open === "object" && open ? habits.find((h) => h.id === open.id) ?? null : null;

  const wide = useWide();
  const [celebrate, setCelebrate] = useState(0);

  function check(h: Habit) {
    const next = toggle(h, day);
    update(next);
    if (next.done.includes(day) && day === today) {
      const s = streaks(next, today).current;
      if (MILESTONES.includes(s)) setToast(`${s} dias seguidos de “${h.name}”. Isso já é rotina.`);
      // Last habit of the day just got checked: celebrate.
      const due = habits.map((x) => (x.id === h.id ? next : x)).filter((x) => scheduled(x, today));
      if (due.length && due.every((x) => x.done.includes(today))) setCelebrate((c) => c + 1);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col lg:max-w-6xl">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-lime focus:px-3 focus:py-2 focus:text-moss">Pular para o conteúdo</a>
        <Confetti fire={celebrate} />
        {wide ? (
          // Desktop: both panels side by side, no tab switching needed.
          <main id="conteudo" className="grid flex-1 grid-cols-[minmax(0,26rem)_minmax(0,1fr)] gap-12 px-8 pb-32 pt-10">
            <Today habits={habits} today={today} day={day} setDay={setDay} onToggle={check} onOpen={setOpen} />
            <div className="rounded-[2rem] border border-moss-3 bg-moss-2/40 p-8"><Stats habits={habits} today={today} /></div>
          </main>
        ) : (
          <main id="conteudo" className="flex-1 px-5 pb-36 pt-[max(env(safe-area-inset-top),1.25rem)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={tab} initial={{ opacity: 0, x: tab === "hoje" ? -motionTokens.distance.md : motionTokens.distance.md }}
                animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: motionTokens.duration.fast }}>
                {tab === "hoje"
                  ? <Today habits={habits} today={today} day={day} setDay={setDay} onToggle={check} onOpen={setOpen} />
                  : <Stats habits={habits} today={today} />}
              </motion.div>
            </AnimatePresence>
          </main>
        )}

        <AnimatePresence>
          {toast && (
            <motion.div role="status" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={springs.snappy}
              className="fixed inset-x-4 bottom-28 z-20 mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-lime p-4 text-moss shadow-2xl">
              <span className="font-display text-3xl font-extrabold" aria-hidden="true">✦</span>
              <p className="font-bold leading-snug">{toast}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-10 pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto mb-3 grid max-w-[22rem] grid-cols-[1fr_auto_1fr] items-center rounded-full border border-moss-3 bg-moss-2/90 p-1.5 shadow-[0_10px_40px_rgba(0,0,0,.5)] backdrop-blur">
            {wide ? <span className="pl-4 text-sm font-bold text-dim">habitflow</span> : <NavBtn active={tab === "hoje"} onClick={() => setTab("hoje")}>Hoje</NavBtn>}
            <motion.button whileTap={{ scale: motionTokens.scale.press }} onClick={() => setOpen("new")} aria-label="Novo hábito"
              className="mx-2 grid size-12 place-items-center rounded-full bg-lime text-moss">
              <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
            </motion.button>
            {wide ? <span className="pr-4 text-right text-sm text-dim">novo hábito</span> : <NavBtn active={tab === "stats"} onClick={() => setTab("stats")}>Estatísticas</NavBtn>}
          </div>
        </nav>

        {open === "new" && <Sheet title="Novo hábito" onClose={() => setOpen(null)}><Editor onSave={add} /></Sheet>}
        {current && (
          <Sheet title={`${current.emoji} ${current.name}`} onClose={() => setOpen(null)}>
            <Detail h={current} today={today} onChange={update} onDelete={() => remove(current.id)} />
          </Sheet>
        )}
      </div>
    </MotionConfig>
  );
}

function NavBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-current={active ? "page" : undefined}
      className={`relative rounded-full py-3 text-sm font-bold transition-colors ${active ? "text-moss" : "text-dim hover:text-chalk"}`}>
      {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-chalk" transition={springs.snappy} />}
      <span className="relative">{children}</span>
    </button>
  );
}

/** Odometer-style number: old value slides up, new one rolls in. */
function Roll({ value, className = "" }: { value: number | string; className?: string }) {
  return (
    <span className={`relative inline-flex overflow-hidden tabular-nums ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }} transition={springs.snappy}>{value}</motion.span>
      </AnimatePresence>
    </span>
  );
}

function Today({ habits, today, day, setDay, onToggle, onOpen }: {
  habits: Habit[]; today: string; day: string; setDay: (d: string) => void; onToggle: (h: Habit) => void; onOpen: (h: Habit) => void;
}) {
  const due = habits.filter((h) => scheduled(h, day));
  const doneCount = due.filter((h) => h.done.includes(day)).length;
  const pct = due.length ? Math.round((doneCount / due.length) * 100) : 0;
  const isToday = day === today;
  const d = parse(day);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  return (
    <>
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-dim first-letter:uppercase">{d.toLocaleDateString("pt-BR", { weekday: "long" })} · {d.toLocaleDateString("pt-BR", { month: "long" })}</p>
          <h1 className="font-display text-[5.5rem] font-extrabold leading-[0.8] tracking-tighter">
            {d.getDate()}<span className="text-lime">.</span>
          </h1>
        </div>
        <div className="pb-1 text-right">
          <p className="font-display text-4xl font-extrabold leading-none"><Roll value={pct} />%</p>
          <p className="mt-1 text-sm text-dim" aria-live="polite">{doneCount} de {due.length} {isToday ? "hoje" : "nesse dia"}</p>
        </div>
      </header>

      <div className="mt-5 flex gap-1" aria-hidden="true">
        {due.map((h) => (
          <span key={h.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-moss-3">
            <motion.span className="block h-full origin-left rounded-full bg-lime" initial={false}
              animate={{ scaleX: h.done.includes(day) ? 1 : 0 }} transition={springs.snappy} />
          </span>
        ))}
      </div>

      <div role="group" aria-label="Escolher dia" className="mt-6 grid grid-cols-7 gap-1.5">
        {week.map((k) => {
          const sel = k === day;
          const all = habits.filter((h) => scheduled(h, k));
          const r = all.length ? all.filter((h) => h.done.includes(k)).length / all.length : 0;
          return (
            <button key={k} onClick={() => setDay(k)} aria-pressed={sel}
              aria-label={`${WD_LONG[weekday(k)]}, dia ${parse(k).getDate()}: ${Math.round(r * 100)}% feito`}
              className={`relative flex flex-col items-center gap-1 rounded-2xl py-2 transition-colors ${sel ? "bg-chalk text-moss" : "text-dim hover:bg-moss-2"}`}>
              <span className="text-[11px] font-bold">{WD[weekday(k)]}</span>
              <span className="font-display text-lg font-bold leading-none">{parse(k).getDate()}</span>
              <span className={`size-1.5 rounded-full ${r === 1 ? "bg-lime" : r > 0 ? (sel ? "bg-moss/40" : "bg-dim/50") : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>
      {!isToday && (
        <p className="mt-3 flex items-center justify-between rounded-xl bg-moss-2 px-3 py-2 text-sm text-dim">
          Editando um dia anterior.
          <button onClick={() => setDay(today)} className="font-bold text-lime">Voltar para hoje</button>
        </p>
      )}

      <ul className="mt-6 space-y-2.5">
        <AnimatePresence initial={false}>
          {due.map((h) => <Row key={h.id} h={h} today={today} day={day} onToggle={() => onToggle(h)} onOpen={() => onOpen(h)} />)}
        </AnimatePresence>
      </ul>
      {due.length === 0 && (
        <div className="mt-10 rounded-3xl border border-dashed border-moss-3 p-8 text-center">
          <p className="font-display text-2xl font-bold">Dia livre.</p>
          <p className="mt-1 text-dim">Nenhum hábito agendado. Toque em + para criar um.</p>
        </div>
      )}

      {habits.some((h) => !scheduled(h, day)) && (
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-widest text-dim">Fora da agenda nesse dia</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {habits.filter((h) => !scheduled(h, day)).map((h) => (
              <button key={h.id} onClick={() => onOpen(h)} className="rounded-full border border-moss-3 px-3 py-1.5 text-sm text-dim hover:text-chalk">{h.emoji} {h.name}</button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function Row({ h, today, day, onToggle, onOpen }: { h: Habit; today: string; day: string; onToggle: () => void; onOpen: () => void }) {
  const done = h.done.includes(day);
  const { current } = streaks(h, today);
  return (
    <motion.li layout initial={{ opacity: 0, y: motionTokens.distance.sm }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={springs.snappy} className="relative overflow-hidden rounded-3xl border border-moss-3 bg-moss-2">
      <motion.span aria-hidden="true" className="absolute inset-0 origin-left bg-lime" initial={false}
        animate={{ scaleX: done ? 1 : 0 }} transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }} />
      <div className={`relative flex items-center gap-3 p-3 transition-colors duration-300 ${done ? "text-moss" : ""}`}>
        <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className={`grid size-12 shrink-0 place-items-center rounded-2xl text-2xl transition-colors ${done ? "bg-moss/10" : "bg-moss-3"}`} aria-hidden="true">{h.emoji}</span>
          <span className="min-w-0">
            <span className="block truncate text-[1.05rem] font-bold">{h.name}</span>
            <span className={`flex items-center gap-1 text-sm ${done ? "text-moss/70" : "text-dim"}`}>
              {current > 0 ? <><span aria-hidden="true">🔥</span><Roll value={current} /> {current === 1 ? "dia seguido" : "dias seguidos"}</> : "comece hoje"}
              {h.reminder && <span className="ml-1">· {h.reminder}</span>}
            </span>
          </span>
        </button>
        <motion.button whileTap={{ scale: motionTokens.scale.press }} onClick={() => { onToggle(); if (!done) navigator.vibrate?.(12); }}
          aria-pressed={done} aria-label={`${done ? "Desmarcar" : "Marcar"} ${h.name}`}
          className={`grid size-14 shrink-0 place-items-center rounded-full border-2 transition-colors ${done ? "border-moss bg-moss text-lime" : "border-moss-3 text-dim hover:border-dim"}`}>
          <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
            <motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
              initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0.25 }} transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }} />
          </svg>
        </motion.button>
      </div>
    </motion.li>
  );
}

function Grid({ h, today, weeks = 12 }: { h: Habit; today: string; weeks?: number }) {
  const end = addDays(today, 6 - weekday(today));
  const start = addDays(end, -(weeks * 7 - 1));
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
  const set = new Set(h.done);
  return (
    <div>
      <div className="grid grid-flow-col grid-rows-7 gap-1" role="img" aria-label={`Histórico das últimas ${weeks} semanas: ${h.done.filter((d) => d >= start).length} dias feitos`}>
        {cells.map((k, i) => (
          <motion.span key={k} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.004, duration: motionTokens.duration.fast }}
            className={`aspect-square rounded-[4px] ${k > today ? "bg-transparent" : set.has(k) ? "bg-lime" : scheduled(h, k) ? "bg-moss-3" : "bg-moss-2"} ${k === today ? "ring-1 ring-chalk" : ""}`} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-dim"><span>{weeks} semanas atrás</span><span>hoje</span></div>
    </div>
  );
}

function Detail({ h, today, onChange, onDelete }: { h: Habit; today: string; onChange: (h: Habit) => void; onDelete: () => void }) {
  const s = streaks(h, today);
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="space-y-7">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="sequência" value={<Roll value={s.current} />} accent />
        <Stat label="recorde" value={s.best} />
        <Stat label="30 dias" value={`${Math.round(rate(h, today, 30) * 100)}%`} />
      </div>
      {s.best > 0 && s.current < s.best && <p className="text-sm text-dim">Faltam {s.best - s.current} dias para igualar seu recorde.</p>}
      <Grid h={h} today={today} />
      <Editor initial={h} onSave={onChange} />
      {confirming ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-moss-3 p-3 text-sm" role="alertdialog" aria-label="Confirmar exclusão">
          <span>Apagar o hábito e todo o histórico?</span>
          <span className="flex gap-2">
            <button onClick={() => setConfirming(false)} className="rounded-full px-3 py-2 text-dim">Cancelar</button>
            <button onClick={onDelete} className="rounded-full bg-chalk px-3 py-2 font-bold text-moss">Apagar</button>
          </span>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} className="w-full py-3 text-sm text-dim underline">Apagar hábito</button>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${accent ? "bg-lime text-moss" : "bg-moss-2"}`}>
      <div className={`font-display text-3xl font-extrabold ${accent ? "" : "text-chalk"}`}>{value}</div>
      <div className={`text-xs ${accent ? "text-moss/70" : "text-dim"}`}>{label}</div>
    </div>
  );
}

function Editor({ initial, onSave }: { initial?: Habit; onSave: (h: Habit) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? EMOJIS[0]);
  const [days, setDays] = useState(initial?.days ?? [0, 1, 2, 3, 4, 5, 6]);
  const [reminder, setReminder] = useState(initial?.reminder ?? "");
  const [perm, setPerm] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !days.length) return;
    if (reminder && perm === "default") setPerm(await Notification.requestPermission());
    onSave({ ...(initial ?? { id: crypto.randomUUID(), done: [], created: dayKey() }), name: name.trim().slice(0, 60), emoji, days: [...days].sort(), reminder: reminder || undefined });
    if (initial) { setSaved(true); setTimeout(() => setSaved(false), 1500); }
  }

  const presets: [string, number[]][] = [["Todo dia", [0, 1, 2, 3, 4, 5, 6]], ["Dias úteis", [1, 2, 3, 4, 5]], ["Fim de semana", [0, 6]]];

  return (
    <form onSubmit={save} className="space-y-6">
      <label className="block">
        <span className="text-sm font-bold text-dim">Nome</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="Ex.: Caminhar 15 min"
          className="mt-1.5 w-full rounded-2xl border border-moss-3 bg-moss-2 px-4 py-3.5 text-base placeholder:text-dim/60 focus:border-lime" />
      </label>
      <fieldset>
        <legend className="text-sm font-bold text-dim">Ícone</legend>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {EMOJIS.map((em) => (
            <button type="button" key={em} onClick={() => setEmoji(em)} aria-pressed={emoji === em} aria-label={`Ícone ${em}`}
              className={`aspect-square rounded-2xl text-2xl transition-colors ${emoji === em ? "bg-lime" : "bg-moss-2 hover:bg-moss-3"}`}>{em}</button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-bold text-dim">Dias</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map(([label, p]) => (
            <button type="button" key={label} onClick={() => setDays(p)}
              aria-pressed={p.length === days.length && p.every((x) => days.includes(x))}
              className="rounded-full border border-moss-3 px-3 py-1.5 text-sm aria-pressed:border-lime aria-pressed:text-lime">{label}</button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {WD.map((d, i) => (
            <button type="button" key={i} aria-pressed={days.includes(i)} aria-label={WD_LONG[i]}
              onClick={() => setDays((ds) => (ds.includes(i) ? ds.filter((x) => x !== i) : [...ds, i]))}
              className={`h-12 rounded-2xl font-bold transition-colors ${days.includes(i) ? "bg-chalk text-moss" : "bg-moss-2 text-dim"}`}>{d}</button>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="text-sm font-bold text-dim">Lembrete (opcional)</span>
        <input type="time" value={reminder} onChange={(e) => setReminder(e.target.value)}
          className="mt-1.5 w-full rounded-2xl border border-moss-3 bg-moss-2 px-4 py-3.5 text-base [color-scheme:dark]" />
        {reminder && perm === "denied" && <span className="mt-1 block text-sm text-dim">As notificações estão bloqueadas no navegador.</span>}
        {reminder && perm === "unsupported" && <span className="mt-1 block text-sm text-dim">Este navegador não suporta notificações.</span>}
      </label>
      <motion.button whileTap={{ scale: 0.98 }} className="w-full rounded-2xl bg-lime py-4 font-display text-lg font-extrabold text-moss disabled:opacity-40" disabled={!name.trim() || !days.length}>
        {saved ? "Salvo ✓" : initial ? "Salvar alterações" : "Criar hábito"}
      </motion.button>
    </form>
  );
}

function Heatmap({ habits, today, weeks = 15 }: { habits: Habit[]; today: string; weeks?: number }) {
  const end = addDays(today, 6 - weekday(today));
  const start = addDays(end, -(weeks * 7 - 1));
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
  const level = (k: string) => {
    const due = habits.filter((h) => scheduled(h, k));
    if (!due.length || k > today) return -1;
    return due.filter((h) => h.done.includes(k)).length / due.length;
  };
  const shade = (v: number) => (v < 0 ? "bg-transparent" : v === 0 ? "bg-moss-3/60" : v < 0.5 ? "bg-lime/30" : v < 1 ? "bg-lime/65" : "bg-lime");
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-[3px]" role="img" aria-label={`Mapa de conclusão das últimas ${weeks} semanas`}>
      {cells.map((k) => <span key={k} title={k} className={`aspect-square rounded-[3px] ${shade(level(k))}`} />)}
    </div>
  );
}

function Stats({ habits, today }: { habits: Habit[]; today: string }) {
  const wr = weekdayRates(habits, today, 8);
  const ranked = habits.map((h) => ({ h, r: rate(h, today, 30), s: streaks(h, today) })).sort((a, b) => b.r - a.r);
  const overall = ranked.length ? ranked.reduce((a, x) => a + x.r, 0) / ranked.length : 0;
  const bestDay = wr.indexOf(Math.max(...wr));
  const worstDay = wr.indexOf(Math.min(...wr));
  return (
    <>
      <p className="text-sm text-dim">Últimos 30 dias</p>
      <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">Estatísticas</h1>

      <div className="mt-6 rounded-3xl bg-lime p-5 text-moss">
        <p className="text-sm font-bold opacity-70">Conclusão geral</p>
        <p className="font-display text-7xl font-extrabold leading-none tracking-tighter">{Math.round(overall * 100)}%</p>
        <p className="mt-2 text-sm font-bold">Maior sequência ativa: {Math.max(0, ...ranked.map((x) => x.s.current))} dias</p>
      </div>

      <section className="mt-8" aria-labelledby="map">
        <h2 id="map" className="font-display text-xl font-bold">Últimas 15 semanas</h2>
        <div className="mt-3"><Heatmap habits={habits} today={today} /></div>
        <div className="mt-2 flex items-center justify-end gap-1 text-xs text-dim" aria-hidden="true">
          menos <span className="size-3 rounded-[3px] bg-moss-3/60" /><span className="size-3 rounded-[3px] bg-lime/30" /><span className="size-3 rounded-[3px] bg-lime/65" /><span className="size-3 rounded-[3px] bg-lime" /> mais
        </div>
      </section>

      <section className="mt-8" aria-labelledby="wd">
        <h2 id="wd" className="font-display text-xl font-bold">Por dia da semana</h2>
        <p className="text-sm text-dim">Você vai melhor na {WD_LONG[bestDay]} e tropeça mais no {WD_LONG[worstDay]}.</p>
        <div className="mt-4 flex h-40 items-end gap-2">
          {wr.map((v, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs tabular-nums text-dim">{Math.round(v * 100)}</span>
              <motion.div className={`w-full origin-bottom rounded-t-lg ${i === bestDay ? "bg-lime" : "bg-moss-3"}`} style={{ height: `${Math.max(v * 100, 4)}%` }}
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ ...springs.gentle, delay: i * 0.04 }} />
              <span className="text-xs font-bold text-dim" aria-label={WD_LONG[i]}>{WD[i]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="rank">
        <h2 id="rank" className="font-display text-xl font-bold">Hábitos</h2>
        <ol className="mt-3 space-y-4">
          {ranked.map(({ h, r, s }) => (
            <li key={h.id}>
              <div className="flex justify-between text-sm"><span className="font-bold">{h.emoji} {h.name}</span><span className="tabular-nums text-dim">{Math.round(r * 100)}% · recorde {s.best}</span></div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-moss-3">
                <motion.div className="h-full origin-left rounded-full bg-lime" style={{ width: `${r * 100}%` }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={springs.gentle} />
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} aria-label={title}
      className="sheet m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-[2rem] border-t border-moss-3 bg-moss px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3 text-chalk backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:mx-auto sm:max-w-md">
      <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-moss-3" aria-hidden="true" />
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="truncate font-display text-2xl font-extrabold">{title}</h2>
        <button onClick={onClose} className="shrink-0 rounded-full bg-moss-2 px-4 py-2 text-sm font-bold">Fechar</button>
      </div>
      {children}
    </dialog>
  );
}

function useWide() {
  const q = "(min-width: 1024px)";
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

const CONFETTI_COLORS = ["#d4f04a", "#e8e2cf", "#9ba393", "#ffffff"];

/** Small confetti burst from the bottom center; re-fires whenever `fire` changes. */
function Confetti({ fire }: { fire: number }) {
  const [pieces, setPieces] = useState<{ id: number; x: number; y: number; r: number; c: string; d: number }[]>([]);
  useEffect(() => {
    if (!fire || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const batch = Array.from({ length: 36 }, (_, i) => ({
      id: fire * 100 + i, x: (Math.random() - 0.5) * 520, y: -(220 + Math.random() * 380), r: (Math.random() - 0.5) * 720,
      c: CONFETTI_COLORS[i % CONFETTI_COLORS.length], d: 0.9 + Math.random() * 0.6,
    }));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- burst is triggered by a counter prop
    setPieces(batch);
    const t = setTimeout(() => setPieces([]), 1800);
    return () => clearTimeout(t);
  }, [fire]);
  return (
    <div aria-hidden="true" className="pointer-events-none fixed bottom-24 left-1/2 z-30">
      {pieces.map((p) => (
        <motion.span key={p.id} className="absolute block h-3 w-1.5 rounded-sm" style={{ background: p.c }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }} animate={{ x: p.x, y: [0, p.y, p.y + 260], rotate: p.r, opacity: [1, 1, 0] }}
          transition={{ duration: p.d * 1.6, ease: "easeOut" }} />
      ))}
    </div>
  );
}

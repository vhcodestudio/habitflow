import { useEffect, useRef, useState, type ReactNode } from "react";
import { addDays, dayKey, parse, rate, scheduled, streaks, toggle, weekday, weekdayRates, type Habit } from "./lib/habits";
import { useHabits, useReminders } from "./store";

const WD = ["D", "S", "T", "Q", "Q", "S", "S"];
const WD_LONG = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const EMOJIS = ["💧", "📖", "🏋️", "🧘", "🗣️", "🥗", "🛌", "✍️", "🚶", "🎸"];

export default function App() {
  const [habits, setHabits] = useHabits();
  const [tab, setTab] = useState<"hoje" | "stats">("hoje");
  const [open, setOpen] = useState<Habit | "new" | null>(null);
  const today = dayKey();
  useReminders(habits);

  const update = (h: Habit) => setHabits((all) => all.map((x) => (x.id === h.id ? h : x)));
  const remove = (id: string) => { setHabits((all) => all.filter((x) => x.id !== id)); setOpen(null); };
  const add = (h: Habit) => { setHabits((all) => [...all, h]); setOpen(null); };
  const current = typeof open === "object" && open ? habits.find((h) => h.id === open.id) ?? null : null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 px-5 pb-32 pt-[max(env(safe-area-inset-top),1.5rem)]">
        {tab === "hoje" ? <Today habits={habits} today={today} onToggle={(h) => update(toggle(h, today))} onOpen={setOpen} /> : <Stats habits={habits} today={today} />}
      </main>

      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-10 border-t border-moss-3 bg-moss/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3 items-center px-5 py-2">
          <NavBtn active={tab === "hoje"} onClick={() => setTab("hoje")}>Hoje</NavBtn>
          <button onClick={() => setOpen("new")} aria-label="Novo hábito" className="mx-auto grid size-14 place-items-center rounded-2xl bg-lime text-3xl leading-none text-moss shadow-[0_6px_0_#93a82a] active:translate-y-1 active:shadow-[0_2px_0_#93a82a]">+</button>
          <NavBtn active={tab === "stats"} onClick={() => setTab("stats")}>Estatísticas</NavBtn>
        </div>
      </nav>

      {open === "new" && <Sheet title="Novo hábito" onClose={() => setOpen(null)}><Editor onSave={add} /></Sheet>}
      {current && (
        <Sheet title={`${current.emoji} ${current.name}`} onClose={() => setOpen(null)}>
          <Detail h={current} today={today} onChange={update} onDelete={() => remove(current.id)} />
        </Sheet>
      )}
    </div>
  );
}

function NavBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-current={active ? "page" : undefined} className={`py-3 text-sm font-bold ${active ? "text-lime" : "text-dim"}`}>
      {children}
    </button>
  );
}

function Ring({ value }: { value: number }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="size-20 -rotate-90" aria-hidden="true">
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-moss-3)" strokeWidth="8" />
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-lime)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value)} style={{ transition: "stroke-dashoffset .4s" }} />
    </svg>
  );
}

function Today({ habits, today, onToggle, onOpen }: { habits: Habit[]; today: string; onToggle: (h: Habit) => void; onOpen: (h: Habit) => void }) {
  const due = habits.filter((h) => scheduled(h, today));
  const doneCount = due.filter((h) => h.done.includes(today)).length;
  const date = parse(today).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return (
    <>
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm capitalize text-dim">{date}</p>
          <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight">Hoje</h1>
          <p className="mt-1 text-dim" aria-live="polite">{doneCount} de {due.length} feitos</p>
        </div>
        <div className="relative">
          <Ring value={due.length ? doneCount / due.length : 0} />
          <span className="absolute inset-0 grid place-items-center font-display text-lg font-bold">{due.length ? Math.round((doneCount / due.length) * 100) : 0}%</span>
        </div>
      </header>

      <ul className="mt-8 space-y-3">
        {due.map((h) => <Row key={h.id} h={h} today={today} onToggle={() => onToggle(h)} onOpen={() => onOpen(h)} />)}
      </ul>
      {due.length === 0 && <p className="mt-10 text-center text-dim">Nada agendado para hoje. Toque em + para criar um hábito.</p>}

      {habits.length > due.length && (
        <p className="mt-8 text-sm text-dim">
          Fora de hoje: {habits.filter((h) => !scheduled(h, today)).map((h) => (
            <button key={h.id} onClick={() => onOpen(h)} className="mr-2 underline">{h.emoji} {h.name}</button>
          ))}
        </p>
      )}
    </>
  );
}

function Row({ h, today, onToggle, onOpen }: { h: Habit; today: string; onToggle: () => void; onOpen: () => void }) {
  const done = h.done.includes(today);
  const { current } = streaks(h, today);
  const [bump, setBump] = useState(0);
  return (
    <li className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${done ? "border-lime/40 bg-moss-2" : "border-moss-3"}`}>
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-moss-3 text-xl" aria-hidden="true">{h.emoji}</span>
        <span className="min-w-0">
          <span className={`block truncate font-bold ${done ? "text-dim line-through" : ""}`}>{h.name}</span>
          <span className="text-sm text-dim">{current > 0 ? `🔥 ${current} ${current === 1 ? "dia" : "dias"} seguidos` : "comece hoje"}{h.reminder ? ` · ⏰ ${h.reminder}` : ""}</span>
        </span>
      </button>
      <button
        key={bump}
        onClick={() => { onToggle(); setBump((b) => b + 1); if (!done) navigator.vibrate?.(15); }}
        aria-pressed={done}
        aria-label={`${done ? "Desmarcar" : "Marcar"} ${h.name}`}
        className={`grid size-12 shrink-0 place-items-center rounded-full border-2 text-xl ${bump ? "pop" : ""} ${done ? "border-lime bg-lime text-moss" : "border-moss-3 text-transparent"}`}
      >✓</button>
    </li>
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
        {cells.map((k) => (
          <span key={k} className={`aspect-square rounded-[3px] ${k > today ? "bg-transparent" : set.has(k) ? "bg-lime" : scheduled(h, k) ? "bg-moss-3" : "bg-moss-2"}`} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-dim"><span>{weeks} semanas atrás</span><span>hoje</span></div>
    </div>
  );
}

function Detail({ h, today, onChange, onDelete }: { h: Habit; today: string; onChange: (h: Habit) => void; onDelete: () => void }) {
  const s = streaks(h, today);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="sequência" value={s.current} />
        <Stat label="recorde" value={s.best} />
        <Stat label="30 dias" value={`${Math.round(rate(h, today, 30) * 100)}%`} />
      </div>
      <Grid h={h} today={today} />
      <Editor initial={h} onSave={onChange} />
      <button onClick={() => { if (confirm(`Apagar “${h.name}”? O histórico some junto.`)) onDelete(); }} className="w-full py-3 text-sm text-dim underline">Apagar hábito</button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-moss-2 p-3">
      <div className="font-display text-3xl font-extrabold text-lime">{value}</div>
      <div className="text-xs text-dim">{label}</div>
    </div>
  );
}

function Editor({ initial, onSave }: { initial?: Habit; onSave: (h: Habit) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? EMOJIS[0]);
  const [days, setDays] = useState(initial?.days ?? [0, 1, 2, 3, 4, 5, 6]);
  const [reminder, setReminder] = useState(initial?.reminder ?? "");
  const [perm, setPerm] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !days.length) return;
    if (reminder && perm === "default") setPerm(await Notification.requestPermission());
    onSave({ ...(initial ?? { id: crypto.randomUUID(), done: [], created: dayKey() }), name: name.trim().slice(0, 60), emoji, days: [...days].sort(), reminder: reminder || undefined });
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <label className="block">
        <span className="text-sm text-dim">Nome</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="Ex.: Caminhar 15 min"
          className="mt-1 w-full rounded-xl border border-moss-3 bg-moss-2 px-4 py-3 text-base placeholder:text-dim/60" />
      </label>
      <fieldset>
        <legend className="text-sm text-dim">Ícone</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {EMOJIS.map((em) => (
            <button type="button" key={em} onClick={() => setEmoji(em)} aria-pressed={emoji === em} aria-label={`Ícone ${em}`}
              className={`size-11 rounded-xl text-xl ${emoji === em ? "bg-lime" : "bg-moss-2"}`}>{em}</button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm text-dim">Dias</legend>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {WD.map((d, i) => (
            <button type="button" key={i} aria-pressed={days.includes(i)} aria-label={WD_LONG[i]}
              onClick={() => setDays((ds) => (ds.includes(i) ? ds.filter((x) => x !== i) : [...ds, i]))}
              className={`h-11 rounded-xl font-bold ${days.includes(i) ? "bg-chalk text-moss" : "bg-moss-2 text-dim"}`}>{d}</button>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="text-sm text-dim">Lembrete (opcional)</span>
        <input type="time" value={reminder} onChange={(e) => setReminder(e.target.value)}
          className="mt-1 w-full rounded-xl border border-moss-3 bg-moss-2 px-4 py-3 text-base [color-scheme:dark]" />
        {reminder && perm === "denied" && <span className="mt-1 block text-sm text-dim">As notificações estão bloqueadas no navegador.</span>}
        {reminder && perm === "unsupported" && <span className="mt-1 block text-sm text-dim">Este navegador não suporta notificações.</span>}
      </label>
      <button className="w-full rounded-2xl bg-lime py-4 font-display text-lg font-extrabold text-moss disabled:opacity-40" disabled={!name.trim() || !days.length}>
        {initial ? "Salvar alterações" : "Criar hábito"}
      </button>
    </form>
  );
}

function Stats({ habits, today }: { habits: Habit[]; today: string }) {
  const wr = weekdayRates(habits, today, 8);
  const ranked = habits.map((h) => ({ h, r: rate(h, today, 30), s: streaks(h, today) })).sort((a, b) => b.r - a.r);
  const overall = ranked.length ? ranked.reduce((a, x) => a + x.r, 0) / ranked.length : 0;
  const bestDay = wr.indexOf(Math.max(...wr));
  return (
    <>
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Estatísticas</h1>
      <p className="mt-1 text-dim">Últimos 30 dias</p>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Stat label="conclusão geral" value={`${Math.round(overall * 100)}%`} />
        <Stat label="maior sequência ativa" value={Math.max(0, ...ranked.map((x) => x.s.current))} />
      </div>

      <section className="mt-8" aria-labelledby="wd">
        <h2 id="wd" className="font-display text-xl font-bold">Por dia da semana</h2>
        <p className="text-sm text-dim">Seu melhor dia é {WD_LONG[bestDay]}.</p>
        <div className="mt-4 flex h-36 items-end gap-2">
          {wr.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs text-dim">{Math.round(v * 100)}</span>
              <div className={`w-full rounded-t-md ${i === bestDay ? "bg-lime" : "bg-moss-3"}`} style={{ height: `${Math.max(v * 100, 4)}px` }} />
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
              <div className="flex justify-between text-sm"><span>{h.emoji} {h.name}</span><span className="text-dim">{Math.round(r * 100)}% · recorde {s.best}</span></div>
              <div className="mt-1 h-2 rounded-full bg-moss-3"><div className="h-2 rounded-full bg-lime" style={{ width: `${r * 100}%` }} /></div>
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
      className="sheet m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-moss px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3 text-chalk backdrop:bg-black/60 sm:mx-auto sm:max-w-md">
      <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-moss-3" aria-hidden="true" />
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="truncate font-display text-2xl font-extrabold">{title}</h2>
        <button onClick={onClose} className="shrink-0 rounded-full bg-moss-2 px-4 py-2 text-sm">Fechar</button>
      </div>
      {children}
    </dialog>
  );
}

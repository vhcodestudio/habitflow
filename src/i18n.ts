import { createContext, useContext, useEffect, useState } from "react";

export const LANGS = ["pt", "en", "es"] as const;
export type Lang = (typeof LANGS)[number];
export const langLabel: Record<Lang, string> = { pt: "Português", en: "English", es: "Español" };
const LOCALE: Record<Lang, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" };
const KEY = "habitflow:lang";

/** ?lang= in the URL wins, then the saved choice, then the browser language. */
export function detectLang(): Lang {
  try {
    const q = new URLSearchParams(location.search).get("lang");
    if (q && (LANGS as readonly string[]).includes(q)) return q as Lang;
    const saved = localStorage.getItem(KEY);
    if (saved && (LANGS as readonly string[]).includes(saved)) return saved as Lang;
  } catch { /* storage blocked */ }
  const nav = (typeof navigator !== "undefined" ? navigator.language : "pt").toLowerCase();
  return nav.startsWith("es") ? "es" : nav.startsWith("en") ? "en" : "pt";
}

export function useLangState() {
  const [lang, setLang] = useState<Lang>(detectLang);
  useEffect(() => {
    document.documentElement.lang = LOCALE[lang];
    document.title = dicts[lang].title;
    try { localStorage.setItem(KEY, lang); } catch { /* storage blocked */ }
  }, [lang]);
  return [lang, setLang] as const;
}

const pt = {
  title: "habitflow — hábitos que ficam",
  locale: "pt-BR",
  skip: "Pular para o conteúdo",
  wd: ["D", "S", "T", "Q", "Q", "S", "S"],
  wdLong: ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"],
  milestone: (n: number, name: string) => `${n} dias seguidos de “${name}”. Isso já é rotina.`,
  nav: { label: "Principal", today: "Hoje", stats: "Estatísticas", newHabit: "Novo hábito", newSmall: "novo hábito", language: "Idioma" },
  today: {
    of: (done: number, total: number, isToday: boolean) => `${done} de ${total} ${isToday ? "hoje" : "nesse dia"}`,
    pickDay: "Escolher dia", dayLabel: (wd: string, n: number, pct: number) => `${wd}, dia ${n}: ${pct}% feito`,
    past: "Editando um dia anterior.", back: "Voltar para hoje",
    free: "Dia livre.", freeText: "Nenhum hábito agendado. Toque em + para criar um.", off: "Fora da agenda nesse dia",
    streak: (n: number): string => (n === 1 ? "dia seguido" : "dias seguidos"), start: "comece hoje",
    check: (done: boolean, name: string) => `${done ? "Desmarcar" : "Marcar"} ${name}`,
  },
  grid: { label: (w: number, n: number) => `Histórico das últimas ${w} semanas: ${n} dias feitos`, ago: (w: number) => `${w} semanas atrás`, now: "hoje" },
  detail: {
    streak: "sequência", best: "recorde", d30: "30 dias", toBest: (n: number) => `Faltam ${n} dias para igualar seu recorde.`,
    confirm: "Confirmar exclusão", ask: "Apagar o hábito e todo o histórico?", cancel: "Cancelar", del: "Apagar", delHabit: "Apagar hábito",
  },
  editor: {
    presets: ["Todo dia", "Dias úteis", "Fim de semana"], name: "Nome", placeholder: "Ex.: Caminhar 15 min", icon: "Ícone", days: "Dias",
    reminder: "Lembrete (opcional)", blocked: "As notificações estão bloqueadas no navegador.", unsupported: "Este navegador não suporta notificações.",
    saved: "Salvo ✓", save: "Salvar alterações", create: "Criar hábito",
  },
  stats: {
    last30: "Últimos 30 dias", title: "Estatísticas", overall: "Conclusão geral", bestActive: (n: number) => `Maior sequência ativa: ${n} dias`,
    weeks: "Últimas 15 semanas", mapLabel: (w: number) => `Mapa de conclusão das últimas ${w} semanas`, less: "menos", more: "mais",
    byDay: "Por dia da semana", byDayText: (best: string, worst: string) => `Você vai melhor na ${best} e tropeça mais no ${worst}.`,
    habits: "Hábitos", record: "recorde",
  },
  close: "Fechar",
  seed: ["Beber 2 L de água", "Ler 20 páginas", "Treinar", "Inglês no app"],
};
export type Dict = typeof pt;

const en: Dict = {
  title: "habitflow — habits that stick",
  locale: "en-US",
  skip: "Skip to content",
  wd: ["S", "M", "T", "W", "T", "F", "S"],
  wdLong: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  milestone: (n, name) => `${n} days in a row of “${name}”. That is a routine now.`,
  nav: { label: "Main", today: "Today", stats: "Stats", newHabit: "New habit", newSmall: "new habit", language: "Language" },
  today: {
    of: (done, total, isToday) => `${done} of ${total} ${isToday ? "today" : "that day"}`,
    pickDay: "Pick a day", dayLabel: (wd, n, pct) => `${wd}, day ${n}: ${pct}% done`,
    past: "Editing a past day.", back: "Back to today",
    free: "Free day.", freeText: "No habits scheduled. Tap + to create one.", off: "Not scheduled that day",
    streak: (n) => (n === 1 ? "day in a row" : "days in a row"), start: "start today",
    check: (done, name) => `${done ? "Uncheck" : "Check"} ${name}`,
  },
  grid: { label: (w, n) => `History for the last ${w} weeks: ${n} days done`, ago: (w) => `${w} weeks ago`, now: "today" },
  detail: {
    streak: "streak", best: "best", d30: "30 days", toBest: (n) => `${n} more days to match your best.`,
    confirm: "Confirm delete", ask: "Delete the habit and all its history?", cancel: "Cancel", del: "Delete", delHabit: "Delete habit",
  },
  editor: {
    presets: ["Every day", "Weekdays", "Weekends"], name: "Name", placeholder: "E.g. Walk for 15 min", icon: "Icon", days: "Days",
    reminder: "Reminder (optional)", blocked: "Notifications are blocked in this browser.", unsupported: "This browser does not support notifications.",
    saved: "Saved ✓", save: "Save changes", create: "Create habit",
  },
  stats: {
    last30: "Last 30 days", title: "Stats", overall: "Overall completion", bestActive: (n) => `Longest active streak: ${n} days`,
    weeks: "Last 15 weeks", mapLabel: (w) => `Completion map for the last ${w} weeks`, less: "less", more: "more",
    byDay: "By day of the week", byDayText: (best, worst) => `You do best on ${best} and slip most on ${worst}.`,
    habits: "Habits", record: "best",
  },
  close: "Close",
  seed: ["Drink 2 L of water", "Read 20 pages", "Work out", "Spanish on the app"],
};

const es: Dict = {
  title: "habitflow — hábitos que se quedan",
  locale: "es-ES",
  skip: "Saltar al contenido",
  wd: ["D", "L", "M", "X", "J", "V", "S"],
  wdLong: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  milestone: (n, name) => `${n} días seguidos de “${name}”. Eso ya es rutina.`,
  nav: { label: "Principal", today: "Hoy", stats: "Estadísticas", newHabit: "Nuevo hábito", newSmall: "nuevo hábito", language: "Idioma" },
  today: {
    of: (done, total, isToday) => `${done} de ${total} ${isToday ? "hoy" : "ese día"}`,
    pickDay: "Elegir día", dayLabel: (wd, n, pct) => `${wd}, día ${n}: ${pct}% hecho`,
    past: "Editando un día anterior.", back: "Volver a hoy",
    free: "Día libre.", freeText: "Ningún hábito programado. Toca + para crear uno.", off: "Fuera de agenda ese día",
    streak: (n) => (n === 1 ? "día seguido" : "días seguidos"), start: "empieza hoy",
    check: (done, name) => `${done ? "Desmarcar" : "Marcar"} ${name}`,
  },
  grid: { label: (w, n) => `Historial de las últimas ${w} semanas: ${n} días hechos`, ago: (w) => `hace ${w} semanas`, now: "hoy" },
  detail: {
    streak: "racha", best: "récord", d30: "30 días", toBest: (n) => `Faltan ${n} días para igualar tu récord.`,
    confirm: "Confirmar eliminación", ask: "¿Borrar el hábito y todo su historial?", cancel: "Cancelar", del: "Borrar", delHabit: "Borrar hábito",
  },
  editor: {
    presets: ["Todos los días", "Días hábiles", "Fin de semana"], name: "Nombre", placeholder: "Ej.: Caminar 15 min", icon: "Ícono", days: "Días",
    reminder: "Recordatorio (opcional)", blocked: "Las notificaciones están bloqueadas en el navegador.", unsupported: "Este navegador no admite notificaciones.",
    saved: "Guardado ✓", save: "Guardar cambios", create: "Crear hábito",
  },
  stats: {
    last30: "Últimos 30 días", title: "Estadísticas", overall: "Cumplimiento general", bestActive: (n) => `Racha activa más larga: ${n} días`,
    weeks: "Últimas 15 semanas", mapLabel: (w) => `Mapa de cumplimiento de las últimas ${w} semanas`, less: "menos", more: "más",
    byDay: "Por día de la semana", byDayText: (best, worst) => `Te va mejor el ${best} y fallas más el ${worst}.`,
    habits: "Hábitos", record: "récord",
  },
  close: "Cerrar",
  seed: ["Beber 2 L de agua", "Leer 20 páginas", "Entrenar", "Inglés en la app"],
};

export const dicts: Record<Lang, Dict> = { pt, en, es };

export const LangContext = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({ lang: "pt", t: pt, setLang: () => {} });
export const useT = () => useContext(LangContext).t;

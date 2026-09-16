import { dominicanDate } from "@ahorra/domain";

export function currentMonth(): string {
  return dominicanDate().slice(0, 7);
}

export function today(): string {
  return dominicanDate();
}

export function monthLabel(month: string): string {
  const [year, value] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es-DO", { month: "long", year: "numeric" }).format(
    new Date(year!, value! - 1, 1)
  );
}

export async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error("No pudimos cargar la información.");
  return response.json() as Promise<T>;
}

export function getUserName(
  user: { email?: string; user_metadata?: Record<string, unknown> } | null
): string {
  if (!user) return "Usuario";
  const meta = user.user_metadata;
  if (meta?.username && typeof meta.username === "string" && (meta.username as string).trim())
    return (meta.username as string).trim();
  if (
    meta?.display_name &&
    typeof meta.display_name === "string" &&
    (meta.display_name as string).trim()
  )
    return (meta.display_name as string).trim();
  if (meta?.full_name && typeof meta.full_name === "string" && (meta.full_name as string).trim())
    return (meta.full_name as string).trim();
  if (meta?.name && typeof meta.name === "string" && (meta.name as string).trim())
    return (meta.name as string).trim();
  if (user.email) {
    const raw = user.email.split("@")[0] || "Usuario";
    return raw
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return "Usuario";
}

export function getUserInitial(name: string): string {
  if (!name) return "U";
  return name.charAt(0).toUpperCase();
}

/** El mes anterior a uno dado, en formato AAAA-MM. */
export function previousMonth(month: string): string {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(year!, value! - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Solo el nombre del mes, en minusculas: "septiembre". */
export function monthName(month: string): string {
  const [year, value] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es-DO", { month: "long" }).format(new Date(year!, value! - 1, 1));
}

export interface MonthElapsed {
  day: number;
  days: number;
  /** Parte del mes que ya paso, de 0 a 1. */
  ratio: number;
  /** Solo el mes en curso tiene un "hoy" que marcar. */
  current: boolean;
}

/** Cuanto del mes ya paso. Un mes cerrado vale 1 y uno que aun no empieza, 0. */
export function monthElapsed(month: string): MonthElapsed {
  const [year, value] = month.split("-").map(Number);
  const days = new Date(year!, value!, 0).getDate();
  const now = today();
  if (now.slice(0, 7) !== month) {
    const past = now.slice(0, 7) > month;
    return { day: past ? days : 0, days, ratio: past ? 1 : 0, current: false };
  }
  const day = Number(now.slice(8, 10));
  return { day, days, ratio: day / days, current: true };
}

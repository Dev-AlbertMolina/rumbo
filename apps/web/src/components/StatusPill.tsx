import { CheckCircle2, CircleDot, Clock, PauseCircle } from "./icons";
import { ICON_TEXT } from "./icons";

export type StatusPillTone = "registered" | "scheduled" | "active" | "paused" | "completed";

const ICONS: Record<StatusPillTone, typeof CheckCircle2> = {
  registered: CheckCircle2,
  scheduled: Clock,
  active: CircleDot,
  paused: PauseCircle,
  completed: CheckCircle2
};

export function StatusPill({ tone, label }: { tone: StatusPillTone; label: string }) {
  const Icon = ICONS[tone];
  return (
    <span className={`status-pill ${tone}`}>
      <Icon size={ICON_TEXT} aria-hidden="true" />
      {label}
    </span>
  );
}

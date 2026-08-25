import Link from 'next/link';
import { CalendarClock, Gavel, Landmark, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  CASE_STATUS_COLORS,
  CASE_STATUS_LABELS,
  DISCIPLINE_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  type CaseDiscipline,
  type CaseExpanded,
  type CaseStatus,
} from '@/lib/types';

interface CaseCardProps {
  item: CaseExpanded;
  hidePrivateDetails?: boolean;
}

function formatAmount(amount?: number) {
  if (!amount) return '-';

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDeadline(deadlineDate?: string) {
  if (!deadlineDate) return null;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(deadlineDate)
    ? `${deadlineDate}T12:00:00`
    : deadlineDate;
  const target = new Date(normalized);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
  const formatted = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(target);

  if (days <= 7) return { formatted, color: 'bg-red-100 text-red-800', label: 'Urgente' };
  if (days <= 30) return { formatted, color: 'bg-amber-100 text-amber-800', label: 'Próxima' };
  return { formatted, color: 'bg-emerald-100 text-emerald-800', label: 'Programada' };
}

export function CaseCard({ item, hidePrivateDetails = false }: CaseCardProps) {
  const statusColor = CASE_STATUS_COLORS[item.status as CaseStatus];
  const priorityColor = PRIORITY_COLORS[item.priority];
  const brand = item.brand || 'CNP';
  const deadline = formatDeadline(item.deadlineDate);

  return (
    <Link
      href={`/crm/cases/${item._id}`}
      aria-label={`Abrir caso ${item.caseCode}: ${item.title}`}
      className="group block h-full rounded-2xl outline-none ring-[#2969b0] focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-white p-4 shadow-sm transition-[transform,box-shadow,border-color] duration-200 group-hover:-translate-y-0.5 group-hover:border-[#2969b0]/35 group-hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none">
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-0.5 ${brand === 'Peritus' ? 'bg-violet-500' : 'bg-sky-500'}`}
        />

        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Badge
              variant="outline"
              className={`shrink-0 border-0 text-[10px] font-semibold ${
                brand === 'Peritus'
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-sky-100 text-sky-700'
              }`}
            >
              {brand}
            </Badge>
            <span className="truncate font-mono text-[11px] font-medium text-muted-foreground">
              {item.caseCode}
            </span>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 border-0 px-2 py-0.5 text-[10px] ${statusColor?.bg} ${statusColor?.text}`}
          >
            <span className={`mr-1.5 size-1.5 rounded-full ${statusColor?.dot}`} />
            {CASE_STATUS_LABELS[item.status as CaseStatus] || item.status}
          </Badge>
        </div>

        <h2
          title={item.title}
          className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-foreground group-hover:text-[#1b5697]"
        >
          {item.title}
        </h2>

        <div className="mt-2 min-h-11">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Objeto del dictamen
          </p>
          <p
            title={item.dictamenObject || undefined}
            className="mt-0.5 line-clamp-2 text-xs leading-4 text-muted-foreground"
          >
            {item.dictamenObject || 'Sin objeto registrado'}
          </p>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/50 pt-3">
          {!hidePrivateDetails && (
            <div className="col-span-2 min-w-0">
              <dt className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <UserRound className="size-3" aria-hidden="true" />
                Cliente
              </dt>
              <dd className="mt-0.5 truncate text-xs font-medium text-foreground" title={item.client?.name}>
                {item.client?.name || '-'}
              </dd>
            </div>
          )}

          <div className="min-w-0">
            <dt className="text-[10px] text-muted-foreground">Disciplina</dt>
            <dd className="mt-0.5 truncate text-xs font-medium text-foreground">
              {DISCIPLINE_LABELS[item.discipline as CaseDiscipline] || item.discipline}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] text-muted-foreground">Prioridad</dt>
            <dd className="mt-0.5">
              <Badge
                variant="outline"
                className={`border-0 px-2 py-0 text-[10px] ${priorityColor?.bg} ${priorityColor?.text}`}
              >
                {PRIORITY_LABELS[item.priority] || item.priority}
              </Badge>
            </dd>
          </div>

          {!hidePrivateDetails && (
            <div className="col-span-2 min-w-0">
              <dt className="text-[10px] text-muted-foreground">Monto estimado</dt>
              <dd className="mt-0.5 truncate font-mono text-xs font-semibold text-foreground">
                {formatAmount(item.estimatedAmount)}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-auto grid grid-cols-3 gap-1.5 border-t border-border/50 pt-3">
          <div className="min-w-0 rounded-lg bg-muted/45 px-2 py-1.5 text-center">
            <Gavel className="mx-auto size-3 text-muted-foreground" aria-hidden="true" />
            <p className="mt-1 text-[9px] text-muted-foreground">Juzgado</p>
            <p className="truncate text-[10px] font-semibold text-foreground" title={item.courtName || undefined}>
              {item.courtName ? 'Sí' : 'No'}
            </p>
          </div>
          <div className="min-w-0 rounded-lg bg-muted/45 px-2 py-1.5 text-center">
            <Landmark className="mx-auto size-3 text-muted-foreground" aria-hidden="true" />
            <p className="mt-1 text-[9px] text-muted-foreground">Audiencia</p>
            <p className="text-[10px] font-semibold text-foreground">{item.hasHearing ? 'Sí' : 'No'}</p>
          </div>
          <div className="min-w-0 rounded-lg bg-muted/45 px-2 py-1.5 text-center">
            <CalendarClock className="mx-auto size-3 text-muted-foreground" aria-hidden="true" />
            <p className="mt-1 text-[9px] text-muted-foreground">Entrega</p>
            {deadline ? (
              <p
                title={`${deadline.label}: ${deadline.formatted}`}
                className={`mt-0.5 truncate rounded px-1 text-[10px] font-semibold ${deadline.color}`}
              >
                {deadline.formatted}
              </p>
            ) : (
              <p className="text-[10px] font-semibold text-foreground">-</p>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

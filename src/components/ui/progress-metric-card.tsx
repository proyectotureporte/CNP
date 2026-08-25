'use client';

import { useId, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, ChartNoAxesCombined, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface MetricSeriesPoint {
  date: string;
  value: number;
}

interface RangeOption {
  label: string;
  value: string;
}

interface MetricFilter {
  ariaLabel: string;
  value: string;
  options: RangeOption[];
  onChange: (value: string) => void;
}

interface ProgressMetricCardProps {
  title: string;
  value: number;
  unit: string;
  data: MetricSeriesPoint[];
  href: string;
  rangeLabel: string;
  rangeOptions?: RangeOption[];
  rangeValue?: string;
  onRangeChange?: (value: string) => void;
  filters?: MetricFilter[];
  trendPercent?: number | null;
  footerLead: string;
  dateGranularity: 'day' | 'month';
  className?: string;
}

type ChartMode = 'area' | 'bar';

function formatPointDate(value: string, granularity: 'day' | 'month') {
  const normalizedValue = granularity === 'month' && /^\d{4}-\d{2}$/.test(value)
    ? `${value}-01T12:00:00`
    : granularity === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T12:00:00`
      : value;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';

  return new Intl.DateTimeFormat('es-CO', granularity === 'month'
    ? { month: 'short', year: 'numeric' }
    : { day: 'numeric', month: 'short' }).format(date);
}

function MetricTooltip({
  active,
  payload,
  label,
  granularity,
  unit,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    value?: number | string;
    payload?: MetricSeriesPoint;
  }>;
  label?: string | number;
  granularity: 'day' | 'month';
  unit: string;
}) {
  if (!active || !payload?.length) return null;

  const pointDate = payload[0].payload?.date ?? (typeof label === 'string' ? label : '');

  return (
    <div className="rounded-lg border border-border/70 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      <p className="font-medium text-foreground">{formatPointDate(pointDate, granularity)}</p>
      <p className="mt-0.5 text-muted-foreground">
        <span className="font-semibold text-[#1b5697]">{Number(payload[0].value ?? 0).toLocaleString('es-CO')}</span>{' '}
        {unit}
      </p>
    </div>
  );
}

export default function ProgressMetricCard({
  title,
  value,
  unit,
  data,
  href,
  rangeLabel,
  rangeOptions,
  rangeValue,
  onRangeChange,
  filters,
  trendPercent,
  footerLead,
  dateGranularity,
  className,
}: ProgressMetricCardProps) {
  const router = useRouter();
  const gradientId = `metric-${useId().replaceAll(':', '')}`;
  const [chartMode, setChartMode] = useState<ChartMode>('area');

  const summary = useMemo(() => {
    const values = data.map((point) => point.value);
    if (values.length === 0) return { peak: 0, low: 0, average: 0 };

    return {
      peak: Math.max(...values),
      low: Math.min(...values),
      average: Number((values.reduce((total, item) => total + item, 0) / values.length).toFixed(1)),
    };
  }, [data]);

  function navigate() {
    router.push(href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate();
    }
  }

  function selectChartMode(event: MouseEvent<HTMLButtonElement>, mode: ChartMode) {
    event.stopPropagation();
    setChartMode(mode);
  }

  const trendIsPositive = (trendPercent ?? 0) >= 0;
  const TrendIcon = trendIsPositive ? TrendingUp : TrendingDown;

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Abrir ${title}`}
      onClick={navigate}
      onKeyDown={handleKeyDown}
      className={cn(
        'h-full cursor-pointer rounded-2xl outline-none ring-[#2969b0] transition-shadow focus-visible:ring-2 focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="flex h-full min-h-64 flex-col rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <div
              className="flex rounded-lg border border-border/70 bg-muted/40 p-0.5"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Mostrar gráfico de línea"
                aria-pressed={chartMode === 'area'}
                onClick={(event) => selectChartMode(event, 'area')}
                className={cn(
                  'rounded-md p-1.5 text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2969b0]',
                  chartMode === 'area' && 'bg-white text-[#1b5697] shadow-sm',
                )}
              >
                <ChartNoAxesCombined className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Mostrar gráfico de barras"
                aria-pressed={chartMode === 'bar'}
                onClick={(event) => selectChartMode(event, 'bar')}
                className={cn(
                  'rounded-md p-1.5 text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2969b0]',
                  chartMode === 'bar' && 'bg-white text-[#1b5697] shadow-sm',
                )}
              >
                <BarChart3 className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {trendPercent !== null && trendPercent !== undefined && (
              <span className={cn(
                'inline-flex items-center gap-1 font-semibold',
                trendIsPositive ? 'text-emerald-600' : 'text-rose-600',
              )}>
                <TrendIcon className="size-3.5" />
                {trendIsPositive ? '+' : ''}{trendPercent.toFixed(1)}%
              </span>
            )}
            {rangeOptions && rangeValue && onRangeChange ? (
              <select
                aria-label="Periodo del gráfico"
                value={rangeValue}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => onRangeChange(event.target.value)}
                className="cursor-pointer rounded-md border-0 bg-transparent py-1 pl-1 pr-0 text-xs font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#2969b0]"
              >
                {rangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <span className="font-medium text-muted-foreground">{rangeLabel}</span>
            )}
          </div>
        </div>

        {filters && filters.length > 0 && (
          <div
            className="relative z-10 flex flex-wrap gap-2 px-5 pt-2"
            onClick={(event) => event.stopPropagation()}
          >
            {filters.map((filter) => (
              <select
                key={filter.ariaLabel}
                aria-label={filter.ariaLabel}
                value={filter.value}
                onChange={(event) => filter.onChange(event.target.value)}
                className="cursor-pointer rounded-lg border border-border/70 bg-muted/35 px-2.5 py-1.5 text-xs font-medium text-foreground outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-[#2969b0]"
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ))}
          </div>
        )}

        <div className="relative z-10 px-5 pt-3">
          <p className="text-[2.55rem] font-semibold leading-none tracking-[-0.05em] text-[#1b5697]">
            {value.toLocaleString('es-CO')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{unit}</p>
        </div>

        <div
          className="relative z-0 mt-1 h-28 w-full bg-[size:12px_12px]"
          style={{
            backgroundImage: 'radial-gradient(rgba(41,105,176,0.16) 1px, transparent 1px)',
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'area' ? (
              <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2969b0" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2969b0" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <Tooltip
                  content={(props) => (
                    <MetricTooltip
                      active={props.active}
                      payload={props.payload}
                      label={props.label}
                      granularity={dateGranularity}
                      unit={unit}
                    />
                  )}
                  cursor={{ stroke: '#2969b0', strokeOpacity: 0.18, strokeDasharray: '3 3' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2969b0"
                  strokeWidth={2.25}
                  fill={`url(#${gradientId})`}
                  activeDot={{ r: 4, fill: '#1b5697', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={500}
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="date" hide />
                <Tooltip
                  content={(props) => (
                    <MetricTooltip
                      active={props.active}
                      payload={props.payload}
                      label={props.label}
                      granularity={dateGranularity}
                      unit={unit}
                    />
                  )}
                  cursor={{ fill: 'rgba(41,105,176,0.06)' }}
                />
                <Bar
                  dataKey="value"
                  fill="#2969b0"
                  radius={[4, 4, 0, 0]}
                  animationDuration={500}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="relative z-10 mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border/50 px-5 py-3 text-[11px]">
          <span className="font-semibold text-[#2969b0]">{footerLead}</span>
          <span className="text-muted-foreground">
            <strong className="font-semibold text-foreground">{summary.peak.toLocaleString('es-CO')}</strong> máx.
            <span className="mx-1.5 text-border">·</span>
            <strong className="font-semibold text-foreground">{summary.low.toLocaleString('es-CO')}</strong> mín.
            <span className="mx-1.5 text-border">·</span>
            <strong className="font-semibold text-foreground">{summary.average.toLocaleString('es-CO')}</strong> prom.
          </span>
        </div>
      </div>
    </article>
  );
}

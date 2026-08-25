"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, FileText } from 'lucide-react';
import type { DashboardStats as DashboardStatsType } from '@/lib/types';
import type { UserRole } from '@/lib/types';
import ProgressMetricCard from '@/components/ui/progress-metric-card';

interface DashboardStatsProps {
  stats: DashboardStatsType;
  userRole: UserRole;
  allRoles?: boolean;
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

const periodOptions = [
  { value: '7', label: '7 días' },
  { value: '15', label: '15 días' },
  { value: '28', label: '28 días' },
  { value: '90', label: '3 meses' },
];

const caseBrandOptions = [
  { value: 'all', label: 'Todas las marcas' },
  { value: 'CNP', label: 'CNP' },
  { value: 'Peritus', label: 'Peritus' },
];

const casePeriodOptions = [
  { value: 'all', label: 'Todos' },
  ...periodOptions,
];

const caseDeadlineOptions = [
  { value: 'all', label: 'Todos los casos' },
  { value: 'upcoming', label: 'Próximos a vencer' },
  { value: 'urgent', label: 'Urgentes' },
];

function calculateTrend(current: number, previous: number): number | null {
  if (current === 0 && previous === 0) return 0;
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export default function DashboardStats({ stats, userRole, allRoles = false }: DashboardStatsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [selectedCasePeriod, setSelectedCasePeriod] = useState('all');
  const [selectedCaseBrand, setSelectedCaseBrand] = useState('all');
  const [selectedCaseDeadline, setSelectedCaseDeadline] = useState('all');
  const periodDays = Number(selectedPeriod);
  const casePeriodDays = selectedCasePeriod === 'all' ? null : Number(selectedCasePeriod);

  const recentMetric = useMemo(() => {
    const current = stats.clientRegistrationsByDay.slice(-periodDays);
    const previous = stats.clientRegistrationsByDay.slice(-(periodDays * 2), -periodDays);
    const total = current.reduce((sum, point) => sum + point.value, 0);
    const previousTotal = previous.reduce((sum, point) => sum + point.value, 0);

    return {
      data: current,
      total,
      trend: calculateTrend(total, previousTotal),
      today: current.at(-1)?.value ?? 0,
    };
  }, [periodDays, stats.clientRegistrationsByDay]);

  const monthlyMetric = useMemo(() => {
    const current = stats.clientGrowthByMonth.at(-1)?.value ?? stats.totalClients;
    const previous = stats.clientGrowthByMonth.at(-2)?.value ?? 0;
    const addedThisMonth = Math.max(0, current - previous);

    return {
      trend: calculateTrend(current, previous),
      addedThisMonth,
    };
  }, [stats.clientGrowthByMonth, stats.totalClients]);

  const caseMetric = useMemo(() => {
    const dates = [...new Set(stats.caseRegistrationsByDay.map((point) => point.date))].sort();
    const currentDates = casePeriodDays === null ? dates : dates.slice(-casePeriodDays);
    const previousDates = casePeriodDays === null
      ? []
      : dates.slice(-(casePeriodDays * 2), -casePeriodDays);
    const field = selectedCaseDeadline === 'urgent'
      ? 'urgent'
      : selectedCaseDeadline === 'upcoming'
        ? 'upcoming'
        : 'total';

    function buildSeries(selectedDates: string[]) {
      return selectedDates.map((date) => ({
        date,
        value: stats.caseRegistrationsByDay
          .filter((point) => point.date === date && (
            selectedCaseBrand === 'all' || point.brand === selectedCaseBrand
          ))
          .reduce((sum, point) => sum + point[field], 0),
      }));
    }

    const data = buildSeries(currentDates);
    const previousData = buildSeries(previousDates);
    const total = data.reduce((sum, point) => sum + point.value, 0);
    const previousTotal = previousData.reduce((sum, point) => sum + point.value, 0);

    return {
      data,
      total,
      trend: casePeriodDays === null ? null : calculateTrend(total, previousTotal),
      today: data.at(-1)?.value ?? 0,
    };
  }, [casePeriodDays, selectedCaseBrand, selectedCaseDeadline, stats.caseRegistrationsByDay]);

  const casesHref = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCaseBrand !== 'all') params.set('brand', selectedCaseBrand);
    if (selectedCaseDeadline === 'upcoming') params.set('deadlineFilter', 'proximos');
    if (selectedCaseDeadline === 'urgent') params.set('deadlineFilter', 'urgente');
    const query = params.toString();
    if (userRole === 'admin' && !allRoles) return '/crm/reports';
    return query ? `/crm/cases?${query}` : '/crm/cases';
  }, [allRoles, selectedCaseBrand, selectedCaseDeadline, userRole]);

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
        {(allRoles || userRole === 'admin' || userRole === 'comercial_juridico') && <ProgressMetricCard
          title="Total Clientes"
          value={stats.totalClients}
          unit="clientes acumulados"
          data={stats.clientGrowthByMonth}
          href="/crm/clients"
          rangeLabel="Desde el inicio"
          trendPercent={monthlyMetric.trend}
          footerLead={`+${monthlyMetric.addedThisMonth} este mes`}
          dateGranularity="month"
        />}

        {(allRoles || userRole === 'admin' || userRole === 'comercial_juridico') && <ProgressMetricCard
          title="Clientes nuevos"
          value={recentMetric.total}
          unit={`registrados en ${periodOptions.find((option) => option.value === selectedPeriod)?.label.toLowerCase()}`}
          data={recentMetric.data}
          href="/crm/clients"
          rangeLabel=""
          rangeOptions={periodOptions}
          rangeValue={selectedPeriod}
          onRangeChange={setSelectedPeriod}
          trendPercent={recentMetric.trend}
          footerLead={`+${recentMetric.today} hoy`}
          dateGranularity="day"
        />}

        <ProgressMetricCard
          title="Casos"
          value={caseMetric.total}
          unit={selectedCasePeriod === 'all'
            ? userRole === 'perito_interno' ? 'casos asignados' : 'casos en el sistema'
            : `creados en ${periodOptions.find((option) => option.value === selectedCasePeriod)?.label.toLowerCase()}`}
          data={caseMetric.data}
          href={casesHref}
          rangeLabel=""
          rangeOptions={casePeriodOptions}
          rangeValue={selectedCasePeriod}
          onRangeChange={setSelectedCasePeriod}
          filters={[
            {
              ariaLabel: 'Filtrar casos por marca',
              value: selectedCaseBrand,
              options: caseBrandOptions,
              onChange: setSelectedCaseBrand,
            },
            {
              ariaLabel: 'Filtrar casos por vencimiento',
              value: selectedCaseDeadline,
              options: caseDeadlineOptions,
              onChange: setSelectedCaseDeadline,
            },
          ]}
          trendPercent={caseMetric.trend}
          footerLead={`+${caseMetric.today} hoy`}
          dateGranularity="day"
        />
      </div>

      {/* Recent Clients Section */}
      {(userRole === 'admin' || userRole === 'comercial_juridico') && <div className="overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-semibold">
              Clientes Recientes
            </h3>
          </div>
        </div>

        {stats.recentClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              No hay clientes recientes
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Los nuevos clientes apareceran aqui
            </p>
          </div>
        ) : (
          <ul>
            {stats.recentClients.slice(0, 5).map((client, index) => (
              <li
                key={client._id}
                className={`${
                  index < Math.min(stats.recentClients.length, 5) - 1
                    ? 'border-b border-border/40'
                    : ''
                }`}
              >
                <Link
                  href={`/crm/clients/${client._id}`}
                  aria-label={`Abrir ficha de ${client.name}`}
                  className="flex w-full items-center justify-between px-6 py-4 outline-none transition-colors duration-200 hover:bg-accent/30 focus-visible:bg-accent/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2969b0]"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #2969b0, #1b5697)' }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {client.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{client.company}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    {formatDate(client._createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>}
    </div>
  );
}

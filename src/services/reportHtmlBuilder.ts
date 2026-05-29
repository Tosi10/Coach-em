import { AthleteReportData, AthleteReportHealthSummary } from './athleteReport.service';

export type ReportHtmlOptions = {
  logoDataUri?: string | null;
};

const C = {
  bg: '#0a0a0a',
  card: '#141414',
  cardAlt: '#1a1a1a',
  border: '#2a2a2a',
  text: '#f5f5f5',
  muted: '#a3a3a3',
  dim: '#737373',
  primary: '#fb923c',
  primaryDark: '#ea580c',
  accent: '#fdba74',
  success: '#34d399',
};

const CHART_COLORS = ['#fb923c', '#f97316', '#fdba74', '#ea580c', '#fed7aa'];

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDateBr(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('pt-BR');
}

function fmtNum(value: number | null | undefined, suffix = ''): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value}${suffix}`;
}

type ChartPoint = { label: string; value: number };

function svgBarChart(
  points: ChartPoint[],
  options: { height?: number; barColor?: string; emptyText?: string } = {},
): string {
  const height = options.height ?? 160;
  const width = 520;
  const pad = { top: 16, right: 12, bottom: 36, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  if (points.length === 0) {
    return `<p class="muted">${escapeHtml(options.emptyText || 'Sem dados.')}</p>`;
  }

  const max = Math.max(1, ...points.map((p) => p.value));
  const barW = Math.min(48, Math.max(14, innerW / points.length - 8));
  const gap = (innerW - barW * points.length) / (points.length + 1);

  const bars = points
    .map((p, i) => {
      const h = Math.max(4, (p.value / max) * innerH);
      const x = pad.left + gap + i * (barW + gap);
      const y = pad.top + innerH - h;
      return `
        <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="4" fill="${options.barColor || C.primary}" opacity="0.92"/>
        <text x="${x + barW / 2}" y="${height - 10}" text-anchor="middle" fill="${C.dim}" font-size="9">${escapeHtml(p.label)}</text>
        <text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" fill="${C.accent}" font-size="9" font-weight="600">${p.value}</text>
      `;
    })
    .join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
      <rect x="0" y="0" width="${width}" height="${height}" fill="${C.cardAlt}" rx="10"/>
      <line x1="${pad.left}" y1="${pad.top + innerH}" x2="${width - pad.right}" y2="${pad.top + innerH}" stroke="${C.border}" stroke-width="1"/>
      ${bars}
    </svg>`;
}

function svgLineChart(
  series: Array<{ name: string; points: ChartPoint[]; color: string }>,
  options: { height?: number; valueSuffix?: string; emptyText?: string } = {},
): string {
  const height = options.height ?? 180;
  const width = 520;
  const pad = { top: 20, right: 16, bottom: 36, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) {
    return `<p class="muted">${escapeHtml(options.emptyText || 'Sem dados.')}</p>`;
  }

  const allValues = allPoints.map((p) => p.value);
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const range = Math.max(maxV - minV, 1);
  const yPad = range * 0.08;

  const yScale = (v: number) => pad.top + innerH - ((v - minV + yPad) / (range + 2 * yPad)) * innerH;
  const xAt = (i: number, count: number) =>
    count <= 1 ? pad.left + innerW / 2 : pad.left + (i / (count - 1)) * innerW;

  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map((t) => {
      const v = minV + t * range;
      const y = yScale(v);
      return `
        <line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="${C.border}" stroke-width="1" stroke-dasharray="4 4"/>
        <text x="${pad.left - 6}" y="${y + 3}" text-anchor="end" fill="${C.dim}" font-size="8">${Math.round(v)}</text>
      `;
    })
    .join('');

  const paths = series
    .map((s) => {
      if (s.points.length === 0) return '';
      const d = s.points
        .map((p, i) => {
          const x = xAt(i, s.points.length);
          const y = yScale(p.value);
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');
      const dots = s.points
        .map((p, i) => {
          const x = xAt(i, s.points.length);
          const y = yScale(p.value);
          return `<circle cx="${x}" cy="${y}" r="3.5" fill="${s.color}" stroke="${C.bg}" stroke-width="1.5"/>`;
        })
        .join('');
      return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${dots}`;
    })
    .join('');

  const xLabels = (series[0]?.points || [])
    .map((p, i) => {
      const x = xAt(i, series[0].points.length);
      return `<text x="${x}" y="${height - 8}" text-anchor="middle" fill="${C.dim}" font-size="8">${escapeHtml(p.label)}</text>`;
    })
    .join('');

  const legend = series
    .map(
      (s) => `
      <span class="legend-item">
        <span class="legend-dot" style="background:${s.color}"></span>
        ${escapeHtml(s.name.length > 22 ? `${s.name.slice(0, 20)}…` : s.name)}
      </span>`,
    )
    .join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
      <rect x="0" y="0" width="${width}" height="${height}" fill="${C.cardAlt}" rx="10"/>
      ${gridLines}
      ${paths}
      ${xLabels}
    </svg>
    ${series.length > 1 ? `<div class="legend">${legend}</div>` : ''}`;
}

function buildReportStyles(): string {
  return `
    @page { margin: 18mm 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: ${C.bg};
      color: ${C.text};
      font-size: 12px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { padding: 0; max-width: 720px; margin: 0 auto; }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 22px;
      background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 55%, #1c1208 100%);
      border: 1px solid ${C.border};
      border-radius: 16px;
      margin-bottom: 16px;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .logo { width: 52px; height: 52px; border-radius: 12px; object-fit: contain; background: #1f1f1f; border: 1px solid ${C.border}; }
    .logo-fallback {
      width: 52px; height: 52px; border-radius: 12px;
      background: linear-gradient(145deg, ${C.primary}, ${C.primaryDark});
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 22px; color: #fff;
    }
    .brand-title { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .brand-sub { margin: 4px 0 0; font-size: 11px; color: ${C.muted}; }
    .brand-tag { font-size: 10px; font-weight: 700; color: ${C.primary}; letter-spacing: 0.06em; text-transform: uppercase; }
    .period-pill {
      display: inline-block; margin-top: 8px; padding: 4px 10px;
      background: rgba(251, 146, 60, 0.12); border: 1px solid rgba(251, 146, 60, 0.35);
      border-radius: 999px; font-size: 11px; color: ${C.accent};
    }
    .section {
      background: ${C.card};
      border: 1px solid ${C.border};
      border-radius: 14px;
      padding: 16px 18px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .section-title {
      margin: 0 0 12px;
      font-size: 13px;
      font-weight: 700;
      color: ${C.primary};
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
    .meta-item .k { font-size: 10px; color: ${C.dim}; text-transform: uppercase; letter-spacing: 0.04em; }
    .meta-item .v { font-size: 13px; font-weight: 600; margin-top: 2px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .kpi {
      background: ${C.cardAlt};
      border: 1px solid ${C.border};
      border-radius: 12px;
      padding: 12px 10px;
      text-align: center;
    }
    .kpi .k { font-size: 9px; color: ${C.dim}; text-transform: uppercase; letter-spacing: 0.04em; }
    .kpi .v { font-size: 22px; font-weight: 800; color: ${C.text}; margin-top: 6px; line-height: 1; }
    .kpi .v small { font-size: 12px; font-weight: 600; color: ${C.muted}; }
    .kpi-accent .v { color: ${C.primary}; }
    .bar-row { display: grid; grid-template-columns: 118px 1fr 24px; gap: 8px; align-items: center; margin-bottom: 8px; }
    .bar-label { font-size: 11px; color: ${C.muted}; }
    .bar-track { background: #262626; border-radius: 999px; height: 10px; overflow: hidden; }
    .bar-fill { background: linear-gradient(90deg, ${C.primaryDark}, ${C.primary}); height: 10px; border-radius: 999px; }
    .bar-value { font-size: 11px; font-weight: 700; color: ${C.accent}; text-align: right; }
    .chart-wrap { margin-top: 4px; }
    .legend { display: flex; flex-wrap: wrap; gap: 10px 14px; margin-top: 8px; font-size: 10px; color: ${C.muted}; }
    .legend-item { display: inline-flex; align-items: center; gap: 5px; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    .muted { color: ${C.dim}; font-size: 11px; margin: 0; }
    .coach-msg {
      margin-top: 12px; padding: 10px 12px;
      background: rgba(251, 146, 60, 0.08);
      border-left: 3px solid ${C.primary};
      border-radius: 0 8px 8px 0;
      font-size: 11px; color: ${C.muted};
    }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    thead { display: table-header-group; }
    th {
      text-align: left; padding: 8px 6px;
      color: ${C.accent}; font-weight: 700; font-size: 9px;
      text-transform: uppercase; letter-spacing: 0.04em;
      border-bottom: 2px solid ${C.primary};
      background: #1f1f1f;
    }
    td { padding: 7px 6px; border-bottom: 1px solid ${C.border}; color: ${C.muted}; vertical-align: top; }
    tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
    td strong { color: ${C.text}; font-weight: 600; }
    .status-done { color: ${C.success}; font-weight: 600; }
    .status-pending { color: ${C.accent}; }
    .health-cell { color: ${C.primary}; font-weight: 600; white-space: nowrap; }
    .footer {
      margin-top: 20px; padding-top: 12px;
      border-top: 1px solid ${C.border};
      font-size: 9px; color: ${C.dim};
      display: flex; justify-content: space-between;
    }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media print {
      body { background: ${C.bg}; }
      .section { break-inside: avoid; }
    }
  `;
}

function buildHeader(report: AthleteReportData, logoDataUri?: string | null): string {
  const periodLabel = `${formatDateBr(report.period.startDate)} — ${formatDateBr(report.period.endDate)}`;
  const logoBlock = logoDataUri
    ? `<img class="logo" src="${logoDataUri}" alt="Coach'em" />`
    : `<div class="logo-fallback">C</div>`;

  return `
    <header class="header">
      <div class="header-left">
        ${logoBlock}
        <div>
          <div class="brand-tag">Coach'em · Vision10</div>
          <h1 class="brand-title">Relatório do atleta</h1>
          <p class="brand-sub">${escapeHtml(report.athlete.name)}${report.athlete.sport ? ` · ${escapeHtml(report.athlete.sport)}` : ''}</p>
          <span class="period-pill">${escapeHtml(periodLabel)}</span>
        </div>
      </div>
    </header>`;
}

function buildHealthSection(summary: AthleteReportHealthSummary): string {
  const hrChart = svgLineChart(
    [
      {
        name: 'FC média (bpm)',
        points: summary.hrTrend.map((p) => ({ label: p.label, value: p.avgHr })),
        color: C.primary,
      },
    ],
    { valueSuffix: ' bpm', emptyText: 'Sem treinos com FC no período.' },
  );

  return `
    <section class="section">
      <h2 class="section-title">Saúde e relógio — resumo do período</h2>
      <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 14px;">
        <div class="kpi kpi-accent">
          <div class="k">Treinos com relógio</div>
          <div class="v">${summary.workoutsWithHealth}<small> / ${summary.completedWorkouts}</small></div>
        </div>
        <div class="kpi">
          <div class="k">FC média (média)</div>
          <div class="v">${fmtNum(summary.avgHrMean)}<small> bpm</small></div>
        </div>
        <div class="kpi">
          <div class="k">FC máx. · FC mín.</div>
          <div class="v" style="font-size:16px;">${fmtNum(summary.maxHrPeak)} <small>/ ${fmtNum(summary.minHrLow)}</small></div>
        </div>
        <div class="kpi">
          <div class="k">Calorias (soma)</div>
          <div class="v">${summary.totalCalories > 0 ? summary.totalCalories : '—'}<small> kcal</small></div>
        </div>
        <div class="kpi">
          <div class="k">Distância (soma)</div>
          <div class="v">${summary.totalDistanceKm > 0 ? summary.totalDistanceKm : '—'}<small> km</small></div>
        </div>
      </div>
      <p class="muted" style="margin-bottom:8px;">Evolução da FC média por treino</p>
      <div class="chart-wrap">${hrChart}</div>
    </section>`;
}

function buildWeightSection(report: AthleteReportData): string {
  if (report.weightByExercise.length === 0 && report.weightTrend.length === 0) {
    return `
      <section class="section">
        <h2 class="section-title">Evolução de carga</h2>
        <p class="muted">Nenhum registo de peso/carga no período.</p>
      </section>`;
  }

  const series = report.weightByExercise.map((ex, i) => ({
    name: ex.exerciseName,
    points: ex.points,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const chart =
    series.length > 0
      ? svgLineChart(series, { emptyText: 'Sem dados de carga.' })
      : svgLineChart(
          [
            {
              name: 'Carga (kg)',
              points: report.weightTrend.map((p) => ({ label: p.label, value: p.value })),
              color: C.primary,
            },
          ],
          { emptyText: 'Sem dados de carga.' },
        );

  return `
    <section class="section">
      <h2 class="section-title">Evolução de carga (kg)</h2>
      <div class="chart-wrap">${chart}</div>
    </section>`;
}

function buildFeedbackBars(report: AthleteReportData): string {
  const max = Math.max(1, ...report.metrics.feedbackCounts.map((f) => f.count));
  return report.metrics.feedbackCounts
    .map((item) => {
      const width = Math.round((item.count / max) * 100);
      return `
        <div class="bar-row">
          <div class="bar-label">${escapeHtml(item.label)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
          <div class="bar-value">${item.count}</div>
        </div>`;
    })
    .join('');
}

function buildWorkoutsTable(report: AthleteReportData): string {
  if (report.workouts.length === 0) {
    return '<p class="muted">Nenhum treino no período selecionado.</p>';
  }

  const rows = report.workouts
    .slice(0, 80)
    .map((w) => {
      const statusClass = w.status === 'Concluído' ? 'status-done' : 'status-pending';
      const h = w.health;
      return `<tr>
        <td><strong>${escapeHtml(w.name)}</strong></td>
        <td>${escapeHtml(formatDateBr(w.date))}</td>
        <td class="${statusClass}">${escapeHtml(w.status)}</td>
        <td>${escapeHtml(w.feedbackLabel || '—')}</td>
        <td class="health-cell">${fmtNum(h?.avgHr)}</td>
        <td class="health-cell">${fmtNum(h?.maxHr)}</td>
        <td class="health-cell">${h?.calories != null ? h.calories : '—'}</td>
        <td class="health-cell">${h?.distanceKm != null ? `${h.distanceKm} km` : '—'}</td>
      </tr>`;
    })
    .join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Treino</th>
          <th>Data</th>
          <th>Status</th>
          <th>Feedback</th>
          <th>FC méd.</th>
          <th>FC máx.</th>
          <th>kcal</th>
          <th>Dist.</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function buildAthleteReportHtml(
  report: AthleteReportData,
  options: ReportHtmlOptions = {},
): string {
  const weeklyChart = svgBarChart(
    report.weeklyTrend.map((w) => ({ label: w.label.slice(5), value: w.completed })),
    { emptyText: 'Sem treinos concluídos por semana.' },
  );

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Relatório ${escapeHtml(report.athlete.name)} — Coach'em</title>
    <style>${buildReportStyles()}</style>
  </head>
  <body>
    <div class="page">
      ${buildHeader(report, options.logoDataUri)}

      <section class="section">
        <h2 class="section-title">Identificação</h2>
        <div class="meta-grid">
          <div class="meta-item"><div class="k">Atleta</div><div class="v">${escapeHtml(report.athlete.name)}</div></div>
          <div class="meta-item"><div class="k">Treinador(a)</div><div class="v">${escapeHtml(report.coach.name)}</div></div>
          <div class="meta-item"><div class="k">Status</div><div class="v">${escapeHtml(report.athlete.status || '—')}</div></div>
          <div class="meta-item"><div class="k">Gerado em</div><div class="v">${escapeHtml(new Date(report.generatedAt).toLocaleString('pt-BR'))}</div></div>
        </div>
        ${
          report.coach.message
            ? `<div class="coach-msg"><strong>Mensagem do treinador:</strong> ${escapeHtml(report.coach.message)}</div>`
            : ''
        }
      </section>

      <section class="section">
        <h2 class="section-title">Resumo executivo</h2>
        <div class="kpi-grid">
          <div class="kpi"><div class="k">Treinos</div><div class="v">${report.metrics.totalWorkouts}</div></div>
          <div class="kpi kpi-accent"><div class="k">Concluídos</div><div class="v">${report.metrics.completedWorkouts}</div></div>
          <div class="kpi"><div class="k">Pendentes</div><div class="v">${report.metrics.pendingWorkouts}</div></div>
          <div class="kpi kpi-accent"><div class="k">Conclusão</div><div class="v">${report.metrics.completionRate}<small>%</small></div></div>
        </div>
      </section>

      ${report.healthSummary ? buildHealthSection(report.healthSummary) : ''}

      <div class="two-col">
        <section class="section">
          <h2 class="section-title">Feedback</h2>
          ${buildFeedbackBars(report)}
        </section>
        <section class="section">
          <h2 class="section-title">Semanas (concluídos)</h2>
          <div class="chart-wrap">${weeklyChart}</div>
        </section>
      </div>

      ${buildWeightSection(report)}

      <section class="section">
        <h2 class="section-title">Treinos do período</h2>
        ${buildWorkoutsTable(report)}
        ${
          report.workouts.length > 80
            ? `<p class="muted" style="margin-top:8px;">Exibindo 80 de ${report.workouts.length} treinos.</p>`
            : ''
        }
      </section>

      <footer class="footer">
        <span>Coach'em · Vision10 · V6 CORE LTDA</span>
        <span>Relatório confidencial</span>
      </footer>
    </div>
  </body>
</html>`;
}

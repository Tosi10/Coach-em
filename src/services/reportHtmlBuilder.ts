import { AthleteReportData } from './athleteReport.service';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDateBr(value?: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('pt-BR');
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
        </div>
      `;
    })
    .join('');
}

function buildWeeklyTable(report: AthleteReportData): string {
  if (report.weeklyTrend.length === 0) {
    return '<p class="muted">Sem dados de semanas concluídas no período.</p>';
  }
  return `
    <table>
      <thead>
        <tr><th>Semana</th><th>Treinos concluídos</th></tr>
      </thead>
      <tbody>
        ${report.weeklyTrend
          .map((w) => `<tr><td>${escapeHtml(w.label)}</td><td>${w.completed}</td></tr>`)
          .join('')}
      </tbody>
    </table>
  `;
}

function buildWorkoutsTable(report: AthleteReportData): string {
  if (report.workouts.length === 0) {
    return '<p class="muted">Nenhum treino no período selecionado.</p>';
  }
  const rows = report.workouts
    .slice(0, 60)
    .map(
      (w) => `<tr>
        <td>${escapeHtml(w.name)}</td>
        <td>${escapeHtml(formatDateBr(w.date))}</td>
        <td>${escapeHtml(w.status)}</td>
        <td>${escapeHtml(w.feedbackLabel || '-')}</td>
      </tr>`
    )
    .join('');
  return `
    <table>
      <thead>
        <tr><th>Treino</th><th>Data</th><th>Status</th><th>Feedback</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export function buildAthleteReportHtml(report: AthleteReportData): string {
  const periodLabel = `${formatDateBr(report.period.startDate)} a ${formatDateBr(report.period.endDate)}`;
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Relatório ${escapeHtml(report.athlete.name)}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #111827; margin: 24px; }
      .brand { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
      .brand h1 { margin:0; color:#111827; font-size:22px; }
      .tag { font-size:12px; color:#f97316; font-weight:700; }
      .section { border:1px solid #e5e7eb; border-radius:12px; padding:14px; margin-bottom:12px; }
      .grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; }
      .metric { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:10px; }
      .metric .label { font-size:11px; color:#6b7280; }
      .metric .value { font-size:20px; margin-top:4px; font-weight:700; color:#111827; }
      .muted { color:#6b7280; font-size:12px; }
      h2 { font-size:15px; margin:0 0 10px 0; }
      table { width:100%; border-collapse:collapse; font-size:12px; }
      th, td { border-bottom:1px solid #e5e7eb; padding:8px 6px; text-align:left; }
      th { color:#374151; font-weight:700; }
      .bar-row { display:grid; grid-template-columns: 140px 1fr 28px; gap:8px; align-items:center; margin-bottom:6px; }
      .bar-track { background:#f3f4f6; border-radius:999px; height:8px; overflow:hidden; }
      .bar-fill { background:#f97316; height:8px; border-radius:999px; }
      .bar-label, .bar-value { font-size:12px; color:#374151; }
      .footer { margin-top:18px; font-size:10px; color:#9ca3af; text-align:right; }
    </style>
  </head>
  <body>
    <div class="brand">
      <h1>Treina+ - Relatório do Atleta</h1>
      <div class="tag">Vision10</div>
    </div>

    <div class="section">
      <h2>Identificação</h2>
      <div><strong>Atleta:</strong> ${escapeHtml(report.athlete.name)}</div>
      <div><strong>Treinador(a):</strong> ${escapeHtml(report.coach.name)}</div>
      <div><strong>Período:</strong> ${escapeHtml(periodLabel)}</div>
      <div><strong>Status:</strong> ${escapeHtml(report.athlete.status || '-')}</div>
      ${
        report.coach.message
          ? `<div style="margin-top:8px;"><strong>Mensagem do treinador(a):</strong> ${escapeHtml(report.coach.message)}</div>`
          : ''
      }
    </div>

    <div class="section">
      <h2>Resumo executivo</h2>
      <div class="grid">
        <div class="metric"><div class="label">Treinos no período</div><div class="value">${report.metrics.totalWorkouts}</div></div>
        <div class="metric"><div class="label">Concluídos</div><div class="value">${report.metrics.completedWorkouts}</div></div>
        <div class="metric"><div class="label">Pendentes</div><div class="value">${report.metrics.pendingWorkouts}</div></div>
        <div class="metric"><div class="label">Taxa de conclusão</div><div class="value">${report.metrics.completionRate}%</div></div>
      </div>
    </div>

    <div class="section">
      <h2>Distribuição de feedback</h2>
      ${buildFeedbackBars(report)}
    </div>

    <div class="section">
      <h2>Evolução semanal (concluídos)</h2>
      ${buildWeeklyTable(report)}
    </div>

    <div class="section">
      <h2>Treinos do período</h2>
      ${buildWorkoutsTable(report)}
    </div>

    <div class="footer">
      Gerado em ${new Date(report.generatedAt).toLocaleString('pt-BR')}
    </div>
  </body>
</html>`;
}

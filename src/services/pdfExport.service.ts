import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystemLegacy from 'expo-file-system/legacy';

import { AthleteReportData } from './athleteReport.service';
import { buildAthleteReportHtml } from './reportHtmlBuilder';

function safeFileNamePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 40);
}

export async function generateAthleteReportPdf(
  report: AthleteReportData
): Promise<{ uri: string; fileName: string }> {
  const html = buildAthleteReportHtml(report);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const fileName = `relatorio_${safeFileNamePart(report.athlete.name)}_${report.period.startDate}_${report.period.endDate}.pdf`;
  const targetUri = `${FileSystemLegacy.documentDirectory}${fileName}`;

  await FileSystemLegacy.copyAsync({
    from: uri,
    to: targetUri,
  });

  return { uri: targetUri, fileName };
}

export async function sharePdf(uri: string): Promise<boolean> {
  const available = await Sharing.isAvailableAsync();
  if (!available) return false;
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Compartilhar relatório do atleta',
  });
  return true;
}

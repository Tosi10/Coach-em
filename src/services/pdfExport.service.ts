import { Asset } from 'expo-asset';
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

async function loadCoachEmLogoDataUri(): Promise<string | null> {
  try {
    const asset = Asset.fromModule(require('../../assets/images/Coach-emIcone02.png'));
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) return null;
    const base64 = await FileSystemLegacy.readAsStringAsync(uri, {
      encoding: FileSystemLegacy.EncodingType.Base64,
    });
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

export async function generateAthleteReportPdf(
  report: AthleteReportData,
): Promise<{ uri: string; fileName: string }> {
  const logoDataUri = await loadCoachEmLogoDataUri();
  const html = buildAthleteReportHtml(report, { logoDataUri });
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
    dialogTitle: 'Compartilhar relatório',
  });
  return true;
}

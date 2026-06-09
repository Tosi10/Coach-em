/**
 * Gera captura estática Athlete Pro 1242×2208 para revisão IAP (sem iPhone/build).
 * Uso: node scripts/generate-asc-athlete-pro-screenshot.mjs
 */

import sharp from 'sharp';
import { mkdirSync } from 'fs';
import path from 'path';

const W = 1242;
const H = 2208;
const outDir = path.join('docs', 'review-screenshots');
const outFile = path.join(outDir, 'athlete-pro-asc-generated.png');

mkdirSync(outDir, { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0d0d0d"/>
  <text x="72" y="120" fill="#fb923c" font-family="Arial, Helvetica, sans-serif" font-size="36">← Voltar</text>
  <text x="72" y="220" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="bold">Athlete Pro</text>
  <text x="72" y="280" fill="#a3a3a3" font-family="Arial, Helvetica, sans-serif" font-size="28">Biblioteca completa, treinos-modelo e wearables</text>

  <rect x="72" y="330" width="1098" height="120" rx="20" fill="#1a1a1a" stroke="#333" stroke-width="2"/>
  <text x="100" y="375" fill="#a3a3a3" font-size="24" font-family="Arial">Estado no app (Firebase)</text>
  <text x="100" y="420" fill="#ffffff" font-size="32" font-family="Arial" font-weight="bold">Grátis</text>

  <rect x="72" y="480" width="1098" height="200" rx="20" fill="#1a1a1a" stroke="#333" stroke-width="2"/>
  <text x="100" y="525" fill="#a3a3a3" font-size="24" font-family="Arial">Assinatura na loja (Apple / Google)</text>
  <text x="100" y="570" fill="#ffffff" font-size="32" font-family="Arial" font-weight="bold">Sem Pro detectado</text>

  <text x="72" y="750" fill="#ffffff" font-size="36" font-family="Arial" font-weight="bold">Comparativo</text>
  <rect x="72" y="780" width="1098" height="200" rx="16" fill="#1a1a1a" stroke="#333"/>
  <text x="100" y="830" fill="#a3a3a3" font-size="26" font-family="Arial">Treinos-modelo</text>
  <text x="520" y="830" fill="#a3a3a3" font-size="26" font-family="Arial">Grátis: 5</text>
  <text x="820" y="830" fill="#fb923c" font-size="26" font-family="Arial" font-weight="bold">Pro: 50</text>
  <text x="100" y="900" fill="#a3a3a3" font-size="26" font-family="Arial">Exercícios</text>
  <text x="520" y="900" fill="#a3a3a3" font-size="26" font-family="Arial">Grátis: 7</text>
  <text x="820" y="900" fill="#fb923c" font-size="26" font-family="Arial" font-weight="bold">Pro: 100</text>

  <rect x="72" y="1020" width="520" height="200" rx="20" fill="#1a1a1a" stroke="#fb923c" stroke-width="3"/>
  <text x="100" y="1080" fill="#ffffff" font-size="32" font-family="Arial" font-weight="bold">Plano mensal</text>
  <text x="100" y="1150" fill="#fb923c" font-size="40" font-family="Arial" font-weight="bold">US$ 5,99/mês</text>

  <rect x="620" y="1020" width="550" height="200" rx="20" fill="#1a1a1a" stroke="#333" stroke-width="2"/>
  <text x="648" y="1080" fill="#ffffff" font-size="32" font-family="Arial" font-weight="bold">Plano anual</text>
  <text x="648" y="1150" fill="#fb923c" font-size="40" font-family="Arial" font-weight="bold">US$ 59,99/ano</text>

  <rect x="72" y="1280" width="1098" height="100" rx="24" fill="#ea580c"/>
  <text x="621" y="1345" fill="#ffffff" font-size="36" font-family="Arial" font-weight="bold" text-anchor="middle">Assinar Pro — mensal</text>

  <text x="72" y="1450" fill="#737373" font-size="22" font-family="Arial">Coach'em — assinatura apenas para contas ATHLETE (atleta).</text>
  <text x="72" y="1490" fill="#737373" font-size="22" font-family="Arial">Perfil → Plano e assinatura. Product ID: coachem_athlete_pro_monthly</text>
</svg>`;

await sharp(Buffer.from(svg))
  .flatten({ background: { r: 13, g: 13, b: 13 } })
  .png({ compressionLevel: 6, force: true })
  .toFile(outFile);

const meta = await sharp(outFile).metadata();
console.log(`Gerado: ${path.resolve(outFile)}`);
console.log(`${meta.width} x ${meta.height}, alpha: ${meta.hasAlpha ? 'sim' : 'não'}`);

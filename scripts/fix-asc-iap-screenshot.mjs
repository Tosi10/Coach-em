/**
 * Gera PNG aceite pela Apple (revisão IAP/subscrição) a partir de qualquer captura.
 * Uso: node scripts/fix-asc-iap-screenshot.mjs entrada.png [saida.png]
 *
 * Tamanho padrão: 1242×2208 (iPhone 5,5") — o mais aceite em IAP review.
 * Sem canal alpha, fundo opaco, preenche ecrã (sem barras pretas).
 */

import sharp from 'sharp';
import { existsSync } from 'fs';
import path from 'path';

const W = 1242;
const H = 2208;
const BG = { r: 13, g: 13, b: 13 };

const input = process.argv[2];
const output = process.argv[3] ?? path.join('docs', 'review-screenshots', 'athlete-pro-asc-1242x2208.png');

if (!input || !existsSync(input)) {
  console.error('Uso: node scripts/fix-asc-iap-screenshot.mjs <captura.png> [saida.png]');
  process.exit(1);
}

await sharp(input)
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .flatten({ background: BG })
  .png({ compressionLevel: 6, force: true })
  .toFile(output);

const meta = await sharp(output).metadata();
console.log(`OK: ${path.resolve(output)}`);
console.log(`Dimensões: ${meta.width} x ${meta.height}, alpha: ${meta.hasAlpha ? 'sim (erro)' : 'não'}`);

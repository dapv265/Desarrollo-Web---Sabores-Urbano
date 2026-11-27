import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Indica si el archivo se ejecutó con `node archivo.js` (y no se importó desde otro módulo).
export const esEjecucionDirecta = (urlModulo) =>
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === fileURLToPath(urlModulo);

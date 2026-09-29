// dev/sellar_version.js — pone a cada app su número de versión y arma version.json.
//
// Por qué: el iPhone guarda su propia copia de la app instalada y a veces no toma la
// versión nueva. Cada app trae `var APP_VERSION='…'` (bloque «ACTUALIZACIÓN AUTOMÁTICA DE LA APP»)
// y al abrir lo compara con version.json; si no coincide, se recarga sola.
//
// La versión es una huella del contenido del archivo (sin contar la propia versión ni
// los finales de línea), así que sale igual en cualquier computadora y solo cambia si
// cambió el archivo.
//
// Uso (desde la raíz del repo, ANTES de cada commit que toque un .html):
//   node dev/sellar_version.js           → sella y escribe version.json
//   node dev/sellar_version.js --revisar → solo revisa; sale con error si falta sellar
const fs = require('fs'), crypto = require('crypto');

const RE = /var APP_VERSION='[^']*';/g;

function huella(texto){
  const base = texto.replace(/\r/g, '').replace(RE, "var APP_VERSION='';");
  return crypto.createHash('sha1').update(base, 'utf8').digest('hex').slice(0, 12);
}

// Apps con el bloque de actualización (las que tienen exactamente un APP_VERSION).
function appsConVersion(){
  return fs.readdirSync('.').filter(f => f.endsWith('.html')).filter(f => {
    const n = (fs.readFileSync(f, 'utf8').match(RE) || []).length;
    if (n > 1) throw new Error(f + ': tiene ' + n + ' APP_VERSION (debe haber uno solo)');
    return n === 1;
  }).sort();
}

function leerVersionJson(){
  try { return JSON.parse(fs.readFileSync('version.json', 'utf8')); } catch (e) { return {}; }
}

function revisar(){
  const vj = leerVersionJson(), errores = [];
  for (const f of appsConVersion()){
    const s = fs.readFileSync(f, 'utf8');
    const puesta = s.match(/var APP_VERSION='([^']*)';/)[1];
    const debe = huella(s);
    if (puesta !== debe) errores.push(f + ': APP_VERSION no está al día');
    else if (vj[f] !== debe) errores.push(f + ': version.json no está al día');
  }
  return errores;
}

function sellar(){
  const vj = {};
  for (const f of appsConVersion()){
    const s = fs.readFileSync(f, 'utf8');
    const v = huella(s);
    const nuevo = s.replace(RE, "var APP_VERSION='" + v + "';");
    if (nuevo !== s) fs.writeFileSync(f, nuevo, 'utf8');
    vj[f] = v;
    console.log('✓', f, v);
  }
  fs.writeFileSync('version.json', JSON.stringify(vj, null, 2) + '\n', 'utf8');
  console.log('✓ version.json');
}

module.exports = { revisar, sellar, huella };

if (require.main === module){
  if (process.argv.includes('--revisar')){
    const e = revisar();
    e.forEach(x => console.log('✗', x));
    if (e.length){ console.log('→ corre: node dev/sellar_version.js'); process.exit(1); }
    console.log('✓ versiones selladas');
  } else sellar();
}

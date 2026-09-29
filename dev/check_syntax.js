// dev/check_syntax.js — compila cada <script> inline de los .html (y autocorrector.js)
// Uso: node dev/check_syntax.js  (desde la raíz del repo). Un error de sintaxis deja la app en blanco para todos.
const fs=require('fs'),vm=require('vm');let bad=0;
const files=process.argv.slice(2).length?process.argv.slice(2):fs.readdirSync('.').filter(f=>f.endsWith('.html'));
for(const f of files){const s=fs.readFileSync(f,'utf8');const re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;let m,n=0;
  while((m=re.exec(s))){n++;try{new vm.Script(m[1],{filename:f+'#'+n});}catch(e){bad=1;console.log('✗',f,'bloque',n,e.message);}}
  console.log('✓',f,n,'bloques');}
try{new vm.Script(fs.readFileSync('autocorrector.js','utf8'));console.log('✓ autocorrector.js');}catch(e){bad=1;console.log('✗ autocorrector.js',e.message);}
// Versión de cada app (actualización automática en los teléfonos): ver dev/sellar_version.js
try{const e=require('./sellar_version.js').revisar();e.forEach(x=>{bad=1;console.log('✗',x);});if(e.length)console.log('→ corre: node dev/sellar_version.js');else console.log('✓ versiones selladas');}catch(e){bad=1;console.log('✗ versiones',e.message);}
process.exit(bad);

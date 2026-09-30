// dev/prueba_sync.js — simulador: varios teléfonos sobre un Firebase falso compartido, con señal
// que va y viene. Prueba el sincronizador («GUARDADO POR REGISTRO») sin tocar la base real.
// Uso (desde la raíz del repo): node dev/prueba_sync.js [archivo.html]   (por defecto MTRENTAL_Gerencia.html)
// Correrlo SIEMPRE que se toque el sincronizador: debe terminar en «Todo bien».
const fs = require('fs'), vm = require('vm');
const _app = fs.readFileSync(process.argv[2] || 'MTRENTAL_Gerencia.html', 'utf8').replace(/\r/g, '');
const _m = _app.indexOf('// ══ GUARDADO POR REGISTRO (sincronizador)');
if (_m < 0) throw new Error('Esa app no tiene el sincronizador');
const code = _app.slice(_app.lastIndexOf('<script>', _m) + 8, _app.indexOf('</script>', _m));
const J = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
const get = (t, p) => p.split('/').filter(Boolean).reduce((o, k) => o == null ? undefined : o[k], t);
function put(t, p, v){ const ks = p.split('/').filter(Boolean); let o = t;
  for(let i = 0; i < ks.length - 1; i++){ if(o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; }
  if(v === null || v === undefined) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = J(v); }
const snap = (v, key) => ({ key, val: () => v === undefined ? null : J(v), forEach(cb){ if(v && typeof v === 'object') Object.keys(v).forEach(k => cb(snap(v[k], k))); } });

const SERVIDOR = { tree: {}, clientes: [] };
function notificar(){ SERVIDOR.clientes.forEach(c => { if(c.online){ c.vista = J(SERVIDOR.tree); c.disparar(); } }); }

function cliente(nombre, DBinicial, ls){
  const c = { nombre, online: true, vista: J(SERVIDOR.tree), cola: [], oyentes: [], ls: ls || {} };
  c.disparar = () => c.oyentes.forEach(o => setTimeout(() => o.cb(snap(get(c.vista, o.p), o.p.split('/').pop())), 0));
  const escribir = (fn) => { // fn(tree) aplica la escritura
    if(c.online){ fn(SERVIDOR.tree); notificar(); return Promise.resolve(); }
    fn(c.vista); c.disparar(); return new Promise(res => c.cola.push(() => { fn(SERVIDOR.tree); res(); }));
  };
  const ref = p => ({
    on: (ev, cb) => { c.oyentes.push({ p, cb }); setTimeout(() => cb(snap(get(c.vista, p), p.split('/').pop())), 0); return cb; },
    off(){}, once: () => new Promise(res => { const hacer = () => res(snap(get(c.online ? SERVIDOR.tree : c.vista, p), p.split('/').pop())); c.online ? hacer() : c.cola.push(() => { hacer(); }); }),
    set: v => escribir(t => put(t, p, v)),
    update: o => escribir(t => { for(const k in o) put(t, p ? p + '/' + k : k, o[k]); }),
    orderByChild: ch => ({ equalTo: val => ({ once: () => new Promise(res => { const hacer = () => { const v = get(c.online ? SERVIDOR.tree : c.vista, p) || {}; const r = {}; Object.keys(v).forEach(k => { if(v[k] && v[k][ch] === val) r[k] = v[k]; }); res(snap(r)); }; c.online ? hacer() : c.cola.push(hacer); }) }) }),
    transaction: fn => {
      const correr = t => { const cur = get(t, p); const r = fn(cur === undefined ? null : J(cur)); if(r === undefined) return { committed: false, snapshot: snap(cur) }; put(t, p, r); return { committed: true, snapshot: snap(r) }; };
      if(c.online){ const r = correr(SERVIDOR.tree); notificar(); return Promise.resolve(r); }
      correr(c.vista); c.disparar();                         // optimista en el teléfono
      return new Promise(res => c.cola.push(() => res(correr(SERVIDOR.tree))));
    }
  });
  c.fb = { ref };
  c.avisos = [];
  const localStorage = { getItem: k => c.ls[k] === undefined ? null : c.ls[k], setItem: (k, v) => { c.ls[k] = String(v); } };
  c.ctx = { window: { _fbReady: true }, DB: DBinicial, localStorage, toast: m => c.avisos.push(m), console: { warn: m => c.avisos.push(String(m)) }, JSON, Math, Object, Array, Promise, String, parseInt, isNaN, Date, setTimeout };
  vm.createContext(c.ctx); vm.runInContext(code, c.ctx);
  c.sync = c.ctx._Sync;
  c.DB = () => c.ctx.DB;
  c.sinSenal = () => { c.online = false; };
  c.conSenal = async () => { c.online = true; const q = c.cola; c.cola = []; for(const f of q) await f(); notificar(); await esperar(); };
  SERVIDOR.clientes.push(c);
  c.sync.iniciar('montasa', c.fb);
  return c;
}
const esperar = async (n = 30) => { for(let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };
const srv = col => (Object.values(get(SERVIDOR.tree, 'montasa/' + col) || {})).filter(Boolean);
const lg = (id, extra) => Object.assign({ id, correlativo: id.toUpperCase(), estado: 'En proceso', cerrado: false }, extra || {});

let fallas = 0;
async function sinDuplicados(etq){
  for(const c of SERVIDOR.clientes){ if(c.online){ await c.sync.guardar(); await c.sync.guardar(); } }
  await esperar();
  const m = get(SERVIDOR.tree, 'montasa') || {};
  for(const col of Object.keys(m)){ if(col.charAt(0) === '_' || typeof m[col] !== 'object') continue;
    const ids = Object.values(m[col]).filter(Boolean).map(x => x.id); const u = new Set(ids);
    if(u.size !== ids.length){ ok('   sin duplicados en ' + col + ' (' + etq + ')', false, ids.join(',')); return; } }
}
function ok(nombre, cond, extra){ console.log((cond ? '✓ ' : '✗ ') + nombre + (extra ? '  → ' + extra : '')); if(!cond) fallas++; }
function reset(tree){ SERVIDOR.tree = J(tree); SERVIDOR.clientes = []; }

(async () => {
  await sinDuplicados('antes del caso 1');
  // 1 ─ Dos teléfonos editan datos distintos de la misma orden
  reset({ montasa: { logistica: [lg('lg1'), lg('lg2')] } });
  let A = cliente('A', { logistica: J(srv('logistica')) }), B = cliente('B', { logistica: J(srv('logistica')) });
  await esperar();
  A.DB().logistica[1].kmRetorno = '1500'; B.DB().logistica[1].firma = 'FIRMA-B';
  await Promise.all([A.sync.guardar(), B.sync.guardar()]); await esperar();
  let s2 = srv('logistica').find(o => o.id === 'lg2');
  ok('1. Dos personas, datos distintos de la misma orden → se guardan los dos', s2.kmRetorno === '1500' && s2.firma === 'FIRMA-B', JSON.stringify({ km: s2.kmRetorno, firma: s2.firma }));
  ok('   y el teléfono A recibe la firma de B sin perder nada', A.DB().logistica[1].firma === 'FIRMA-B' && A.DB().logistica[1].kmRetorno === '1500');

  await sinDuplicados('antes del caso 2');
  // 2 ─ B sin señal con copia vieja; A cierra la orden; B toca otra cosa; vuelve la señal
  reset({ montasa: { logistica: [lg('lg1'), lg('lg2'), lg('lg3')] } });
  A = cliente('A', { logistica: J(srv('logistica')) }); B = cliente('B', { logistica: J(srv('logistica')) });
  await esperar();
  B.sinSenal();
  A.DB().logistica[2].estado = 'Completado'; A.DB().logistica[2].cerrado = true; await A.sync.guardar(); await esperar();
  B.DB().logistica[2].notas = 'nota de B sin señal'; B.sync.guardar(); await esperar();
  await B.conSenal();
  let s3 = srv('logistica').find(o => o.id === 'lg3');
  ok('2. B estuvo sin señal con copia vieja → el cierre de A NO se pierde', s3.estado === 'Completado' && s3.cerrado === true, 'estado=' + s3.estado);
  ok('   y la nota de B también queda', s3.notas === 'nota de B sin señal');
  ok('   y B termina viendo la orden cerrada', B.DB().logistica[2].estado === 'Completado');

  await sinDuplicados('antes del caso 3');
  // 3 ─ Mismo dato: gana el último
  reset({ montasa: { logistica: [lg('lg1')] } });
  A = cliente('A', { logistica: J(srv('logistica')) }); B = cliente('B', { logistica: J(srv('logistica')) }); await esperar();
  A.DB().logistica[0].kmRetorno = '100'; await A.sync.guardar(); await esperar();
  B.DB().logistica[0].kmRetorno = '200'; await B.sync.guardar(); await esperar();
  ok('3. Mismo dato cambiado por dos → gana el último', srv('logistica')[0].kmRetorno === '200');

  await sinDuplicados('antes del caso 4');
  // 4 ─ Orden nueva en A y en B al mismo tiempo
  reset({ montasa: { logistica: [lg('lg1')] } });
  A = cliente('A', { logistica: J(srv('logistica')) }); B = cliente('B', { logistica: J(srv('logistica')) }); await esperar();
  A.DB().logistica.push(lg('nA')); B.DB().logistica.push(lg('nB'));
  await Promise.all([A.sync.guardar(), B.sync.guardar()]); await esperar();
  const ids4 = srv('logistica').map(o => o.id).sort().join(',');
  ok('4. Dos órdenes nuevas a la vez desde dos teléfonos → quedan las dos', ids4 === 'lg1,nA,nB', ids4);

  await sinDuplicados('antes del caso 5');
  // 5 ─ Borrar una orden en A; B tenía un cambio pendiente sin señal
  reset({ montasa: { logistica: [lg('lg1'), lg('lg2'), lg('lg3')] } });
  A = cliente('A', { logistica: J(srv('logistica')) }); B = cliente('B', { logistica: J(srv('logistica')) }); await esperar();
  await A.sync.guardar(); await B.sync.guardar(); await esperar();   // ambos "ven" sus listas
  B.sinSenal();
  A.DB().logistica = A.DB().logistica.filter(o => o.id !== 'lg1'); await A.sync.guardar(); await esperar();
  ok('5. A borra LG1 → se borra del servidor', srv('logistica').map(o => o.id).join(',') === 'lg2,lg3');
  ok('   y queda la lápida en _borradas', !!get(SERVIDOR.tree, 'montasa/_borradas/lg1'));
  B.DB().logistica[0].notas = 'cambio de B a una orden que A borró'; B.sync.guardar();
  await B.conSenal(); await esperar();
  ok('   B vuelve con un cambio a la orden borrada → NO la resucita', !srv('logistica').some(o => o.id === 'lg1'), srv('logistica').map(o => o.id).join(','));
  ok('   y las demás siguen intactas', srv('logistica').length === 2);

  await sinDuplicados('antes del caso 6');
  // 6 ─ Freno: un teléfono con la lista vacía no vacía la base
  reset({ montasa: { logistica: [lg('lg1'), lg('lg2'), lg('lg3'), lg('lg4')] } });
  A = cliente('A', { logistica: J(srv('logistica')) }); await esperar(); await A.sync.guardar();
  A.DB().logistica = []; await A.sync.guardar(); await esperar();
  ok('6. Una app con la lista vacía → NO borra nada (freno)', srv('logistica').length === 4, 'quedan ' + srv('logistica').length);

  await sinDuplicados('antes del caso 7');
  // 7 ─ Una app que nunca cargó una lista no la toca
  reset({ montasa: { logistica: [lg('lg1')], solicitudes: [{ id: 's1', correlativo: 'MH-0001' }] } });
  A = cliente('A', { logistica: J(srv('logistica')), solicitudes: [] }); await esperar();
  await A.sync.guardar(); await esperar(); await A.sync.guardar(); await esperar();
  ok('7. Lista que esta app nunca cargó (solicitudes con 1 registro) → NO la borra', srv('solicitudes').length === 1);

  await sinDuplicados('antes del caso 8');
  // 8 ─ Cambio sin señal y se cierra la app: se sube al volver a abrirla
  reset({ montasa: { logistica: [lg('lg1'), lg('lg2')] } });
  A = cliente('A', { logistica: J(srv('logistica')) }); await esperar();
  A.sinSenal();
  A.DB().logistica[1].estado = 'Completado'; A.DB().logistica[1].cerrado = true; A.sync.guardar(); await esperar();
  const cache = J(A.DB()), ls = J(A.ls);
  SERVIDOR.clientes = SERVIDOR.clientes.filter(x => x !== A);        // se cerró la app: su cola se pierde
  ok('8. (sin señal) el cierre todavía no llegó al servidor', srv('logistica')[1].estado === 'En proceso');
  const A2 = cliente('A2', cache, ls); await esperar(); await esperar();
  ok('   al volver a abrir la app con señal → el cierre se sube', srv('logistica')[1].estado === 'Completado' && srv('logistica')[1].cerrado === true, 'estado=' + srv('logistica')[1].estado);

  await sinDuplicados('antes del caso 9');
  // 9 ─ Copia vieja con una orden que tiene lápida → no se resucita
  reset({ montasa: { logistica: [lg('lg1')], _borradas: { prueba1: 123 } } });
  A = cliente('A', { logistica: [lg('lg1'), lg('prueba1', { descripcion: 'orden de prueba ya borrada' })] }); await esperar();
  await A.sync.guardar(); await esperar();
  ok('9. Copia vieja con una orden de prueba ya borrada (lápida) → NO se resucita', !srv('logistica').some(o => o.id === 'prueba1'));

  await sinDuplicados('antes del caso 10');
  // 10 ─ Fotos nunca se suben por aquí
  reset({ montasa: { logistica: [lg('lg1', { nFotos: 1 })] } });
  A = cliente('A', { logistica: J(srv('logistica')) }); await esperar();
  A.DB().logistica[0].fotos = ['data:image/jpeg;base64,AAAA']; A.DB().logistica[0].notas = 'x'; await A.sync.guardar(); await esperar();
  ok('10. Fotos cargadas en el teléfono → no se suben a la lista (solo la nota)', !srv('logistica')[0].fotos && srv('logistica')[0].notas === 'x');

  await sinDuplicados('antes del caso 11');
  // 11 ─ Equipos: vender uno (sale de la flota) → se quita del servidor
  reset({ montasa: { equipos: [{ id: 'e1', codigo: 'MT-1', estado: 'DISPONIBLE' }, { id: 'e2', codigo: 'MT-2', estado: 'EN RENTA' }] } });
  A = cliente('A', { equipos: J(srv('equipos')) }); await esperar(); await A.sync.guardar();
  A.DB().equipos = A.DB().equipos.filter(e => e.id !== 'e1'); await A.sync.guardar(); await esperar();
  ok('11. Equipo vendido (sale de la flota en el teléfono) → sale del servidor', srv('equipos').map(e => e.codigo).join(',') === 'MT-2');

  await sinDuplicados('antes del caso 12');
  // 12 ─ Lista con huecos (objeto) en el servidor
  reset({ montasa: { correctivos: { '0': lg('c1'), '4': lg('c5') } } });
  A = cliente('A', { correctivos: J(srv('correctivos')) }); await esperar();
  A.DB().correctivos[1].estado = 'Completado'; await A.sync.guardar(); await esperar();
  ok('12. Lista del servidor con huecos → se actualiza el registro correcto', get(SERVIDOR.tree, 'montasa/correctivos/4/estado') === 'Completado' && get(SERVIDOR.tree, 'montasa/correctivos/0/estado') === 'En proceso');

  await sinDuplicados('antes del caso 13');
  // 13 ─ Muchos registros nuevos a la vez → posiciones seguidas, sin huecos
  reset({ montasa: { equipos: [{ id: 'e0', codigo: 'MT-0' }] } });
  A = cliente('A', { equipos: J(srv('equipos')) }); await esperar();
  for(let i = 1; i <= 30; i++) A.DB().equipos.push({ id: 'n' + i, codigo: 'N-' + i });
  await A.sync.guardar(); await esperar();
  const ks13 = Object.keys(get(SERVIDOR.tree, 'montasa/equipos')).map(Number).sort((a,b)=>a-b);
  ok('13. 30 equipos nuevos en un solo guardado → quedan los 31, en posiciones seguidas', ks13.length === 31 && ks13[30] === 30, 'claves 0..' + ks13[ks13.length-1] + ' (' + ks13.length + ')');
  B = cliente('B', { equipos: [] }); await esperar();
  A.DB().equipos.push({ id: 'nA', codigo: 'A-1' }); await A.sync.guardar(); await esperar();
  ok('   y uno más después sigue en la posición 31', get(SERVIDOR.tree, 'montasa/equipos/31/id') === 'nA');

  await sinDuplicados('antes del caso 14');
  // 14 ─ Equipos: no resucitar vendidos ni repetir
  reset({ montasa: { equipos: [{ id: 'e1', codigo: 'MT-1', serie: 'SER-0001' }], vendidos: [{ id: 'v66', codigo: 'MT-66', serie: 'B16091J00103' }] } });
  A = cliente('A', { equipos: J(srv('equipos')).concat([{ id: 'x66', codigo: 'MT-66', serie: 'B16091J00103' }, { id: 'x66b', codigo: 'MT-66', serie: 'B16091J00103' }, { id: 'dup1', codigo: 'MT-1', serie: 'SER-0001' }, { id: 'ok1', codigo: 'MT-200', serie: 'NUEVA-200' }]), vendidos: J(srv('vendidos')) });
  await esperar(); await A.sync.guardar(); await esperar();
  const cods14 = srv('equipos').map(e => e.codigo).join(',');
  ok('14. Flota de ejemplo con vendidos (MT-66 ×2) y un repetido → solo entra el equipo nuevo de verdad', cods14 === 'MT-1,MT-200', cods14);

  // 15 ─ Código de un vendido reusado por un equipo distinto (otra serie) → SÍ se agrega
  reset({ montasa: { equipos: [{ id: 'e1', codigo: 'MT-1', serie: 'SER-0001' }], vendidos: [{ id: 'v67', codigo: 'MT-67', serie: 'B16091J00110' }] } });
  A = cliente('A', { equipos: J(srv('equipos')).concat([{ id: 'n67', codigo: 'MT-67', serie: '010409M4896' }]), vendidos: J(srv('vendidos')) });
  await esperar(); await A.sync.guardar(); await esperar();
  ok('15. MT-67 nuevo con otra serie que la del MT-67 vendido → se agrega', srv('equipos').some(e => e.id === 'n67'), srv('equipos').map(e => e.codigo + '/' + e.serie).join(', '));

  await sinDuplicados('final');
  console.log(fallas ? '\n✗ ' + fallas + ' falla(s)' : '\nTodo bien');
  process.exitCode = fallas ? 1 : 0;
})();

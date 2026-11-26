// ══ Firebase FALSO del piloto «NEXO Administración — Piloto» ══ Sustituye al SDK de Firebase dentro de las copias de Logística. Nada sale a internet.
//  · La «base» es un árbol guardado en localStorage (nxl_db) de este origen (localhost:8798): la comparten MT Rental y MONHACO.
//  · Sin señal (nxl_sinSenal=1, lo cambia la barra de prueba): las escrituras quedan en cola EN MEMORIA, como el SDK real, y las
//    lecturas esperan a que vuelva la señal. Si se recarga la página, esa cola se pierde (igual que el SDK) y la app reenvía lo suyo
//    con su propio mecanismo de pendientes (copia local + «sucio»), que es justo lo que se quiere probar.
//  · .info/connected sigue a la señal simulada. El aviso de señal llega a todos los marcos por el evento «storage».
//  · Cualquier llamada a firebaseio.com / googleapis se corta aquí. El acceso del teléfono (accesos/<uid>) sale del teléfono de prueba.
(function () {
  'use strict';
  var KDB = 'nxl_db', KSIN = 'nxl_sinSenal', KDISP = 'nxl_dispositivo';
  function J(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  function cargar() { try { var s = localStorage.getItem(KDB); if (s) return JSON.parse(s); } catch (e) {} var t = J(window.SEMILLA_LOG || {}); try { localStorage.setItem(KDB, JSON.stringify(t)); } catch (e) {} return t; }
  var tree = cargar(); window.__arbol = tree;
  function guardar() { try { localStorage.setItem(KDB, JSON.stringify(tree)); } catch (e) { console.warn('piloto: no se pudo guardar', e); } try { window.top.postMessage({ nxl: 'cambio' }, '*'); } catch (e) {} }
  function sinSenal() { try { return localStorage.getItem(KSIN) === '1'; } catch (e) { return false; } }
  function get(p) { if (p === '.info/connected') return !sinSenal(); return p.split('/').filter(Boolean).reduce(function (o, k) { return o == null ? undefined : o[k]; }, tree); }
  function put(p, v) { var ks = p.split('/').filter(Boolean); if (!ks.length) return; var o = tree; for (var i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; } if (v === null || v === undefined) { if (Array.isArray(o)) o[ks[ks.length - 1]] = null; else delete o[ks[ks.length - 1]]; } else o[ks[ks.length - 1]] = J(v); }
  // valores del servidor: {'.sv':'timestamp'} → hora actual
  function sv(v) { if (v && typeof v === 'object') { if (v['.sv'] === 'timestamp') return Date.now(); var o = Array.isArray(v) ? [] : {}; for (var k in v) o[k] = sv(v[k]); return o; } return v; }
  function sdk(x) { if (Array.isArray(x)) { var r = []; x.forEach(function (e, i) { if (e !== null && e !== undefined) r[i] = sdk(e); }); return r; } if (x && typeof x === 'object') { var o = {}; for (var k in x) if (x[k] !== null && x[k] !== undefined) o[k] = sdk(x[k]); return o; } return x; }
  function snap(v, key) { return { val: function () { return v === undefined ? null : sdk(J(v)); }, exists: function () { return v !== undefined && v !== null; }, key: key, forEach: function (cb) { if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { cb(snap(v[k], k)); }); } }; }
  var oyentes = [];
  function avisar(soloInfo) { oyentes.forEach(function (o) { if (soloInfo && o.p !== '.info/connected') return; setTimeout(function () { try { o.cb(snap(get(o.p), o.p.split('/').pop())); } catch (e) { console.error('oyente', o.p, e); } }, 0); }); }
  var cola = [], esperas = [];   // escrituras y lecturas sin señal (en memoria)
  function fresco() { try { var s = localStorage.getItem(KDB); if (s) { tree = JSON.parse(s); window.__arbol = tree; } } catch (e) {} }
  function escribir(fn) { if (sinSenal()) return new Promise(function (ok) { cola.push(function () { fn(); ok(); }); }); fresco(); fn(); guardar(); avisar(); return Promise.resolve(); }
  function leer(fn) { if (sinSenal()) return new Promise(function (ok) { esperas.push(function () { ok(fn()); }); }); return Promise.resolve(fn()); }
  function volvio() { if (sinSenal()) return; fresco(); var c = cola.splice(0); c.forEach(function (f) { try { f(); } catch (e) {} }); if (c.length) guardar(); var e = esperas.splice(0); e.forEach(function (f) { try { f(); } catch (x) {} }); avisar(); }
  window.addEventListener('storage', function (e) {
    if (e.key === KDB && e.newValue && !sinSenal()) { try { tree = JSON.parse(e.newValue); window.__arbol = tree; avisar(); } catch (_) {} }
    if (e.key === KSIN) { if (sinSenal()) avisar(true); else volvio(); }
  });
  window.addEventListener('message', function (ev) { if (ev.data && ev.data.nxl === 'senal') volvio(); });
  window.__nxlCola = function () { return cola.length; };
  function ref(p) {
    p = p || '';
    return {
      key: p.split('/').pop() || null,
      once: function () { return leer(function () { return snap(get(p), p.split('/').pop()); }); },
      // sin señal, el SDK real no entrega nada del servidor hasta que vuelve la conexión (los oyentes se avisan al volver)
      on: function (e, cb) { oyentes.push({ p: p, cb: cb }); setTimeout(function () { if (p !== '.info/connected' && sinSenal()) return; cb(snap(get(p), p.split('/').pop())); }, 0); return cb; },
      off: function () {},
      set: function (v) { return escribir(function () { put(p, sv(v)); }); },
      update: function (o) { return escribir(function () { for (var k in o) put(p ? p + '/' + k : k, sv(o[k])); }); },
      remove: function () { return escribir(function () { put(p, null); }); },
      push: function (v) { var k = 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); var r = ref(p + '/' + k); r.key = k; if (v !== undefined) return Object.assign(r.set(v), { key: k }); var pr = Promise.resolve(); r.then = pr.then.bind(pr); return r; },
      child: function (c) { return ref(p + '/' + c); },
      orderByKey: function () { return { limitToLast: function (n) { return { once: function () { return leer(function () { var v = get(p) || {}; var r = {}; Object.keys(v).sort(function (x, y) { return (+x) - (+y); }).slice(-n).forEach(function (k) { r[k] = v[k]; }); return snap(r); }); } }; } }; },
      orderByChild: function (c) { return { equalTo: function (val) { return { once: function () { return leer(function () { var v = get(p) || {}, r = {}; Object.keys(v).forEach(function (k) { if (v[k] && v[k][c] === val) r[k] = v[k]; }); return snap(r); }); } }; } }; },
      transaction: function (fn) { var correr = function () { fresco(); var cur = get(p), x = fn(cur === undefined ? null : J(cur)); if (x === undefined) return { committed: false, snapshot: snap(cur) }; put(p, sv(x)); guardar(); avisar(); return { committed: true, snapshot: snap(x) }; };
        if (sinSenal()) return new Promise(function (ok) { esperas.push(function () { ok(correr()); }); }); return Promise.resolve(correr()); },
      onDisconnect: function () { return { set: function () { return Promise.resolve(); }, remove: function () { return Promise.resolve(); }, cancel: function () { return Promise.resolve(); } }; }
    };
  }
  var DBF = { ref: ref, goOnline: function () {}, goOffline: function () {} };
  window.firebase = { apps: [], initializeApp: function () { this.apps.push({}); return {}; }, database: function () { return DBF; },
    auth: function () { return { currentUser: { uid: uid(), getIdToken: function () { return Promise.resolve('tok'); } }, onAuthStateChanged: function (cb) { setTimeout(function () { cb({ uid: uid(), getIdToken: function () { return Promise.resolve('tok'); } }); }, 50); }, signInAnonymously: function () { return Promise.resolve(); } }; } };
  window.firebase.database.ServerValue = { TIMESTAMP: { '.sv': 'timestamp' } };
  function uid() { try { return localStorage.getItem(KDISP) || 'tel_ger'; } catch (e) { return 'tel_ger'; } }
  function dispositivo() { var d = (window.DISPOSITIVOS_LOG || {})[uid()]; return d ? J(d) : null; }
  // Red: solo se permite este servidor local. Lo de Firebase real se responde aquí (acceso del teléfono) o se corta. Sin señal, falla.
  var _f = window.fetch;
  window.fetch = function (u, o) {
    u = String(u && u.url || u);
    if (/firebaseio\.com|identitytoolkit|securetoken|firebaseapp\.com/.test(u)) {
      if (sinSenal()) return Promise.reject(new TypeError('Failed to fetch (sin señal simulada)'));
      var m = (o && o.method) || 'GET', cuerpo = null;
      if (/\/accesos\/[^/.]+\.json/.test(u) && m === 'GET') cuerpo = dispositivo();
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(cuerpo); }, text: function () { return Promise.resolve(JSON.stringify(cuerpo)); } });
    }
    if (/^https?:\/\//.test(u) && u.indexOf(location.origin) !== 0 && !/fonts\.(googleapis|gstatic)\.com|cdnjs|jsdelivr|unpkg/.test(u)) return Promise.reject(new Error('Piloto: red externa bloqueada (' + u.slice(0, 60) + ')'));
    return _f.apply(this, arguments);
  };
})();

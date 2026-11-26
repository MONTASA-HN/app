// ══ Piloto «NEXO Administración · Caja chica · Acuse» · SOLO EN LA PRUEBA ══
// · Etiqueta PILOTO y «↺»: borra lo hecho en la prueba y vuelve a los datos iniciales. (26/11: Finanzas firma en el teléfono de
//   Gerencia, así que ya no hay selector de equipo.)
// · Nada sale de la computadora: WhatsApp, correo, teléfono, compartir y enlaces a otros sitios se bloquean con un aviso.
(function () {
  'use strict';
  try { localStorage.setItem('nxl_dispositivo', 'tel_ger'); } catch (e) {}
  var css = document.createElement('style');
  css.textContent = '#nxp-barra{position:fixed;top:calc(4px + env(safe-area-inset-top));right:8px;z-index:2147483646;display:flex;align-items:center;gap:4px;background:#fff;border:1px solid #c9d3e3;border-radius:999px;padding:3px 3px 3px 10px;box-shadow:0 2px 8px rgba(15,35,70,.18);font:700 11px/1 system-ui,sans-serif;color:#0f2a4a}'
    + '#nxp-barra .tag{background:#c2410c;color:#fff;border-radius:999px;padding:4px 8px;letter-spacing:.3px;margin-left:-7px}'
    + '#nxp-barra button{border:0;background:transparent;font:inherit;color:#52627a;padding:7px 10px;border-radius:999px;cursor:pointer}'
    + '#nxp-aviso{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:2147483646;background:#0f2a4a;color:#fff;padding:10px 14px;border-radius:10px;font:600 13px system-ui,sans-serif;max-width:86%;text-align:center;opacity:0;transition:opacity .2s;pointer-events:none}';
  document.head.appendChild(css);
  var b = document.createElement('div'); b.id = 'nxp-barra'; b.setAttribute('role', 'group'); b.setAttribute('aria-label', 'Piloto');
  b.innerHTML = '<span class="tag">PILOTO</span><button type="button" data-r="1" title="Volver a los datos de prueba iniciales">↺ Datos iniciales</button>';
  document.body.appendChild(b);
  b.querySelector('[data-r]').onclick = function () { if (!confirm('¿Borrar todo lo que se hizo en la prueba y volver a los datos iniciales?')) return; try { if (window.__NXP_WEB) localStorage.clear(); else localStorage.removeItem('nxl_db'); } catch (e) {} location.reload(); };   // en la página de prueba, clear() borra SOLO lo del piloto
  // ── Nada sale: avisos, correos, llamadas, compartir y sitios externos ──
  var av = document.createElement('div'); av.id = 'nxp-aviso'; document.body.appendChild(av);
  function avisar(t) { av.textContent = t; av.style.opacity = '1'; clearTimeout(avisar._t); avisar._t = setTimeout(function () { av.style.opacity = '0'; }, 2600); }
  window.__nxpBloqueados = [];
  function externo(u) { u = String(u || ''); if (/^(mailto|tel|sms|whatsapp|intent):/i.test(u)) return true; try { var x = new URL(u, location.href); return x.origin !== location.origin; } catch (e) { return false; } }
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest('a[href]'); if (!a) return;
    var u = a.getAttribute('href'); if (!externo(u)) return;
    ev.preventDefault(); ev.stopPropagation(); window.__nxpBloqueados.push(u); avisar('Piloto: no se abre ' + (/wa\.me|whatsapp/i.test(u) ? 'WhatsApp' : 'el enlace externo') + ' (nada sale de esta computadora).');
  }, true);
  // Página de prueba (misma dirección que las apps reales): solo se navega entre las dos Gerencias de esta carpeta
  if (window.__NXP_WEB) {
    var PERMITIDAS = ['', 'index.html', 'MTRENTAL_Gerencia.html', 'MONHACO_Gerencia.html'], CARPETA = location.pathname.replace(/[^/]*$/, '');
    var dentro = function (u) { try { var x = new URL(u, location.href); return x.origin === location.origin && x.pathname.indexOf(CARPETA) === 0 && PERMITIDAS.indexOf(x.pathname.slice(CARPETA.length)) >= 0; } catch (e) { return false; } };
    var NO = 'Página de prueba: aquí solo están las dos Gerencias (MT RENTAL y MONHACO).';
    document.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest && ev.target.closest('a[href]'); if (!a || a.hasAttribute('download')) return;
      var u = a.getAttribute('href'); if (!u || u.charAt(0) === '#' || /^(javascript|blob|data):/i.test(u) || externo(u) || dentro(u)) return;
      ev.preventDefault(); ev.stopPropagation(); avisar(NO);
    }, true);
    if (window.navigation && navigation.addEventListener) navigation.addEventListener('navigate', function (e) {
      if (e.hashChange || e.downloadRequest || !e.cancelable) return;
      if (!dentro(e.destination.url)) { e.preventDefault(); avisar(NO); }
    });
  }
  var _open = window.open;
  window.open = function (u) { if (u && externo(u)) { window.__nxpBloqueados.push(String(u)); avisar('Piloto: no se abre WhatsApp ni sitios externos.'); return null; } return _open.apply(window, arguments); };
  try { if (navigator.share) navigator.share = function () { avisar('Piloto: «Compartir» no envía nada.'); window.__nxpBloqueados.push('share'); return Promise.resolve(); }; } catch (e) {}
})();

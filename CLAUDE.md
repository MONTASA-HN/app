# CLAUDE.md — Apps de MONTASA Handling Co.

Guía para retomar el trabajo en este repo sin repetir lo ya resuelto. La lee
cualquiera que entre: otro programador, otra sesión de Claude, o Miguel en un
chat nuevo. **Mantenla al día**: cada vez que se resuelva algo no obvio, se tome
una decisión de negocio o se descarte un camino, anótalo aquí en el mismo commit.

Documentos hermanos, en la raíz (también se mantienen vivos, en el mismo commit):
- **`FLUJO.md`** — cómo funciona la app por dentro: de dónde sale el dato, qué pasa
  al crear y cerrar una orden, estados de equipo, cada escritura a Firebase.
- **`TRAMPAS.md`** — cosas que se comportan distinto a como se ven, y bugs conocidos.

La app la usan mecánicos, motoristas y supervisores que no programan, desde el
teléfono, muchas veces con las manos sucias y sin buena señal. Eso manda sobre todo
lo demás.

---

## 0. LEE ESTO PRIMERO

**Cada sesión nueva empieza con `git pull`**, antes de leer o tocar nada. Hay varios
autores (Miguel, Rodrigo, otras sesiones de Claude) y cualquiera pudo subir algo.
Después, `git log --oneline -10` para ver qué entró y leer lo que no conozcas.

**Estado al 2026-09-29:**
- El repo está clonado en la PC de Miguel: `C:\Users\MiguelAntonioOrellan\Documents\montasa-app`.
  Se trabaja con Claude Code (app de escritorio) sobre esa carpeta. Git y Node
  están instalados (winget).
- Los 8 archivos de la sesión de Cowork (PDF de órdenes, campo Cliente, firma
  «Recibido conforme») entraron por commit con fusión de 3 vías contra `9dfd89b`,
  sin conflictos. Las subidas por el navegador del 26-sep ya venían incluidas.
- Rodrigo pidió (2026-09-29) reemplazar su `CLAUDE.md` por esta guía, y crear
  `FLUJO.md` y `TRAMPAS.md`.

---

## 1. Cómo se trabaja (reglas que no se negocian)

- **Idioma: español, siempre.** Mensajes, commits, comentarios en el código
  (explicando el **porqué**, no el qué). Miguel escribe rápido y con faltas;
  entiende lo que quiere decir, no lo corrijas. Respuestas cortas y claras, sin
  jerga técnica (él no es programador): explica **qué se rompe y para quién**
  —"ya no se pierden órdenes cuando dos personas guardan a la vez"—, no el nombre
  del patrón.
- **Preguntar antes de actuar.** Instrucción textual de Miguel: *"hazme las
  preguntas necesarias antes de realizar la acción (hazla siempre aunque yo no
  te lo diga, no asumas nada, pregunta siempre)"*. Antes de implementar, se
  preguntan los puntos abiertos (apps afectadas, comportamiento exacto, casos
  borde). Si algo es claramente la intención, igual se confirma en una línea.
  Preguntas con opciones concretas (y una recomendada) funcionan bien con él.
  Si su respuesta es texto libre que cambia el plan, se sigue lo que dice.
- **Flujo git (desde 2026-09-29, pedido por Rodrigo y Miguel):**
  1. `git pull` **al empezar cada sesión** y otra vez antes de tocar cualquier archivo.
  2. Cambios sobre la versión del repo, nunca sobre copias locales viejas.
  3. `node dev/sellar_version.js` y luego `node dev/check_syntax.js` → todo en ✓ (§7).
     Sin sellar, los teléfonos no se enteran de que hay versión nueva (§4, «Actualización
     automática»); `check_syntax` lo detecta y sale en ✗.
  4. Probar (§7).
  5. `git commit` **local**, con mensaje en español que diga **qué** y **por qué**.
  6. **`git push` SOLO con permiso explícito de Miguel, cada vez.** Él quiere revisar
     antes de que algo llegue a GitHub (lo que está en `main` es lo que corre en
     todos los teléfonos). Antes de pedir permiso, resumirle en palabras de su
     trabajo qué cambia y qué debe probar. Un "sí" vale para ese push, no para los
     siguientes. Justo antes de hacer push: `git pull` otra vez.
  7. GitHub Pages publica solo en ~1–10 min tras el push.
- **Actualizar CLAUDE.md / FLUJO.md / TRAMPAS.md** en el mismo commit cuando cambie
  algo que el próximo necesite saber.
- **Ya no se suben archivos por el navegador de GitHub** ("Add file → Upload files").
  Esa subida reemplaza el archivo entero con la copia que uno tenga en la
  computadora y **borra en silencio lo que otro haya subido mientras tanto**.
  Así se perdió el autocorrector el 2026-09-24 (commit `44bc77e`). Todo entra
  por commits. Si aparece un commit "Add files via upload", revisarlo con
  `git show` (que no haya borrado cambios de otros ni las líneas del autocorrector).
- **Si Miguel trae una copia suelta de un archivo** (de Descargas, de otro chat):
  no copiarla encima. Meterla con fusión de 3 vías contra el commit del que salió:
  `git show BASE:ARCHIVO > base; git merge-file -p copia base ARCHIVO_actual > resultado`
  (normalizar antes los finales de línea: el repo guarda LF; las descargas de
  Windows vienen en CRLF → `tr -d '\r'`).
- Tras publicar, **los teléfonos se actualizan solos** al abrir la app o volver a ella
  (bloque «ACTUALIZACIÓN AUTOMÁTICA DE LA APP», §4), siempre que se haya sellado la versión.
- Al hacer commit o pedir push, decirle en 1–2 frases qué cambió y qué debe
  probar; no recitar cada paso.

### Reglas de la casa (de Rodrigo)
- **No hay build.** Es HTML con CSS y JS adentro, servido por GitHub Pages. No meter
  npm, bundler ni framework en la app. (`dev/` es solo para herramientas de revisión
  que corren en la PC; la app no las usa.)
- **Honduras**: `es-HN`, +504, lempiras.
- **`autocorrector.js` no se toca** (§9).
- **No se hace sin preguntar a Miguel:**
  - Borrar o reescribir datos de la base (es la operación real de la empresa).
  - **Cambiar nombres de campos o de estados.** Hay otras cosas leyendo esta misma
    base —el tablero de flota y un mundo isométrico— y un campo renombrado las
    rompe en silencio.
  - **Mover o renombrar archivos.** Los links de los teléfonos (PWA) apuntan por nombre.
- **Si te costó descubrirlo, escríbelo** en `TRAMPAS.md` (formato: Qué pasa / Por qué
  pasa, con archivo y línea / Cómo se nota desde afuera / Qué hacer). No arreglarlo
  callado ni dejarlo solo en el chat.

---

## 2. Qué es esto

Sistema de gestión de mantenimiento, logística y viáticos para dos empresas
del mismo grupo, dueño/usuario principal **Miguel Antonio Orellana**
(Gerente de Mantenimiento, jefe.taller@montasa.com):

- **MT RENTAL / MONTASA** — renta de montacargas, elevadoras, vehículos (grúa,
  camiones). Taller en San Pedro Sula.
- **MONHACO** — operación de flota en planta de clientes (mulas, stackers,
  montacargas, electro tower…). Tiene toma de horómetros por cliente y reportes
  de cobro.
- **MONHAGRO** — tercera empresa; aparece como chip gris en el selector, aún
  sin app.

Otros autores: **Rodrigo Monterroso** ("Rodzilla The Creator",
rodrigo.monterroso@montasa.com) — autocorrector y la primera guía del repo.

### Hosting y datos
- **GitHub Pages**: `https://montasa-hn.github.io/app/` (repo `MONTASA-HN/app`,
  rama `main`). `index.html` redirige a `MTRENTAL_Gerencia.html`.
- **Firebase Realtime Database** (SDK compat 9.23.0):
  `https://montasa-app-default-rtdb.firebaseio.com`. Nodos raíz:
  `montasa` (MT Rental) y `monhaco` (MONHACO). Detalle de lecturas y escrituras en
  `FLUJO.md`.
- `sw.js` es un **kill-switch**: desregistra service workers viejos y borra su
  caché. No hay caché offline de la app; no reintroducir un SW con caché sin
  planearlo (los SW viejos dejaron versiones pegadas en los teléfonos).

---

## 3. Las apps (un archivo HTML autocontenido cada una)

| Archivo | Quién la usa | Empresa |
|---|---|---|
| `MTRENTAL_Gerencia.html` | Miguel (gerencia): todo, con PIN | MT Rental |
| `MONTASA_Supervision.html` | Supervisores | MT Rental |
| `MONTASA_Tecnicos.html` | Técnicos del taller | MT Rental |
| `MONTASA_Logistica.html` | Motoristas/operadores de logística | MT Rental |
| `MONTASA_Comercial.html` | Área comercial | MT Rental |
| `MONHACO_Gerencia.html` | Gerencia MONHACO | MONHACO |
| `MONHACO_Supervision.html` | Supervisión MONHACO | MONHACO |
| `MONHACO_Tecnicos.html` | Técnicos MONHACO | MONHACO |
| `MONHACO_Logistica.html` | Logística MONHACO: horómetros y reportes de cobro | MONHACO |
| `MONHACO_Logistica_PRUEBA.html` | Copia de prueba; escribe en `monhaco_prueba/...` | MONHACO |
| `MONTASA_Tecnicos_MONHACO.html` | **Solo redirige** a `MONHACO_Tecnicos.html` (desde 2026-09-29). La versión vieja (jul-2026) borraba y recreaba los equipos de cliente de MONHACO; sigue en el historial de git | — |
| `autocorrector.js` | Corrector ortográfico compartido (ver §9) | ambas |
| `manifest_*.json`, `icons/` | PWA (instalación en teléfono) | — |
| `dev/` | Herramientas de desarrollo (no las usa la app) | — |

Cada app es **un solo archivo** con HTML+CSS+JS inline. Muchas funciones están
**duplicadas entre apps** (viáticos, vales, PIN, repuestos…): un arreglo casi
siempre hay que aplicarlo en varias. Antes de cerrar un cambio, `grep` por el
nombre de la función en todos los `.html`, y anotar en `FLUJO.md` cuáles se tocaron.

**PINs**: `PIN_CORRECTO` es `1624` en casi todas; **`2026` en las dos
Supervisiones**. No asumir que es el mismo.

---

## 4. Arquitectura y patrones del código

(El mapa detallado, con funciones y líneas, está en `FLUJO.md`.)

- **Objeto global `DB`** con las colecciones (`equipos`, `preventivos`,
  `correctivos`, `logistica`, `solicitudes`, `repuestos`, `vendidos`,
  `horometros`, `papelera`…). `saveDB()` guarda local + Firebase.
- **Correlativos**: mantenimiento `MH-XXXX` (**también en MT Rental**, no solo
  MONHACO — el prefijo confunde), logística `LG-XXXX`, repuestos `SR-XXXX`.
- **Candados de escritura** (críticos, no quitarlos):
  - `window._fbReady` — Firebase ya entregó el snapshot real. Antes de eso,
    **no escribir**: se subiría la versión recortada del caché local.
  - `window._equiposFBok` — ya se leyeron los equipos reales.
    `saveAllEquipos()` no escribe nada mientras sea `false`. Cualquier proceso
    que cree/edite equipos al arrancar debe esperar este flag, o sus cambios
    viven solo en memoria y se pierden al recargar.
- **Escrituras puntuales, no listas completas.** Escribir por registro/índice
  (`montasa/equipos/<idx>/estado`, `montasa/repuestos/<id>`,
  `montasa/horometros/<mes>/<equipoId>`). Reescribir una lista entera con la
  copia local **borra lo que otro dispositivo agregó** (así se perdieron
  LG-0213/0223/0224/0226). Para borrar de una lista: leer la del servidor
  (`once('value')`), quitar solo el elemento y escribir eso. **Nunca escribir por una
  posición sacada de la copia local** (`DB.x.findIndex` / `indexOf` / `length-1`): usar
  `_fbRefPorId('<raíz>/<lista>/'+idx+…).set()/.update()`, que verifica el `id` en el servidor
  (desde 2026-09-29, TRAMPAS T2). Si la posición salió de un snapshot del servidor, `window._fbDB.ref` sirve.
- **Sincronizador (desde 2026-09-29, TRAMPAS T7)**: bloque `// ══ GUARDADO POR REGISTRO (sincronizador)`,
  **idéntico** en MTG, MTS, MTT, MTL, MTC, MHG, MHS, MHT; se arranca con `_Sync.iniciar(raíz, _fbDB)` junto a
  `window._fbDB = firebase.database()`. Maneja logistica, preventivos, correctivos, revisiones, evaluaciones,
  solicitudes, ordenesCerradas, equipos y vendidos. **Ya no se escriben listas enteras de esas colecciones:**
  `saveDB()` y las demás funciones llaman `_Sync.guardar()`, que sube solo los datos que este teléfono cambió
  de cada registro (transacción que comprueba el `id`), agrega los nuevos al final sin huecos y borra lo que
  este teléfono tuvo y quitó (máx. 2 por lista y guardado; nunca lo que la app no cargó; deja lápida en
  `_borradas` y nunca resucita algo con lápida; nunca agrega un equipo vendido o repetido por serie/código).
  Si dos cambian el mismo dato, gana el último (decisión de Miguel). La «base» (huellas de lo último
  confirmado) vive en `localStorage` (`_sync_base_<raíz>`): lo hecho sin señal se sube al volver a abrir la
  app. La forma de los datos en Firebase NO cambió. Fotos nunca pasan por aquí. **Regla: para guardar una de
  esas colecciones, modificar `DB.<col>` y llamar `saveDB()` o `_Sync.guardar()`; nunca
  `ref('<raíz>/<col>').set(lista)` ni `update({<col>: …})`.** Si se toca el sincronizador:
  `node dev/prueba_sync.js <app>.html` debe decir «Todo bien» (14 casos con teléfonos simulados).
- **Firebase devuelve listas con huecos como objeto** `{0:…,2:…}`: normalizar
  siempre a arreglo (`_toArr`).
- **Equipos**: flags `esVehiculo`, `esEquipoCliente`, `esGenerico`. Los
  vehículos guardan su **kilometraje en el campo `horometro`**.
- **Vendidos**: al vender, el equipo sale de `DB.equipos` y pasa a
  `DB.vendidos` (`VENDIDOS_INICIALES` es el catálogo base). Al cargar, la app
  quita de la flota todo lo que `_estaVendido()` reconoce (compara **por
  serie**). Los equipos de cliente están exentos a propósito (ver §8).
- **Datos que hay que editar a veces** (buscar por nombre): `TECNICOS_VIAT`,
  `OPERADORES_LOGISTICA`, `MOTORISTAS_LOGISTICA`, `GESTORES_VIATICOS`,
  `DESTINOS_VIATICOS` (km ida y vuelta + peajes), `_VIAT_DESC` (conceptos de
  factura en liquidación), `EQUIPOS_INICIALES`, `VENDIDOS_INICIALES`. Suelen
  estar repetidos en varias apps: cambiarlos en todas.
- **PDFs**: jsPDF 2.5.1 + html2canvas 1.4.1 desde cdnjs, cargados a demanda
  (`_cargarLibPDF`, `_srPDFLibs`). Paginar por filas (ver PDF de repuestos),
  no cortando una imagen larga. El PDF de órdenes tiene su propio cargador (§11).
- **`DB` se declara con `let`**: NO cuelga de `window`. Un `<script>` aparte lo ve
  por nombre (`typeof DB!=='undefined' ? DB : …`), pero `window.DB` es `undefined`.
  (Así falló la primera versión del PDF: "Orden no encontrada".)
- **Fotos de órdenes "bajo demanda"**: no viven en la orden sino en
  `fotosOrden_montasa/<idOrden>` / `fotosOrden_monhaco/<idOrden>` (`{fotos:[dataURL…]}`);
  la orden lleva `nFotos`. Usar `_fotosPendientes(o)` + `_hidratarFotos(o, cb)` antes de
  necesitarlas. `_sinFotosPersist()` las quita al guardar listas.
- **Repuestos de una orden**: `DB.repuestos` (objeto por id) filtrando `r.ordenId===o.id`;
  cada SR trae `items:[{cant, desc, parte}]`. Solo existe en las apps MT.
- **Firma de la orden**: `o.firma` (dataURL PNG), capturada en el canvas
  `firma-<id>` / `firma-log-<id>` con `getFirmaData(id)`; existe además el recuadro
  a pantalla completa `firma-ov-canvas`.
- **Lugar del trabajo**: mantenimiento `o.ubicacion` ('plantel' | 'campo');
  logística `o.ubicacionLog` ('plantel' | 'fuera'). Rentas: siempre fuera.
- **Funciones de guardado de campos**: Técnicos/Gerencia/Supervisión
  `actualizarCampoOrden('prev'|'corr', id, campo, valor)` (acepta cualquier campo);
  Logística `actualizarLog(id, campo, valor)`; evaluaciones `actualizarEvaluacion`;
  cortinas (MONHACO) `actualizarCortina` + `_syncCortina`.
- **Actualización automática** (desde 2026-09-29, pedido de Miguel: el iPhone seguía con la
  versión vieja). Bloque `// ══ ACTUALIZACIÓN AUTOMÁTICA DE LA APP` justo después de
  `<meta charset>` en las 10 apps vivas (no en `index.html` ni en la app vieja), **idéntico**
  en todas salvo `APP_VERSION`. Al abrir y al volver a la app pide `version.json` sin caché;
  si la versión de ese archivo es distinta de su `APP_VERSION`, hace
  `location.replace(archivo?v=<versión>)` (URL nueva = el teléfono no puede usar la copia
  vieja). **No recarga si en esa sesión se tocó un campo, la firma (canvas) o la cámara**:
  en iPhone abrir la cámara o WhatsApp dispara "volver a la app" y recargar borraría lo que
  se estaba llenando; espera a la próxima apertura. Candado anti-ciclo: no reintenta la misma
  versión antes de 5 min (`localStorage _actualizar_<archivo>`). `APP_VERSION` y
  `version.json` los escribe `node dev/sellar_version.js` (huella sha1 del contenido, sin
  finales de línea); nunca a mano. No cubre `autocorrector.js` (se carga aparte y el
  teléfono puede tener la copia vieja un rato).
- **Mapa de la flota y el menú ☰** (2026-09-29): `#mapa-cont` lleva `position:relative;z-index:0;isolation:isolate`
  porque Leaflet usa z-index 400–1000 y tapaba el botón ☰ (120) y su menú (121). En celular
  (`L.Browser.mobile`) el mapa se crea con `dragging:false`: un dedo baja la página, dos dedos
  mueven/acercan el mapa (pellizco de Leaflet). Mismo cambio en MTG y MHG.
  **Equipos de cliente en el mapa** (2026-09-29): pin **amarillo #ffd60a con borde #8a6d00**
  (`_MAPA_COL_CLIENTE`; el morado es de DEMO/PRÉSTAMO y el mostaza #e0a800 de EN MANTENIMIENTO),
  rotulado con `clienteNombre || cliente` (`_mapaNombreEq`), filtro propio «🟡 Equipos de cliente»
  (`_mapaCat` → 'CLIENTE'); ya no cuentan como «Disponibles».
- **Mapas**: Leaflet 1.9.4 (cdnjs) + teselas de OpenStreetMap, sin API key.
- **PIN**: `solicitarPINAccion(callback, titulo, subtitulo)`. Solo Gerencia MT,
  Gerencia MONHACO y Logística MT tienen teclado real (`.pin-key`); en las
  demás la función cae al `prompt()` del sistema.

---

## 5. Reglas de negocio vigentes

- **Solo Gerencia edita o elimina órdenes de trabajo.** En Supervisión/Técnicos
  esas funciones empiezan con `toast('Solo Gerencia puede editar o eliminar…'); return;`.
  Es intencional.
- **Papelera**: órdenes borradas van a `<raíz>/papelera/<id>` (se conservan 2
  meses); lápidas en `<raíz>/_borradas/<id>` para que otro dispositivo no las
  resucite.
- **Viáticos**: varias solicitudes por orden, **una sola liquidación**; el
  monto asignado es la suma de todas. Destino internacional (Santa Ana, El
  Salvador) muestra aviso: alimentación/hospedaje a mano y gastos de frontera en
  "Otros gastos".
- **Vales de alimentación**: formato oficial "Comprobante de entrega de caja
  chica" (`_valeComprobanteImprimir`). El monto se recalcula por el número real
  de personas de la orden.
- **Logística — renta de vehículo**: km de salida/retorno en vez de horómetro;
  motorista obligatorio al cierre, operador opcional. **Días de renta** en
  rentas y entregas; notificación en Gerencia MT a 3 días hábiles del
  vencimiento solo para **entregas** (las rentas no notifican); desaparece al
  crear una orden de retiro de ese equipo.
- **Inicio de renta** (`inicioRenta`, 'YYYY-MM-DD'): se pide en la solicitud
  (Gerencia MT y Supervisión MT) junto con los días — **los dos o ninguno**.
  La finalización = inicio de renta + días (antes era la fecha de inicio de la
  orden, que a veces se genera días antes). Órdenes viejas sin `inicioRenta`
  siguen usando `fechaInicio` (y si no, `fechaCierre`). Funciones:
  `_rentaInicioDe` / `_rentaVenceDe` (Gerencia), `_rentaFinFecha` /
  `_rentaIniTexto` (Logística). «✏️ Ajustar (PIN)» edita inicio y días en una
  ventana propia (`_rentaModal`, z-index 99990, debajo del PIN).
- **Cancelar retiro** (Gerencia MT): cada aviso de retiro trae «🚫 Cancelar
  retiro (PIN)» → motivo obligatorio (Renta cancelada / Orden de prueba / Otro
  + detalle, obligatorio si es Otro) → guarda
  `o.retiroCancelado = {ts, motivo, nota, por}` en la orden de entrega y el
  aviso ya no sale. **No toca el estado del equipo.** La orden muestra «Retiro
  cancelado» con «↩ Reactivar aviso (PIN)» (borra `retiroCancelado`).
  Logística muestra el retiro cancelado en el detalle. Se sincroniza solo esa
  orden con `_sincronizarLogisticaConReintento(o.id)`.
- **Estados de equipo**: al cerrar una renta o retiro, el equipo vuelve a
  DISPONIBLE (salvo EN MANTENIMIENTO / MAL ESTADO). Se escribe en la ficha
  (`<raíz>/equipos/<idx>/estado`). Lista completa de estados y caminos en `FLUJO.md`.
- **Ubicación GPS**: link `https://www.google.com/maps?q=lat,lng` en la orden,
  que viaja a `eq.ubicacionLink` (+ `ubicacionTs`). Aplica a entregas fuera del
  plantel, a **rentas de equipo** (no de vehículo; desde 2026-09-26, obligatoria
  para cerrar, `_gpsAplicaLog(o)` en Logística MT) y a mantenimiento fuera del
  plantel (no a revisiones/evaluaciones). **No sale en el PDF** (decisión de Miguel:
  traducir a dirección exigía una clave de Google Maps de pago y la descartó; tampoco
  quiso OpenStreetMap).
  Al cerrar un retiro, el link del equipo pasa al taller SPS
  (`_GPS_TALLER_SPS`).
- **Solicitudes de repuestos (SR)**: hasta 80 filas (10 visibles al abrir, se
  agregan de 5 en 5). Varias SR por orden: la 2ª en adelante pide PIN cada vez
  y se numera ligada a la primera (`SR-0057`, `SR-0057-2`, `-3`…). Editar una SR
  guardada: solo Gerencia y Supervisión. Compartir = PDF carta paginado.
- **Equipos de cliente**: al escribir cliente+marca+modelo en la tarjeta de
  una orden, se registra la ficha en "Equipos de cliente" y se enlaza la orden.
  Un equipo **vendido por nosotros** al que seguimos dando servicio queda en
  Vendidos **y además** como equipo de cliente (con su código original, p. ej.
  E-11). Gerencia corre una reparación única al abrir
  (`_repararEquiposCliente`) para órdenes que quedaron sin ficha.
- **Horómetros MONHACO**: tomas por mes y **por cliente**, cada cliente con
  firmas de SUPERVISOR y GERENTE obligatorias para finalizar; al finalizar se
  comparte y las lecturas pasan a la ficha.
- **Horómetros MT Rental** (módulo extra): **un solo listado** (en renta,
  disponibles, en mantenimiento, vehículos incluidos en km). Captura en
  Logística MT, consulta en Gerencia MT. Firmas obligatorias: **OPERADOR** y
  **GERENTE DE MANTENIMIENTO**. Nodo `montasa/horometros`.
- **Mapa de la flota** (Gerencia MT y MONHACO): pines por estado desde
  `ubicacionLink`; alerta si la ubicación tiene más de 60 días.
- **Compartir órdenes = PDF** (ver §11). Excepciones que siguen como imagen:
  **Atención de Compras** y **Revisión físico-técnica**.
- **Cliente de la orden** (`o.clienteOrden`): obligatorio para cerrar preventivos,
  correctivos, evaluaciones, cortinas y logística (renta, entrega, retiro, apoyo a
  mantenimiento; NO atención de compras). Se llena a mano; si la orden ya traía
  nombre (`clienteNombre` / `cliente`) sale escrito y editable. Es lo que imprime el PDF.
- **Quién firma «Recibido conforme»**: equipo de cliente → el cliente (en plantel o
  fuera); equipo propio fuera del plantel → el cliente; equipo propio en el plantel →
  el supervisor de mantenimiento, en el mismo recuadro del celular del técnico al cerrar.
  En el PDF nunca va nombre ni cargo: solo la firma y «RECIBIDO CONFORME».

---

## 6. Personal y datos de referencia (a la fecha)

- **Técnicos MT Rental**: Jonathan Martinez, Sergio Madrid, Elkin Perez,
  Kevin Deras, Fernando Benavides, Dalton Garcia, Eliberto Peña.
- **Técnicos MONHACO**: Rances Pineda, Angel Cardona, Maynor Paz, Cristian
  Barrera, Jose Escoto, Ramon Moreno, Marvin Torres.
  (Sergio Madrid ↔ Marvin Torres se intercambiaron empresa el 2026-09; el
  histórico no se tocó.)
- **Motoristas logística MT**: Francisco Narvaez, Miguel Lopez, Jorge Martinez
  (Jorge sin teléfono).
- Gestores de viáticos: ver `GESTORES_VIATICOS` (incluye a Miguel Antonio
  Orellana Lopez).
- Taller SPS: `https://maps.app.goo.gl/iXbWDRPh7HG77Ski6`.

Esto cambia seguido: si no coincide con el código, **manda el código**, y se
corrige aquí.

---

## 7. Cómo probar antes de commit

1. `node dev/sellar_version.js` y después `node dev/check_syntax.js` (desde la raíz del
   repo) → todo ✓. Un error de sintaxis deja la app en blanco para todos. `check_syntax`
   compila cada `<script>` inline de los `.html` y `autocorrector.js`, y revisa que las
   versiones estén selladas. Si se tocó el sincronizador, además `node dev/prueba_sync.js`.
2. **Playwright** con Chromium (no está instalado en la PC de Miguel todavía; se
   instala fuera del repo, p. ej. en una carpeta temporal, para no meter npm en la app).
   Patrón que funciona:
   - `page.route('**/*')`: dejar pasar `file://`, `blob:` y `data:`; abortar el
     resto; servir desde disco las librerías de CDN que se necesiten (jsPDF,
     html2canvas, Leaflet; se bajan con `npm pack`).
   - Sustituir Firebase con un stub en `addInitScript`:
     `window.firebase = { initializeApp(){}, database: () => ({ ref: mk }) }`,
     donde `mk(path)` devuelve `set/update/remove/once/on/off/child` y
     registra las escrituras para verificarlas. El snapshot raíz necesita `_ts`.
   - Marcar `window._fbReady = true` (y `_equiposFBok` si se tocan equipos).
   - **Probar con clics reales** (`page.click`), no solo llamando funciones:
     así se descubrió que el botón de PIN no hacía nada en Técnicos.
   - Las apps traen su flota embebida (`EQUIPOS_INICIALES`,
     `VENDIDOS_INICIALES`) que se mezcla con el stub: verificar por inclusión,
     no por conteos exactos.
   - Para el PDF: servir también `fonts.googleapis.com` con un CSS local de
     `@font-face` (DM Sans 400–800 y DM Mono de `npm pack @fontsource/dm-sans`
     `@fontsource/dm-mono`), y capturar el archivo con
     `context({acceptDownloads:true})` + `page.waitForEvent('download')` (en Chromium
     sin pantalla no hay `navigator.share`, así que la app descarga).
   - Errores que dan los stubs y NO son bugs: `Autocorrector is not defined`
     (el .js no está junto al archivo de prueba) y `localeCompare` de equipos de
     prueba sin `codigo` en Supervisión.
   - **Nunca abrir las apps contra la Firebase real para probar**: al arrancar
     corren reparaciones y sincronizaciones que escriben en la base de verdad.
3. Para cambios de datos reales en Firebase: solo con autorización de Miguel,
   escrituras puntuales (nunca PUT de listas completas).

### Cómo editar (convención)
Cambios con scripts de reemplazo que verifican **el número exacto de
coincidencias** del texto a reemplazar (`assert s.count(viejo) == 1`) y fallan
sin escribir si no calza. Evita parches aplicados a medias o dos veces.

---

## 8. Problemas ya resueltos (no volver a caer)

- **Botón que "no hace nada"**: casi siempre un error de JS silencioso.
  Reproducir con clic real y mirar `pageerror`. Casos: `solicitarPINAccion` sin
  teclado en Técnicos/Supervisión; `editarLiquidacionConPin` escribía en
  `#vliq-container` (no existe; es `#viaticos-content`).
- **Modal debajo de otro modal**: `.pin-overlay` tenía `z-index:900` bajo el
  formulario de repuestos (`99996`). Ahora `99998`.
- **Equipo de cliente que "no aparece" aunque se creó**: la limpieza de
  vendidos al cargar lo borraba por coincidir en serie con un equipo vendido.
  `_estaVendido()` exime `esEquipoCliente`. (Caso MH-0167, Genie de Becamo,
  ex E-11.)
- **Supervisión no registraba equipos de cliente** desde la tarjeta: faltaba
  el disparador que sí tenían Técnicos y Gerencia.
- **Borrado que se llevaba órdenes ajenas**: escribía la lista local completa.
  Ahora lee la del servidor y quita solo una.
- **Estados que no cambiaban al cerrar**: se escribían en `montasa/estados`,
  nodo que nadie lee.
- **Vale que contaba 1 persona**: migración que solo corría si no existía el
  campo; ahora resincroniza siempre.
- **Correlativo `SR-2` en vez de `SR-0057-2`**: el regex quitaba el número de
  serie como si fuera sufijo. Probar con regex estrictos
  (`/^SR-\d{4}-2$/`), no con `/-2$/`.
- **"Something went really wrong" en GitHub**: el editor web no aguanta
  archivos de 800 KB+. (Irrelevante ya: todo va por git.)
- **Link corto de Google (`maps.app.goo.gl/...`)** no trae coordenadas: el
  mapa no puede ubicarlo. Desde el navegador no se puede resolver (CORS). Se
  recaptura con el botón 📍. Quedó pendiente decidir si se agrega un campo de
  coordenadas manual (ver §10).
- **Paginación medida antes de que carguen las fuentes**: si se mide el alto
  con la fuente de respaldo, la firma se monta sobre el pie. Cargar explícitamente
  cada peso con `document.fonts.load('700 12px "DM Sans"')` (no basta
  `document.fonts.ready`) y dejar margen de 8 px sobre el pie.
- **Copias viejas fuera del repo** (/tmp, Descargas de hace días): nunca copiarlas
  encima del repo; les faltaba el autocorrector. Trabajar solo sobre main al día.
  En Descargas hay muchas versiones con el mismo nombre (`-1`, `-2`, `(1)`…):
  identificarlas por contenido y fecha, no por nombre.

---

## 9. Otros autores y piezas compartidas

- **Autocorrector** (`autocorrector.js`, autor Rodrigo / "Rodzilla The Creator"):
  corrige ortografía en los campos de texto al salir del campo, sin cambiar
  palabras que sí existen. Se carga al final de 10 apps con
  `<script src="autocorrector.js"></script><script>Autocorrector.vigilar();</script>`.
  **No quitar esas dos líneas ni tocar el archivo.** (`MONTASA_Comercial.html`
  nunca las tuvo.) Reglas del autocorrector (ver commits `0f31351`, `cb79130`,
  `9dfd89b`): nunca cambia singular↔plural, lista de palabras protegidas
  (mula/mulas/mulita/muela/pisto…), diccionario de 47 mil palabras + jerga del
  taller. Antes de agregar una "corrección" hay que mirar la frase entera: si la
  palabra puede ser correcta en algún contexto, no se corrige. Si no lo ves en el
  repo, avisar antes de hacer nada.
- Si aparece un commit de otra persona, léelo antes de tocar el mismo archivo.

---

## 10. Pendientes y decisiones abiertas

- Link corto de Google en fichas: ¿campo de coordenadas manual, traducir el
  link vía servicio externo, o solo recapturar? Miguel no decidió aún.
- Órdenes de logística huérfanas sin restaurar: LG-0224 (entrega Cargill),
  LG-0226 (renta MT-118), LG-0213 (retiro MT-129). Restaurar solo si Miguel lo
  pide.
- LG-0223 conserva el texto "Orden restaurada — retiro de elevadora en
  Cargill" en la descripción; se ofreció limpiarlo.
- Borrar respaldos viejos en Firebase (`respaldo_montasa_20260824`,
  `respaldo_monhaco_20260912`) y el nodo `monhaco_prueba` cuando Miguel
  confirme.
- MONHAGRO: activar el chip cuando exista su app.
- **Bugs conocidos sin arreglar**: están en `TRAMPAS.md` (con archivo, línea y
  arreglo propuesto). Preguntar a Miguel cuáles se arreglan.
- Cliente en equipo propio en el plantel: hoy también es obligatorio (escriben p. ej.
  «MONTASA»). Se le ofreció a Miguel no pedirlo o llenarlo solo en ese caso; no respondió.
- Pies de foto del PDF: las fotos se guardan sin etiqueta, por eso salen «Fotografía N de M».
  Si Miguel quiere «Antes / Durante / Después», habría que pedir la etiqueta al tomar la foto.

---

## 11. PDF de órdenes y campo Cliente (2026-09-29) — cómo está hecho

### PDF (`compartirPDFOrden(tipo, id)`)
- Vive en un `<script>` propio antes del último `</body>` que empieza con
  `// ══ PDF DE ÓRDENES DE TRABAJO`, **idéntico** en: `MTRENTAL_Gerencia`,
  `MONTASA_Supervision`, `MONTASA_Comercial`, `MONHACO_Gerencia`, `MONHACO_Supervision`.
  Si se cambia, cambiarlo en las 5 (copiar el bloque completo).
- `copiarImagenOrden(tipo,id)` quedó como despachador: revisión físico-técnica y
  atención de compras → `_copiarImagenOrdenIMG` (la imagen vieja); el resto → PDF.
  Los botones dicen «📄 Compartir PDF» (en logística el texto depende de si es
  `atencion_compras`).
- Tipos: preventivo, correctivo, evaluacion, cortinas (MONHACO), renta, entrega,
  retiro, apoyo_mantenimiento. `spec(tipo,o)` arma secciones; `construir(d)` pinta
  hojas carta de 816×1056 px fuera de pantalla y **pagina midiendo**; cada hoja pasa
  por html2canvas (scale 2, JPEG 0.9) a jsPDF (`letter`, pt). Entrega con
  `navigator.share` (archivo) y si no, descarga `CORRELATIVO.pdf`.
- **Diseño aprobado por Miguel** (no cambiarlo sin preguntar): logo MONTASA
  (`_LOGO_MONTASA_B64`, también en MONHACO), DM Sans + DM Mono, azul marino `#1f3864`,
  franja azul→verde del logo (`#0088c8`→`#68b894`); encabezado con tipo de orden y
  «N.º MH-0167»; banda de fecha/prioridad/lugar (**sin estado** desde 2026-09-29); secciones numeradas;
  firma **centrada al pie de la primera hoja**, solo con «RECIBIDO CONFORME»;
  anexo fotográfico 6 por hoja («Fotografía N de M»); pie «Montasa Handling Co. ·
  Documento generado por el sistema de gestión… · CORR · Página X de Y».
  Si no cabe, sigue en hojas «Continuación de la orden».
- **Solo se genera si la orden está completada** (`completada(tipo,o)`; decisión de Miguel
  2026-09-29): mantenimiento/evaluación/cortinas → `completado===true` o estado «Completado»;
  logística (cualquier otro tipo, incluso viejos como `entrega_retiro`) → `cerrado===true` y no
  «Cancelado». Si no, toast «Solo se puede compartir el PDF de órdenes completadas». Por eso
  el PDF ya no muestra estado. **El botón «📄 Compartir PDF» solo aparece en órdenes completadas**
  (mantenimiento/evaluación/cortinas ya lo tenían dentro de `if(est==='Completado')`; logística en
  `_renderDetalleLGGer` y evaluaciones de Comercial en `_detalleOrdenCom` se condicionaron el 2026-09-29).
  Atención de compras y revisión físico-técnica siguen como imagen, siempre visibles.
- Fechas: `aFecha` entiende `AAAA-MM-DD[THH:MM]` y `DD/MM/AAAA [HH:MM]` (las órdenes viejas
  guardan así `fechaInicio`; antes salían «—» en fecha y tiempos).
- Qué muestra: **Cliente** siempre (de `clienteOrden || clienteNombre || cliente`);
  **Km recorridos** calculado (retorno − salida; no se imprimen km de salida/retorno);
  condiciones de renta (inicio, días, finalización) **sin** «aviso de retiro»;
  **sin ubicación GPS**; en cortinas sí el campo escrito «Ubicación» (p. ej. andén).
  Repuestos (SR) de la orden en las apps MT. Horas de uso = horómetro retorno − salida.
- Modelo de muestra aprobado: `Modelo_Ordenes_PDF_MONTASA.pdf` (Miguel lo tiene).

### Cliente y firma (`// ══ CLIENTE DE LA ORDEN Y QUIÉN FIRMA`)
- Bloque común en Técnicos MT/MONHACO, Logística MT, Gerencias y Supervisiones:
  `_cliOrdenValor(o)`, `_firmaEsSupervisor(o)`, `_firmaTituloTxt(o)`,
  `_cliCampoHTML(o, onchangeJS)`, `_cliOrdenAlCerrar(o)`.
- Cada tarjeta de orden abierta muestra «🏢 Cliente» (input `cli-orden-<id>`) encima
  de la firma; cada función de cierre llama `_cliOrdenAlCerrar(o)` y agrega
  `'🏢 Cliente'` a `faltantes`. Formularios que crean y finalizan de una vez usan
  `prev-cliente-orden` / `corr-cliente-orden`; evaluación usa su `eval-cliente` y
  cortinas su `cort-cliente` como cliente de la orden.
- Título de la firma en tarjetas: «✍️ Firma del cliente» o «✍️ Firma del supervisor de
  mantenimiento»; overlay a pantalla completa: «✍️ Firma — Recibido conforme».
  El faltante de firma ahora dice «Firma (recibido conforme)». Órdenes canceladas
  en logística no piden cliente (igual que no piden otros campos).
- `MONHACO_Logistica.html` no se tocó: es la app de horómetros/recepciones, no cierra órdenes.

---

## 12. Historial de esta guía

- 2026-09-26 — Creación. Se pasa a trabajar con git (pull → cambios → check →
  commit → push). Incluye el arreglo de equipos de cliente vendidos
  (`_estaVendido` exime `esEquipoCliente`; la reparación espera
  `_equiposFBok`).
- 2026-09-26 — Inicio de renta en la solicitud (obligatorio con los días) y
  cancelación/reactivación del aviso de retiro con PIN y motivo.
- 2026-09-26 — Sin push posible, Miguel pide dejar git y recibir archivos; se
  entregan por Descargas (y se suben por el navegador). GPS obligatorio en rentas
  de equipo (Logística MT).
- 2026-09-28 — Rodrigo sube su propia guía (`153f537`) con las reglas de la casa y
  el pedido de `FLUJO.md` / `TRAMPAS.md`.
- 2026-09-29 — PDF formal de órdenes (reemplaza la imagen), campo Cliente
  obligatorio al cerrar, firma «Recibido conforme» con regla cliente/supervisor.
- 2026-09-29 — Repo clonado en la PC de Miguel; se trabaja con Claude Code local.
  A pedido de Rodrigo: esta guía reemplaza la suya (se integraron sus reglas),
  `git pull` al empezar cada sesión, y **push solo con permiso de Miguel**. Se
  crean `FLUJO.md` y `TRAMPAS.md`.
- 2026-09-29 — Actualización automática de las apps en los teléfonos (`version.json` +
  `dev/sellar_version.js`), porque el iPhone de Miguel seguía mostrando «Compartir imagen».
- 2026-09-29 — PDF sin estado y solo para órdenes completadas; fechas día/mes/año en el PDF.
- 2026-09-29 — Riesgo «escrituras por posición» (T2) arreglado con `_fbRefPorId` en 7 apps.
- 2026-09-29 — Riesgo «dos teléfonos se pisan» (T7) arreglado con el sincronizador `_Sync` en 8 apps:
  ya no se suben listas enteras; se sube solo lo cambiado de cada registro (`dev/prueba_sync.js`).
- 2026-09-29 — Botón «Compartir PDF» oculto en órdenes abiertas; mapa que no tapa el menú ☰;
  la app vieja `MONTASA_Tecnicos_MONHACO.html` se reemplaza por una redirección. Se mandan
  a la papelera 29 órdenes de prueba (copia en `respaldo_pruebas_20260929`).

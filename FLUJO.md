# FLUJO.md — Cómo funcionan las apps por dentro

Mapa del flujo de datos, sacado del código (no de lo que parece razonable).
**Líneas según el commit `9a4619e` (2026-09-29).** Las líneas se corren con cada
cambio: si no calzan, buscar por nombre de función. **Mantener vivo**: quien cambie
algo de este flujo, actualiza este archivo en el mismo commit.

Abreviaturas de archivo:

| Abrev. | Archivo | Raíz Firebase |
|---|---|---|
| **MTG** | `MTRENTAL_Gerencia.html` | `montasa` |
| **MTS** | `MONTASA_Supervision.html` | `montasa` |
| **MTT** | `MONTASA_Tecnicos.html` | `montasa` |
| **MTL** | `MONTASA_Logistica.html` | `montasa` |
| **MTC** | `MONTASA_Comercial.html` | `montasa` |
| **MHG** | `MONHACO_Gerencia.html` | `monhaco` |
| **MHS** | `MONHACO_Supervision.html` | `monhaco` |
| **MHT** | `MONHACO_Tecnicos.html` | `monhaco` |
| **MHL** | `MONHACO_Logistica.html` | `monhaco` |
| **MHL-P** | `MONHACO_Logistica_PRUEBA.html` | escribe en `monhaco_prueba` |
| **VIEJA** | `MONTASA_Tecnicos_MONHACO.html` | desde 2026-09-29 solo redirige a MHT; las líneas «VIEJA» citadas aquí son de la versión anterior (T1) |

Los bugs y comportamientos raros que aparecen aquí están explicados en **`TRAMPAS.md`** (T#).

---

## 1. De dónde sale el dato al abrir la app

**Antes que todo**, el bloque «ACTUALIZACIÓN AUTOMÁTICA DE LA APP» (líneas 5–56 de las 10
apps) revisa `version.json`; si esta copia de la app es vieja y el usuario no ha tocado
nada, recarga con `?v=<versión>`. Se repite cada vez que la app vuelve a primer plano
(`visibilitychange`, `pageshow`). Detalle en CLAUDE.md §4.

Hay tres fuentes: **listas escritas dentro del HTML** (`EQUIPOS_INICIALES`,
`VENDIDOS_INICIALES`), **caché del teléfono** (localStorage) y **Firebase**.

### Gerencias (MTG, MHG) — también MTS/MHS y MTC con variantes

| Paso | Qué pasa | MTG | MHG |
|---|---|---|---|
| 0 | `DB` arranca vacío. Claves de caché: `montasa_v24` + `montasa_log_cache` (MTG); `monhaco_ger_v1` + `monhaco_log_cache` (MHG) | 1617, 1627 | 1162 |
| 1 | IIFE de Firebase → `_iniciarConexionFirebase` → `FB_REF.once('value')` | 9536, 9558–9559 | 9077, 9099–9100 |
| 2 | Si llegó snapshot: `loadDB()` carga el caché del teléfono y mezcla specs de `EQUIPOS_INICIALES` (su `saveDB()` interno no sube nada: `_fbReady` aún es false) | 2526–2566 | 1893–1933 |
| 3 | **Equipos: gana Firebase**. Cada equipo = `{...spec, ...remoto}`; se agregan los `EQUIPOS_INICIALES` que falten y no estén vendidos; se quitan los vendidos (`_estaVendido`, por serie; exime `esEquipoCliente`) | 9577–9591 | 9110–9116 |
| 4 | `window._equiposFBok = true` (solo si llegaron equipos) | 9592 | 9121 |
| 5 | Resto de colecciones: **se reemplazan enteras** por las remotas si existen; si una no existe en remoto queda la del caché | 9595–9609 | 9124–9142 |
| 6 | Logística: `_mergeLogistica` fusiona **por `id`**: gana el remoto, salvo que un cierre/cancelación local nunca se revierte y se conservan los `vales` locales; órdenes solo locales se agregan | 9604 (def. 11441) | — |
| 7 | `window._fbReady = true` → desde aquí se puede escribir | 9613 | 9146 |
| — | Snapshot vacío: solo `loadDB()`, **sin** `_fbReady` (MHG no reintenta: ver T9) | 9657–9663 | 9160 |
| — | Si `once` falla: `loadDB()` y reintento cada 5 s | 9798–9810 | 9287 |

**Listeners en vivo** (siguen corriendo después de abrir):
- MTG `montasa/logistica .on` (9699): mezcla por id, conserva vales/facturas locales.
- MTG `montasa .on` (9744): reconstruye equipos igual que al abrir; reemplaza prev/corr/rev/eval enteros; `_protegerOrdenesRecientes` (def. 6167) re-inyecta órdenes creadas **en este teléfono** hace < 15 min que el snapshot no traiga.
- MHG: `monhaco/logistica` (9179) y raíz (9224).

**Nadie usa `_ts` para decidir conflictos**: `DB._ts` nunca se asigna en ninguna app,
así que las comparaciones `remote._ts >= local._ts` siempre dan "gana el remoto".

### Diferencias por app
- **MTS / MHS**: mismo esquema que Gerencia, pero sin `_toArr` y detectando vendidos solo
  por código/id (MTS 9033). Tienen un **segundo listener raíz** que asigna
  `DB.equipos = d.equipos` crudo, sin specs ni filtro de vendidos (MTS 9254/9266,
  MHS 10070/10083). MHS llama `_iniciarConexionFirebase` dos veces (9857, 10063) y usa
  la clave de caché **de MT** `montasa_log_cache` (T10).
- **MTT / MHT (Técnicos)**: primero `loadDB()` (MTT 1100 `montasa_tec_v1`; MHT 1021
  `monhaco_tec_v1`) y pinta; luego `once` (MTT 4363, MHT 3400). Toma equipos crudos.
  **Pone `_fbReady = true` siempre** (MTT 4384, MHT 3422), aunque se haya quedado con
  el caché (T8). El listener ignora "sus propios ecos" comparando `_sid` (MTT 4447,
  MHT 3451; T7).
- **MTL (Logística MT)**: `loadDB` (478, `montasa_log_v1`, con `_toArr`); `once` (2921).
  Pone `_fbReady = true` **incluso si `once` falla** (3003, 3006).
- **MTC (Comercial)**: igual que Gerencia para equipos/vendidos (1317–1342); el listener
  en vivo también enciende `_fbReady` (1309).
- **MHL (Logística MONHACO, horómetros)**: sin localStorage, sin listas embebidas, sin
  `_fbReady`. Solo listeners por nodo (2114–2133): `equipos`, `horometros_externos`,
  `horometros`, `cobros`, `preventivos`, `correctivos`.
- **MHL-P**: idéntica a MHL salvo título, encabezado y `HOR_PRUEBA=true` (177). **Lee**
  datos reales (`monhaco/equipos`, prev, corr) pero **escribe** solo en
  `monhaco_prueba/…` y `fotosOrden_monhaco_prueba/…`.

### Qué bloquea cada candado
- `_fbReady` bloquea `saveDB` (MTG 1981), `saveAllEquipos` (2511), `_syncEquipoCampoFB`
  (2054), logística (2090) y casi todas las escrituras puntuales.
- `_equiposFBok` bloquea incluir `equipos` en `saveDB` (MTG 1992), `saveAllEquipos`
  (2512) y `_repararEquiposCliente` (4500). **Solo MTG/MHG/MTC lo respetan en `saveDB`**;
  Técnicos no lo consultan.

---

## 2. Crear una orden

### Desde Solicitudes (Gerencia y Supervisión): `enviarSolicitudWA`
MTG 8854 (duplicado casi idéntico: `copiarMensajeWA` 9057) · MTS 5104 · MHG 8416 · MHS 6902.

1. Validaciones de logística (MTG 8944–8956): bloquea si el equipo está `MAL ESTADO`,
   si es renta y ya está `EN RENTA`, o si ya hay retiro/entrega abierto.
2. Correlativo: `nextCorrelativo('LG'|'MH')` (MTG 6193): toma el máximo entre prev +
   corr + logística + `ordenesCerradas` + solicitudes y `DB['lastCorrelativo_'+pref]`, +1.
   Técnicos: `nextCorrelativo()` (MTT 4108) con `DB.lastCorrelativo`, siempre `MH-`.
   Evaluaciones y revisiones en MHG usan `length+1` (8440, 8451) → pueden repetirse.
3. **Preventivo/correctivo** (MTG 9000 / 9023):
   - `push` a `DB.preventivos|correctivos` guardando `estadoEquipoAnterior`.
   - Se sube con `_guardarOrdenMantResiliente` (MTG 6122): lee
     `montasa/preventivos|correctivos`, upsert por id, sube `lastCorrelativo_MH` solo si
     es mayor, `update('montasa')`, verifica y reintenta hasta 4 veces.
   - Equipo → `_cambiarEstadoEquipoAuto(id,'EN MANTENIMIENTO')` (MTG 9002/9025; solo si
     `!esEquipoCliente` en MT; MHG no filtra).
4. **Logística** (MTG 9007–9021):
   - `push` a `DB.logistica`; sube con `_guardarLogisticaResiliente` (2079) →
     `_sincronizarLogisticaConReintento` (2089): lee remoto, upsert por id, `set` lista.
   - Renta/entrega → equipo (y 2.º equipo) a `EN RENTA` + link de ubicación.
   - **Renta con grúa** (desde 2026-09-29): casilla «🚚 Incluye grúa / vehículo» → `o.vehiculoRentaId`; la
     grúa también pasa a `EN RENTA`. En Logística (`_rentaConGrua`) se piden horómetro del equipo y km de
     la grúa; al cerrar los dos vuelven a `DISPONIBLE` y el km va a `kilometraje` de la grúa.
   - Retiro: **en MT no cambia nada al crear**; **en MONHACO pasa a `DISPONIBLE` al
     crear** (MHG 8564, MHS 6913) — T4.
   - Apoyo a mantenimiento / atención de compras: sin cambio de estado.
5. Equipo de cliente (MTG 8967–8990): se guarda la orden sin cambiar estado.

### Formularios directos de Gerencia/Supervisión: `guardarPreventivo` / `guardarCorrectivo`
MTG 7813 / 8146 · MHG 7428 / 7761 · MTS 4356 / 4570 · MHS 6041 / 6246.
- Llaman `equipoAInactivo` (MTG 6092): **solo si está DISPONIBLE lo pasa a `MAL ESTADO`**
  (no a EN MANTENIMIENTO). T3.
- No usan el guardado resiliente: solo `saveDB()`.

### Técnicos: `guardarPreventivo` / `guardarCorrectivo`
MTT 3087 / 3542 · MHT 2161 / 2592.
- Guardan `estadoEquipoAnterior`, usan el guardado resiliente y pasan el equipo a
  `EN MANTENIMIENTO` si no se finaliza en el acto (MTT 3137/3616, MHT 2203/2658).
- `_cambiarEstadoEquipoAuto` de Técnicos (MTT 1979) **no tiene protección** y escribe
  por índice `montasa/equipos/{idx}/estado` (1975).

### Evaluaciones, revisiones, cortinas (MONHACO)
- No tienen `equipoId`: no tocan el equipo. Cortinas se guardan **por id** en
  `monhaco/cortinasReg/<id>` con `_syncCortina` (MHG 1252).

### Logística y Comercial
- MTL y MTC **no crean** órdenes.

---

## 3. Cerrar la orden (y a qué estado vuelve el equipo)

> **Desde 2026-09-30 el mantenimiento sigue una regla única** (`_eqAbrirMant` / `_eqCerrarMant`, CLAUDE.md §5):
> la pregunta «¿Cómo quedó el equipo?» decide DISPONIBLE / EN RENTA / MAL ESTADO en las 6 apps. Las filas de
> mantenimiento de la tabla de abajo describen cómo era antes; logística no cambió.

| Quién cierra | Función | Qué le pasa al equipo |
|---|---|---|
| Gerencia/Supervisión MT y MONHACO | `completarPreventivo` (MTG 7896, MHG 7502), `cerrarCorrectivo` (MTG 8236, MHG ~7870) → `equipoADisponible` (MTG 6102) | **Solo pasa `MAL ESTADO` → `DISPONIBLE`.** Si el equipo estaba `EN MANTENIMIENTO` (orden nacida de solicitud) **se queda así** (T3) |
| Técnicos MT y MONHACO | `completarPreventivo` (MTT 3181, MHT 2247), `cerrarCorrectivo` (MTT 3645) | Si está `EN MANTENIMIENTO`: vuelve a `EN RENTA` si `estadoEquipoAnterior` era EN RENTA; **si no, `DISPONIBLE`** (MTT 3246/3688, MHT 2310/2729) — aunque antes estuviera MAL ESTADO (T3). Horómetro a la ficha por índice (MHT 2300). Además `update` por índice local de `preventivos/{idx}` / `correctivos/{idx}` (MTT 3254/3711) |
| Logística MT | `cerrarOrdenLog` (MTL 2251) → `_cambiarEstadoEquipo` (MTL 4073) | Renta/retiro no cancelados → `DISPONIBLE`, salvo si está EN MANTENIMIENTO/MAL ESTADO. Entrega: sin cambio (queda EN RENTA). Escribe `equipos/{idx}/estado` con índice **buscado en el servidor** por id. Horómetro final solo en el teléfono (MTL 2327–2339) |
| Logística MONHACO | — | Las apps MONHACO no cierran logística; Gerencia solo reabre (MHG 4958) |
| Cancelar logística | `cancelarOrdenLog` (MTL 2222) | Desde 2026-09-29: renta/entrega → equipo, 2.º equipo y grúa a `DISPONIBLE` (salvo otra orden abierta o MANT/MAL ESTADO). Antes no tocaba el equipo (T5) |
| Eliminar orden (Gerencia) | `_revertirEstadoEquipoAlEliminar` (MTG 2155, MHG 1513) | Vuelve a `eq.estadoAntesDeMant \|\| 'DISPONIBLE'`; `estadoAntesDeMant` **nunca se asigna** → siempre DISPONIBLE (T6) |

Protección en `_cambiarEstadoEquipoAuto` de MTG (2122–2128): nunca pasa a DISPONIBLE
un equipo EN MANTENIMIENTO / MAL ESTADO e ignora `__cliente__`. **MHG (1484) y Técnicos
(MTT 1979) no tienen esa protección.**

`_cambiarEstadoEquipo` en MTG 11840 / MHG 11149 / MHS 9592 escribe en `<raíz>/estados/<id>`,
nodo que nadie lee y función que nadie llama: **código muerto**.

---

## 4. Estados de equipo

| Estado | Quién lo asigna |
|---|---|
| `DISPONIBLE` | valor por defecto (MTG 2519); cierre en Técnicos (MTT 3246/3688); `equipoADisponible` (6106); Logística al cerrar renta/retiro (MTL 2317); retiro al crear en MONHACO (MHG 8564); eliminar orden (MTG 2177); manual |
| `EN RENTA` | solicitud de renta/entrega (MTG 9013/9017, MTS 5252/5256, MHG 8563); cierre de mant. en Técnicos si antes estaba en renta |
| `EN MANTENIMIENTO` | solicitud de preventivo/correctivo (MTG 9002/9025, MTS 5243/5263); Técnicos al crear (MTT 3137/3616) |
| `MAL ESTADO` | `equipoAInactivo` (MTG 6096, MTS 3189) al crear desde formulario de Gerencia; manual |
| `DEMO/PRESTAMO` | solo manual (select MTG 4191, `guardarDesdeModal` MTG 4408 / MTC 1031). No existe para vehículos. Excluido de toma de horómetros (MTL 587) |
| `VENDIDO`, `DADO DE BAJA` | solo se **leen** (mapa, MTG 3331 / MHG 2005); nunca se asignan (los vendidos salen de la flota a `vendidos`) |

Estados de **orden** (no de equipo): Pendiente, En proceso, En espera de repuestos,
Completado, Cancelado.

> No renombrar estados ni campos sin preguntar: el tablero de flota y el mundo
> isométrico leen esta misma base.

---

## 5. Cada escritura a Firebase

> **Desde 2026-09-29 ninguna app escribe listas enteras** de logistica, preventivos, correctivos,
> revisiones, evaluaciones, solicitudes, ordenesCerradas, equipos ni vendidos: `saveDB()` y las funciones
> de abajo que decían «lista» ahora llaman `_Sync.guardar()` (sincronizador, CLAUDE.md §4), que escribe
> registro por registro con transacción: `<raíz>/<col>/<clave>` (solo datos cambiados), alta en
> `<raíz>/<col>/<siguiente>`, borrado como transacción de la lista + lápida en `<raíz>/_borradas/<id>`.
> `saveDB` sigue escribiendo `notifCompletadas`, `lastCorrelativo_MH`, `_ts`, `_sid`. Los contadores
> `lastCorrelativo_*` se suben con transacción que nunca los baja. Las tablas de abajo describen el
> estado anterior (líneas del commit `9a4619e`).

"Lista" = reemplaza la colección entera. "Índice local" = usa la posición del arreglo
en el teléfono. "Índice servidor" = busca la posición por id en el servidor justo antes.

> **Desde 2026-09-29 todas las escrituras marcadas «índice local» pasan por `_fbRefPorId`**
> (verifica el id en el servidor antes de escribir; TRAMPAS T2). Las tablas de abajo siguen
> diciendo «índice local» para ubicar dónde están; las líneas se corrieron ~70 hacia abajo.

### `saveDB()` — qué sube cada app
| App | Línea | Método | Qué sube |
|---|---|---|---|
| MTG | 1978 | `update('montasa')` | notifCompletadas, `lastCorrelativo_MH` (local, puede ser 0), `_ts`, `_sid`; `equipos` si `_equiposFBok`; prev, corr, rev, eval (sin fotos), solicitudes, vendidos, ordenesCerradas **si no están vacías** — todas como **lista** |
| MHG | 1387/1410 | `update('monhaco')` | igual que MTG, con `_sinFotosPersist` |
| MTS / MHS | 1030 / 986 | `update` | **todas las listas siempre, aunque estén vacías** (`\|\|[]`); MHS sin equipos |
| MTT / MHT / VIEJA | 1185 / 1106 / 851 | `update` | prev, corr, rev, eval, ordenesCerradas (listas). Sin `_fbReady` reintenta cada 500 ms |
| MTL | 539 → `_writeToFirebase` 544 | `once` + `update` | lee `montasa/logistica`, mezcla por id **ganando lo local**, respeta `_logBorradasIds`; sube logística + `lastCorrelativo_LG` |
| MTC | 412 | `update` | vendidos (o `VENDIDOS_INICIALES` si está vacío) + equipos si `_equiposFBok` |

### MTG (Gerencia MT) — resto
| Línea | Ruta | Método | Alcance |
|---|---|---|---|
| 2516 | `montasa/equipos` (`saveAllEquipos`) | set | lista completa, todos los campos |
| 2109 / 2112 | `montasa/logistica` / `lastCorrelativo_LG` | set | lista leída del servidor + upsert / valor |
| 6140 | `montasa` {preventivos\|correctivos, lastCorrelativo_MH} | update | lista leída + upsert (resiliente) |
| 1958 | `fotosOrden_montasa/{id}` | set | registro |
| 2676, 2773 / 2685 | `montasa/agenda/{id}` | set / remove | registro |
| 3052, 3072 | `montasa/repuestos/{id}` | set | registro |
| 3770–3966 | `montasa/horometros/{mes}/…` | set / remove | registro |
| 3863 | `montasa/equipos` {`idx/horometro`} | update | campo, índice servidor |
| 7684, 7730, 7789 | `montasa/equipos/{idx}/ubicacion(Link)` | set | campo, índice servidor |
| 4388 | `montasa` {logistica} | update | lista |
| 5071 | `montasa/logistica/{idx}` (reabrir) | update | **índice local** |
| 5508 | `montasa/vendidos` | set | lista |
| 5824 | `logistica/{idx}/firma` | set | **índice local** |
| 7940 / 8280 / 11228 / 11341 / 11659 / 11742 | `…/{idx}/vales` | set | **índice local** |
| 7968 / 7988 / 8015 | `montasa/papelera` / `papelera/{id}` | set / set / remove | lista / registro |
| 8012 / 8079 | `_borradas/{id}` | remove / update | registro |
| 8024 | `montasa` {logistica, _ts} | update | lista local |
| 8116 | `montasa` {logistica, **equipos**} | update | listas, **sin revisar `_equiposFBok`** |
| 11593 | `montasa` {logistica} | update | lista del servidor menos la borrada |
| 8881 / 9082 / 11530; 8900 / 9101 / 11546 | `montasa/revisiones`, `montasa/evaluaciones` | set | lista |
| 11848 | `montasa/estados/{id}` | set | código muerto |

### MTT (Técnicos MT)
- Índice local: `equipos/{idx}/{campo}` (1975, estado y horómetro pasan por aquí);
  `equipos/{idx}` update y `equipos/{newIdx}` set (4626, 4634); `equipos/{idx}/kilometraje`
  (2395, 5186); `preventivos/{idx}` (3254), `correctivos/{idx}` (3711); vales (251, 3224, 3702).
- Índice servidor: 2958, 3004, 3063.
- Lista: `equipos` set (1225, 5216, 5232, **con la copia del teléfono**); rev/eval set
  (2624, 2625, 4735, 4951); resiliente (4055).
- Registro: agenda (1344, 1353), repuestos (1644, 1664), fotos (1165).

### MTS (Supervisión MT)
- `saveEquipo` (1472): update por índice local, campos fijos.
- `saveAllEquipos` (1484): set de lista **con campos fijos** → pierde `esEquipoCliente`,
  `ubicacionLink`, `esVehiculo`, specs (T11).
- Índice local: `_syncEquipoCampoFB` (1053/1057), 1476, 1781, 1788, `logistica/{idx}` (2251),
  firma (3002), 4427, 4642, 7147, 7260, 7923.
- Índice servidor: 4159, 4205, 4264, 8043. Logística resiliente (1110/1113). Update
  logística+equipos (4470).

### MTL (Logística MT)
- `cerrarOrdenLog`: `update({logistica: DB.logistica})` con la lista local **sin
  fusionar** (2362, reintento 2372).
- Índice local: vales (1708, 1792, 2352), firma (2846), `logistica/{idx}` (4062),
  `equipos/{idx}/kilometraje` (2192, 2202).
- Índice servidor: estado (4095), ubicación (1347, 1416).
- Horómetros (839–1035). Borrado con lista del servidor (1938).

### MTC (Comercial)
- Fotos (392) y `saveDB` (arriba).

### MHG (Gerencia MONHACO) — MHS igual salvo lo indicado
| Ruta | Método | Alcance | Línea |
|---|---|---|---|
| `monhaco/equipos/{idx}/{campo}` | set | **índice local** | 1419 (MHS 1013) |
| `monhaco/equipos/{idx}` (`saveEquipo`) | update | **índice local** | 1875 |
| `monhaco/equipos` (`saveAllEquipos`) | set | **lista recortada a 13 campos** (T11) | 1886 (llamada en 2389, 2505, 5405, 7366) |
| `monhaco/equipos/{idx}` y `{newIdx}` (equipo de cliente) | update / set | índice local | 2530, 2539 |
| `monhaco/logistica` | once + set | lista (lee, mezcla, reescribe) | 1471 |
| `monhaco/logistica/{idx}`, `/vales`, `/firma` | update / set | índice local | 4964, 10538, 10651, 5720 |
| `monhaco` {logistica} | update | lista | 7717, 10902 |
| `monhaco` {prev\|corr} (resiliente) | once + update | lista con verificación | 6033 |
| `preventivos/{idx}/vales`, `correctivos/{idx}/vales` | set | índice local | 7541, 7883, 10968, 11051 |
| `monhaco/revisiones`, `evaluaciones` | set | lista | 8443, 8454, 8633, 8644, 10838, 10852 |
| `monhaco` {solicitudes} | update | lista | 8985 |
| `monhaco/cortinasReg/{id}` | update | registro | 1252, 1262 |
| `monhaco/_cortDbg` | set | diagnóstico | 1254 |
| `monhaco/_borradas/{id}` | update | registro | 7680 |
| `monhaco/papelera`, `papelera/{id}` | set / remove | lista / registro | 7569, 7589 |
| `lastCorrelativo_LG`, `lastCorrelativo_MH` | set / update | contador | 1474, 6032 |
| `monhaco/horometros/…`, `horometros_externos/…` | set / remove | registro | 2911–3252 |
| `monhaco/cobros/{id}`, `fotosOrden_monhaco/{id}` | set / remove | registro | 3709, 3731, 4055 |
| `monhaco/estados/{id}` | set | código muerto | 11157 |

MHS además, índice local: 1407, 1722, 1729, 4104, 4855, 6108, 6315, 8639, 8752, 9494.

### MHT (Técnicos MONHACO)
- `monhaco/equipos` set **lista completa sin `_equiposFBok`** (1147).
- Índice local: `equipos/{idx}/{campo}` (1247), kilometraje (1639), `equipos/{idx}` y
  `{newIdx}` (3630, 3638), `preventivos/{idx}` (2318), `correctivos/{idx}` (2752),
  vales (252, 2288, 2743).
- Lista: revisiones/evaluaciones (1868, 1869, 3736, 3965); resiliente (3096).
- Registro: cortinas (1011), fotos (1083).

### MHL (Logística MONHACO — horómetros y cobros)
- `horometros/{mes}/{eq}` set/remove (493, 532); `_cierres/{ck}` (567); `_cierre` (573);
  `_creada` (656); `_firmas/{ck}/{rol}` (824, 834); `horometros_externos/{id}` (727, 747);
  `equipos` update multi-ruta `{idx}/horometro` con **índice servidor** (559);
  `cobros/{id}` (1291, 1316, 1637); `fotosOrden_monhaco/{id}` (1313, 1638).

---

## 6. Horómetros

### MONHACO (captura en MHL; Gerencia/Supervisión solo consultan: `HOR_CAPTURA` false en MHG 2597, MHS 1785)
Nodo `monhaco/horometros/<YYYY-MM>/`:
- `<eqId>: {lectura, ts, codigo}`
- `_creada: {ts}`
- `_firmas/<CLIENTE_KEY>/{sup, ger}` (PNG dataURL; `CLIENTE_KEY` de `_horCliKey`, MHL 245)
- `_cierres/<CLIENTE_KEY>: {ts}`
- `_cierre: {ts}` global, cuando ya no queda cliente pendiente (569–575)

`monhaco/horometros_externos/ext_<id>: {codigo, cliente, capacidad, ubicacion, anterior, ts}` (718–727).

Finalizar (`finalizarTomaCliente` 576 / `finalizarTomaHorometros` 600):
1. Exige firmas SUPERVISOR y GERENTE (582–584). Ambas se hacen en la misma app, sin
   identificar quién firma.
2. **Sella primero** (`_horSellarCliente`, `_horSellarGlobalSiCompleto`, 592–593).
3. Luego `_horFichasActualizar` (543): `once('monhaco/equipos')`, índice del servidor por
   id (555–556), `update({'<idx>/horometro': …})` (559). **Si esto falla, la toma queda
   sellada sin actualizar fichas y no hay reintento** (T12). Externos no tienen ficha.
- Lectura "anterior": último mes con lectura; si no, `horometro` de la ficha (209–219).

### MT Rental (captura en MTL, consulta en MTG)
`finalizarTomaMtHorometros` (MTG 3868): una hoja por mes, firmas `ope` y `ger`, sin
cierres por cliente; sella y luego actualiza fichas con índice del servidor (3849–3866);
después `saveDB`. Nodo `montasa/horometros`.

---

## 7. Diferencias MT vs MONHACO (resumen)

- `_cambiarEstadoEquipoAuto`: MT ignora `__cliente__` y protege EN MANTENIMIENTO/MAL
  ESTADO; MONHACO no.
- Retiro: MT → DISPONIBLE **al cerrar**; MONHACO → DISPONIBLE **al crear**.
- Guardado de equipos: MT reescribe la lista completa con todos los campos
  (`_syncEquipoCampoFB`/`saveEquipo`, MTG 2050–2058, 2503–2524); MONHACO sigue por índice
  y `saveAllEquipos` recorta a 13 campos.
- MT tiene nodos extra: `agenda`, `repuestos`, `vendidos`. MTG también lee
  `monhaco/equipos` y `monhaco/vendidos` para el Excel (1830–1831).
- Iguales en ambos: `equipoAInactivo` / `equipoADisponible`.

---

## 8. Ubicación de los equipos en el mapa (líneas de MTG al 2026-09-29, commit 3d4b553)

- El mapa de la flota (`renderMapaFlota`, MTG ~3540; igual en MHG) pone un pin **solo si
  `eq.ubicacionLink` trae coordenadas**. `_gpsCoordsDeLink` (MTG 3346) acepta `?q=lat,lng`
  (y `query/ll/daddr/destination/center`), `@lat,lng` o `lat,lng` suelto. **Los links cortos
  (`share.google/…`, `maps.app.goo.gl/…`) no traen coordenadas** y el equipo cae en la lista
  «sin ubicación» (no se pueden resolver desde el navegador: CORS).
- Quién escribe `ubicacionLink` (+ `ubicacionTs`): `_setUbLinkEquipo` (MTG 2190) al crear
  renta/entrega con link (9068/9072), botón 📍 de las órdenes, cierre de renta o de retiro fuera del
  plantel → taller de Las Palmas (`_GPS_TALLER_SPS`, con coordenadas; en la renta también 2.º equipo y grúa). Lo borra `_gpsFichaBorrar` (MTG 7772, «🗑 Quitar ubicación»).
- **Renta indefinida (desde 2026-09-30):** en la solicitud de renta/entrega se puede marcar «♾️ Renta indefinida» en
  vez de días: la orden queda con `rentaIndefinida:true`, sin fecha de fin y sin aviso de vencimiento.
- **Desde 2026-09-30:** los campos de link solo aceptan coordenadas (vigilante `_ubLinkRevisar`), y EN RENTA a
  mano en la ficha pide cliente y motivo (`_rentaManualPedir` → `eq.rentaManual`).
- **La ficha permite cambiar estado y cliente a mano** (`guardarDesdeModal`, MTG 4456; MTC 1031)
  sin orden de logística: no queda ubicación, fecha ni días de renta. Al 2026-09-29, 20 de los 26
  equipos MT en EN RENTA no tenían ninguna orden de renta/entrega (TRAMPAS T20).

## 9. Cómo revisar la integridad de los datos

La base se puede leer por REST: `GET <base>/<ruta>.json`, y
`<base>/.json?shallow=true` lista los nodos raíz. **Solo lectura**; cualquier escritura, con
permiso de Miguel y respaldo previo.

Nodos raíz al 2026-09-29: `montasa`, `monhaco`, `fotosOrden_montasa`, `fotosOrden_monhaco`,
`monhaco_prueba`, respaldos `respaldo_montasa_20260824`, `respaldo_monhaco_20260912`,
`respaldo_pruebas_20260929` (lo que se mandó a la papelera hoy), y `bitacora` (**otra app**:
caja chica; no la tocan estas apps ni se debe tocar).

Método usado el 2026-09-29 (repetible):
1. Bajar `montasa` y el respaldo más reciente; normalizar listas (Firebase devuelve objetos si
   hay huecos).
2. Equipos: comparar por `id`. Los que faltan deben estar en `vendidos` (por id o serie); los
   nuevos suelen ser equipos de cliente. Buscar campos que tenían valor y hoy están vacíos,
   códigos y series repetidos.
3. Órdenes (prev, corr, eval, logística, cerradas, solicitudes): comparar por `id|correlativo`;
   cruzar lo que falte contra `papelera`, `_borradas` y `respaldo_pruebas_20260929`.
4. Coherencia del estado: EN MANTENIMIENTO sin orden abierta, EN RENTA sin orden de
   renta/entrega, EN RENTA sin coordenadas, DISPONIBLE con orden abierta.

Resultado del 2026-09-29 (contra el 24-ago): sin datos corrompidos. 18 equipos faltantes = todos
vendidos; órdenes faltantes = las 29 de prueba; solo se vaciaron `E-46.ubicacionLink` (quitado
desde la app; era un link corto) y `MTV-02.cliente`. Incongruencias: 4 equipos EN MANTENIMIENTO sin
orden (E-15, E-45, MT-132, MT-67), 20 EN RENTA sin orden de logística, serie repetida ST-2/ST-3.
Informe para Miguel: `DocumentsRevision_integridad_datos_MONTASA_2026-09-29.pdf` (fuera del repo).

## 10. Archivos tocados por cambio (registro)

Anotar aquí cada cambio que afecte este flujo y en qué apps se aplicó.

- 2026-09-29 — Sincronizador `_Sync` en MTG, MTS, MTT, MTL, MTC, MHG, MHS, MHT (bloque nuevo después de
  «GUARDAR POR ID»; en MTC después de «ACTUALIZACIÓN AUTOMÁTICA»). Reemplazadas: `saveDB` (sin listas),
  `_guardarOrdenMantResiliente`, `_sincronizarLogisticaConReintento`, `saveAllEquipos`, `_writeToFirebase`
  (MTL) y ~50 escrituras `ref('<raíz>/<col>').set(...)` / `update({<col>: ...})`. Simulador: `dev/prueba_sync.js`.

- 2026-09-29 — Actualización automática: bloque nuevo al inicio de MTG, MTS, MTT, MTL, MTC,
  MHG, MHS, MHT, MHL, MHL-P (**corre ~52 líneas hacia abajo** todo lo citado en este archivo,
  que es de `9a4619e`). Nuevos: `version.json`, `dev/sellar_version.js`.

- 2026-09-29 (`9a4619e`) — PDF de órdenes (MTG, MTS, MTC, MHG, MHS) y campo Cliente
  obligatorio al cerrar (MTT, MHT, MTL, MTG, MTS, MHG, MHS). No cambian el flujo de
  datos: agregan el campo `clienteOrden` a las órdenes.

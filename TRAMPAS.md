# TRAMPAS.md — Lo que se comporta distinto a como se ve

Regla: **si te costó descubrirlo, escríbelo aquí.** No arreglarlo callado ni dejarlo
solo en el chat. Cuando se arregle una trampa, no se borra: se marca **✅ Arreglado
(fecha, commit)** y se deja una línea de qué se hizo.

Líneas según el commit `9a4619e` (2026-09-29). Abreviaturas de archivo en `FLUJO.md`.
Ordenadas por gravedad (lo que puede perder datos o rentar una máquina rota, primero).
**Ninguna está arreglada todavía**: cuáles se arreglan lo decide Miguel.

---

## T1. La app vieja de técnicos MONHACO borra y recrea los equipos de cliente cada vez que se abre

**✅ Arreglado (2026-09-29):** el archivo ahora solo redirige a `MONHACO_Tecnicos.html`. Lo de
abajo describe la versión vieja (sigue en el historial de git). Ojo: un teléfono que tenga
guardada la copia vieja en caché podría abrirla hasta que la recargue (esa versión no tiene
actualización automática).

### Qué pasa
`MONTASA_Tecnicos_MONHACO.html` (versión de jul-2026) sigue en el repo y publicada. Al
abrirla, `_migrarEquiposCliente` quita **todos** los equipos de cliente de MONHACO, los
vuelve a crear con ids nuevos solo desde órdenes con los 4 campos completos, y reescribe
`monhaco/equipos` entero.
### Por qué pasa
VIEJA 892–905 (`DB.equipos.filter(e=>!e.esEquipoCliente)` … `ref('monhaco/equipos').set(DB.equipos)`),
llamada al arrancar (2875). Además usa `LS_KEY='monhaco_tec_v1'` (823), la misma que
`MONHACO_Tecnicos.html`, y pisa su caché en el mismo teléfono.
### Cómo se nota desde afuera
Equipos de cliente que desaparecen, órdenes que quedan apuntando a un equipo que "no
existe", equipos de cliente duplicados con otro id.
### Qué hacer
No está enlazada desde ninguna app, `index.html` ni manifest, pero cualquiera que tenga
el link guardado o la PWA vieja instalada la puede abrir. Preguntar a Miguel si se
retira del repo (o se reemplaza por una página que redirija a `MONHACO_Tecnicos.html`).

---

## T2. Escrituras que apuntan a un registro por su posición en la lista

**✅ Arreglado (2026-09-29):** las 60 escrituras con posición del teléfono ahora pasan por
`_fbRefPorId(ruta)` (bloque «GUARDAR POR ID, NO POR POSICIÓN», idéntico en MTG, MTS, MTT, MTL,
MHG, MHS, MHT): confirma en el servidor que en esa posición está el mismo `id`; si no, lo busca;
si ya no existe, no guarda y avisa; un equipo nuevo se agrega al final con transacción. Las 13 que
ya buscaban la posición en el servidor siguen con `window._fbDB.ref`. **Regla nueva: nunca escribir
`window._fbDB.ref('…/'+idx)` con una posición sacada de `DB.*`; usar `_fbRefPorId`.** Queda una
ventana de milisegundos entre la verificación y la escritura. Lo de abajo describe cómo era.

### Qué pasa
Muchas escrituras usan la **posición** del registro en el arreglo del teléfono
(`…/equipos/3/estado`, `…/preventivos/12`, `…/logistica/40/vales`). Si en el servidor
esa posición ya es otro registro, **se escribe encima del registro equivocado**.
### Por qué pasa
La posición del teléfono deja de coincidir con la del servidor cuando: se borra una
orden (se compacta la lista del servidor: MTG 8089, 8096, 11584; MTL 1930); al cargar se
agregan `EQUIPOS_INICIALES` al final y se quitan vendidos (MTG 9757–9769, MHG 9234–9243);
`_toArr`/`filter(Boolean)` juntan huecos; `_mergeLogistica` agrega órdenes locales al final.
Hay llave propia en todos los casos (`id` en órdenes y equipos), pero no se usa.
Lista completa de escrituras por índice local en `FLUJO.md` §5. Las más peligrosas:
- MTT 1975 / MHT 1247 `equipos/{idx}/{campo}` — por aquí pasan **estado y horómetro**.
- MTT 3254 / 3711, MHT 2318 / 2752 — `preventivos|correctivos/{idx}` al cerrar: puede
  marcar **Completado otra orden**.
- MTT 4634 / MHT 3638 / MHG 2539 — `equipos/{newIdx}` con `set`: puede **borrar un equipo existente**.
- Vales y firmas de logística por índice (MTG 5824, 7940, 8280; MTL 1708, 1792, 2352, 2846).
Si la posición ya no existe, se crea un "registro fantasma" sin id (p. ej. solo `{vales:[…]}`).
### Cómo se nota desde afuera
Un equipo cambia de estado "solo"; una orden aparece cerrada sin que nadie la cerrara;
vales o firmas en la orden equivocada; registros vacíos raros en la base.
### Qué hacer
Arreglo recomendado: antes de escribir, leer la lista del servidor y buscar la posición
**por id** (como ya hacen MTG 7684, MTL 4095, MHL 559), o escribir el registro completo
por id. Aplicarlo en todas las apps a la vez.

---

## T3. El estado del equipo al cerrar depende de quién cierra la orden

**✅ Arreglado (2026-09-30):** regla única en las 6 apps (CLAUDE.md §5): al abrir → EN MANTENIMIENTO; al cerrar
se pregunta «¿Cómo quedó el equipo?» (operativo / sigue con falla); «En espera de repuestos» no se cierra; con
otra orden abierta sigue EN MANTENIMIENTO. Los 4 equipos EN MANTENIMIENTO sin orden del 2026-09-29 (E-15, E-45,
MT-132, MT-67) no eran por este error: se habían cambiado a mano en la ficha. Lo de abajo describe cómo era.

### Qué pasa
- **Cerrada desde Técnicos**: si el equipo está EN MANTENIMIENTO sale `DISPONIBLE`
  (o `EN RENTA` si antes estaba en renta), **aunque antes de la orden estuviera en MAL
  ESTADO o DEMO/PRESTAMO**. No revisa si hay otra orden abierta del mismo equipo, ni si
  el correctivo quedó "En espera de repuestos".
- **Cerrada desde Gerencia o Supervisión**: `equipoADisponible` solo cambia `MAL ESTADO`
  → `DISPONIBLE`. Si la orden nació de una solicitud (equipo `EN MANTENIMIENTO`), **el
  equipo queda EN MANTENIMIENTO para siempre**. Y una máquina que ya estaba en MAL ESTADO
  antes de abrir la orden sale DISPONIBLE al cerrarla.
- **Abierta desde el formulario de Gerencia**: `equipoAInactivo` pasa DISPONIBLE →
  `MAL ESTADO` (no EN MANTENIMIENTO), a diferencia de la solicitud y de Técnicos.
### Por qué pasa
- Técnicos: `const _destino = _anterior==='EN RENTA' ? 'EN RENTA' : 'DISPONIBLE';`
  (MTT 3246, 3688; MHT 2310, 2729).
- Gerencia/Supervisión: `equipoADisponible` / `equipoAInactivo` (MTG 6092–6110, igual en
  MHG 5985–5995, MTS 3189–3195). Llamadas al cerrar: MTG 7950, 8286; MHG 7551, 7889.
### Cómo se nota desde afuera
Máquina rota que aparece DISPONIBLE y se renta (lo paga un cliente); o máquina reparada
que sigue EN MANTENIMIENTO y nadie la ofrece.
### Qué hacer
Definir con Miguel una regla única ("al cerrar, vuelve a `estadoEquipoAnterior`, salvo
que el técnico marque que quedó mal") y aplicarla igual en las 6 apps que cierran
mantenimiento. Mientras tanto, revisar a mano el estado del equipo después de cerrar.

---

## T4. En MONHACO el retiro marca el equipo DISPONIBLE al crear la orden, no al cerrarla

### Qué pasa
Al generar una orden de retiro, el equipo pasa a DISPONIBLE aunque siga donde el cliente.
En MT pasa a DISPONIBLE recién cuando Logística cierra el retiro.
### Por qué pasa
MHG 8564 / 8726 y MHS 6913 / 7088 (`else if(tipo==='retiro'){ _cambiarEstadoEquipoAuto(equipoId,'DISPONIBLE') …}`).
Además `_cambiarEstadoEquipoAuto` de MHG (1484) no protege EN MANTENIMIENTO/MAL ESTADO
ni ignora `__cliente__` como el de MT (MTG 2122–2128).
### Cómo se nota desde afuera
Una máquina en camino (o todavía en planta del cliente) aparece disponible para otra renta.
### Qué hacer
Preguntar a Miguel si en MONHACO debe comportarse como MT.

---

## T5. Cancelar una renta o entrega deja el equipo EN RENTA

**✅ Arreglado (2026-09-29):** `cancelarOrdenLog` (Logística MT) regresa a DISPONIBLE el equipo, el 2.º equipo
y la grúa (`vehiculoRentaId`), salvo que otra orden abierta los use o estén EN MANTENIMIENTO / MAL ESTADO.
Lo de abajo describe cómo era.

### Qué pasa
`cancelarOrdenLog` marca la orden Cancelado pero no toca el equipo, que quedó EN RENTA
al crear la orden.
### Por qué pasa
MTL 2222–2234: solo cambia `o.estado`, `o.cerrado`, `o.fechaCancelado` y guarda.
### Cómo se nota desde afuera
Equipo EN RENTA sin orden abierta; no se puede volver a rentar (la solicitud bloquea si ya
está EN RENTA, MTG 8944–8956) hasta que alguien lo cambie a mano.
### Qué hacer
Al cancelar renta/entrega, volver al estado anterior del equipo (guardar
`estadoEquipoAnterior` también en logística). Confirmar con Miguel.

---

## T6. Eliminar una orden siempre deja el equipo DISPONIBLE

**✅ Arreglado (2026-09-30):** `_revertirEstadoEquipoAlEliminar` (MTG, MHG) solo actúa si la orden borrada está
**abierta**. Mantenimiento → vuelve a `orden.estadoEquipoAnterior` (o DISPONIBLE), también si el correctivo estaba
«En espera de repuestos» o «En pausa». Renta/entrega → equipo, 2.º equipo y grúa de EN RENTA a DISPONIBLE. No toca
equipos que otra orden abierta usa, ni órdenes cerradas (borrar una entrega cerrada no regresa el equipo).
Lo de abajo describe cómo era.

### Qué pasa
Al eliminar una orden abierta desde Gerencia, el equipo "vuelve a su estado anterior",
pero en la práctica **siempre** vuelve a DISPONIBLE.
### Por qué pasa
`_revertirEstadoEquipoAlEliminar` (MTG 2155–2179, MHG 1513–1537) usa
`eq.estadoAntesDeMant || 'DISPONIBLE'`, y `estadoAntesDeMant` **no se asigna en ningún
archivo**. El dato bueno existe en la orden (`o.estadoEquipoAnterior`) pero no se usa.
Un correctivo "En espera de repuestos" no cumple la condición y deja el equipo EN
MANTENIMIENTO.
### Cómo se nota desde afuera
Equipo que estaba EN RENTA o MAL ESTADO aparece DISPONIBLE tras borrar una orden.
### Qué hacer
Usar `o.estadoEquipoAnterior` en vez de `eq.estadoAntesDeMant`. Arreglo chico; aplicarlo en MTG y MHG.

---

## T7. Guardar sube listas completas: el último que guarda manda

**✅ Arreglado (2026-09-29):** sincronizador `_Sync` (bloque «GUARDADO POR REGISTRO», idéntico en 8 apps).
Ninguna app sube ya listas enteras de logística, preventivos, correctivos, revisiones, evaluaciones,
solicitudes, cerradas, equipos ni vendidos: se sube solo lo que cada teléfono cambió de cada registro.
Probado con `dev/prueba_sync.js` (14 casos: dos teléfonos, sin señal, borrados, freno, lápidas, vendidos) y
con las 8 apps reales sobre copia de los datos del 2026-09-29. Detalle en CLAUDE.md §4. Lo de abajo
describe cómo era. Queda: si dos cambian el MISMO dato, gana el último (decisión de Miguel); `_ts`/`_sid` y
contadores siguen en `saveDB`.

### Qué pasa
`saveDB()` sube colecciones enteras (preventivos, correctivos, logística, equipos…). Con
dos teléfonos en línea casi siempre se salva, porque los listeners actualizan antes. Pero
**si uno estuvo sin señal**, Firebase guarda en cola su `update` con listas viejas y al
reconectar las sube enteras: lo que el otro cerró o editó en ese rato **desaparece sin
error ni aviso**. Si el que estuvo sin señal es Gerencia, pisa también `equipos`.
### Por qué pasa
- `saveDB` MTG 1978–2002, MHG 1387, MTT 1185, MHT 1106, MTC 412 (listas enteras con
  `update` en la raíz).
- MTS 1030 / MHS 986 suben las listas **aunque estén vacías** (`||[]`): una Supervisión
  con listas vacías las vacía en el servidor.
- MTL `_writeToFirebase` (544) mezcla por id, pero **gana lo local** en órdenes que ya
  existen; `cerrarOrdenLog` (2362) sube la lista local sin mezclar.
- MTG 8116 (`eliminarDelHistorial`, rama logística) sube `equipos` **sin** `_equiposFBok`.
- Técnicos reescriben toda la flota con su copia (MTT 1225, 5216, 5232; MHT 1147).
- Ecos: Técnicos/Logística ignoran snapshots cuyo `_sid` es el suyo (MTT 4447, MHT 3451,
  MTL 2990). Escrituras que no tocan `_sid` (resiliente MTG 6140, `saveAllEquipos`,
  `_elimLG`, todas las de índice) llegan con el `_sid` del técnico → el técnico **no ve
  ese cambio** y en su próximo `saveDB` sube su copia vieja.
- Mitigaciones que existen: `_guardarOrdenMantResiliente` (solo al **crear** órdenes),
  `_protegerOrdenesRecientes` (órdenes de este teléfono < 15 min), borrado de logística
  sobre la lista del servidor. **Nada protege ediciones de órdenes existentes** (cierres,
  firmas, notas, horómetro, estado del equipo).
### Cómo se nota desde afuera
"Yo la cerré y aparece abierta otra vez"; firmas o notas que desaparecen; órdenes que
vuelven al estado de hace un rato.
### Qué hacer
Arreglo de fondo: escribir cada orden/equipo **por id** (`<raíz>/preventivos/<id>` o
`update` multi-ruta del registro tocado) en vez de listas. Es un cambio grande que toca
todas las apps y la forma de los datos: planearlo con Miguel (y avisar a quien lea la
base: tablero de flota, mundo isométrico).

---

## T8. Técnicos habilitan escritura aunque no hayan leído la base de verdad

**Mejorado (2026-09-29):** con el sincronizador, lo que el técnico cierra sin señal ya no se pierde: se sube
cuando vuelve la señal, o la próxima vez que abra la app (la base de lo confirmado se guarda en el
teléfono). Sigue siendo cierto que `_fbReady` se enciende sin haber leído el servidor.

### Qué pasa
Si el técnico abre la app con mala señal, ve las órdenes del caché; si cierra una en ese
momento ve "cerrada y guardada". Al conectar, `once()` reemplaza las listas por las
remotas sin mezclar → **el cierre se pierde**. En la otra dirección, `_fbReady` se
enciende siempre, y desde ahí `saveDB` puede subir el caché recortado (sin fotos ni firmas).
### Por qué pasa
MTT 4364–4384 / MHT 3400–3422: `_fbReady=true` sin importar qué ganó; la comparación
`remote._ts >= local._ts` siempre da remoto porque **`DB._ts` nunca se asigna** en
ninguna app. MHT 1038–1046 recorta el caché. `saveDB` de técnicos encadena
`setTimeout(saveDB,500)` sin límite mientras no hay conexión (varias llamadas = varias
cadenas). MTL enciende `_fbReady` incluso si `once` falla (3003, 3006).
### Cómo se nota desde afuera
Técnico jura que cerró una orden y en Gerencia sigue abierta.
### Qué hacer
Encender `_fbReady` solo cuando llegó el snapshot real, y al llegar, mezclar por id
conservando cierres locales (como `_mergeLogistica` en MTG).

---

## T9. Gerencia MONHACO no escribe nada si Firebase respondió vacío al abrir

### Qué pasa
Si el primer `once` devuelve vacío (p. ej. por un permiso o un fallo raro), la app queda
toda la sesión sin escribir a Firebase, sin avisar.
### Por qué pasa
MHG 9160: solo `loadDB()`; no hay reintento (solo en `.catch`, 9287) y el listener raíz
(9224) no enciende `_fbReady`.
### Cómo se nota desde afuera
Cambios hechos en Gerencia MONHACO que "no llegan" a los demás y desaparecen al recargar.
### Qué hacer
Encender `_fbReady` desde el listener cuando llegue un snapshot con datos, o reintentar.

---

## T10. Supervisión MONHACO usa la caché de logística de MT

### Qué pasa
En un mismo teléfono (o PC) que abra MT y MONHACO, la logística en caché de una empresa
se mezcla con la de la otra.
### Por qué pasa
MHS usa `localStorage 'montasa_log_cache'` (1037, 1470, 9899, 9923, 9948, 10028), la
misma clave que MTG (2081, 2566). MHG usa `monhaco_log_cache`. Todas las apps comparten
origen (`montasa-hn.github.io`).
### Cómo se nota desde afuera
Órdenes LG de MT que aparecen un momento en Supervisión MONHACO (o al revés) hasta que
llega Firebase.
### Qué hacer
Cambiar la clave de MHS a `monhaco_log_cache`. Arreglo chico.

---

## T11. `saveAllEquipos` de Supervisión y MONHACO borra campos de los equipos

**✅ Arreglado (2026-09-29):** `saveAllEquipos` ahora guarda por el sincronizador (solo los datos cambiados de
cada equipo, sin recortar campos).

### Qué pasa
Al reescribir la flota, solo sube una lista fija de campos: se pierden
`esEquipoCliente`, `clienteNombre`, `modelo`, `ubicacionLink`, `esVehiculo`, specs, etc.
### Por qué pasa
MTS 1484 (campos fijos); MHG 1886 (13 campos; llamada en 2389, 2505, 5405, 7366). MTG
2503–2524 ya sube todos los campos.
### Cómo se nota desde afuera
Equipos de cliente que dejan de verse como tales; pines que desaparecen del mapa de la
flota; vehículos que muestran horómetro en vez de km.
### Qué hacer
Copiar el enfoque de MTG (subir el objeto completo). Arreglo chico-mediano.

---

## T12. Horómetros MONHACO: la toma se sella aunque no se actualicen las fichas

### Qué pasa
Al finalizar una toma, primero se sella y después se actualizan las fichas de los
equipos. Si lo segundo falla (señal), la toma queda cerrada y las fichas con el
horómetro viejo, sin reintento ni aviso.
### Por qué pasa
MHL 592–593 (sella) antes de `_horFichasActualizar` (543–559). `horFirmaBorrar` (830)
tampoco revisa si la toma ya está cerrada. Las dos firmas (supervisor y gerente) se hacen
en la misma app sin identificar a quien firma.
### Cómo se nota desde afuera
Horómetro de la ficha distinto al del reporte del mes.
### Qué hacer
Actualizar fichas primero y sellar al confirmar, o reintentar la actualización.

---

## T13. Contador de correlativos que puede bajar

### Qué pasa
`saveDB` de Gerencia/Supervisión sube `lastCorrelativo_MH: DB['lastCorrelativo_MH']||0`,
pero ese valor **no se lee de Firebase al abrir**. Un teléfono sin caché sube 0.
### Por qué pasa
MTG 1986 (y MTS/MHG/MHS). `nextCorrelativo` (MTG 6193) mitiga porque calcula el máximo
de las órdenes existentes; el guardado resiliente (6136–6139) solo sube si es mayor.
### Cómo se nota desde afuera
Raro: un correlativo MH que se repite si justo se borraron las órdenes con los números
más altos.
### Qué hacer
Leer `lastCorrelativo_MH` al abrir, o no incluirlo en `saveDB`.

---

## Bugs de pantalla (la orden se guarda, pero la app se "traba" o no confirma)

### T14. Técnicos: `renderDashboard()` no existe
- **✅ Arreglado (2026-09-30):** MTT y MHT tienen un puente `renderDashboard()` → `renderDashboardTec()`.
- **Qué pasa:** al cerrar o finalizar, la orden sí se guarda pero revienta antes del aviso
  «cerrada» / ventana de éxito. El técnico no ve confirmación y puede repetir la orden.
- **Por qué:** se llama `renderDashboard()` (solo existe `renderDashboardTec`): MTT 3155,
  3635, 3717; MHT 2221, 2677, 2757; VIEJA 1778, 2236, 2335.
- **Qué hacer:** `if(typeof renderDashboard==='function') renderDashboard();` o llamar
  `renderDashboardTec`. Arreglo chico.

### T15. Gerencia: finalizar un correctivo desde el formulario revienta a medio camino
- **Qué pasa:** después de `saveDB` intenta limpiar campos que no existen → error →
  **`registrarOrdenCerrada` no se ejecuta** (la orden no llega a `ordenesCerradas`), el
  formulario no se limpia y no sale el aviso.
- **Por qué:** MTG 8213 / MHG 7819 `document.getElementById(id).value=''` sobre
  `corr-departamento`, `corr-ciudad`, `corr-cliente-*` (0 coincidencias en el HTML;
  tampoco `corr-cliente-fields`, MTG 8217).
- **Qué hacer:** saltar los que no existen (`const el=…; if(el) el.value=''`). Arreglo chico.

### T16. Supervisión MONHACO: «✅ Cerrar correctivo (PIN)» no cierra esa orden
- **Qué pasa:** sale "faltan campos" o, si el formulario de orden nueva tiene datos,
  **crea un correctivo nuevo**. No pide PIN. La orden de la tarjeta nunca se cierra.
- **Por qué:** el botón (MHS 9168) llama `finalizarOrdenCorrectivo('id')`, pero esa
  función (MHS 5950) no recibe argumentos: valida y guarda el **formulario** `corr-*`. El
  cierre correcto es `cerrarCorrectivo(id)` (MHS 6274).
- **Qué hacer:** cambiar el botón a `cerrarCorrectivo` con PIN. Arreglo chico.

### T17. Técnicos MONHACO no tiene pantalla de evaluaciones
- **Qué pasa:** las evaluaciones nunca se muestran (y el campo Cliente de evaluaciones no
  se ve ahí).
- **Por qué:** no existe `#evaluacion-list` ni `tab-evaluacion` en MHT; `renderEvaluaciones`
  (MHT 3981–3983) sale en silencio por `if(!el) return`.
- **Qué hacer:** preguntar a Miguel si los técnicos MONHACO deben ver evaluaciones.

---

## T18. La primera vez, los teléfonos con la versión vieja no se actualizan solos

### Qué pasa
La actualización automática vive dentro de la app. Un teléfono que sigue con una copia
**anterior** a ese cambio no tiene el código que lo actualiza.
### Por qué pasa
El iPhone guarda su propia copia de la app instalada; el bloque se agregó el 2026-09-29.
### Cómo se nota desde afuera
Un teléfono sigue mostrando cosas viejas (p. ej. «Compartir imagen» en vez de PDF).
### Qué hacer
Una sola vez por teléfono: cerrar la app por completo y abrirla; si sigue igual, borrar el
ícono y volver a agregarla desde Safari (`montasa-hn.github.io/app/`). Desde ahí se
actualiza sola. También: si alguien sube un `.html` sin correr `dev/sellar_version.js`, los
teléfonos no se enteran de ese cambio (no rompe nada, solo no avisa).

---

## T19. Los preventivos cerrados siguen diciendo «En proceso»

### Qué pasa
Al cerrar un preventivo queda `completado = true`, pero `estado` se queda en «En proceso»
(27 de 31 preventivos de MT al 2026-09-29; uno en «En pausa» con `completado=true`).
### Por qué pasa
El cierre de preventivos marca `completado` y no toca `estado` (p. ej. MHT 2250/2265/2345);
los correctivos sí ponen `estado='Completado'`.
### Cómo se nota desde afuera
Cualquier pantalla o reporte que lea `estado` de un preventivo lo muestra abierto. Así el
PDF decía «En proceso» en órdenes cerradas (por eso se quitó el estado del PDF).
### Qué hacer
Para saber si un preventivo está cerrado, usar `completado`, no `estado`. Arreglarlo (poner
`estado='Completado'` al cerrar y corregir los viejos) cambia datos: preguntar a Miguel, y
recordar que el tablero de flota y el mundo isométrico leen la base.

---

## T20. Equipos EN RENTA sin orden y ubicaciones que el mapa no puede leer

**✅ Arreglado hacia adelante (2026-09-30):** links sin coordenadas ya no se aceptan (vigilante en los campos
`…ublink…`) y EN RENTA a mano pide cliente + motivo (`eq.rentaManual`). Las 21 rentas viejas sin orden están en
`Documents\Rentas_sin_orden_para_llenar_2026-09-30.xlsx` (fuera del repo) para que Miguel las complete y se
regularicen. Lo de abajo describe cómo era.

**✅ Regularizado (2026-09-30):** con la hoja de Miguel se crearon entregas cerradas LG-0235…LG-0251 (renta
indefinida) para las rentas que siguen; MT-115/MT-119 pasaron a DEMO/PRESTAMO y MT-122 a EN MANTENIMIENTO. Solo
E-10 queda EN RENTA sin orden de entrega (tiene su retiro LG-0234 abierto; Miguel pidió no tocarlo).

### Qué pasa
La ficha deja poner EN RENTA y escribir el cliente a mano, sin orden de entrega/renta; y se aceptan
links cortos de Google sin coordenadas. El equipo queda «en renta» sin ubicación, fecha ni días.
### Por qué pasa
`guardarDesdeModal` (MTG 4456) no exige orden; `_gpsCoordsDeLink` (MTG 3346) no puede leer links
cortos. Ver FLUJO.md §8.
### Cómo se nota desde afuera
Equipos que se sabe que están en un sitio (p. ej. El Salvador: E-01, E-21, E-46) y el mapa no los
muestra. Al 2026-09-29: 20 de 26 equipos MT en renta sin orden de logística.
### Qué hacer
Exigir orden (o PIN + motivo) para EN RENTA y avisar al pegar un link corto. Decisión de Miguel.

---

## T22. Al terminar una renta el equipo seguía con el link del cliente

**✅ Arreglado (2026-09-30):** `cerrarOrdenLog` (Logística MT) solo cambiaba el link al cerrar un retiro, y
además usaba un link corto sin coordenadas. Ahora renta y retiro fuera del plantel dejan el punto del taller de
Las Palmas con coordenadas. Ojo: entre los «DISPONIBLE» hay **máquinas de clientes** (código = modelo o serie,
cliente = la empresa): a esas nunca se les pone el punto del taller.
Además, todos los equipos del taller comparten el mismo punto: el mapa los agrupa en un marcador con el número
(si no, quedaban uno encima de otro y parecía que faltaban).

## T24. Fechas «AAAA-MM-DD» que salen un día antes

**✅ Arreglado en los vales (2026-09-30):** `new Date('2026-09-30')` se lee como medianoche UTC y en Honduras (UTC-6)
es el 29/09 a las 18:00: el vale mostraba un día antes. Además usaba `fechaCierre` (día en que se cerró en la app)
en vez de `fechaFin`. Ojo en cualquier otra fecha sin hora: armarla con `new Date(año, mes-1, día)`.
Las que traen hora (`2026-09-17T17:00`) sí se leen como hora local.

## T23. Liquidación que no abría después de guardarla

**✅ Arreglado (2026-09-30):** `_leerFormLiquidacion` guarda las filas vacías como `null` y la suma del total en
`renderLiquidacionForm` hacía `f.monto` sin revisar: al volver a abrir la liquidación (o con una fila vacía entre
facturas) se rompía. Ahora suma `f&&f.monto`. Ojo si se agrega otra suma o lista de facturas: pueden venir `null`.

## T21. Códigos MT-xx que se repiten entre empresas (y una serie con dos códigos)

### Qué pasa
Cada empresa numera su flota desde MT-01, así que el mismo código existe en MT Rental y en MONHACO para
máquinas distintas (p. ej. MT-67: en MT Rental serie 010409M4896, Baoli/Pegasus CPQYD-40, activo; en MONHACO
serie B16091J00110, Baoli KBE-20, vendido). Además, al 2026-09-30 la serie B16091J00110 aparece en los
vendidos de MONHACO como MT-67 **y** como MT-80, y en los vendidos de MT Rental como MT-80.
### Por qué pasa
El código no identifica a la máquina; la serie sí. Un registro de vendidos quedó con el código cambiado.
### Cómo se nota desde afuera
Confusiones al buscar por código entre empresas; un equipo «vendido» que parece estar activo.
### Qué hacer
Comparar siempre por **serie** (el sincronizador ya lo hace contra vendidos). Pendiente que Miguel diga cuál
de los dos vendidos de B16091J00110 (MT-67 o MT-80) es el correcto en MONHACO.

---

## Otras cosas raras (menores)

- **IDs repetidos en MTG**: `prev-cliente-fields` (730 y 1151), `corr-falla`, `corr-ublink`,
  `corr-diag` dos veces. `getElementById` toma el primero: un formulario lee/limpia
  campos del otro.
- **Equipo de cliente creado en `guardarCorrectivo` de Técnicos MT** (~MTT 3583–3600):
  solo queda en el teléfono; la orden apunta a un `equipoId` que desaparece con la
  siguiente actualización. (Gerencia lo repara con `_repararEquiposCliente`.)
- **`eliminarPreventivo` de Gerencia** (MTG 8137) borra solo con `confirm`, sin PIN (a
  diferencia de `eliminarDelHistorial`).
- **Arreglos con `null`**: varios `find(x=>x.id===…)` sin chequear nulos (MTG 5071,
  listener de logística MTG 9704) pueden romper con TypeError.
- **`_mergeLogistica`** (MTG 11448) conserva la versión local cerrada sobre una reapertura
  hecha en otro dispositivo, y resucita en el teléfono órdenes borradas en otro lado.
- **Renta/entrega desde Gerencia** no revisa el estado actual al pasar a EN RENTA en
  todos los caminos (MTG 8997–9025): revisar si se puede rentar algo EN MANTENIMIENTO.
- **Horómetro final de logística MT** se guarda solo en el teléfono (MTL 2327–2339);
  Logística no sube equipos.
- **`_cambiarEstadoEquipo`** (MTG 11840, MHG 11149, MHS 9592) escribe en `<raíz>/estados`,
  nodo que nadie lee. Código muerto; no revivirlo.
- **Stubs de prueba**: `Autocorrector is not defined` y `localeCompare` en Supervisión con
  equipos sin `codigo` no son bugs (ver CLAUDE.md §7).

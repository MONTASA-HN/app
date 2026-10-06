# ACCESO.md — Candado de la base sin login

Plan para cerrar la base de Firebase sin pedirle usuario ni contraseña a nadie del
campo. **Nada de esto está hecho todavía**: es el diseño acordado por Rodrigo y Miguel
el 2026-10-06, para que Miguel (o su Claude) lo construya. Al construir cada paso,
marcarlo aquí con **✅ Hecho (fecha, commit)**, igual que en `TRAMPAS.md`.

La regla de `CLAUDE.md` manda acá más que en ningún lado: la app la usan mecánicos
desde el teléfono, con las manos sucias y sin buena señal. **Un paso más es una
razón para no usarla.** Por eso no hay login: el teléfono se identifica solo y
Miguel lo aprueba una vez.

---

## 1. Por qué hace falta

- La dirección de la base (`montasa-app-default-rtdb.firebaseio.com`) está en el
  código de las 9 apps, que están publicadas en `montasa-hn.github.io` sin
  contraseña, y el repo es público. Cualquiera puede encontrarla.
- Con esa dirección, hoy se lee **todo** sin credenciales: equipos, órdenes,
  logística, `rrhh`, y `bitacora/auth-config` (los códigos de acceso por rol).
  Verificado el 2026-10-06, solo leyendo. La escritura no se probó (probarla es
  escribir en la base), pero las reglas no exigen nada a nadie.
- Que una pantalla sea "solo de Gerencia" protege la pantalla, no el dato: la base
  le contesta igual a cualquiera que pregunte.

---

## 2. Cómo funciona, en una línea por paso

1. La app se identifica sola al abrir (inicio de sesión **anónimo** de Firebase: sin
   pantalla, sin contraseña; el teléfono guarda la identificación).
2. La primera vez, pide **nombre y apellido**. Una sola vez por teléfono.
3. A Miguel le aparece en Gerencia **"N personas esperando acceso"** y aprueba ahí.
   Sin correo, sin servidor, sin plan de pago.
4. Cuando ya están registrados los que trabajan, se activa el bloqueo: la base solo
   le contesta a teléfonos aprobados.
5. Después, **App Check** (lo que Miguel llamó etapa 3): la base solo le contesta a
   las apps de Nexo de verdad, aunque alguien copie la llave pública de la página.

---

## 3. Paso 1 — Registro (no bloquea nada)

**✅ Hecho en el código (2026-10-06).** Las 9 apps (MTG, MTS, MTT, MTL, MTC, MHG, MHS, MHT, MHL) cargan
`firebase-auth-compat` 9.23.0 y el bloque «ACCESO NEXO · PASO 1» al inicio del `<body>`. Gerencia MT y MONHACO:
pestaña Personal › «📱 Accesos» (cobertura, pendientes, aprobados, rechazados; aprobar elige empleado de la plantilla de las
dos empresas y rol), aviso en Notificaciones (`#acc-aviso`), número en el botón Personal, botón «Primer paso» para que el
primer equipo de Gerencia se apruebe a sí mismo con PIN (reemplaza el paso a mano en la consola) y, al dar de baja en
Personal, ofrece quitar sus teléfonos. Campo extra: `empleadoEmpresa`. **Falta:** activar *Anónimo* en la consola
(Authentication → Sign-in method). Mientras no esté activo, las apps siguen igual y no piden registro.

Este paso **no cambia las reglas**. Todo sigue funcionando igual que hoy; solo se
empieza a saber quién es quién.

### En las 9 apps
- Agregar `firebase-auth-compat.js` **9.23.0** (la misma versión que
  `firebase-app-compat` y `firebase-database-compat` que ya usan).
- En la consola de Firebase: *Authentication → Sign-in method → Anónimo* → activar.
- Al arrancar: `firebase.auth().signInAnonymously()`. La sesión queda guardada en el
  teléfono (persistencia local, que es la de fábrica). **En este paso no esperarla
  para leer**: que el arranque con mala señal no se vuelva más lento por algo que
  todavía no protege nada. En el paso 2 sí hay que esperarla antes del primer `once`.
- Si `accesos/<uid>` no existe → pantalla **"Para pedir acceso: nombre y apellido"**.
  Al guardar escribe `accesos/<uid>` con `estado: 'pendiente'` y **deja seguir
  usando la app**. En este paso no se bloquea a nadie.
- **Los que ya tienen la app** la ven después de la próxima actualización
  automática, igual que cualquier cambio. No hace falta reinstalar.
- `ultimaVez` se actualiza al abrir (una vez por sesión, no en cada lectura).

### Lo que guarda cada teléfono — `accesos/<uid>` (en la raíz, no por empresa)
```
accesos/<uid>: {
  nombre:     "Rodrigo",
  apellido:   "Rodríguez",
  app:        "MONTASA_Tecnicos.html",     // de qué app pidió
  empresa:    "montasa" | "monhaco",
  dispositivo:"iPhone · Safari 17",        // corto, del userAgent: para que Miguel reconozca
  creado:     1696600000000,
  ultimaVez:  1696600000000,
  estado:     "pendiente" | "aprobado" | "rechazado",
  rol:        "campo" | "gerencia",        // lo pone Miguel al aprobar
  empleadoId: "…",                          // opcional: lo enlaza Miguel al aprobar
  aprobadoPor:"<uid de quien aprobó>",
  aprobadoEn: 1696600000000
}
```
Va en la raíz porque una misma persona puede usar apps de las dos empresas, y porque
las reglas del paso 2 lo consultan desde cualquier ruta.

### En Gerencia (MTG y MHG)
- Aviso **"N personas esperando acceso"**, igual que los demás avisos de Gerencia.
- Lista de pendientes con nombre, app, empresa, teléfono y hora. Botones
  **Aprobar** / **Rechazar**.
- Al aprobar, elegir **a qué empleado de Personal corresponde** (`empleadoId`).
  Así el nombre que cuenta es el de la ficha, no el que escribió la persona —
  cualquiera puede escribir "Rodrigo Rodríguez".
- Lista de aprobados con **Quitar acceso**: para teléfonos perdidos o robados, y
  para cuando alguien deja la empresa. Cuando en Personal se da de baja a alguien,
  sugerir quitarle sus teléfonos (como pasó el 2026-10-03 con Dalton, Cristian,
  Rances y Angel).
- **Medidor de cobertura**: *"X de Y técnicos y operadores activos de Personal ya
  tienen teléfono aprobado"*. Ese número es el que dice cuándo se puede pasar al
  paso 2.

### Arranque
- El primer aprobador no lo puede aprobar nadie: el `accesos/<uid>` de Miguel se
  marca `estado: 'aprobado'`, `rol: 'gerencia'` a mano en la consola.

### Cosas a saber
- **iPhone**: cada app instalada tiene su propio almacenamiento, así que una persona
  con dos apps de Nexo en el iPhone pide acceso dos veces. Es normal; en Android las
  apps del mismo sitio comparten la identificación.
- Si alguien **borra los datos del navegador o cambia de teléfono**, pide acceso de
  nuevo. También normal.

---

## 4. Paso 2 — Bloqueo

**Cuándo:** cuando Miguel y Rodrigo decidan que hay suficientes registrados. Criterio
propuesto: todos los técnicos y operadores activos de Personal con al menos un
teléfono aprobado. **No antes**: si el día que se activa medio taller queda
"esperando autorización", ese día nadie usa la app, y es difícil que vuelvan.

**Ese mismo día, no después**, tienen que estar listos los de afuera (sección 6).
Si no, el mundo, el tablero, Jarvis y RADAR se quedan sin datos, y RADAR lo hace
**en silencio**.

### Mientras no está aprobado
La persona ve **"Esperando autorización de Gerencia"** y nada más. La app solo puede
leer y escribir su propio `accesos/<uid>`.

### Reglas — borrador (probar antes de publicar)
Firebase Realtime Database no tiene funciones en las reglas, así que la condición se
repite. Abreviada acá como:

- `APROBADO` = `auth != null && root.child('accesos/'+auth.uid+'/estado').val() === 'aprobado'`
- `GERENCIA` = `APROBADO && root.child('accesos/'+auth.uid+'/rol').val() === 'gerencia'`

```
{
  "rules": {
    "accesos": {
      ".read": "GERENCIA",
      "$uid": {
        ".read":  "auth != null && auth.uid === $uid",
        ".write": "GERENCIA || (auth != null && auth.uid === $uid && (!data.exists() ? newData.child('estado').val() === 'pendiente' : (newData.child('estado').val() === data.child('estado').val() && newData.child('rol').val() === data.child('rol').val())))"
      }
    },
    "montasa":            { ".read": "APROBADO", ".write": "APROBADO" },
    "monhaco":            { ".read": "APROBADO", ".write": "APROBADO" },
    "fotosOrden_montasa": { ".read": "APROBADO", ".write": "APROBADO" },
    "fotosOrden_monhaco": { ".read": "APROBADO", ".write": "APROBADO" },
    "bitacora": {
      "auth-config": { ".read": false, ".write": "GERENCIA" },
      "$nodo":       { ".read": "APROBADO", ".write": "APROBADO" }
    },
    "respaldo_montasa_20260824": { ".read": "GERENCIA", ".write": false },
    "respaldo_monhaco_20260912": { ".read": "GERENCIA", ".write": false },
    "respaldo_pruebas_20260929": { ".read": "GERENCIA", ".write": false },
    "monhaco_prueba":     { ".read": "APROBADO", ".write": "APROBADO" }
  }
}
```
(Al copiarlo, reemplazar `APROBADO` y `GERENCIA` por las expresiones completas.)

La regla de `accesos/$uid` deja que cada teléfono **cree** su solicitud como
`pendiente` y actualice `ultimaVez`, pero **no** que se apruebe solo ni que se
cambie el rol. Eso solo lo hace Gerencia.

### Dos cosas de Firebase que muerden acá
1. **Un permiso dado arriba no se puede quitar abajo.** Si `montasa` tiene `.read`,
   todo lo de adentro se lee, diga lo que diga la regla del hijo. Por eso `bitacora`
   **no** lleva `.read` propio: se abre hijo por hijo con `$nodo`, y `auth-config`,
   que tiene regla con nombre, queda fuera del comodín y cerrado. Se puede porque
   nadie lee `bitacora` entera: ninguna app de Nexo la toca (es del mundo, el tablero
   y la bitácora SGI) y esas la leen siempre de a un hijo. Con `montasa` es distinto:
   **`montasa/rrhh` no se puede cerrar sin abrir `montasa` hijo por hijo**.
2. **Y abrir hijo por hijo rompe las apps**, porque Gerencia y Técnicos leen la raíz
   entera (`FB_REF.once('value')` y el oyente `montasa .on`, `FLUJO.md` §1). Una
   lectura de `montasa` se niega completa si no hay `.read` en `montasa`.
   **Entonces: si se quiere que `rrhh` sea solo de Gerencia también en la base (no
   solo en pantalla), tiene que salir de debajo de `montasa` / `monhaco`**, por ejemplo
   a `rrhh/montasa` y `rrhh/monhaco` con `".read": "GERENCIA"`. Si no, con el paso 2
   cualquier teléfono aprobado puede leerlo. Es decisión de Miguel.

### Antes de publicar las reglas
- Probarlas en el *Rules Playground* de la consola con tres casos: sin sesión,
  sesión pendiente, sesión aprobada.
- Probar con un teléfono de cada tipo: Android, iPhone, y uno de los Huawei/Honor sin
  servicios de Google (T27).
- Guardar las reglas que estaban antes, para poder volver en un minuto si algo falla.

---

## 5. Paso 3 — App Check (la etapa 3 de Miguel)

Hace que la base solo le conteste a las apps de Nexo de verdad: verifica en silencio
que cada consulta venga del sitio real. Sin pasos para el usuario. Cierra el hueco que
deja el anónimo: la llave pública está en la página y alguien decidido podría hacerse
pasar por la app.

- Proveedor para web: reCAPTCHA. Se registra **cada sitio** que consulta la base.
- **Hay que registrar también `rodzilla-thecreator.github.io`** (el mundo, el tablero
  y la bitácora), o quedan afuera.
- Probar primero en el Huawei sin servicios de Google. Si no pasa ahí, el mecánico
  que lo usa se queda sin app.
- Los servidores (sección 6) no pasan por App Check: usan su credencial.

---

## 6. Los que leen esta base desde afuera de Nexo

Cada uno necesita algo para seguir funcionando **el día del paso 2**. Medido el
2026-10-06 en el código de cada uno.

| Quién | Dónde corre | Qué lee | Qué escribe | Qué necesita | Lo hace |
|---|---|---|---|---|---|
| **Mundo isométrico** | navegador, `rodzilla-thecreator.github.io/dash/mundo` | `montasa` y `monhaco`: `equipos`, `preventivos`, `correctivos`, `ordenesCerradas`; `bitacora/*` | `bitacora/data-cajachica`, `data-bitacora`, `mundo-registro`, `mundo-procesos`, `mundo-mejoras`, `mundo-presencia`, `mundo-encargos` | Anónimo + aprobación, como un teléfono. Pantalla de nombre en la página. App Check en el paso 3 | Rodrigo |
| **Tablero de flota** (Cristian) | navegador, `…/dash/` | hojas de `montasa` y `monhaco` (taller); `bitacora/data-cajachica` | nada | Igual que el mundo | Rodrigo |
| **Bitácora SGI** | navegador, `…/dash/bitacora` | `bitacora/*` | `bitacora/*` | Igual que el mundo | Rodrigo |
| **Servidor de sesión del mundo** | servidor (`mundo/servidor/sesion.js`) | `bitacora/auth-config` | nada | Credencial de servidor. Con el paso 2 `auth-config` queda cerrado para todos los demás, que es lo correcto | Rodrigo |
| **Jarvis** | servidor | todo, solo lectura | `bitacora/mundo-presencia`, `mundo-actividad` | Credencial de servidor de **solo lectura** (abajo). Las dos escrituras de presencia son decorativas: se apagan o se les da identidad aprobada | Rodrigo, con la credencial que cree Miguel |
| **Respaldo diario** | PC de Miguel (tarea de Windows, 12:00) | toda la base, solo lectura | nada | Credencial de servidor de solo lectura. Hoy lee sin credencial: **el día del paso 2 dejaría de respaldar** | Miguel / Claude |
| **RADAR** | servidor de Fabrizio | órdenes de Nexo: las copia todos los días a las **11:20 UTC** a su tabla `mantenimientos` (correlativos MH-…; la última, MH-0182, el 2026-10-03) | nada en esta base | Credencial de servidor de solo lectura. **Si no la tiene el día del paso 2, deja de recibir órdenes sin avisar** | Fabrizio, con la credencial que cree Miguel |

### La credencial de servidor (Jarvis, RADAR, sesión del mundo)
- Una **cuenta de servicio** en el proyecto de Google Cloud de la base, con el rol
  **Firebase Realtime Database Viewer** (solo lectura). La crea Miguel, que es el
  dueño del proyecto.
- Una cuenta por servidor, para poder quitarle el acceso a uno sin tocar a los otros.
- La llave de cada cuenta **nunca entra a un repo**: los dos repos son públicos. Se
  entrega por fuera y vive en la configuración del servidor.
- Ojo: una credencial de servidor **no pasa por las reglas**, solo por el rol. Con
  rol de lector puede leer todo, incluido `rrhh`. Del lado de Jarvis, `rrhh` se
  agrega a la lista de rutas que su lector tiene bloqueadas (ya bloquea
  `bitacora/auth-config`).

---

## 7. Lista del día del paso 2

1. Medidor de cobertura en Gerencia: completo.
2. Reglas probadas en el Playground y en los tres teléfonos.
3. Credenciales de servidor creadas y entregadas: Jarvis, RADAR, sesión del mundo.
4. Mundo, tablero y bitácora con su anónimo + aprobados.
5. Reglas viejas guardadas.
6. Publicar las reglas **temprano en la mañana**, con Miguel disponible.
7. Al día siguiente, revisar que RADAR haya copiado las órdenes del día anterior.

---

## 8. Decisiones abiertas

- ~~**`rrhh` fuera de `montasa`/`monhaco`**~~ **✅ Hecho (2026-10-06):** empleados, colaboradores (vacaciones) y acciones (AP)
  están en `rrhh/montasa` y `rrhh/monhaco` (raíz). En el paso 2: `"rrhh": { ".read": "GERENCIA", ".write": "GERENCIA" }`.
  La **plantilla** (nombre en órdenes, cargo, roles, teléfono) se queda en `<raíz>/rrhh/plantilla` porque la leen las 8 apps.
- **Quiénes son `gerencia`**: hoy, Miguel. ¿Alguien más aprueba?
- **Criterio de "suficientes"** para el paso 2: propuesto arriba, a confirmar.
- **Respaldos y `monhaco_prueba`**: `CLAUDE.md` §10 ya los tiene para borrar; si se
  borran antes del paso 2, salen de las reglas.

---

## Historial

- 2026-10-06 — Personal movido a `rrhh/<raíz>` (decisión de Miguel). Agregado el respaldo diario a la tabla de lectores externos.
- 2026-10-06 — Paso 1 construido (registro + aprobación en Gerencia). Probado en copias con sesión simulada.

- 2026-10-06 — Creación. Diseño de Rodrigo y Miguel: sin login, aprobación por
  teléfono desde Gerencia (sin correo ni servidor), bloqueo solo cuando haya
  suficientes registrados, App Check después. Mapa de lectores externos medido en el
  código del mundo, el tablero, la bitácora, Jarvis y en la tabla de RADAR.

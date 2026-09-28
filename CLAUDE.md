# App de taller de Montasa

Esta es la app con la que los mecánicos de Montasa y Monhaco levantan órdenes de
trabajo en el taller y en el campo. La usa gente que no programa, desde el teléfono,
muchas veces con las manos sucias y sin señal buena. Eso manda sobre todo lo demás.

**Miguel es el dueño de esta app.** No es programador. Cuando le expliques algo,
explicá **qué se rompe y para quién**, no el nombre del patrón.

---

## Cómo trabaja Miguel, y por qué importa

**Sube los archivos arrastrándolos a la web de GitHub**, no con `git`. Eso tiene dos
consecuencias que hay que tener presentes siempre:

- **Un archivo que él suba pisa lo que vos hayas cambiado.** Si editás algo y él sube
  su copia de ese mismo archivo, tu cambio desaparece. Ya pasó con `autocorrector.js`.
- **No hay ramas ni PRs.** Lo que está en `main` es lo que está corriendo.

Antes de cambiar cualquier archivo, **preguntale si tiene una versión más nueva que la
del repo**. Si la tiene, pedísela: trabajar sobre la del repo le borra su trabajo.

---

## Lo primero que tenés que hacer: mapear el flujo

**No hay documentación del funcionamiento y hace falta.** Tu primera tarea, antes de
cambiar nada, es leer el código y escribir **`FLUJO.md`** en la raíz del repo.

Ese archivo tiene que contestar, con nombres de función y número de línea:

1. **De dónde sale el dato al abrir la app.** ¿Lee de Firebase, del teléfono, o de una
   lista escrita adentro del HTML? ¿En qué orden y qué gana si hay conflicto?
2. **Qué pasa exactamente al crear una orden**, paso por paso, incluyendo qué le cambia
   al equipo.
3. **Qué pasa al cerrarla**, y a qué estado vuelve el equipo.
4. **Todos los estados que puede tener un equipo**, sacados del código y de la base —
   no de lo que parezca razonable.
5. **Cada lugar donde se escribe a Firebase**: qué ruta, qué método, y si reemplaza o
   mezcla.

**Mantenelo vivo.** Cada vez que cambies algo que altere ese flujo, actualizá `FLUJO.md`
en el mismo commit. Un documento que quedó viejo es peor que no tenerlo: manda a la
gente en la dirección equivocada con confianza.

---

## Las trampas: escribilas donde se vean

Cuando encuentres algo que **se comporta distinto a como se ve**, no lo arregles callado
ni lo dejes solo en el chat. Escribilo en **`TRAMPAS.md`**, en la raíz, con este formato:

```
## Qué pasa
## Por qué pasa (con el archivo y la línea)
## Cómo se nota desde afuera
## Qué hacer
```

La regla: **si te costó descubrirlo, escribilo.** El próximo que abra esto —o vos mismo
en dos meses— no va a tener el contexto que tenés ahora.

---

## Tres cosas que mirar de cerca

Son **sospechas, no diagnósticos**. Verificalas contra el código antes de creerles, y si
resultan ciertas, decidí vos si conviene arreglarlas o solo documentarlas.

**1. Cómo se guarda.** Revisá `saveDB()`. Si sube colecciones enteras en vez de
registros sueltos, entonces dos personas con la app abierta se pisan: el que guarda
último manda, y lo que el otro escribió desaparece sin error y sin aviso. Miralo con
esta pregunta: *si Miguel y un técnico guardan con un minuto de diferencia, ¿qué pasa
con lo que escribió el primero?*

**2. Cómo se apunta a un registro.** Buscá escrituras que usen la **posición** de un
elemento en un arreglo (`.../preventivos/' + indice`). Si la posición local no es la
misma que la del servidor, se escribe encima de otro registro. Fijate si hay una llave
propia que se pueda usar en lugar de la posición.

**3. Qué le pasa al equipo cuando una orden se abre y se cierra.** Seguí el estado de
punta a punta y buscá los caminos donde **no** se actualiza, o donde vuelve a un estado
distinto del que tenía. Una máquina rota que sale del taller marcada como disponible se
vuelve a rentar rota, y eso lo paga un cliente.

Si arreglás alguna, **decile a Miguel qué cambió en palabras de su trabajo** — "ya no se
pierden órdenes cuando dos personas guardan a la vez" — y actualizá `FLUJO.md`.

---

## Reglas de la casa

- **Todo va en español**, comentarios incluidos, y explicando **el porqué** y no el qué.
- **No hay build.** Es HTML con el CSS y el JavaScript adentro, servido por GitHub
  Pages. No metas npm, ni bundler, ni un framework: rompe la forma en que Miguel
  trabaja.
- **Son once archivos casi iguales**, uno por rol y por empresa. Si arreglás algo en uno,
  fijate en cuáles otros existe lo mismo — y dejá anotado en `FLUJO.md` cuáles tocaste.
- **Honduras**: `es-HN`, +504, lempiras.
- **`autocorrector.js` no se toca.** Corrige ortografía en los campos de texto al salir
  del campo, sin cambiar palabras que sí existen. Se perdió una vez en una subida; si no
  lo ves en el repo, avisá antes de hacer nada.

## Lo que NO se hace sin preguntar

- **Borrar o reescribir datos de la base.** Es la operación real de la empresa.
- **Cambiar los nombres de los campos o de los estados.** Hay otras cosas leyendo esta
  misma base —el tablero de flota y un mundo isométrico— y un campo renombrado las
  rompe en silencio.
- **Mover archivos de lugar.** Miguel los sube por nombre desde la web.

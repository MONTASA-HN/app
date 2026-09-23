/* ═══════════════════════════════════════════════════════════════════════
   AUTOCORRECTOR DEL TALLER — español hondureño + jerga de montacargas
   =======================================================================
   Un archivo, sin dependencias. Se incluye y listo.

   LO QUE HACE Y, SOBRE TODO, LO QUE NO
   ------------------------------------
   NO adivina lo que vas a escribir. NO reescribe lo que escribiste. NO
   cambia una palabra que existe. Solo señala las que NO son palabras y,
   cuando está seguro, propone una. El técnico decide.

   Eso es a propósito. Un corrector que "mejora" el texto arruina el dato:
   si cambia "mangueras" por "manguera" deja de saberse si se cambió una o
   cuatro, y esa diferencia es la orden de trabajo. Por eso hay una regla
   dura, la de abajo, que prohíbe tocar singulares y plurales.

   DE DÓNDE SALE EL DICCIONARIO
   ----------------------------
   No de una lista de español genérica. De las 925 palabras que los
   técnicos de Montasa escribieron de verdad en órdenes, diagnósticos y
   solicitudes, menos las que estaban mal. Por eso `orbitrol`, `fiting`,
   `straddle`, `balineras` o `Chumbagua` no se marcan nunca: son parte del
   idioma de este taller aunque no estén en la RAE.

   Y por eso el corrector APRENDE: si marca algo que sí era correcto, el
   técnico aprieta "así está bien" y no vuelve a preguntarlo. Sin eso, un
   repuesto nuevo o un cliente nuevo sería un error para siempre.

   CÓMO SE USA
   -----------
       <script src="autocorrector.js"></script>
       Autocorrector.enganchar(document.getElementById('diagnostico'));

   O a mano, si se quiere otra interfaz:
       const hallazgos = Autocorrector.revisar(texto);
       // [{palabra, desde, hasta, sugerencia, motivo}]
   ═══════════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var PALABRAS = new Set(["a", "abril", "aceite", "aceleración", "acelerado", "acelerador", "acido", "acople", "acoples", "acoplo", "acrílico", "actual", "adecuada", "adecuado", "adicional", "adsorbo", "agarra", "agenda", "agua", "ahora", "ahí", "aire", "ajustar", "ajustaron", "ajuste", "ajusto", "al", "alcanzó", "algo", "alimentación", "alivio", "allí", "alternador", "altura", "ambas", "ambos", "ametita", "ancho", "andén", "anormal", "antes", "anual", "apagar", "arandelas", "ariacop", "armar", "arnés", "arranque", "asado", "aseguró", "aseo", "asiento", "asignados", "asistencia", "así", "atención", "atraso", "aun", "automaticos", "auxiliar", "auxiliares", "avenida", "años", "bac", "bajada", "bajo", "balineras", "balresa", "banda", "banqueteo", "baoli", "baquelas", "baqueteo", "bar", "barrio", "base", "batería", "baterías", "becamo", "bien", "bigote", "bomba", "bombas", "bomohsa", "borner", "brazo", "bronce", "buen", "buena", "bufa", "buffa", "bujes", "bujia", "bujías", "bulbo", "buster", "cable", "cables", "cada", "cadena", "cadenas", "cajón", "calavera", "calentalentadores", "calentamiento", "calibración", "calienta", "calle", "cambiar", "cambiaron", "cambiará", "cambio", "cambió", "camina", "camisas", "camión", "canasta", "canceló", "candelas", "capacidad", "capo", "carburador", "carga", "cargador", "cargill", "cargo", "carrito", "carritos", "carro", "casa", "castes", "causa", "celda", "celdas", "cencol", "central", "checar", "chequeo", "chicharra", "chl", "choloma", "choluteca", "chumbagua", "cierra", "circuito", "clamp", "cliente", "clinacion", "clutch", "colocaron", "coloco", "combustible", "combustión", "comenta", "comida", "como", "compartimento", "comple", "completa", "completación", "completando", "completas", "completo", "completó", "componentes", "compra", "compras", "con", "conexiones", "configuración", "conseguir", "contactor", "contar", "control", "coolant", "copica", "correctamente", "correctivo", "correctivos", "correcto", "correspondientes", "corrigió", "cortesía", "cortina", "cotización", "cpcd", "cpd", "cremallera", "crítico", "cual", "cuando", "cubren", "cuchillas", "cuerpo", "cumple", "códigos", "dar", "darle", "dañada", "dañadas", "dañado", "dañados", "daño", "de", "decir", "dejando", "dejar", "dejo", "dejó", "del", "delantera", "delanteras", "delanteros", "delnradiador", "depurador", "desarmo", "descarga", "descargada", "descartó", "desde", "desengrasante", "desgastados", "desgaste", "desmontar", "desmonto", "desmontó", "desplazador", "despues", "después", "destrabo", "detalle", "detenía", "determino", "dfsk", "diagnosticar", "diagnóstico", "dice", "diek", "diesel", "diferencial", "dijo", "dio", "direccional", "dirección", "directa", "disel", "distribuidor", "dió", "dock", "docleavel", "documentos", "don", "donde", "dos", "duracreto", "durante", "día", "días", "edr", "efectivo", "eje", "el", "elcatex", "electricista", "electro", "electroválvulas", "elevación", "elevadora", "elimino", "ellos", "eléctrica", "eléctrico", "eléctricos", "emergencia", "empaque", "empezar", "empezo", "en", "encender", "encenderlo", "encendido", "enciende", "encontraron", "encontro", "encontró", "enero", "enfriamiento", "engrasa", "engrasado", "engrasadoras", "engrasar", "engrasaron", "engrase", "engraso", "engrasó", "enlace", "entre", "entrega", "equipo", "equipos", "era", "es", "esa", "escape", "ese", "eslabones", "eso", "espaciador", "espacio", "esperar", "espero", "esta", "estaba", "estaban", "estado", "estamos", "estar", "estas", "este", "estos", "estroboscopica", "está", "están", "evaluacion", "evaluación", "explosiones", "extendiendo", "extension", "extensión", "exterior", "externa", "extracción", "fabricación", "fabricarla", "falla", "fallar", "fallas", "falta", "faltan", "farsiman", "federados", "ferreteros", "ficha", "fijó", "filtro", "filtros", "fiting", "fitings", "fitting", "flejionrepues", "flete", "fletes", "flexible", "floja", "flojo", "fluidos", "foco", "forland", "fotografía", "frenado", "freno", "frenos", "fresado", "fricciónes", "frontal", "frío", "fue", "fueron", "fuerza", "fuga", "fugando", "fugas", "funciona", "funcionamiento", "funcionando", "funciones", "funcionó", "función", "fusible", "fusibles", "físico", "galones", "galón", "garantía", "garganta", "gas", "gasolina", "generador", "general", "genie", "golf", "goteo", "grasa", "grúa", "guias", "guticia", "guía", "haber", "habia", "habilitar", "hace", "hacemos", "hacer", "hacia", "hasta", "hay", "hecho", "hicieron", "hidraulica", "hidraulico", "hidráulica", "hidráulicas", "hidráulico", "hidráulicos", "hino", "hispanos", "hizo", "honduras", "hora", "horas", "horometro", "horquillas", "humedad", "humedeciendo", "impidió", "impresora", "inclinación", "inferior", "inhabilitado", "inspección", "instalaciones", "instalación", "instalar", "instalaron", "instalo", "instaló", "insumos", "intercambiaron", "interior", "interiormente", "interna", "internamente", "international", "invema", "inyección", "inyectores", "ir", "iso", "isuzu", "izquierdo", "john", "jonh", "jordan", "jorneo", "joystick", "juan", "junto", "kbd", "kbe", "kbg", "kit", "la", "lado", "larach", "largo", "las", "lateral", "laterales", "lavado", "lavar", "lavaron", "lavo", "le", "led", "lenin", "lenta", "les", "levantamiento", "levante", "leve", "level", "limpia", "limpiar", "limpiaron", "limpieza", "limpio", "liquido", "litio", "litros", "llamar", "llamo", "llanta", "llantas", "llave", "llavin", "llegando", "llegar", "llego", "lleva", "llevar", "llevo", "lo", "loa", "logistica", "logró", "los", "lpg", "lubricación", "luces", "luego", "luz", "líneas", "líquido", "maestra", "mal", "mala", "malas", "malo", "malos", "mandar", "mandarba", "mandarlas", "mando", "manejo", "manguera", "mangueras", "manipular", "mant", "mantenimiento", "mantuvo", "manuales", "manzana", "marca", "martinez", "mas", "materiales", "max", "mayor", "mañana", "medias", "medición", "medida", "medina", "medio", "medir", "mejor", "menos", "mesa", "meses", "meter", "metio", "mezanine", "mide", "midio", "miguel", "mini", "minimas", "minutos", "misma", "mismo", "mitsubishi", "modulo", "mofle", "momento", "montacarga", "montacargas", "montar", "montasa", "monterroso", "monto", "montó", "motivo", "motor", "motores", "movimientos", "movió", "mudanza", "muelas", "muestra", "muy", "máquina", "más", "mástil", "máxima", "módulo", "módulos", "naviera", "nbc", "necesario", "necesita", "neumaticas", "neutrolizador", "ninguna", "ninguno", "nivel", "nivelación", "niveles", "nkr", "no", "northern", "nosotros", "notificaciones", "notificación", "nueva", "nuevamente", "nuevas", "nuevo", "nuevos", "numeración", "o", "observación", "omar", "operador", "operativo", "orbitrol", "orellana", "orig", "original", "orring", "oruga", "otra", "otras", "otro", "otros", "palanca", "palancas", "pallets", "panel", "para", "parado", "parchado", "parecer", "paro", "parrilla", "parte", "pasados", "pata", "patrulla", "pedir", "pegada", "peor", "pequeño", "perforaciones", "pero", "pidio", "piensas", "piezas", "piloto", "pinclevi", "piruetas", "piston", "pistones", "pistón", "plataforma", "platino", "platinum", "plato", "pocas", "polea", "pondra", "poner", "por", "porque", "porta", "portón", "posición", "preparación", "preparar", "presenta", "presentan", "presentar", "presente", "presión", "preventivo", "primario", "principal", "probando", "probar", "problema", "problemas", "probo", "procarne", "procedió", "proceso", "pronorsa", "pronto", "proquin", "provesa", "provocaba", "provocando", "prueba", "pruebas", "próximo", "puede", "puedo", "puente", "puesto", "punta", "puntos", "puso", "que", "quebrado", "queda", "quedar", "quedaron", "quedará", "quedo", "quemado", "quitando", "qué", "radiador", "ralenti", "realiza", "realizaba", "realizar", "realizaron", "realizo", "realizó", "rebobinar", "reclamo", "recomendamos", "recomienda", "reemplazaron", "reemplazo", "regulación", "regulo", "regulonfrenos", "renta", "rentan", "reparaciones", "reparación", "reparar", "reparo", "reporta", "reportada", "repuesto", "repuestos", "requiere", "reservorio", "resorte", "resortes", "respiradero", "restos", "retiraron", "retiro", "retiró", "retrovisor", "retrovisores", "retráctil", "reventado", "revisando", "revisar", "revisaron", "revision", "revisiones", "revisión", "reviso", "revisó", "revoluciones", "rich", "roatan", "rodos", "rojos", "rotula", "rotulas", "rueda", "ruedas", "rápido", "sabe", "sacar", "saco", "sacó", "saint", "salvador", "samsa", "san", "saner", "sangrar", "sangro", "se", "secciones", "seguir", "seguridad", "seguros", "según", "sello", "sellos", "sensor", "sensores", "ser", "sería", "si", "sibesta", "signos", "siguio", "sin", "sistema", "sistemas", "sobre", "sobrecalentamiento", "soldadura", "soldar", "soldo", "soldó", "solo", "son", "sopleteo", "sps", "stacker", "stone", "straddle", "su", "succión", "suciedad", "sugiere", "sus", "switch", "sólidas", "tablero", "taller", "también", "tambores", "tampoco", "tanque", "tanques", "tapadera", "tapizado", "tapón", "tarjeta", "tecnica", "temperatura", "tenemos", "tener", "tenia", "terminales", "terminar", "termino", "terrestre", "textil", "tiempo", "tiene", "tira", "toca", "tocaba", "toda", "todas", "todo", "todos", "tolava", "tomo", "tono", "tope", "torna", "tornillo", "tornillos", "torre", "torres", "total", "totalmente", "towmotor", "trabajadas", "trabajando", "trabajar", "trabajará", "trabajo", "tracción", "traer", "trajo", "trancador", "transcurso", "transmisión", "transportes", "trasera", "traseras", "trasladar", "traslado", "tren", "tres", "truck", "tubería", "tuberías", "tuercas", "turbina", "técnica", "técnico", "técnicos", "un", "una", "unas", "unidad", "uno", "unos", "utilizo", "va", "vales", "valvula", "vaquelas", "varias", "varios", "veces", "venir", "venta", "ventiladora", "ver", "vida", "vieja", "villa", "vino", "vio", "visita", "viñeta", "volqueta", "volver", "volvió", "válvula", "válvulas", "vástagos", "vías", "y", "ya", "zapatas", "zip", "zonas", "ángulo", "émbolo"]);
  var ERRORES  = {"cambionde": "cambio de","cambiobde": "cambio de","mantenimientobde": "mantenimiento de","cambion": "cambio","cambko": "cambio","cambiae": "cambiar","cele": "se le","sele": "se le","seles": "se les","enal": "en mal","orquillas": "horquillas","idralico": "hidraulico","jidraulico": "hidraulico","hidrauilica": "hidraulica","mangera": "manguera","mangeras": "mangueras","limpiesa": "limpieza","linpiesa": "limpieza","filro": "filtro","filtto": "filtro","likido": "liquido","kavado": "lavado","despazador": "desplazador","balinseras": "balineras","sircuito": "circuito","luses": "luces","lus": "luz","traceras": "traseras","treceras": "traseras","aquipo": "equipo","pisto": "piston","mulas": "muelas","aser": "hacer","ralizar": "realizar","reprar": "reparar","neceita": "necesita","detarmino": "determino","valvuva": "valvula","vavula": "valvula","clucth": "clutch","cluch": "clutch","clucht": "clutch","suish": "switch","staker": "stacker","barclam": "bar clamp","clam": "clamp","baoly": "Baoli","olvitrol": "orbitrol","orbitro": "orbitrol","neomaticas": "neumaticas","hembobinar": "rebobinar","grasado": "engrasado","grazado": "engrasado","grase": "engrase","lition": "litio","revicion": "revision","reviosn": "revision","evaluavion": "evaluacion","extencion": "extension","bateria": "batería","baterias": "baterías","electrico": "eléctrico","electrica": "eléctrica","hidraulico": "hidráulico","hidraulica": "hidráulica","hidraulicos": "hidráulicos","hidraulicas": "hidráulicas","maquina": "máquina","mastil": "mástil","valvula": "válvula","liquido": "líquido","angulo": "ángulo","dia": "día","rapido": "rápido","proximo": "próximo","frio": "frío","galon": "galón","tapon": "tapón","anden": "andén","vias": "vías","revision": "revisión","reparacion": "reparación","direccion": "dirección","transmision": "transmisión","traccion": "tracción","inclinacion": "inclinación","calibracion": "calibración","aceleracion": "aceleración","evaluacion": "evaluación","inyeccion": "inyección","preparacion": "preparación","notificacion": "notificación","medicion": "medición","extension": "extensión","posicion": "posición","funcion": "función","lubricacion": "lubricación","completacion": "completación","atencion": "atención","cotizacion": "cotización","presion": "presión"};
  var BASURA   = new Set(["aasfasfh", "amcajcvajxhcvkashvc", "asñdkjvbqsldvbasldvhblig", "des", "djdhchjfgvkyfgvj", "doc", "jhvjacvzxvcjzvcjdvbcl", "kqflkavlkbdclsbdlchdkcnaldchalshdcvqw", "opc", "opx", "sdncvasldcbasl", "xvn", "ydghfx", "zxcbabnxv"]);

  /* Las correcciones encadenan: "likido" lleva a "liquido", que a su vez es un
     error porque le falta la tilde. Sin resolver la cadena harian falta dos
     pasadas y el tecnico veria el mismo subrayado dos veces seguidas, que se
     siente a que el corrector no sabe lo que quiere. Se resuelve una sola vez
     al cargar, con tope por si alguien deja un ciclo al agregar una palabra. */
  (function resolverCadenas() {
    Object.keys(ERRORES).forEach(function (mal) {
      var visto = {}, v = ERRORES[mal], vueltas = 0;
      while (ERRORES[v.toLowerCase()] && !visto[v] && vueltas++ < 5) {
        visto[v] = true; v = ERRORES[v.toLowerCase()];
      }
      ERRORES[mal] = v;
    });
  })();

  var CLAVE_APRENDIDAS = 'taller_palabras_ok';

  /* Las que el técnico marcó como buenas. Viven en el navegador: cada quien
     acumula su vocabulario sin pedirle permiso a nadie. */
  function aprendidas() {
    try {
      var s = JSON.parse(localStorage.getItem(CLAVE_APRENDIDAS));
      return new Set(Array.isArray(s) ? s : []);
    } catch (e) { return new Set(); }
  }
  function aprender(palabra) {
    try {
      var s = aprendidas(); s.add(norm(palabra));
      localStorage.setItem(CLAVE_APRENDIDAS, JSON.stringify([].concat(Array.from(s))));
    } catch (e) { /* sin localStorage sigue funcionando, solo no recuerda */ }
  }

  /* Comparar sin tildes y en minúscula. Las tildes se comparan aparte:
     "bateria" vs "batería" es un error que SÍ se corrige, pero para buscar
     candidatos conviene que las dos formas se parezcan. */
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* Lo que NO es una palabra y no hay que revisar: códigos de equipo
     (MT-117), series (B16090J00038), medidas (15w40, 250104041BF20F),
     números y horas. Revisarlos llenaría la pantalla de rojo. */
  function esCodigo(p) {
    return /\d/.test(p) || /^[A-Z]{1,4}-/.test(p) || p.length < 3;
  }

  /* Distancia de edición con tope: si ya se pasó de `tope`, corta. No hace
     falta saber si son 7 cambios o 9, solo si son pocos. */
  function distancia(a, b, tope) {
    if (Math.abs(a.length - b.length) > tope) return tope + 1;
    var prev = [], fila = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      fila[0] = i;
      var mejor = i;
      for (j = 1; j <= b.length; j++) {
        fila[j] = Math.min(prev[j] + 1, fila[j - 1] + 1,
                           prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (fila[j] < mejor) mejor = fila[j];
      }
      if (mejor > tope) return tope + 1;
      prev = fila.slice();
    }
    return prev[b.length];
  }

  /* LA REGLA QUE NO SE NEGOCIA
     Si dos palabras solo se diferencian en la "s" o el "es" del final, son
     la misma palabra en singular y plural: NO se sugiere nada. Cambiar
     "mangueras" por "manguera" arruina el dato, porque deja de saberse
     cuántas se cambiaron. */
  function soloPlural(a, b) {
    var x = norm(a), y = norm(b);
    if (x === y) return false;
    var corto = x.length < y.length ? x : y;
    var largo = x.length < y.length ? y : x;
    return largo === corto + 's' || largo === corto + 'es';
  }

  function candidatos(p) {
    var n = norm(p), fuera = [], tope = n.length <= 5 ? 1 : 2;
    PALABRAS.forEach(function (w) {
      if (soloPlural(n, w)) return;
      if (distancia(n, norm(w), tope) <= tope) fuera.push(w);
    });
    return fuera;
  }

  /* Devuelve los hallazgos sin tocar el texto. Quien llama decide qué hacer. */
  function revisar(texto) {
    var ok = aprendidas(), fuera = [];
    var re = /[A-Za-zÁÉÍÓÚÑÜáéíóúñü][A-Za-zÁÉÍÓÚÑÜáéíóúñü'-]*/g, m;
    while ((m = re.exec(String(texto || ''))) !== null) {
      var bruta = m[0], p = norm(bruta);
      if (esCodigo(bruta) || PALABRAS.has(p) || PALABRAS.has(bruta.toLowerCase()) || ok.has(p)) continue;

      var hallazgo = { palabra: bruta, desde: m.index, hasta: m.index + bruta.length,
                       sugerencia: null, motivo: '' };

      if (BASURA.has(p)) {
        hallazgo.motivo = 'Esto no parece una palabra.';
      } else if (ERRORES[p]) {
        hallazgo.sugerencia = ERRORES[p];
        hallazgo.motivo = '¿Quisiste decir "' + ERRORES[p] + '"?';
      } else {
        var c = candidatos(p);
        /* Solo se sugiere cuando hay UNA sola posibilidad. Con dos, elegir
           es adivinar, y adivinar es lo que no queremos. */
        if (c.length === 1) {
          hallazgo.sugerencia = c[0];
          hallazgo.motivo = '¿Quisiste decir "' + c[0] + '"?';
        } else {
          hallazgo.motivo = 'No reconozco esta palabra.';
        }
      }
      fuera.push(hallazgo);
    }
    return fuera;
  }

  /* ── La interfaz ────────────────────────────────────────────────────
     Un subrayado bajo la palabra y un globito al tocarla. No se cambia
     nada solo: hay que apretar la sugerencia. El botón "así está bien"
     está al lado y pesa lo mismo, porque el técnico tiene razón más veces
     de las que uno cree. */
  function enganchar(campo, opciones) {
    if (!campo || campo.__autocorrector) return;
    campo.__autocorrector = true;
    opciones = opciones || {};
    var espera = opciones.espera || 600, reloj = null;

    var capa = document.createElement('div');
    capa.className = 'ac-avisos';
    capa.style.cssText = 'font-size:12px;line-height:1.5;margin-top:4px;';
    campo.parentNode.insertBefore(capa, campo.nextSibling);

    function pintar() {
      var h = revisar(campo.value);
      if (!h.length) { capa.innerHTML = ''; return; }
      /* Una palabra por renglon y el renglon tiene que entrar en un telefono.
         Cuando hay sugerencia NO se escribe "¿Quisiste decir X?": el boton ya
         dice X, y repetirlo hacia que la fila se partiera en dos. Con cinco
         errores eso son diez renglones que empujan el boton de guardar fuera
         de la pantalla, y el mecanico deja de ver como terminar la orden.
         El texto largo se queda solo para lo que NO tiene sugerencia, que es
         donde hace falta explicar por que esta marcado. */
      capa.innerHTML = h.map(function (x, i) {
        var medio = x.sugerencia
          ? '<span style="' + EST.flecha + '">&rarr;</span>' +
            '<button type="button" data-i="' + i + '" data-accion="usar" style="' + EST.usar + '">' +
            x.sugerencia + '</button>'
          : '<span style="' + EST.motivo + '">' + x.motivo + '</span>';
        return '<div style="' + EST.fila + '"><b style="' + EST.mal + '">' + x.palabra + '</b>' +
               medio +
               '<button type="button" data-i="' + i + '" data-accion="ok" style="' + EST.ok + '">' +
               'está bien</button></div>';
      }).join('');
      capa.__h = h;
    }

    capa.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var x = (capa.__h || [])[Number(b.dataset.i)]; if (!x) return;
      if (b.dataset.accion === 'ok') { aprender(x.palabra); }
      else {
        /* Se reemplaza por posición y no con replace(), que cambiaría la
           primera aparición aunque el técnico haya tocado la tercera. */
        campo.value = campo.value.slice(0, x.desde) + x.sugerencia + campo.value.slice(x.hasta);
      }
      pintar();
      campo.dispatchEvent(new Event('input', { bubbles: true }));
    });

    campo.addEventListener('input', function () {
      clearTimeout(reloj); reloj = setTimeout(pintar, espera);
    });
    campo.addEventListener('blur', pintar);
    pintar();
  }

  var EST = {
    fila:   'display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:2px 0;',
    mal:    'color:#b91c1c;text-decoration:underline wavy #b91c1c 1px;text-underline-offset:3px;',
    flecha: 'color:#9ca3af;',
    motivo: 'color:#6b7280;flex:1;min-width:0;',
    usar:   'border:1px solid #c7d2fe;background:#eef2ff;color:#3730a3;border-radius:6px;' +
            'padding:1px 8px;font:inherit;font-weight:600;cursor:pointer;white-space:nowrap;',
    ok:     'border:1px solid #e5e7eb;background:#fff;color:#6b7280;border-radius:6px;' +
            'padding:1px 8px;font:inherit;cursor:pointer;white-space:nowrap;margin-left:auto;'
  };

  /* Engancha TODOS los <textarea> de la pagina.
     Existe porque la app del taller son once HTML sueltos y los id de los
     campos no son los mismos en todos: en Tecnicos hay `corr-diag` y
     `eval-diagnostico`, en Supervision `sol-desc`, en Logistica `v-obs`, y
     varios no tienen id. Una lista de id se desactualiza con el primer campo
     nuevo que alguien agregue; "todos los textarea" no.

     Se puede excluir uno con data-sin-corrector. Y vuelve a correr cuando
     aparece un textarea nuevo, porque esa app abre los formularios en
     ventanas que se arman al momento: si solo corriera al cargar, el campo
     recien dibujado se quedaria sin corrector. */
  function engancharTodo(raiz2, opciones) {
    var d = raiz2 || document;
    [].forEach.call(d.querySelectorAll('textarea:not([data-sin-corrector])'),
                    function (t) { enganchar(t, opciones); });
  }
  function vigilar(opciones) {
    engancharTodo(document, opciones);
    if (typeof MutationObserver !== 'function') return;
    var o = new MutationObserver(function () { engancharTodo(document, opciones); });
    o.observe(document.documentElement, { childList: true, subtree: true });
    return o;
  }

  raiz.Autocorrector = {
    revisar: revisar, enganchar: enganchar, aprender: aprender,
    engancharTodo: engancharTodo, vigilar: vigilar,
    conoce: function (p) { return PALABRAS.has(norm(p)) || aprendidas().has(norm(p)); },
    cuantas: function () { return PALABRAS.size; }
  };
})(typeof window !== 'undefined' ? window : this);

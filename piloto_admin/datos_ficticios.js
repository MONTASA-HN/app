// Datos FICTICIOS del piloto «NEXO Administración · Caja chica · Acuse de Finanzas» (nada sale de la base real).
// Mismos nombres de campos que la app. Viáticos en órdenes de LOGÍSTICA (en MONHACO los viáticos solo van en Logística).
(function (root) {
  var CLI = ['Constructora Ejemplo S.A.', 'Bodegas del Valle Prueba', 'Industrias Ficticias', 'Textiles Demo', 'Logística Norte Prueba', 'Agrícola Muestra'];
  var CIU = ['San Pedro Sula', 'Choloma', 'Villanueva', 'La Lima', 'Puerto Cortés', 'El Progreso'];
  var GENTE = ['Carlos Prueba', 'Diego Prueba', 'Elena Prueba', 'Mario Prueba'];
  function f(d) { var x = new Date(2026, 10, 26); x.setDate(x.getDate() - d); return x.toISOString().slice(0, 10); }
  function sinVacios(o) { Object.keys(o).forEach(function (k) { if (o[k] === undefined) delete o[k]; }); return o; }
  function equipos(p, n, mt) {
    var out = [], est = ['EN RENTA', 'DISPONIBLE', 'EN RENTA', 'EN MANTENIMIENTO', 'EN RENTA', 'DISPONIBLE'];
    for (var i = 0; i < n; i++) {
      var e = est[i % est.length];
      out.push({ id: p + '_eq_' + i, codigo: (mt ? 'MT-' : 'MH-') + (900 + i), tipo: mt ? 'Montacargas' : 'MONTACARGAS', marca: 'Marca ' + 'ABCD'[i % 4], modelo: 'Modelo ' + (10 + i), serie: 'SER-PRUEBA-' + (1000 + i),
        desc: 'Marca ' + 'ABCD'[i % 4] + ' Modelo ' + (10 + i), estado: e, cliente: e === 'EN RENTA' ? CLI[i % CLI.length] : '', ubicacion: e === 'EN RENTA' ? CIU[i % CIU.length].toUpperCase() : 'PLANTEL',
        combustible: ['DIESEL', 'GAS', 'ELECTRICO'][i % 3], horometro: String(1200 + i * 137), observaciones: '', capacidad: (2 + i % 3) + ' t', intervaloMantMeses: 3 });
    }
    return out;
  }
  // Solicitud de viáticos (y liquidación si conFact)
  function viat(fecha, gestor, destino, conFact) {
    return sinVacios({ fecha_doc: fecha, cliente: CLI[0], destino: destino, motivo: 'Entrega de equipo (prueba)', gestor_nombre: gestor, gestor_id: '', gestor_cuenta: '', gestor_depto: 'LOGISTICA',
      vehiculo: 'PICK-UP', km_total: 54, num_peajes: 0, costo_peaje: 22, combustible: 1200, hospedaje: 0, hospedaje_noche: 0, findes: {}, otros_gastos: 0, observaciones: '',
      personas: [{ nombre: gestor, fecha: fecha, fecha_fin: fecha, hora_ini: '06:00', hora_fin: '17:00', desayuno: 100, almuerzo: 120, cena: 0, media_noche: 0, transporte: 0, hospedaje: 0, total: 220 }],
      facturas: conFact ? [{ descripcion: 'COMBUSTIBLE', fecha: fecha, ndocumento: '000-001-01-00012345', monto: 1150 }, { descripcion: 'ALIMENTACION', fecha: fecha, ndocumento: '000-001-01-00067890', monto: 215 }] : undefined });
  }
  function logi(p, eqs, pref, mt) {
    var out = [], tipos = ['entrega', 'retiro', 'entrega', 'renta', 'entrega', 'retiro'];
    for (var i = 0; i < 6; i++) {
      var e = eqs[(i * 2) % eqs.length], d = f(i * 3 + 1), hecho = i % 2 === 0;
      out.push(sinVacios({ id: p + '_lg_' + i, correlativo: pref + String(500 + i), equipoId: e.id, tipoLogistica: tipos[i], estado: hecho ? 'Completado' : 'En proceso', cerrado: hecho,
        fecha: d, fechaInicio: d + 'T06:30', fechaFin: hecho ? d + 'T10:00' : '', fechaCierre: hecho ? d : '', descripcion: 'Orden de logística de prueba', clienteOrden: e.cliente || CLI[i % CLI.length],
        operador: GENTE[i % 4], motorista: GENTE[(i + 2) % 4], prioridad: 'Normal', ubicacionLog: 'fuera',
        // 501: solicitud sin liquidación (para capturarla en la prueba) · 502: solicitud con liquidación ya guardada
        viaticos: i === 1 ? viat(d, GENTE[1], 'VILLANUEVA', false) : i === 2 ? viat(d, GENTE[2], mt ? 'VILLANUEVA' : 'POTRERILLOS', true) : undefined }));
    }
    return out;
  }
  function empleados(p) {
    var cargos = ['Técnico de mantenimiento', 'Operador', 'Motorista', 'Jefe de taller'], dep = ['MANTENIMIENTO', 'LOGISTICA', 'LOGISTICA', 'TALLER'], o = {};
    GENTE.forEach(function (n, i) { var id = p + '_emp_' + i;
      o[id] = { id: id, nombreCompleto: n.toUpperCase(), cargo: cargos[i], departamento: dep[i], identidad: '0000-1990-0000' + i, telefono: '0000-000' + i, fechaNacimiento: '1990-0' + (i + 1) + '-15', fechaIngreso: '2020-01-0' + (i + 1), activo: true }; });
    return o;
  }
  var eMT = equipos('mt', 12, true), eMH = equipos('mh', 10, false);
  var tel_ger = { etiqueta: 'Gerente Prueba · Gerencia', estado: 'aprobado', rol: 'gerencia', nombre: 'Gerente', apellido: 'Prueba', empresa: 'montasa', app: 'MTRENTAL_Gerencia.html', dispositivo: 'Windows · Chrome', ultimaVez: 1795700000000 };
  // (26/11) Finanzas firma en el teléfono de Gerencia: no hay equipo de Finanzas. La firma del elaborador (la de Miguel) solo si existe
  // firma_local.js (archivo local, fuera de git).
  var firma = root.__FIRMA_PILOTO ? { nombre: root.__FIRMA_PILOTO.nombre, firma: root.__FIRMA_PILOTO.firma, ts: 1795700000000, por: { uid: 'tel_ger', nombre: 'Gerente Prueba' } } : null;
  root.SEMILLA_LOG = {
    montasa: { _ts: 1795600000000, _sid: 'prueba', equipos: eMT, preventivos: [], correctivos: [], logistica: logi('mt', eMT, 'LGMT-', true), solicitudes: [], lastCorrelativo_MH: 4300, lastCorrelativo_LG: 520, clientesLista: CLI },
    monhaco: { _ts: 1795600000000, _sid: 'prueba', equipos: eMH, preventivos: [], correctivos: [], logistica: logi('mh', eMH, 'LGMH-', false), solicitudes: [], lastCorrelativo_MH: 4300, lastCorrelativo_LG: 520, clientesLista: CLI },
    rrhh: { montasa: { empleados: empleados('mt'), colaboradores: {}, acciones: {} }, monhaco: { empleados: empleados('mh'), colaboradores: {}, acciones: {} } },
    accesos: { tel_ger: Object.assign({ uid: 'tel_ger' }, tel_ger) }
  };
  if (firma) root.SEMILLA_LOG.finanzas = { firmaElaborador: firma };
  root.DISPOSITIVOS_LOG = { tel_ger: tel_ger };
})(typeof window !== 'undefined' ? window : module.exports);

// ============================================================================
// Sincronización CRM → ERP, versión corregida (30-sep-2026)
// Se pega en el Worker "lana-rosa-os-pos" justo ANTES de la línea "// src/index.ts".
// Después, en el router (dentro de src/index.ts) se cambian 3 nombres (ver README.md de esta carpeta).
//
// Qué corrige respecto a las funciones originales:
//  1. Clientes: antes se buscaba al cliente solo por cédula y, si no había, se creaba otro. Ahora se busca
//     por crm_cliente_id, cédula, correo y teléfono, y si existe se VINCULA (se le guarda crm_cliente_id)
//     en vez de duplicarlo.
//  2. Medios de pago: "Nequi", "Efectivo", "Otro" del CRM se convierten a las claves del ERP
//     (nequi, efectivo, ...) antes de guardarlos; antes pasaban con mayúscula y no coincidían.
//  3. Pedidos de la tienda web: los que el ERP ya envió al CRM llevan en las notas un marcador [ERP:PED-…].
//     Si por algún motivo el ERP no alcanzó a marcar el vínculo, aquí se marca (en vez de importarlos otra vez
//     y duplicar el cobro). Los marcados como [PRUEBA-WEB:…] se ignoran.
//  4. Se revisan hasta 500 pedidos del CRM (antes solo los 50 más recientes).
// ============================================================================

function hdrErpSync(env) {
  return { Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json" };
}
function hdrCrmSync(env) {
  return { Authorization: `Bearer ${env.CRM_SUPABASE_SERVICE_ROLE_KEY}`, apikey: env.CRM_SUPABASE_SERVICE_ROLE_KEY };
}
function digitosTelefonoSync(t) {
  return String(t || "").replace(/\D/g, "").slice(-10);
}
function normalizarMedioPagoCrm(texto) {
  const t = String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  if (!t)
    return "efectivo";
  if (t.includes("wompi"))
    return "wompi_otro";
  if (t.includes("nequi"))
    return "nequi";
  if (t.includes("davi"))
    return "daviplata";
  if (t.includes("efectivo"))
    return "efectivo";
  if (t.includes("debito"))
    return "tarjeta_debito";
  if (t.includes("credito") || t.includes("tarjeta"))
    return "tarjeta_credito";
  if (t.includes("transfer") || t.includes("bancolombia") || t.includes("pse") || t.includes("consign"))
    return "transferencia";
  return "efectivo";
}
async function cargarIndiceTercerosSync(env) {
  const resp = await fetch(
    `${env.SUPABASE_URL}/rest/v1/terceros?tipo=in.(cliente,mixto)&select=id,crm_cliente_id,numero_documento,email,telefono&limit=5000`,
    { headers: hdrErpSync(env) }
  );
  return { filas: resp.ok ? await resp.json() : [] };
}
// Devuelve { id, accion } con accion = "existente" | "vinculado" | "creado" (o id null si no se pudo).
async function terceroParaClienteCrm(env, indice, cliente, idCrm) {
  if (!cliente)
    return { id: null, accion: null };
  const cedula = (cliente.cedula || "").trim();
  const email = (cliente.email || "").trim().toLowerCase();
  const tel = digitosTelefonoSync(cliente.telefono);
  const porCrm = indice.filas.find((x) => x.crm_cliente_id === idCrm);
  if (porCrm)
    return { id: porCrm.id, accion: "existente" };
  const t = cedula && indice.filas.find((x) => x.numero_documento === cedula) || email && indice.filas.find((x) => (x.email || "").trim().toLowerCase() === email) || tel.length >= 7 && indice.filas.find((x) => digitosTelefonoSync(x.telefono) === tel);
  if (t) {
    if (!t.crm_cliente_id) {
      const r = await fetch(`${env.SUPABASE_URL}/rest/v1/terceros?id=eq.${t.id}`, {
        method: "PATCH",
        headers: hdrErpSync(env),
        body: JSON.stringify({ crm_cliente_id: idCrm })
      });
      if (r.ok)
        t.crm_cliente_id = idCrm;
    }
    return { id: t.id, accion: "vinculado" };
  }
  const doc = cedula || `CRM-${String(idCrm).slice(0, 8)}`;
  const respCrear = await fetch(`${env.SUPABASE_URL}/rest/v1/terceros`, {
    method: "POST",
    headers: { ...hdrErpSync(env), Prefer: "return=representation" },
    body: JSON.stringify({
      tipo: "cliente",
      tipo_documento: "CC",
      numero_documento: doc,
      nombre_completo: (cliente.nombre || "Cliente del CRM").trim(),
      telefono: cliente.telefono && cliente.telefono.trim() ? cliente.telefono.trim() : null,
      email: email || null,
      direccion: [cliente.direccion, cliente.barrio].filter((x) => x && x.trim()).join(", ") || null,
      ciudad: cliente.ciudad && cliente.ciudad.trim() ? cliente.ciudad.trim() : null,
      crm_cliente_id: idCrm,
      activo: true,
      acepta_tratamiento_datos: true,
      fecha_aceptacion_datos: (/* @__PURE__ */ new Date()).toISOString(),
      medio_autorizacion: "WhatsApp/Redes — aviso en confirmaci\xF3n de pedido",
      version_politica: "v1.0"
    })
  });
  if (respCrear.ok) {
    const [nuevo] = await respCrear.json();
    indice.filas.push({ id: nuevo.id, crm_cliente_id: idCrm, numero_documento: doc, email, telefono: cliente.telefono || null });
    return { id: nuevo.id, accion: "creado" };
  }
  const respBuscar = await fetch(
    `${env.SUPABASE_URL}/rest/v1/terceros?tipo_documento=eq.CC&numero_documento=eq.${encodeURIComponent(doc)}&select=id,crm_cliente_id&limit=1`,
    { headers: hdrErpSync(env) }
  );
  const filas = respBuscar.ok ? await respBuscar.json() : [];
  return { id: filas[0]?.id || null, accion: filas[0] ? "existente" : null };
}
// Pedidos del CRM que vienen de la tienda web: los que ya tienen marcador [ERP:PED-…] se vinculan con el
// pedido del ERP (si falta el vínculo) y se sacan de la lista; los [PRUEBA-WEB:…] se ignoran.
async function separarPedidosWebCrm(env, pedidos) {
  const restantes = [];
  let vinculados = 0;
  for (const p of pedidos) {
    const notas = p.notas || "";
    if (notas.includes("[PRUEBA-WEB:"))
      continue;
    const m = notas.match(/\[ERP:(PED-[0-9]{4}-[0-9]+)\]/);
    if (!m) {
      restantes.push(p);
      continue;
    }
    const respErp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/pedidos_canal_venta?consecutivo=eq.${m[1]}&select=id,referencia_crm_id&limit=1`,
      { headers: hdrErpSync(env) }
    );
    const filas = respErp.ok ? await respErp.json() : [];
    if (filas[0] && !filas[0].referencia_crm_id) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/pedidos_canal_venta?id=eq.${filas[0].id}`, {
        method: "PATCH",
        headers: hdrErpSync(env),
        body: JSON.stringify({ referencia_crm_id: p.id })
      });
      vinculados++;
    }
  }
  return { restantes, vinculados };
}
async function clientesCrmPorId(env, pedidos) {
  const clienteIds = [...new Set(pedidos.map((p) => p.cliente_id).filter(Boolean))];
  if (clienteIds.length === 0)
    return {};
  const resp = await fetch(
    `${env.CRM_SUPABASE_URL}/rest/v1/clientes?id=in.(${clienteIds.join(",")})&select=id,nombre,telefono,ciudad,direccion,barrio,email,cedula,canal`,
    { headers: hdrCrmSync(env) }
  );
  const filas = resp.ok ? await resp.json() : [];
  return Object.fromEntries(filas.map((c) => [c.id, c]));
}
async function centroCostoTiendaSync(env) {
  const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/centros_costo?codigo=eq.01&select=id`, { headers: hdrErpSync(env) });
  const filas = resp.ok ? await resp.json() : [];
  return filas[0]?.id || null;
}
async function handleSincronizarPedidosCrmV2(request, env, auth) {
  requiereRol(auth, ["administrador", "cajero"]);
  const respCrm = await fetch(
    `${env.CRM_SUPABASE_URL}/rest/v1/pedidos?es_stock=eq.false&select=id,cliente_id,descripcion,tipo,cantidad_unidades,precio_total,anticipo,metodo_pago,fecha_pedido,direccion_envio,numero_pedido,notas&order=created_at.desc&limit=500`,
    { headers: hdrCrmSync(env) }
  );
  if (!respCrm.ok)
    return errorResponse("No se pudo consultar el CRM: " + await respCrm.text(), 500);
  const pedidosCrm = await respCrm.json();
  if (pedidosCrm.length === 0)
    return jsonResponse({ importados: 0, ya_existian: 0, vinculados: 0 });
  const idsStr = pedidosCrm.map((p) => p.id).join(",");
  const respExistentes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/pedidos_canal_venta?referencia_crm_id=in.(${idsStr})&select=referencia_crm_id`,
    { headers: hdrErpSync(env) }
  );
  const existentes = respExistentes.ok ? await respExistentes.json() : [];
  const idsYaImportados = new Set(existentes.map((e) => e.referencia_crm_id));
  const sinImportar = pedidosCrm.filter((p) => !idsYaImportados.has(p.id));
  const { restantes: nuevos, vinculados } = await separarPedidosWebCrm(env, sinImportar);
  if (nuevos.length === 0)
    return jsonResponse({ importados: 0, ya_existian: pedidosCrm.length - sinImportar.length, vinculados });
  const clientesPorId = await clientesCrmPorId(env, nuevos);
  const centroCostoTiendaId = await centroCostoTiendaSync(env);
  if (!centroCostoTiendaId)
    return errorResponse("No se encontr\xF3 el centro de costo de Tienda", 500);
  const indice = await cargarIndiceTercerosSync(env);
  const canalesValidos = ["whatsapp", "instagram", "facebook", "tienda_virtual"];
  let importados = 0;
  for (const pedido of nuevos) {
    const cliente = pedido.cliente_id ? clientesPorId[pedido.cliente_id] : null;
    const { id: terceroId } = await terceroParaClienteCrm(env, indice, cliente, pedido.cliente_id);
    const canal = canalesValidos.includes(cliente?.canal) ? cliente.canal : "whatsapp";
    const anticipo = Number(pedido.anticipo) || 0;
    const total = Number(pedido.precio_total) || 0;
    const saldo = Math.max(total - anticipo, 0);
    const respInsert = await fetch(`${env.SUPABASE_URL}/rest/v1/pedidos_canal_venta`, {
      method: "POST",
      headers: hdrErpSync(env),
      body: JSON.stringify({
        canal,
        centro_costo_id: centroCostoTiendaId,
        tercero_id: terceroId,
        descripcion_producto: `[CRM ${pedido.numero_pedido || ""}] ${pedido.tipo || ""} ${pedido.descripcion || ""}`.trim(),
        cantidad: pedido.cantidad_unidades || 1,
        valor_producto: total,
        valor_envio: 0,
        monto_anticipo_requerido: anticipo,
        anticipo_pagado: anticipo > 0,
        fecha_pago_anticipo: anticipo > 0 ? pedido.fecha_pedido : null,
        metodo_pago_anticipo: anticipo > 0 ? normalizarMedioPagoCrm(pedido.metodo_pago) : null,
        monto_saldo_requerido: saldo,
        estado: anticipo > 0 ? "en_preparacion" : "esperando_pago",
        disponible_en_stock: false,
        referencia_crm_id: pedido.id,
        registrado_por: auth.userId
      })
    });
    if (respInsert.ok)
      importados++;
  }
  return jsonResponse({ importados, ya_existian: pedidosCrm.length - sinImportar.length, vinculados });
}
async function handleSincronizarClientesCrmV2(request, env, auth) {
  requiereRol(auth, ["administrador"]);
  const respCrm = await fetch(
    `${env.CRM_SUPABASE_URL}/rest/v1/clientes?select=id,nombre,telefono,ciudad,direccion,barrio,email,cedula,canal,notas`,
    { headers: hdrCrmSync(env) }
  );
  if (!respCrm.ok)
    return errorSeguro("No se pudo consultar el CRM", await respCrm.text(), 500);
  const clientesCrm = await respCrm.json();
  if (clientesCrm.length === 0)
    return jsonResponse({ importados: 0, actualizados: 0, vinculados: 0, total_en_crm: 0 });
  const indice = await cargarIndiceTercerosSync(env);
  let importados = 0;
  let actualizados = 0;
  let vinculados = 0;
  for (const c of clientesCrm) {
    if (!c.nombre || !c.nombre.trim())
      continue;
    const nombreNormalizado = c.nombre.trim().toLowerCase();
    if (nombreNormalizado === "indefinido" || nombreNormalizado === "lana rosa crochet")
      continue;
    const { id, accion } = await terceroParaClienteCrm(env, indice, c, c.id);
    if (!id)
      continue;
    if (accion === "creado") {
      importados++;
      continue;
    }
    if (accion === "vinculado")
      vinculados++;
    // Existente o reci\xE9n vinculado: se completan datos del CRM, sin borrar lo que ya tenga el ERP.
    const cambios = {};
    if (c.telefono && c.telefono.trim())
      cambios.telefono = c.telefono.trim();
    if (c.email && c.email.trim())
      cambios.email = c.email.trim();
    const dir = [c.direccion, c.barrio].filter((x) => x && x.trim()).join(", ");
    if (dir)
      cambios.direccion = dir;
    if (c.ciudad && c.ciudad.trim())
      cambios.ciudad = c.ciudad.trim();
    if (Object.keys(cambios).length > 0) {
      const r = await fetch(`${env.SUPABASE_URL}/rest/v1/terceros?id=eq.${id}`, { method: "PATCH", headers: hdrErpSync(env), body: JSON.stringify(cambios) });
      if (r.ok && accion === "existente")
        actualizados++;
    }
  }
  return jsonResponse({ importados, actualizados, vinculados, total_en_crm: clientesCrm.length });
}
async function handleSincronizarVentasContablesCrmV2(request, env, auth) {
  requiereRol(auth, ["administrador"]);
  const respCrm = await fetch(
    `${env.CRM_SUPABASE_URL}/rest/v1/pedidos?es_stock=eq.false&or=(estado.eq.entregado,anticipo.gt.0)&select=id,cliente_id,descripcion,tipo,cantidad_unidades,precio_total,anticipo,estado,metodo_pago,fecha_pedido,fecha_entrega_real,numero_pedido,notas&order=fecha_pedido.desc&limit=1000`,
    { headers: hdrCrmSync(env) }
  );
  if (!respCrm.ok)
    return errorSeguro("No se pudo consultar el CRM", await respCrm.text(), 500);
  const pedidosCrm = await respCrm.json();
  if (pedidosCrm.length === 0)
    return jsonResponse({ importados: 0, ya_existian: 0, excluidos_lana_rosa: 0, vinculados: 0 });
  const clientesPorId = await clientesCrmPorId(env, pedidosCrm);
  const esLanaRosaMisma = (nombre) => (nombre || "").trim().toLowerCase() === "lana rosa crochet";
  const pedidosDeTerceros = pedidosCrm.filter((p) => !esLanaRosaMisma(clientesPorId[p.cliente_id]?.nombre));
  const excluidosLanaRosa = pedidosCrm.length - pedidosDeTerceros.length;
  if (pedidosDeTerceros.length === 0)
    return jsonResponse({ importados: 0, ya_existian: 0, excluidos_lana_rosa: excluidosLanaRosa, vinculados: 0 });
  const idsStr = pedidosDeTerceros.map((p) => p.id).join(",");
  const respExistentes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/pedidos_canal_venta?referencia_crm_id=in.(${idsStr})&select=referencia_crm_id`,
    { headers: hdrErpSync(env) }
  );
  const existentes = respExistentes.ok ? await respExistentes.json() : [];
  const idsYaImportados = new Set(existentes.map((e) => e.referencia_crm_id));
  const sinImportar = pedidosDeTerceros.filter((p) => !idsYaImportados.has(p.id));
  const { restantes: nuevos, vinculados } = await separarPedidosWebCrm(env, sinImportar);
  const yaExistian = pedidosDeTerceros.length - sinImportar.length;
  if (nuevos.length === 0)
    return jsonResponse({ importados: 0, ya_existian: yaExistian, excluidos_lana_rosa: excluidosLanaRosa, vinculados });
  const centroCostoTiendaId = await centroCostoTiendaSync(env);
  if (!centroCostoTiendaId)
    return errorResponse("No se encontr\xF3 el centro de costo de Tienda", 500);
  const indice = await cargarIndiceTercerosSync(env);
  const canalesValidos = ["whatsapp", "instagram", "facebook", "tienda_virtual"];
  let importados = 0;
  for (const pedido of nuevos) {
    const cliente = pedido.cliente_id ? clientesPorId[pedido.cliente_id] : null;
    const { id: terceroId } = await terceroParaClienteCrm(env, indice, cliente, pedido.cliente_id);
    const canal = canalesValidos.includes(cliente?.canal) ? cliente.canal : "whatsapp";
    const total = Number(pedido.precio_total) || 0;
    if (total < 1e3)
      continue;
    const metodoPago = normalizarMedioPagoCrm(pedido.metodo_pago);
    const fechaVenta = pedido.fecha_entrega_real || pedido.fecha_pedido || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const montoAnticipo = pedido.estado === "entregado" ? total : Math.min(Number(pedido.anticipo) || 0, total);
    const montoSaldoPendiente = Math.max(total - montoAnticipo, 0);
    const saldoYaPagado = montoSaldoPendiente <= 0;
    const estadoErp = pedido.estado === "entregado" ? "entregado" : pedido.estado === "listo" ? "listo_despacho" : "en_preparacion";
    const respInsert = await fetch(`${env.SUPABASE_URL}/rest/v1/pedidos_canal_venta`, {
      method: "POST",
      headers: { ...hdrErpSync(env), Prefer: "return=representation" },
      body: JSON.stringify({
        canal,
        centro_costo_id: centroCostoTiendaId,
        tercero_id: terceroId,
        descripcion_producto: `[CRM ${pedido.numero_pedido || ""}] ${pedido.tipo || ""} ${pedido.descripcion || ""}`.trim(),
        cantidad: pedido.cantidad_unidades || 1,
        valor_producto: total,
        valor_envio: 0,
        total_pedido: total,
        monto_anticipo_requerido: montoAnticipo,
        anticipo_pagado: montoAnticipo > 0,
        fecha_pago_anticipo: montoAnticipo > 0 ? fechaVenta : null,
        metodo_pago_anticipo: montoAnticipo > 0 ? metodoPago : null,
        monto_saldo_requerido: montoSaldoPendiente,
        saldo_pagado: saldoYaPagado,
        fecha_pago_saldo: saldoYaPagado ? fechaVenta : null,
        metodo_pago_saldo: saldoYaPagado ? metodoPago : null,
        estado: estadoErp,
        disponible_en_stock: true,
        referencia_crm_id: pedido.id,
        registrado_por: auth.userId
      })
    });
    if (respInsert.ok) {
      importados++;
      const [nuevoPedido] = await respInsert.json();
      if (montoAnticipo > 0) {
        await fetch(`${env.SUPABASE_URL}/rest/v1/pedidos_canal_pagos`, {
          method: "POST",
          headers: hdrErpSync(env),
          body: JSON.stringify({ pedido_id: nuevoPedido.id, tipo_pago: "anticipo", metodo_pago: metodoPago, monto: montoAnticipo })
        });
        await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/fn_contabilizar_pago_pedido_canal`, {
          method: "POST",
          headers: hdrErpSync(env),
          body: JSON.stringify({ p_pedido_id: nuevoPedido.id, p_tipo_pago: "anticipo" })
        });
      }
      if (montoSaldoPendiente > 0 && terceroId) {
        await fetch(`${env.SUPABASE_URL}/rest/v1/cuentas_por_cobrar_pagar`, {
          method: "POST",
          headers: hdrErpSync(env),
          body: JSON.stringify({
            tipo: "por_cobrar",
            tercero_id: terceroId,
            descripcion: `Saldo pendiente pedido ${pedido.numero_pedido || ""} (CRM)`,
            monto: montoSaldoPendiente,
            fecha_vencimiento: fechaVenta,
            centro_costo_id: centroCostoTiendaId,
            registrado_por: auth.userId
          })
        });
      }
    }
  }
  return jsonResponse({ importados, ya_existian: yaExistian, excluidos_lana_rosa: excluidosLanaRosa, vinculados });
}

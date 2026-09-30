# Worker `lana-rosa-os-pos` — sincronización CRM → ERP corregida

`sincronizacion-crm-v2.js` trae tres funciones nuevas (`...V2`) y sus ayudas. Las funciones viejas se quedan sin usarse; no hay que borrar nada.

## Qué corrige
1. **Clientes duplicados:** antes solo buscaba por cédula. Ahora busca por vínculo con el CRM, cédula, correo y teléfono; si encuentra al cliente lo vincula, y solo crea uno nuevo si no existe.
2. **Medios de pago:** "Nequi", "Efectivo", "Tarjeta débito", "Transferencia"… del CRM se convierten a las claves del ERP (`nequi`, `efectivo`, `tarjeta_debito`, `transferencia`…). Lo que no se reconoce (p. ej. "Otro") queda como `efectivo`; "Wompi" queda como `wompi_otro`.
3. **Pedidos de la web:** los que el ERP ya mandó al CRM (llevan `[ERP:PED-…]` en las notas) no se vuelven a importar; si faltaba el vínculo, se completa. Los de prueba (`[PRUEBA-WEB:…]`) se ignoran.
4. Revisa hasta 500 pedidos del CRM (antes solo los 50 más recientes).

Nota: dos clientes del CRM con el mismo teléfono (por ejemplo, de una misma familia) quedan como un solo tercero en el ERP.

## Cómo aplicarlo (Cloudflare)
1. Cloudflare → **Workers y Pages** → `lana-rosa-os-pos` → **Editar código**.
2. **Respaldo:** selecciona todo el código (Ctrl+A), cópialo y guárdalo en un archivo de texto. Sirve para volver atrás.
3. Con Ctrl+F busca `// src/index.ts`. Pega, **justo encima de esa línea**, todo el contenido de `sincronizacion-crm-v2.js`.
4. En el router (más abajo, dentro de `src/index.ts`) cambia estas tres líneas agregando `V2`:
   - `return await handleSincronizarPedidosCrm(request, env, auth);` → `return await handleSincronizarPedidosCrmV2(request, env, auth);`
   - `return await handleSincronizarVentasContablesCrm(request, env, auth);` → `return await handleSincronizarVentasContablesCrmV2(request, env, auth);`
   - `return await handleSincronizarClientesCrm(request, env, auth);` → `return await handleSincronizarClientesCrmV2(request, env, auth);`
5. **Desplegar** (*Deploy*).
6. Probar en el ERP: *Pedidos Web/Redes → Cargar pedidos nuevos del CRM* y *Directorio → Sincronizar clientes del CRM*. No deben dar error; ahora además informan cuántos quedaron "vinculados".

Para deshacer: pega el respaldo del paso 2 y vuelve a desplegar.

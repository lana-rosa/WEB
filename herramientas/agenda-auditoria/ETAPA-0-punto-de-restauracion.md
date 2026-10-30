# Auditoría de la agenda — Etapa 0: punto de restauración y entorno de pruebas (30-oct-2026)

**Punto de restauración:** commit `b5b248d` de `main` (30-oct-2026, «el diario de tejido alimenta Mi año tejiendo», #446), antes de cualquier cambio de la auditoría. Se intentó crear la etiqueta `pre-auditoria-2026-10-30` en GitHub, pero el servidor la rechazó; la etiqueta existe solo en la copia local. Para volver atrás: `git checkout b5b248d` (o crear una rama desde ese commit).
Base de datos: la migración 39 (cierre de permisos) se aplicó antes de la auditoría y está probada; no hay otros cambios de base planeados en la etapa 1.

**Entorno de pruebas:** cada cambio se prueba en una copia local de la web (`python3 -m http.server 8765`) con navegador automático, en celular (390 px) y computador (1280 px), con cuentas y datos simulados (`herramientas/pruebas/agenda_util.py`). Nada se publica sin tu visto bueno; los cambios viven en la rama de trabajo hasta entonces.

**Datos de las usuarias:** la etapa 1 no cambia ninguna clave de `localStorage` (`rosinaAgenda` y las demás), solo agrega avisos. Las baterías de pruebas de copias, nube, fichas y versiones comprueban que lo ya escrito sigue igual.

**Pruebas manuales que necesito de ti:** `herramientas/agenda-auditoria/pruebas-iphone-samsung.html` (lista corta para hacer con un iPhone y un Samsung).

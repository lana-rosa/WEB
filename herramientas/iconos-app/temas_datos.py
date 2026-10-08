"""Temas del Rincón de Rosina: cada tema = un fondo de pantalla (herramientas/fondos/fondo.html, variante `id`) + 12 íconos de apps
con los colores de ese fondo. Para un tema nuevo: agregar la variante del fondo, agregarlo aquí y correr
python3 herramientas/fondos/generar_fondos.py <id>  y  python3 herramientas/iconos-app/generar_temas.py"""
# id, estación (primavera|verano|otono|invierno|todo), frase, (color de arriba, color de abajo) de los íconos, descripción del fondo
TEMAS = [
 ('rosa', 'primavera', 'Una vuelta a la vez', ('#F9A8CE', '#E96FA7'), 'rosa con corazones y Rosina saludando'),
 ('flores', 'primavera', 'Cada punto, una flor', ('#F7A6C8', '#7CCBA2'), 'rosa y menta con florecitas y Rosina con una flor'),
 ('brote', 'primavera', 'Todo florece a su tiempo', ('#92D9B1', '#3F9F78'), 'verde menta con hojitas y Rosina con un ramo de flores'),
 ('cielo', 'verano', 'Hoy también tejo', ('#A6D3FA', '#5FA8EC'), 'azul cielo con corazones y Rosina abrazando un corazón'),
 ('fucsia', 'verano', 'Tejido con amor', ('#F47DB0', '#D93A86'), 'fucsia con corazones y Rosina haciendo un corazón'),
 ('sol', 'verano', 'Días de sol y lana', ('#FFD27A', '#FF9A5C'), 'amarillo suave con solecitos y Rosina feliz'),
 ('cafe', 'otono', 'Primero café, luego tejo', ('#F4B18F', '#D9775A'), 'durazno con Rosina tomando café'),
 ('hojas', 'otono', 'Tardes de tejer y leer', ('#EDAE72', '#C97536'), 'durazno con hojas y Rosina leyendo'),
 ('hojas2', 'otono', 'Lana, manta y calma', ('#E69E86', '#B5503F'), 'terracota rosado con hojas y Rosina con un ovillo'),
 ('gorro', 'invierno', 'Temporada de tejer', ('#C8B2F6', '#8C6BDB'), 'lila con Rosina y su gorro tejido'),
 ('lila', 'invierno', 'Pequeños pasos, grandes creaciones', ('#B3B8FA', '#7B80E8'), 'lila con estrellas y Rosina tejiendo'),
 ('crema', 'invierno', 'Todo lo bonito también se teje', ('#F6B6D0', '#E07CA8'), 'crema con Rosina y su ovillo'),
 ('terapia', 'todo', 'Tejer es mi terapia', ('#F67FB4', '#E0408C'), 'rosa con Rosina abrazando un ovillo de corazón'),
 ('patron', 'todo', 'Rosina por todas partes', ('#F9A8CE', '#E96FA7'), 'rosa con muchas Rosinas'),
]
EST_NOMBRE = {'primavera': 'primavera', 'verano': 'verano', 'otono': 'otoño', 'invierno': 'invierno', 'todo': 'todo el año'}

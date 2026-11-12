# -*- coding: utf-8 -*-
"""Pedido y proyecto unidos, con horas y lana apartada (E34, 12-nov-2026; js/agenda/pedido-proyecto.js y proyecto-lana.js). Inglés y portugués provisionales; revisados por el chat de idiomas.
Los textos con datos van como plantilla ({a}, {n}, {l}…): esos renglones están en bloques «data-no-traducir», así que los dos archivos pasan el texto por T(). Vocabulario: ovillo = skein / novelo; lana = yarn / lã.
«Lana de este proyecto» (con o sin «:») ya estaba traducida en datos_plus.py."""
FILAS = [
 ('Proyecto de este pedido', 'Project for this order', 'Projeto deste pedido'),
 ('Crear proyecto de este pedido', 'Create a project for this order', 'Criar projeto deste pedido'),
 ('Vincular', 'Link', 'Vincular'),
 ('Quitar el vínculo', 'Remove the link', 'Remover o vínculo'),
 ('Ver proyecto', 'View project', 'Ver projeto'),
 ('Ver pedido', 'View order', 'Ver pedido'),
 ('Pedido de este proyecto', 'Order for this project', 'Pedido deste projeto'),
 ('Proyecto que ya tengo', 'A project I already have', 'Um projeto que eu já tenho'),
 ('Este pedido aún no tiene proyecto. Si lo creas, verás aquí las horas tejidas y la lana apartada.', 'This order has no project yet. If you create one, you will see the crochet hours and the reserved yarn here.', 'Este pedido ainda não tem projeto. Se você criar um, verá aqui as horas de crochê e a lã reservada.'),
 ('O une uno que ya tienes:', 'Or link one you already have:', 'Ou una um que você já tem:'),
 ('Aún no apartaste lana. Se elige en el proyecto, en «Lana de este proyecto».', 'You have not set aside any yarn yet. Choose it in the project, under “Yarn for this project”.', 'Você ainda não reservou lã. Escolha no projeto, em «Lã deste projeto».'),
 ('Anota cuánto vale tu hora en «Mi catálogo de precios» y aquí verás cuánto vale ese tiempo.', 'Enter how much your hour is worth in “My price catalog” and you will see here what that time is worth.', 'Anote quanto vale a sua hora em «Meu catálogo de preços» e aqui você verá quanto vale esse tempo.'),
 ('Tu lista de proyectos está llena. Libera un renglón e inténtalo de nuevo.', 'Your project list is full. Free up a row and try again.', 'Sua lista de projetos está cheia. Libere uma linha e tente de novo.'),
 ('Estado: {a}', 'Status: {a}', 'Status: {a}'),
 ('Último avance: {a}', 'Latest progress: {a}', 'Último avanço: {a}'),
 ('Ese tiempo vale ≈ {a} (horas × tu valor de la hora)', 'That time is worth ≈ {a} (hours × your hourly rate)', 'Esse tempo vale ≈ {a} (horas × o valor da sua hora)'),
 ('{n} × {l} · apartada', '{n} × {l} · reserved', '{n} × {l} · reservada'),
 ('{n} × {l} · descontada', '{n} × {l} · deducted', '{n} × {l} · descontada'),
 ('{n} × {l} · ⚠ no alcanza', '{n} × {l} · ⚠ not enough', '{n} × {l} · ⚠ não alcança'),
 ('{n} × {l} · ⚠ faltan {f}', '{n} × {l} · ⚠ {f} short', '{n} × {l} · ⚠ faltam {f}'),
 ('Te faltan {a} ovillo(s) de {l}: tienes {s} y entre tus proyectos tienes apartados {p}.', 'You are missing {a} skein(s) of {l}: you have {s} and {p} are set aside across your projects.', 'Faltam {a} novelo(s) de {l}: você tem {s} e há {p} reservados entre os seus projetos.'),
 ('Apartados para proyectos: {a} · te faltan {b} ovillo(s).', 'Set aside for projects: {a} · you are {b} skein(s) short.', 'Reservados para projetos: {a} · faltam {b} novelo(s).'),
 ('Apartados para proyectos: {a} · libres: {b}.', 'Set aside for projects: {a} · free: {b}.', 'Reservados para projetos: {a} · livres: {b}.'),
 ('Del pedido de {a}', 'From {a}’s order', 'Do pedido de {a}'),
 ('Del pedido {a#}', 'From order {a}', 'Do pedido {a}'),
]

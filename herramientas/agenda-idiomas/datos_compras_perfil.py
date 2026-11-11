# -*- coding: utf-8 -*-
"""Lista de compras que pasa al inventario de lanas y medidas y gustos de la clienta (E34, 12-nov-2026; js/agenda/compras-inventario.js y clientas-perfil.js).
Inglés y portugués provisionales; revisados por el chat de idiomas. Vocabulario: ovillo = skein / novelo; lana = yarn / lã. «Inventario de lanas» y «Deshacer» ya estaban traducidos.
«Ya entró al inventario…» y el contador «N datos» estaban en bloques «data-no-traducir»: los dos archivos los pasan por T()."""
FILAS = [
 ('Pasar al inventario', 'Move to inventory', 'Passar para o inventário'),
 ('Esta compra se parece a «{a}». Súmala a esa lana.', 'This purchase looks like “{a}”. Add it to that yarn.', 'Esta compra se parece com «{a}». Some à essa lã.'),
 ('Si es una lana, pásala al inventario como lana nueva con {n} ovillo(s).', 'If it is a yarn, move it to the inventory as a new yarn with {n} skein(s).', 'Se for uma lã, passe para o inventário como lã nova com {n} novelo(s).'),
 ('Ya entró al inventario: +{n} de {l}.', 'Already added to the inventory: +{n} of {l}.', 'Já entrou no inventário: +{n} de {l}.'),
 ('Sumé {n} ovillo(s) a {l} en tu inventario.', 'I added {n} skein(s) to {l} in your inventory.', 'Somei {n} novelo(s) a {l} no seu inventário.'),
 ('No pude crear la lana. Revisa que el material tenga nombre.', 'I couldn’t create the yarn. Check that the material has a name.', 'Não consegui criar a lã. Confira se o material tem nome.'),
 ('Medidas y gustos', 'Measurements and preferences', 'Medidas e gostos'),
 ('Guarda estos datos solo si tu clienta te dio permiso.', 'Save this information only if your customer gave you permission.', 'Guarde estes dados somente se a sua cliente deu permissão.'),
 ('Medidas', 'Measurements', 'Medidas'),
 ('Gustos', 'Preferences', 'Gostos'),
 ('Busto o pecho (cm)', 'Bust or chest (cm)', 'Busto ou peito (cm)'),
 ('Cintura (cm)', 'Waist (cm)', 'Cintura (cm)'),
 ('Cadera (cm)', 'Hip (cm)', 'Quadril (cm)'),
 ('Largo de la prenda (cm)', 'Garment length (cm)', 'Comprimento da peça (cm)'),
 ('Contorno de la cabeza (cm)', 'Head circumference (cm)', 'Contorno da cabeça (cm)'),
 ('Colores que le gustan', 'Colors she likes', 'Cores de que ela gosta'),
 ('Colores que evita', 'Colors she avoids', 'Cores que ela evita'),
 ('Fibras o lanas que prefiere', 'Fibers or yarns she prefers', 'Fibras ou lãs que ela prefere'),
 ('Alergias o cuidados con los materiales', 'Allergies or care with materials', 'Alergias ou cuidados com os materiais'),
 ('Otras notas', 'Other notes', 'Outras notas'),
 ('{n#} dato', '{n} item', '{n} dado'),
 ('{n#} datos', '{n} items', '{n} dados'),
]

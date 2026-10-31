# -*- coding: utf-8 -*-
"""Etapa 2, lote 5 (31-oct-2026): Mis materiales (lanas, agujas, compras) y Fechas y bienestar (calendario, fechas especiales, diario, pausas)."""
MES = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre'
DIA = 'lunes|martes|miércoles|jueves|viernes|sábado|domingo'
FILAS = [
 # --- Inventario de lanas
 ('¿Te falta una lana o un hilo? Mira la Mercería Lana Rosa', 'Missing a yarn or thread? Check Lana Rosa Mercería', 'Está faltando uma lã ou linha? Veja a Mercería Lana Rosa'),
 ('Material de la Mercería', 'Mercería supply', 'Material da Mercería'),
 ('Aún no hay lanas. Anota las que tienes en casa para saber qué te alcanza. Ejemplo: «Alize · rosa · 3 ovillos».', 'There is no yarn yet. Write down what you have at home to know what is enough. Example: “Alize · pink · 3 skeins”.', 'Ainda não há lãs. Anote as que você tem em casa para saber o que dá. Exemplo: «Alize · rosa · 3 novelos».'),
 ('Marca', 'Brand', 'Marca'), ('Grosor', 'Weight', 'Espessura'), ('Ovillos', 'Skeins', 'Novelos'), ('Lo usé en', 'I used it in', 'Usei em'), ('Agregar lana o hilo', 'Add yarn or thread', 'Adicionar lã ou linha'),
 ('guarda la etiqueta de cada ovillo; ahí están la marca, el grosor y el número de tintura para comprar el mismo tono.', 'keep the label of each skein; it has the brand, the weight and the dye lot number so you can buy the same shade.', 'guarde a etiqueta de cada novelo; ali estão a marca, a espessura e o número do lote de tingimento para comprar o mesmo tom.'),
 # --- Mis agujas
 ('{n} mm', '{n} mm', '{n} mm'),
 ('Mis agujas y cuándo las compré', 'My hooks and when I bought them', 'Minhas agulhas e quando as comprei'),
 ('anota la fecha de compra de cada aguja y te sugiero cuándo revisarla o cambiarla. Es una guía general: cámbiala antes si ves astillas, rayones o si raspa el hilo.', 'write down the purchase date of each hook and I will suggest when to check or replace it. It is a general guide: replace it sooner if you see splinters, scratches or if it snags the yarn.', 'anote a data de compra de cada agulha e eu sugiro quando revisá-la ou trocá-la. É um guia geral: troque antes se vir farpas, riscos ou se ela arranhar a linha.'),
 ('Aún no hay agujas. Anota las que usas. Ejemplo: «3,5 mm · aluminio».', 'There are no hooks yet. Write down the ones you use. Example: “3.5 mm · aluminum”.', 'Ainda não há agulhas. Anote as que você usa. Exemplo: «3,5 mm · alumínio».'),
 ('Medida (mm)', 'Size (mm)', 'Medida (mm)'), ('Material', 'Material', 'Material'), ('Fecha de compra', 'Purchase date', 'Data da compra'),
 ('Medida (mm) de la aguja {n#}', 'Hook {n} size (mm)', 'Medida (mm) da agulha {n}'), ('Material de la aguja {n#}', 'Hook {n} material', 'Material da agulha {n}'),
 ('Aluminio', 'Aluminum', 'Alumínio'), ('Acero', 'Steel', 'Aço'), ('Bambú o madera', 'Bamboo or wood', 'Bambu ou madeira'), ('Plástico', 'Plastic', 'Plástico'), ('Ergonómica con mango', 'Ergonomic with handle', 'Ergonômica com cabo'), ('Otro', 'Other', 'Outro'),
 ('Agregar una aguja', 'Add a hook', 'Adicionar uma agulha'), ('¿Necesitas una aguja nueva? Mira las de la Mercería Lana Rosa', 'Need a new hook? Check the ones at Lana Rosa Mercería', 'Precisa de uma agulha nova? Veja as da Mercería Lana Rosa'),
 ('Agujas y accesorios de la Mercería', 'Hooks and accessories from the Mercería', 'Agulhas e acessórios da Mercería'),
 ('Otras agujas y accesorios (agujas lanera, de tunecino, marcadores…)', 'Other hooks and accessories (yarn needles, Tunisian hooks, stitch markers…)', 'Outras agulhas e acessórios (agulhas de tapeceiro, de crochê tunisiano, marcadores…)'),
 # --- Lista de compras
 ('Agregar un material de la Mercería Lana Rosa', 'Add a supply from Lana Rosa Mercería', 'Adicionar um material da Mercería Lana Rosa'), ('Agregar a mi lista', 'Add to my list', 'Adicionar à minha lista'),
 ('Aún no hay nada por comprar. Anota lo que te falta. Ejemplo: «Relleno siliconado · 1 bolsa».', 'There is nothing to buy yet. Write down what you are missing. Example: “Silicone stuffing · 1 bag”.', 'Ainda não há nada para comprar. Anote o que está faltando. Exemplo: «Enchimento de silicone · 1 saco».'),
 ('Color o referencia', 'Color or reference', 'Cor ou referência'), ('Cantidad', 'Quantity', 'Quantidade'), ('Comprado', 'Bought', 'Comprado'), ('Comprado de la compra {n#}', 'Purchase {n} bought', 'Compra {n} comprada'),
 ('Agregar material', 'Add material', 'Adicionar material'), ('Enviar mi lista por WhatsApp', 'Send my list on WhatsApp', 'Enviar minha lista pelo WhatsApp'),
 # --- Calendario del año
 ('Días de la semana', 'Days of the week', 'Dias da semana'), ('Semana anterior', 'Previous week', 'Semana anterior'), ('Semana siguiente', 'Next week', 'Próxima semana'),
 ('{w=' + DIA + '} {d#} de {m=' + MES + '}, sin nada', '{w}, {m} {d}, nothing scheduled', '{w}, {d} de {m}, sem nada'),
 ('{w=' + DIA + '} {d#} de {m=' + MES + '}', '{w}, {m} {d}', '{w}, {d} de {m}'),
 ('hoy', 'today', 'hoje'), ('Nada anotado para este día. Escribe una fecha en tus hojas de pedidos, proyectos, fechas especiales, ferias o clientas y aparecerá aquí.', 'Nothing recorded for this day. Write a date in your orders, projects, special dates, fairs or clients pages and it will show up here.', 'Nada anotado para este dia. Escreva uma data nas suas páginas de pedidos, projetos, datas especiais, feiras ou clientes e ela aparecerá aqui.'),
 ('Lo que viene', 'What is coming', 'O que vem por aí'), ('Ver el año completo', 'See the whole year', 'Ver o ano completo'), ('Toca un día marcado para ver qué tienes ese día.', 'Tap a marked day to see what you have that day.', 'Toque num dia marcado para ver o que você tem nesse dia.'),
 ('este calendario se llena solo con las fechas que escribes en pedidos, proyectos en fila, fechas especiales, ferias y clientas. Los días con puntitos de color tienen algo para ti.', 'this calendar fills itself with the dates you write in orders, queued projects, special dates, fairs and clients. Days with colored dots have something for you.', 'este calendário se preenche sozinho com as datas que você escreve em pedidos, projetos na fila, datas especiais, feiras e clientes. Os dias com pontinhos coloridos têm algo para você.'),
 # --- Fechas especiales
 ('Aún no hay fechas especiales. Anota cumpleaños y celebraciones para tejer con tiempo. Ejemplo: «Cumpleaños de mamá · 20 de noviembre».', 'There are no special dates yet. Write down birthdays and celebrations to crochet in time. Example: “Mom’s birthday · November 20”.', 'Ainda não há datas especiais. Anote aniversários e comemorações para crochetar com tempo. Exemplo: «Aniversário da mamãe · 20 de novembro».'),
 ('Ocasión', 'Occasion', 'Ocasião'), ('Idea de regalo', 'Gift idea', 'Ideia de presente'), ('Ocasión de la fecha {n#}', 'Date {n} occasion', 'Ocasião da data {n}'), ('Listo de la fecha {n#}', 'Date {n} done', 'Data {n} pronta'),
 ('Día de la madre', 'Mother’s Day', 'Dia das Mães'), ('Día del padre', 'Father’s Day', 'Dia dos Pais'), ('Amor y amistad', 'Love and friendship', 'Amor e amizade'), ('Graduación', 'Graduation', 'Formatura'),
 ('Aniversario', 'Anniversary', 'Aniversário de casamento'), ('Otra', 'Other', 'Outra'), ('Agregar fecha', 'Add date', 'Adicionar data'),
 ('en Colombia el Día de la madre es el segundo domingo de mayo, el Día del padre el tercer domingo de junio y Amor y amistad el tercer sábado de septiembre. ¡Empieza a tejer al menos un mes antes!', 'in Colombia Mother’s Day is the second Sunday of May, Father’s Day the third Sunday of June and Love and Friendship Day the third Saturday of September. Start crocheting at least a month ahead!', 'na Colômbia o Dia das Mães é no segundo domingo de maio, o Dia dos Pais no terceiro domingo de junho e Amor e amizade no terceiro sábado de setembro. Comece a crochetar pelo menos um mês antes!'),
 # --- Diario de tejido
 ('Aún no hay días anotados. Cuenta cómo te fue tejiendo. Ejemplo: «Hoy terminé la cabeza del osito».', 'There are no days recorded yet. Tell how crocheting went. Example: “Today I finished the teddy bear’s head”.', 'Ainda não há dias anotados. Conte como foi crochetar. Exemplo: «Hoje terminei a cabeça do ursinho».'),
 ('¿Cómo me sentí?', 'How did I feel?', 'Como me senti?'), ('Qué tejí', 'What I crocheted', 'O que crochetei'), ('Una frase para recordar', 'A phrase to remember', 'Uma frase para lembrar'), ('¿Cómo me sentí? del día {n#}', 'How I felt on day {n}', 'Como me senti no dia {n}'),
 ('Feliz', 'Happy', 'Feliz'), ('Tranquila', 'Calm', 'Tranquila'), ('Inspirada', 'Inspired', 'Inspirada'), ('Cansada', 'Tired', 'Cansada'), ('Frustrada', 'Frustrated', 'Frustrada'), ('Agregar día', 'Add day', 'Adicionar dia'),
 ('tejer también es un momento para ti. Respira, disfruta cada vuelta y no te afanes.', 'crocheting is also a moment for you. Breathe, enjoy every round and do not rush.', 'crochetar também é um momento para você. Respire, aproveite cada carreira e não se apresse.'),
 # --- Registro de pausas activas
 ('Del Rincón de Rosina', 'From Rosina’s Corner', 'Do Cantinho da Rosina'), ('Pausas activas para tejedoras', 'Active breaks for crocheters', 'Pausas ativas para crocheteiras'),
 ('Marca los días en que hiciste tus pausas activas mientras tejías.', 'Mark the days you took your active breaks while crocheting.', 'Marque os dias em que você fez as suas pausas ativas enquanto crochetava.'),
 ('cada 30 o 40 minutos de tejido, estira manos, cuello y espalda. Mira las', 'every 30 or 40 minutes of crocheting, stretch your hands, neck and back. Check the', 'a cada 30 ou 40 minutos de crochê, alongue mãos, pescoço e costas. Veja as'),
 ('pausas activas de Rosina', 'Rosina’s active breaks', 'pausas ativas da Rosina'),
]

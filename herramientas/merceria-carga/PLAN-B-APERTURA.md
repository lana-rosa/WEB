# Mercería: calendario de carga y plan B para el 13-dic-2026 (borrador del 15-nov-2026, encargo E20)

Capturas del estado de hoy (sin existencias) en `herramientas/capturas/2026-11-15-plan-b-merceria/`.

## 1. Calendario para llegar a tiempo (la apertura es el domingo 13-dic)
| Qué | Fecha | Por qué |
|---|---|---|
| Excel lleno de la Mercería | **viernes 20-nov** (ideal) · **viernes 27-nov** (última fecha útil) | El valor de la mercancía hay que llevarlo al contador en su reunión (23-nov a 4-dic) para el saldo de apertura; y con el Excel el 27-nov quedan 5 días para cargar, revisar y fijar precios antes del conteo físico (7 a 9-dic). |
| 34 fotos de las lanas | **viernes 27-nov** (última: martes 1-dic) | Subirlas, generar miniaturas y revisarlas en celular toma 1 día. |
| Carga al ERP y precios | 28-nov a 4-dic | Claude genera el SQL, se revisa el resumen con Jennifer y se carga; precios con la regla del 40 %. |
| Prueba de un ovillo con Wompi | 2 a 5-dic | Solo se puede con existencias cargadas. |
| Conteo físico (Tienda y Taller) | 7 a 9-dic | La Mercería ya debe estar cargada para contarla. |
| Ensayo de caja | 10 a 12-dic | |

## 2. Qué hacer si solo llega una parte
- **Solo el Excel (sin fotos):** se carga igual. Las tarjetas sin foto muestran solo el nombre; se puede dejar visibles solo las lanas que ya tengan foto y el resto en «Muy pronto».
- **Solo las fotos (sin Excel):** se suben, pero la web no cambia hasta que haya existencias.
- **Excel a medias:** se cargan primero los ítems completos (por ejemplo, las lanas por ovillo). Lo demás se carga después; el catálogo se llena solo.

## 3. Plan B: cómo se vería la Mercería el 13-dic si no hay existencias
Lo que **ya funciona hoy** (probado, capturas 1 a 4):
- `/merceria/catalogo/` muestra «Muy pronto · Nuestra mercería en línea está por abrir» con el botón **«Avísame cuando abra»** (lista de espera, `avisarme_apertura_merceria`, probada con 29 comprobaciones). Cuando entra un producto con existencias, el aviso desaparece solo.
- La Tienda de amigurumis sigue completa (77 productos).
- Los textos de la tienda física cambian solos el 14-dic (`js/apertura.js`).

Lo que **propongo cambiar** (nada está hecho; cada uno necesita el sí de Jennifer):
1. En `/merceria/` el botón principal «Ver los materiales» lleva a un catálogo vacío. Mientras no haya existencias, cambiarlo a «Avísame cuando abra». Esfuerzo bajo.
2. Poner en `/merceria/tienda-fisica/` y en las preguntas frecuentes de la Mercería una fecha real de llegada de los materiales, **solo si Sara la da**. No inventar fecha. Esfuerzo bajo.
3. Redes y avisos: contar que la tienda física abre el 13-dic y que los materiales llegan «pronto» (coordinar con el chat 8). Sin esfuerzo de código.

## 4. Mensaje para Jennifer → Sara (listo para copiar)
> Hola Sara 🌸 Para tener la Mercería lista el 13 de diciembre necesito dos cosas:
> 1) El Excel de la Mercería lleno (la plantilla `plantilla_carga_merceria.xlsx`: cantidad comprada y costo de cada lana, hilo y accesorio que se vende).
> 2) Las 34 fotos de las lanas (una por color).
> ¿Me los puedes pasar **a más tardar el viernes 20 de noviembre**? Si no alcanzas, el **viernes 27** es la última fecha para cargarlo, fotografiarlo y probarlo antes del conteo del 7 de diciembre. Si solo alcanzas una parte, mándame esa: cargamos primero lo que esté completo y lo demás después. ¡Gracias!

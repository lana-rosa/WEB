# -*- coding: utf-8 -*-
"""Pagos de cada pedido (abonos con fecha, E34, 12-nov-2026; js/agenda/abonos.js). Inglés y portugués provisionales; revisados por el chat de idiomas.
Los textos con cifras van como plantilla ({a}, {b}, {c} = valores en pesos, que no se traducen); abonos.js los pasa por T() porque están en un bloque «data-no-traducir»."""
FILAS = [
 ('Pagos de este pedido', 'Payments for this order', 'Pagamentos deste pedido'),
 ('Registrar abono', 'Record payment', 'Registrar pagamento'),
 ('Poner lo que falta', 'Fill in the balance', 'Colocar o que falta'),
 ('Quitar este abono', 'Remove this payment', 'Remover este pagamento'),
 ('Valor del abono', 'Payment amount', 'Valor do pagamento'),
 ('Fecha del abono', 'Payment date', 'Data do pagamento'),
 ('Escribe el total de la compra para ver cuánto falta por cobrar.', 'Enter the purchase total to see how much is left to collect.', 'Escreva o total da compra para ver quanto falta receber.'),
 ('Escribe cuánto abonó (un número mayor que 0).', 'Enter how much was paid (a number greater than 0).', 'Escreva quanto foi pago (um número maior que 0).'),
 ('Primero escribe el total de la compra.', 'First enter the purchase total.', 'Primeiro escreva o total da compra.'),
 ('El abono es mayor que el total de la compra: revisa los valores.', 'The payment is greater than the purchase total: please check the values.', 'O pagamento é maior que o total da compra: confira os valores.'),
 ('Cambiaste el abono a mano y ahora es menor que la suma de los pagos de la lista: revisa los valores.', 'You changed the paid amount by hand and it is now lower than the sum of the payments in the list: please check the values.', 'Você alterou o valor pago à mão e agora ele é menor que a soma dos pagamentos da lista: confira os valores.'),
 ('Abonado {a} de {b} · Falta {c}', 'Paid {a} of {b} · {c} left', 'Pago {a} de {b} · Falta {c}'),
 ('Pagado completo · {a}', 'Paid in full · {a}', 'Pago por completo · {a}'),
 ('Anticipo anotado: {a}', 'Deposit recorded: {a}', 'Sinal registrado: {a}'),
 ('Ese abono es mayor que lo que falta por cobrar ({a}). Escribe un valor menor o igual.', 'That payment is greater than what is left to collect ({a}). Enter a smaller or equal amount.', 'Esse pagamento é maior que o que falta receber ({a}). Escreva um valor menor ou igual.'),
]

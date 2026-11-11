# -*- coding: utf-8 -*-
"""Validaciones de pedidos y clientas (E34, 12-nov-2026; js/agenda/validar-agenda.js). Inglés y portugués provisionales; revisados por el chat de idiomas.
El aviso del WhatsApp repetido lleva nombres de clientas: va como plantilla y validar-agenda.js lo pasa por T(); con varios nombres salen todos entre «» (los separa '», «')."""
FILAS = [
 ('No puede ser negativo. Quité el signo menos.', 'It can’t be negative. I removed the minus sign.', 'Não pode ser negativo. Tirei o sinal de menos.'),
 ('Este valor es negativo: corrígelo.', 'This value is negative: please correct it.', 'Este valor é negativo: corrija.'),
 ('Ya tienes a «{a}» con este WhatsApp.', 'You already have «{a}» with this WhatsApp number.', 'Você já tem «{a}» com este WhatsApp.'),
]

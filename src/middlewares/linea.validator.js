"use strict";

const mongoose = require('mongoose');
const AppError = require('../utils/appError');

// Una posición GeoJSON válida es [longitud, latitud] con números en rango
function isValidPosition(p) {
    return Array.isArray(p) &&
        p.length === 2 &&
        typeof p[0] === 'number' && Number.isFinite(p[0]) && p[0] >= -180 && p[0] <= 180 &&
        typeof p[1] === 'number' && Number.isFinite(p[1]) && p[1] >= -90 && p[1] <= 90;
}

const ALLOWED_FIELDS = ['codigo', 'nombre', 'color', 'estaciones', 'recorrido'];
const REQUIRED_FIELDS = ['codigo', 'nombre', 'color', 'recorrido'];

function validateLineaPayload(options = {}) {
    const { partial = false } = options;

    return function lineaPayloadValidator(req, res, next) {
        const errors = [];
        const body = req.body || {};
        const providedFields = ALLOWED_FIELDS.filter(f => body[f] !== undefined);

        if (partial && providedFields.length === 0) {
            errors.push('Debes ingresar al menos un campo para actualizar');
        }

        if (!partial) {
            REQUIRED_FIELDS.forEach(f => {
                if (body[f] === undefined || body[f] === '') {
                    errors.push(`El campo ${f} es obligatorio`);
                }
            });
        }

        if (body.codigo !== undefined) {
            if (typeof body.codigo !== 'string' || body.codigo.trim().length < 2) {
                errors.push('El código debe contener al menos 2 caracteres');
            }
            if (typeof body.codigo === 'string' && body.codigo.trim().length > 20) {
                errors.push('El código debe contener máximo 20 caracteres');
            }
        }

        if (body.nombre !== undefined) {
            if (typeof body.nombre !== 'string' || body.nombre.trim().length < 3) {
                errors.push('El nombre de la línea debe contener al menos 3 caracteres');
            }
            if (typeof body.nombre === 'string' && body.nombre.trim().length > 100) {
                errors.push('El nombre de la línea debe contener máximo 100 caracteres');
            }
        }

        if (body.color !== undefined) {
            const hexRegex = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
            if (typeof body.color !== 'string' || !hexRegex.test(body.color.trim())) {
                errors.push('El color debe ser un código hexadecimal válido (ej. #D62828)');
            }
        }

        if (body.estaciones !== undefined) {
            if (!Array.isArray(body.estaciones)) {
                errors.push('El campo estaciones debe ser un arreglo de IDs');
            } else {
                const invalidId = body.estaciones.some(id => !mongoose.Types.ObjectId.isValid(id));
                if (invalidId) {
                    errors.push('Todos los elementos de estaciones deben ser ObjectId válidos');
                }
            }
        }

        if (body.recorrido !== undefined) {
            if (
                typeof body.recorrido !== 'object' ||
                body.recorrido === null ||
                body.recorrido.type !== 'LineString' ||
                !Array.isArray(body.recorrido.coordinates) ||
                body.recorrido.coordinates.length < 2
            ) {
                errors.push('El recorrido debe ser un GeoJSON LineString válido con al menos 2 puntos');
            } else if (!body.recorrido.coordinates.every(isValidPosition)) {
                errors.push('Cada punto del recorrido debe ser [longitud, latitud] numéricos (longitud -180 a 180, latitud -90 a 90)');
            }
        }

        const unknownFields = Object.keys(body).filter(f => !ALLOWED_FIELDS.includes(f));
        if (unknownFields.length > 0) {
            errors.push(`Campos no permitidos: ${unknownFields.join(', ')}`);
        }

        if (errors.length > 0) {
            return next(new AppError(400, 'La información enviada no es válida', errors));
        }

        return next();
    };
}

function validateLineaQuery(req, res, next) {
    const { search } = req.query;
    const errors = [];

    if (search !== undefined && typeof search !== 'string') {
        errors.push('El parámetro search debe ser texto');
    }

    if (errors.length > 0) {
        return next(new AppError(400, 'Parámetros de consulta no válidos', errors));
    }

    return next();
}

function validateLineaNumEstaciones(req, res, next) {
    if (!/^\d+$/.test(req.params.num)) {
        return next(new AppError(400, 'El número de estaciones debe ser un entero mayor o igual a 0'));
    }

    return next();
}

module.exports = {
    validateLineaPayload,
    validateLineaQuery,
    validateLineaNumEstaciones
};
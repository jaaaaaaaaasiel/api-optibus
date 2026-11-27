"use strict";

const AppError = require('../utils/appError');

// Una posición GeoJSON válida es [longitud, latitud] con números en rango
function isValidPosition(p) {
    return Array.isArray(p) &&
        p.length === 2 &&
        typeof p[0] === 'number' && Number.isFinite(p[0]) && p[0] >= -180 && p[0] <= 180 &&
        typeof p[1] === 'number' && Number.isFinite(p[1]) && p[1] >= -90 && p[1] <= 90;
}

// Un anillo debe tener >= 4 posiciones válidas y estar cerrado
function isValidRing(ring) {
    if (!Array.isArray(ring) || ring.length < 4 || !ring.every(isValidPosition)) return false;
    const first = ring[0];
    const last = ring[ring.length - 1];
    return first[0] === last[0] && first[1] === last[1];
}

const ALLOWED_FIELDS = ['nombre', 'color', 'area'];
const REQUIRED_FIELDS = ['nombre', 'color', 'area'];

function validateZonaPayload(options = {}) {
    const { partial = false } = options;

    return function zonaPayloadValidator(req, res, next) {
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

        if (body.nombre !== undefined) {
            if (typeof body.nombre !== 'string' || body.nombre.trim().length < 3) {
                errors.push('El nombre de la zona debe contener al menos 3 caracteres');
            }
            if (typeof body.nombre === 'string' && body.nombre.trim().length > 80) {
                errors.push('El nombre de la zona debe contener máximo 80 caracteres');
            }
        }

        if (body.color !== undefined) {
            const hexRegex = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
            if (typeof body.color !== 'string' || !hexRegex.test(body.color.trim())) {
                errors.push('El color debe ser un código hexadecimal válido (ej. #2A9D8F)');
            }
        }

        if (body.area !== undefined) {
            if (
                typeof body.area !== 'object' ||
                body.area === null ||
                body.area.type !== 'Polygon' ||
                !Array.isArray(body.area.coordinates) ||
                body.area.coordinates.length === 0 ||
                !Array.isArray(body.area.coordinates[0]) ||
                body.area.coordinates[0].length < 4
            ) {
                errors.push('El área debe ser un GeoJSON Polygon válido con al menos 4 vértices cerrados');
            } else if (!body.area.coordinates.every(isValidRing)) {
                errors.push('Cada anillo del área debe tener al menos 4 posiciones [longitud, latitud] válidas y estar cerrado (primer y último punto iguales)');
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

function validateZonaQuery(req, res, next) {
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

module.exports = {
    validateZonaPayload,
    validateZonaQuery
};
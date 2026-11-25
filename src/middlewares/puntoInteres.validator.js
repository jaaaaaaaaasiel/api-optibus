"use strict";

const AppError = require('../utils/appError');

const ALLOWED_FIELDS = ['nombre', 'description', 'latitude', 'longitude'];
const REQUIRED_FIELDS = ['nombre', 'latitude', 'longitude'];

function validatePuntoInteresPayload(options = {}) {
    const { partial = false } = options;

    return function puntoInteresPayloadValidator(req, res, next) {
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
                errors.push('El nombre debe contener al menos 3 caracteres');
            }
            if (typeof body.nombre === 'string' && body.nombre.trim().length > 100) {
                errors.push('El nombre debe contener máximo 100 caracteres');
            }
        }

        if (body.description !== undefined) {
            if (typeof body.description !== 'string' || body.description.trim().length > 250) {
                errors.push('La descripción debe ser texto y contener máximo 250 caracteres');
            }
        }

        if (body.latitude !== undefined) {
            const latitude = Number(body.latitude);
            if (!Number.isFinite(latitude)) {
                errors.push('La latitud debe ser numérica');
            } else if (latitude < -90 || latitude > 90) {
                errors.push('La latitud debe estar entre -90 y 90');
            }
            req.body.latitude = latitude;
        }

        if (body.longitude !== undefined) {
            const longitude = Number(body.longitude);
            if (!Number.isFinite(longitude)) {
                errors.push('La longitud debe ser numérica');
            } else if (longitude < -180 || longitude > 180) {
                errors.push('La longitud debe estar entre -180 y 180');
            }
            req.body.longitude = longitude;
        }

        if ((body.latitude !== undefined) !== (body.longitude !== undefined)) {
            errors.push('Debes proporcionar tanto latitude como longitude');
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

function validatePuntoInteresQuery(req, res, next) {
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
    validatePuntoInteresPayload,
    validatePuntoInteresQuery
};
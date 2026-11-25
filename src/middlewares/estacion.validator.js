"use strict";

const AppError = require('../utils/appError');

const ALLOWED_TYPES = [
    'terminal_transferencia',
    'paradero_troncal',
    'parada_alimentadora'
];

const ALLOWED_STATUS = [
    'operativa',
    'mantenimiento',
    'cerrada'
];

const ALLOWED_FIELDS = ['nombre', 'type', 'estado', 'latitude', 'longitude'];
const REQUIRED_FIELDS = ['nombre', 'type', 'latitude', 'longitude'];

function validateEstacionPayload(options = {}) {
    const { partial = false } = options;

    return function estacionPayloadValidator(req, res, next) {
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
            if (typeof body.nombre === 'string' && body.nombre.trim().length > 80) {
                errors.push('El nombre debe contener máximo 80 caracteres');
            }
        }

        if (body.type !== undefined && !ALLOWED_TYPES.includes(body.type)) {
            errors.push(`El tipo debe ser uno de los siguientes: ${ALLOWED_TYPES.join(', ')}`);
        }

        if (body.estado !== undefined && !ALLOWED_STATUS.includes(body.estado)) {
            errors.push(`El estado debe ser uno de los siguientes: ${ALLOWED_STATUS.join(', ')}`);
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

function validateEstacionQuery(req, res, next) {
    const { search, type, estado } = req.query;
    const errors = [];

    if (search !== undefined && typeof search !== 'string') {
        errors.push('El parámetro search debe ser texto');
    }
    if (type !== undefined && type !== 'all' && !ALLOWED_TYPES.includes(type)) {
        errors.push('El type en el filtrado no es válido');
    }
    if (estado !== undefined && estado !== 'all' && !ALLOWED_STATUS.includes(estado)) {
        errors.push('El estado de filtrado no es válido');
    }

    if (errors.length > 0) {
        return next(new AppError(400, 'Parámetros de consulta no válidos', errors));
    }

    return next();
}

module.exports = {
    validateEstacionPayload,
    validateEstacionQuery,
    ALLOWED_TYPES,
    ALLOWED_STATUS
};
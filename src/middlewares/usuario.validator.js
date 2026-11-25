"use strict";

const AppError = require('../utils/appError');

const ALLOWED_ROLES = ['admin', 'user'];

const ALLOWED_FIELDS = ['nombre', 'email', 'password', 'rol', 'activo'];
const REQUIRED_FIELDS = ['nombre', 'email', 'password'];

function validateUsuarioPayload(options = {}) {
    const { partial = false } = options;

    return function usuarioPayloadValidator(req, res, next) {
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

        if (body.email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (typeof body.email !== 'string' || !emailRegex.test(body.email.trim())) {
                errors.push('El correo electrónico no tiene un formato válido');
            }
        }

        if (body.password !== undefined) {
            if (typeof body.password !== 'string' || body.password.length < 6) {
                errors.push('La contraseña debe contener al menos 6 caracteres');
            }
        }

        if (body.rol !== undefined && !ALLOWED_ROLES.includes(body.rol)) {
            errors.push(`El rol debe ser uno de los siguientes: ${ALLOWED_ROLES.join(' o ')}`);
        }

        if (body.activo !== undefined && typeof body.activo !== 'boolean') {
            errors.push('El campo activo debe ser booleano (true o false)');
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

function validateUsuarioQuery(req, res, next) {
    const { search, rol, activo } = req.query;
    const errors = [];

    if (search !== undefined && typeof search !== 'string') {
        errors.push('El parámetro search debe ser texto');
    }
    if (rol !== undefined && rol !== 'all' && !ALLOWED_ROLES.includes(rol)) {
        errors.push('El rol de filtrado no es válido');
    }
    if (activo !== undefined && activo !== 'all' && activo !== 'true' && activo !== 'false') {
        errors.push('El parámetro activo debe ser true, false o all');
    }

    if (errors.length > 0) {
        return next(new AppError(400, 'Parámetros de consulta no válidos', errors));
    }

    return next();
}

module.exports = {
    validateUsuarioPayload,
    validateUsuarioQuery,
    ALLOWED_ROLES
};
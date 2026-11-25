"use strict";

const mongoose = require('mongoose');
const { ALLOWED_ROLES } = require('../middlewares/usuario.validator');

const usuarioSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            select: false
        },
        rol: {
            type: String,
            required: true,
            enum: ALLOWED_ROLES,
            default: 'user'
        },
        activo: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform(doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.password;
                return ret;
            }
        }
    }
);

const UsuarioModel = mongoose.model('Usuario', usuarioSchema);

module.exports = UsuarioModel;
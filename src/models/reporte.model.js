"use strict";

const mongoose = require('mongoose');
const { ALLOWED_TYPES, ALLOWED_STATUS } = require('../middlewares/reporte.validator');

const reporteSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        type: {
            type: String,
            required: true,
            enum: ALLOWED_TYPES
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300
        },
        estado: {
            type: String,
            required: true,
            enum: ALLOWED_STATUS,
            default: 'pendiente'
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
                required: true
            },
            coordinates: {
                type: [Number],
                required: true
            }
        },
        usuarioId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true
        },
        estacionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Estacion',
            required: true
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
                return ret;
            }
        }
    }
);

reporteSchema.index({ location: '2dsphere' });

const ReporteModel = mongoose.model('Reporte', reporteSchema);

module.exports = ReporteModel;
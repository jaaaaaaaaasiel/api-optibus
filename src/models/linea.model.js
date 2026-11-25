"use strict";

const mongoose = require('mongoose');

const lineaSchema = new mongoose.Schema(
    {
        codigo: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 20
        },
        nombre: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 100
        },
        color: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        estaciones: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Estacion'
            }
        ],
        recorrido: {
            type: {
                type: String,
                enum: ['LineString'],
                default: 'LineString',
                required: true
            },
            coordinates: {
                type: [[Number]],
                required: true
            }
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
        },
        toObject: { virtuals: true }
    }
);

lineaSchema.index({ recorrido: '2dsphere' });

lineaSchema.virtual('num_estaciones').get(function () {
    return Array.isArray(this.estaciones) ? this.estaciones.length : 0;
});

const LineaModel = mongoose.model('Linea', lineaSchema);

module.exports = LineaModel;
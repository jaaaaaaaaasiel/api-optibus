"use strict";

const mongoose = require('mongoose');
const { ALLOWED_TYPES, ALLOWED_STATUS } = require('../middlewares/estacion.validator');

const estacionSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },
        type: {
            type: String,
            required: true,
            enum: ALLOWED_TYPES
        },
        estado: {
            type: String,
            required: true,
            enum: ALLOWED_STATUS,
            default: 'operativa'
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
        zonaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Zona',
            default: null
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

estacionSchema.index({ location: '2dsphere' });

// Virtual inverso: busca en Linea qué rutas contienen el _id de esta estación
estacionSchema.virtual('lineas_a_las_que_pertenece', {
    ref: 'Linea',
    localField: '_id',
    foreignField: 'estaciones'
});

// Calcula zonaId automáticamente según el polígono donde cae el punto
estacionSchema.pre('save', async function () {
    if (this.isModified('location') && this.location?.coordinates?.length === 2) {
        const Zona = mongoose.model('Zona');
        const zonaEncontrada = await Zona.findOne({
            area: {
                $geoIntersects: {
                    $geometry: this.location
                }
            }
        }).select('_id');

        this.zonaId = zonaEncontrada ? zonaEncontrada._id : null;
    }
});

const EstacionModel = mongoose.model('Estacion', estacionSchema);

module.exports = EstacionModel;gt
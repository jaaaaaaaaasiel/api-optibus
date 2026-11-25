"use strict";

const mongoose = require('mongoose');

const puntoInteresSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            trim: true,
            maxlength: 250,
            default: ''
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
        }
    }
);

puntoInteresSchema.index({ location: '2dsphere' });

puntoInteresSchema.pre('save', async function () {
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

const PuntoInteresModel = mongoose.model('PuntoInteres', puntoInteresSchema);

module.exports = PuntoInteresModel;
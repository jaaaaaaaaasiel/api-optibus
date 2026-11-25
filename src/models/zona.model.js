"use strict";

const mongoose = require('mongoose');

const zonaSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 80
        },
        color: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        area: {
            type: {
                type: String,
                enum: ['Polygon'],
                default: 'Polygon',
                required: true
            },
            coordinates: {
                type: [[[Number]]],
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
        }
    }
);

zonaSchema.index({ area: '2dsphere' });

const ZonaModel = mongoose.model('Zona', zonaSchema);

module.exports = ZonaModel;
"use strict";

const mongo = require('mongoose');

const PuntoInteresModel = require('../models/puntoInteres.model');
// El hook pre('save') de PuntoInteres usa mongoose.model('Zona'): hay que registrar el modelo
require('../models/zona.model');
const AppError = require('../utils/appError');
const { escapeRegex } = require('../utils/normalize');

class PuntoInteresService {

  async getAll(filters = {}) {
    const { search = "" } = filters;

    const query = {};

    const text = String(search ?? "").trim();

    if (text) {
      const regex = new RegExp(escapeRegex(text), 'i');
      query.$or = [
        { nombre: regex },
        { description: regex }
      ];
    }

    // los más recientes aparecen primero
    return PuntoInteresModel.find(query).sort({ createdAt: -1 });
  }

  async getById(id) {
    if (!mongo.isValidObjectId(id)) {
      throw new AppError(404, `No se encontró el punto de interés con el id: ${id}`);
    }

    const item = await PuntoInteresModel.findById(id);

    if (!item) {
      throw new AppError(404, `No se encontró el punto de interés con el id: ${id}`);
    }

    return item;
  }

  toFeature(item) {
    return {
      type: "Feature",
      properties: {
        id: item.id,
        nombre: item.nombre,
        description: item.description,
        zonaId: item.zonaId ? String(item.zonaId) : null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      },
      geometry: {
        type: 'Point',
        coordinates: item.location.coordinates
      }
    };
  }

  async getGeoJSON(filters = {}) {
    const items = await this.getAll(filters);

    return {
      type: "FeatureCollection",
      features: items.map((item) => this.toFeature(item))
    };
  }

  async getGeoJSONById(id) {
    const item = await this.getById(id);

    return this.toFeature(item);
  }

  async create(data) {
    return PuntoInteresModel.create({
      nombre: data.nombre.trim(),
      description: data.description?.trim() ?? '',
      location: {
        type: 'Point',
        coordinates: [Number(data.longitude), Number(data.latitude)]
      }
    });
  }

  async update(id, data) {
    const current = await this.getById(id);

    current.nombre = data.nombre?.trim() ?? current.nombre;
    current.description = data.description?.trim() ?? current.description;

    // el validator garantiza que latitude y longitude llegan juntas
    if (data.latitude !== undefined && data.longitude !== undefined) {
      current.location = {
        type: 'Point',
        coordinates: [Number(data.longitude), Number(data.latitude)]
      };
    }

    // pre('save') recalcula zonaId si cambió la ubicación
    return current.save();
  }

  async delete(id) {
    const item = await this.getById(id);
    await item.deleteOne();
    return item;
  }
}

module.exports = PuntoInteresService;

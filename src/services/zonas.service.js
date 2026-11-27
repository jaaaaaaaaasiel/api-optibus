"use strict";

const mongo = require('mongoose');

const ZonaModel = require('../models/zona.model');
const EstacionModel = require('../models/estacion.model');
const PuntoInteresModel = require('../models/puntoInteres.model');
const AppError = require('../utils/appError');
const { escapeRegex } = require('../utils/normalize');

class ZonasService {

  async getAll(filters = {}) {
    const { search = "" } = filters;

    const query = {};

    const text = String(search ?? "").trim();

    if (text) {
      query.nombre = new RegExp(escapeRegex(text), 'i');
    }

    // las más recientes aparecen primero
    return ZonaModel.find(query).sort({ createdAt: -1 });
  }

  async getById(id) {
    if (!mongo.isValidObjectId(id)) {
      throw new AppError(404, `No se encontró la zona con el id: ${id}`);
    }

    const item = await ZonaModel.findById(id);

    if (!item) {
      throw new AppError(404, `No se encontró la zona con el id: ${id}`);
    }

    return item;
  }

  async create(data) {
    return ZonaModel.create({
      nombre: data.nombre.trim(),
      color: data.color.trim(),
      area: {
        type: 'Polygon',
        coordinates: data.area.coordinates
      }
    });
  }

  async update(id, data) {
    const current = await this.getById(id);

    current.nombre = data.nombre?.trim() ?? current.nombre;
    current.color = data.color?.trim() ?? current.color;

    if (data.area !== undefined) {
      current.area = {
        type: 'Polygon',
        coordinates: data.area.coordinates
      };
    }

    return current.save();
  }

  async delete(id) {
    const item = await this.getById(id);

    // zonaId es opcional (default null): al borrar la zona se limpian las referencias
    await Promise.all([
      EstacionModel.updateMany({ zonaId: item._id }, { $set: { zonaId: null } }),
      PuntoInteresModel.updateMany({ zonaId: item._id }, { $set: { zonaId: null } })
    ]);

    await item.deleteOne();
    return item;
  }
}

module.exports = ZonasService;

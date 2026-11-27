"use strict";

const mongo = require('mongoose');

const EstacionModel = require('../models/estacion.model');
const LineaModel = require('../models/linea.model');
const ReporteModel = require('../models/reporte.model');
// El hook pre('save') de Estacion usa mongoose.model('Zona'): hay que registrar el modelo
require('../models/zona.model');
const AppError = require('../utils/appError');
const { escapeRegex } = require('../utils/normalize');

class EstacionesService {

  async getAll(filters = {}) {
    const {
      search = "",
      type = "all",
      estado = "all"
    } = filters;

    const query = {};

    if (type && type !== "all") {
      query.type = type;
    }

    if (estado && estado !== "all") {
      query.estado = estado;
    }

    const text = String(search ?? "").trim();

    if (text) {
      const regex = new RegExp(escapeRegex(text), 'i');
      query.$or = [
        { nombre: regex },
        { type: regex }
      ];
    }

    // las más recientes aparecen primero
    return EstacionModel.find(query).sort({ createdAt: -1 });
  }

  async getById(id) {
    if (!mongo.isValidObjectId(id)) {
      throw new AppError(404, `No se encontró la estación con el id: ${id}`);
    }

    const item = await EstacionModel.findById(id);

    if (!item) {
      throw new AppError(404, `No se encontró la estación con el id: ${id}`);
    }

    return item;
  }

  toFeature(item) {
    return {
      type: "Feature",
      properties: {
        id: item.id,
        nombre: item.nombre,
        type: item.type,
        estado: item.estado,
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
    return EstacionModel.create({
      nombre: data.nombre.trim(),
      type: data.type,
      estado: data.estado,
      location: {
        type: 'Point',
        coordinates: [Number(data.longitude), Number(data.latitude)]
      }
    });
  }

  async update(id, data) {
    const current = await this.getById(id);

    current.nombre = data.nombre?.trim() ?? current.nombre;
    current.type = data.type ?? current.type;
    current.estado = data.estado ?? current.estado;

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

    // evita dejar referencias colgando en líneas y reportes
    const [lineas, reportes] = await Promise.all([
      LineaModel.countDocuments({ estaciones: item._id }),
      ReporteModel.countDocuments({ estacionId: item._id })
    ]);

    if (lineas > 0 || reportes > 0) {
      throw new AppError(
        409,
        `No se puede eliminar la estación: pertenece a ${lineas} línea(s) y tiene ${reportes} reporte(s) asociado(s)`
      );
    }

    await item.deleteOne();
    return item;
  }
}

module.exports = EstacionesService;

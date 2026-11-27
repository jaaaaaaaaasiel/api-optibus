"use strict";

const mongo = require('mongoose');

const ReporteModel = require('../models/reporte.model');
const EstacionModel = require('../models/estacion.model');
const UsuarioModel = require('../models/usuario.model');
const AppError = require('../utils/appError');
const { escapeRegex } = require('../utils/normalize');

class ReportesService {

  async getAll(filters = {}) {
    const {
      search = "",
      type = "all",
      estado = "all",
      estacionId
    } = filters;

    const query = {};

    if (type && type !== "all") {
      query.type = type;
    }

    if (estado && estado !== "all") {
      query.estado = estado;
    }

    if (estacionId) {
      query.estacionId = estacionId;
    }

    const text = String(search ?? "").trim();

    if (text) {
      const regex = new RegExp(escapeRegex(text), 'i');
      query.$or = [
        { nombre: regex },
        { description: regex },
        { type: regex }
      ];
    }

    // los más recientes aparecen primero
    return ReporteModel.find(query).sort({ createdAt: -1 });
  }

  async getById(id) {
    if (!mongo.isValidObjectId(id)) {
      throw new AppError(404, `No se encontró el reporte con el id: ${id}`);
    }

    const item = await ReporteModel.findById(id);

    if (!item) {
      throw new AppError(404, `No se encontró el reporte con el id: ${id}`);
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
        description: item.description,
        estado: item.estado,
        usuarioId: String(item.usuarioId),
        estacionId: String(item.estacionId),
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

  // Verifica que el usuario y la estación a los que apunta el reporte existan
  async assertReferences({ usuarioId, estacionId }) {
    if (usuarioId !== undefined) {
      const usuario = await UsuarioModel.exists({ _id: usuarioId });
      if (!usuario) {
        throw new AppError(404, `No existe el usuario con el id: ${usuarioId}`);
      }
    }

    if (estacionId !== undefined) {
      const estacion = await EstacionModel.exists({ _id: estacionId });
      if (!estacion) {
        throw new AppError(404, `No existe la estación con el id: ${estacionId}`);
      }
    }
  }

  async create(data) {
    await this.assertReferences({
      usuarioId: data.usuarioId,
      estacionId: data.estacionId
    });

    return ReporteModel.create({
      nombre: data.nombre.trim(),
      type: data.type,
      description: data.description.trim(),
      estado: data.estado,
      location: {
        type: 'Point',
        coordinates: [Number(data.longitude), Number(data.latitude)]
      },
      usuarioId: data.usuarioId,
      estacionId: data.estacionId
    });
  }

  async update(id, data) {
    const current = await this.getById(id);

    await this.assertReferences({
      usuarioId: data.usuarioId,
      estacionId: data.estacionId
    });

    current.nombre = data.nombre?.trim() ?? current.nombre;
    current.type = data.type ?? current.type;
    current.description = data.description?.trim() ?? current.description;
    current.estado = data.estado ?? current.estado;
    current.usuarioId = data.usuarioId ?? current.usuarioId;
    current.estacionId = data.estacionId ?? current.estacionId;

    // el validator garantiza que latitude y longitude llegan juntas
    if (data.latitude !== undefined && data.longitude !== undefined) {
      current.location = {
        type: 'Point',
        coordinates: [Number(data.longitude), Number(data.latitude)]
      };
    }

    return current.save();
  }

  async delete(id) {
    const item = await this.getById(id);
    await item.deleteOne();
    return item;
  }
}

module.exports = ReportesService;

"use strict";

const mongo = require('mongoose');

const LineaModel = require('../models/linea.model');
const EstacionModel = require('../models/estacion.model');
const AppError = require('../utils/appError');
const { escapeRegex } = require('../utils/normalize');

class LineasService {

  async getAll(filters = {}) {
    const { search = "" } = filters;

    const query = {};

    const text = String(search ?? "").trim();

    if (text) {
      const regex = new RegExp(escapeRegex(text), 'i');
      query.$or = [
        { codigo: regex },
        { nombre: regex }
      ];
    }

    // las más recientes aparecen primero
    return LineaModel.find(query).sort({ createdAt: -1 });
  }

  async getById(id) {
    if (!mongo.isValidObjectId(id)) {
      throw new AppError(404, `No se encontró la línea con el id: ${id}`);
    }

    const item = await LineaModel.findById(id);

    if (!item) {
      throw new AppError(404, `No se encontró la línea con el id: ${id}`);
    }

    return item;
  }

  // Líneas que tienen EXACTAMENTE `num` estaciones
  async getByNumEstaciones(num) {
    const total = Number(num);

    if (!Number.isInteger(total) || total < 0) {
      throw new AppError(400, 'El número de estaciones debe ser un entero mayor o igual a 0');
    }

    return LineaModel
      .find({ estaciones: { $size: total } })
      .sort({ createdAt: -1 });
  }

  // Verifica que todas las estaciones indicadas existan
  async assertEstacionesExist(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return;

    const unique = [...new Set(ids.map(String))];
    const existing = await EstacionModel.distinct('_id', { _id: { $in: unique } });
    const existingSet = new Set(existing.map(String));
    const missing = unique.filter((id) => !existingSet.has(id));

    if (missing.length > 0) {
      throw new AppError(
        404,
        `No existen las estaciones con los ids: ${missing.join(', ')}`
      );
    }
  }

  buildRecorrido(recorrido) {
    return {
      type: 'LineString',
      coordinates: recorrido.coordinates.map(([lng, lat]) => [Number(lng), Number(lat)])
    };
  }

  async create(data) {
    await this.assertEstacionesExist(data.estaciones);

    return LineaModel.create({
      codigo: data.codigo.trim(),
      nombre: data.nombre.trim(),
      color: data.color.trim(),
      estaciones: data.estaciones ?? [],
      recorrido: this.buildRecorrido(data.recorrido)
    });
  }

  async update(id, data) {
    const current = await this.getById(id);

    if (data.estaciones !== undefined) {
      await this.assertEstacionesExist(data.estaciones);
      current.estaciones = data.estaciones;
    }

    current.codigo = data.codigo?.trim() ?? current.codigo;
    current.nombre = data.nombre?.trim() ?? current.nombre;
    current.color = data.color?.trim() ?? current.color;

    if (data.recorrido !== undefined) {
      current.recorrido = this.buildRecorrido(data.recorrido);
    }

    return current.save();
  }

  async delete(id) {
    const item = await this.getById(id);
    await item.deleteOne();
    return item;
  }
}

module.exports = LineasService;

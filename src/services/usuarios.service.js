"use strict";

const mongo = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioModel = require('../models/usuario.model');
const ReporteModel = require('../models/reporte.model');
const AppError = require('../utils/appError');
const { escapeRegex } = require('../utils/normalize');

const SALT_ROUNDS = 10;

class UsuariosService {

  async getAll(filters = {}) {
    const {
      search = "",
      rol = "all",
      activo = "all"
    } = filters;

    const query = {};

    if (rol && rol !== "all") {
      query.rol = rol;
    }

    // por query string "activo" llega como texto: 'true' o 'false'
    if (activo === "true" || activo === "false") {
      query.activo = activo === "true";
    }

    const text = String(search ?? "").trim();

    if (text) {
      const regex = new RegExp(escapeRegex(text), 'i');
      query.$or = [
        { nombre: regex },
        { email: regex }
      ];
    }

    // las más recientes aparecen primero (el password nunca se devuelve: select:false)
    return UsuarioModel.find(query).sort({ createdAt: -1 });
  }

  async getById(id) {
    if (!mongo.isValidObjectId(id)) {
      throw new AppError(404, `No se encontró el usuario con el id: ${id}`);
    }

    const item = await UsuarioModel.findById(id);

    if (!item) {
      throw new AppError(404, `No se encontró el usuario con el id: ${id}`);
    }

    return item;
  }

  async create(data) {
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    return UsuarioModel.create({
      nombre: data.nombre.trim(),
      email: data.email.trim(),
      password: passwordHash,
      rol: data.rol,
      activo: data.activo
    });
  }

  async update(id, data) {
    const current = await this.getById(id);

    current.nombre = data.nombre?.trim() ?? current.nombre;
    current.email = data.email?.trim() ?? current.email;
    current.rol = data.rol ?? current.rol;
    current.activo = data.activo ?? current.activo;

    if (data.password !== undefined) {
      current.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    return current.save();
  }

  async delete(id) {
    const item = await this.getById(id);

    const reportes = await ReporteModel.countDocuments({ usuarioId: item._id });

    if (reportes > 0) {
      throw new AppError(
        409,
        `No se puede eliminar el usuario porque tiene ${reportes} reporte(s) asociado(s). Puedes desactivarlo con activo: false`
      );
    }

    await item.deleteOne();
    return item;
  }
}

module.exports = UsuariosService;

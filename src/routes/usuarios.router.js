"use strict";

const express = require("express");

const UsuariosService = require("../services/usuarios.service");

const { validateUsuarioPayload, validateUsuarioQuery } = require("../middlewares/usuario.validator");

const router = express.Router();
const service = new UsuariosService();

const getFilters = (query) => ({
  search: query.search,
  rol: query.rol,
  activo: query.activo
});

// GET /api/usuarios  -> lista (acepta filtros por query string)
router.get("/", validateUsuarioQuery, async (req, res, next) => {
  try {
    const items = await service.getAll(getFilters(req.query));

    res.status(200).json({
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/usuarios/:id
router.get("/:id", async (req, res, next) => {
  try {
    const item = await service.getById(req.params.id);

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
});

router.post("/", validateUsuarioPayload({ partial: false }), async (req, res, next) => {
  try {
    const created = await service.create(req.body);

    res.status(201).json({
      message: "Usuario registrado correctamente",
      data: created
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", validateUsuarioPayload({ partial: true }), async (req, res, next) => {
  try {
    const updated = await service.update(req.params.id, req.body);

    res.status(200).json({
      message: "Usuario actualizado correctamente",
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await service.delete(req.params.id);

    res.status(200).json({
      message: "Usuario eliminado correctamente",
      data: deleted
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

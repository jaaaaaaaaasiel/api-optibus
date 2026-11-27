"use strict";

const express = require("express");

const LineasService = require("../services/lineas.service");

const { validateLineaPayload, validateLineaQuery, validateLineaNumEstaciones } = require("../middlewares/linea.validator");

const router = express.Router();
const service = new LineasService();

const getFilters = (query) => ({
  search: query.search
});

// GET /api/lineas  -> lista (acepta filtros por query string)
router.get("/", validateLineaQuery, async (req, res, next) => {
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

// GET /api/lineas/num-estaciones/:num  -> líneas con exactamente :num estaciones
// OJO: se declara ANTES de "/:id" por claridad (tiene 2 segmentos, no choca, pero así queda ordenado)
router.get("/num-estaciones/:num", validateLineaNumEstaciones, async (req, res, next) => {
  try {
    const items = await service.getByNumEstaciones(req.params.num);

    res.status(200).json({
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/lineas/:id
router.get("/:id", async (req, res, next) => {
  try {
    const item = await service.getById(req.params.id);

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
});

router.post("/", validateLineaPayload({ partial: false }), async (req, res, next) => {
  try {
    const created = await service.create(req.body);

    res.status(201).json({
      message: "Línea registrada correctamente",
      data: created
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", validateLineaPayload({ partial: true }), async (req, res, next) => {
  try {
    const updated = await service.update(req.params.id, req.body);

    res.status(200).json({
      message: "Línea actualizada correctamente",
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
      message: "Línea eliminada correctamente",
      data: deleted
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

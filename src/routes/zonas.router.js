"use strict";

const express = require("express");

const ZonasService = require("../services/zonas.service");

const { validateZonaPayload, validateZonaQuery } = require("../middlewares/zona.validator");

const router = express.Router();
const service = new ZonasService();

const getFilters = (query) => ({
  search: query.search
});

// GET /api/zonas  -> lista (acepta filtros por query string)
router.get("/", validateZonaQuery, async (req, res, next) => {
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

// GET /api/zonas/:id
router.get("/:id", async (req, res, next) => {
  try {
    const item = await service.getById(req.params.id);

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
});

router.post("/", validateZonaPayload({ partial: false }), async (req, res, next) => {
  try {
    const created = await service.create(req.body);

    res.status(201).json({
      message: "Zona registrada correctamente",
      data: created
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", validateZonaPayload({ partial: true }), async (req, res, next) => {
  try {
    const updated = await service.update(req.params.id, req.body);

    res.status(200).json({
      message: "Zona actualizada correctamente",
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
      message: "Zona eliminada correctamente",
      data: deleted
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

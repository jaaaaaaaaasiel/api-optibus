"use strict";

const express = require("express");

const ReportesService = require("../services/reportes.service");

const { validateReportePayload, validateReporteQuery } = require("../middlewares/reporte.validator");

const router = express.Router();
const service = new ReportesService();

const getFilters = (query) => ({
  search: query.search,
  type: query.type,
  estado: query.estado,
  estacionId: query.estacionId
});

// GET /api/reportes  -> lista (acepta filtros por query string)
router.get("/", validateReporteQuery, async (req, res, next) => {
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

// GET /api/reportes/geojson  -> FeatureCollection (mismos filtros)
// OJO: debe ir ANTES de "/:id", si no Express tomaría "geojson" como un id
router.get("/geojson", validateReporteQuery, async (req, res, next) => {
  try {
    const geoJSON = await service.getGeoJSON(getFilters(req.query));

    res.status(200).json(geoJSON);
  } catch (error) {
    next(error);
  }
});

// GET /api/reportes/:id/geojson  -> un solo Feature
router.get("/:id/geojson", async (req, res, next) => {
  try {
    const feature = await service.getGeoJSONById(req.params.id);

    res.status(200).json(feature);
  } catch (error) {
    next(error);
  }
});

// GET /api/reportes/:id
router.get("/:id", async (req, res, next) => {
  try {
    const item = await service.getById(req.params.id);

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
});

router.post("/", validateReportePayload({ partial: false }), async (req, res, next) => {
  try {
    const created = await service.create(req.body);

    res.status(201).json({
      message: "Reporte registrado correctamente",
      data: created
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", validateReportePayload({ partial: true }), async (req, res, next) => {
  try {
    const updated = await service.update(req.params.id, req.body);

    res.status(200).json({
      message: "Reporte actualizado correctamente",
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
      message: "Reporte eliminado correctamente",
      data: deleted
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

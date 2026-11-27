"use strict";

const express = require("express");

const PuntoInteresService = require("../services/puntoInteres.service");

const { validatePuntoInteresPayload, validatePuntoInteresQuery } = require("../middlewares/puntoInteres.validator");

const router = express.Router();
const service = new PuntoInteresService();

const getFilters = (query) => ({
  search: query.search
});

// GET /api/puntoInteres  -> lista (acepta filtros por query string)
router.get("/", validatePuntoInteresQuery, async (req, res, next) => {
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

// GET /api/puntoInteres/geojson  -> FeatureCollection (mismos filtros)
// OJO: debe ir ANTES de "/:id", si no Express tomaría "geojson" como un id
router.get("/geojson", validatePuntoInteresQuery, async (req, res, next) => {
  try {
    const geoJSON = await service.getGeoJSON(getFilters(req.query));

    res.status(200).json(geoJSON);
  } catch (error) {
    next(error);
  }
});

// GET /api/puntoInteres/:id/geojson  -> un solo Feature
router.get("/:id/geojson", async (req, res, next) => {
  try {
    const feature = await service.getGeoJSONById(req.params.id);

    res.status(200).json(feature);
  } catch (error) {
    next(error);
  }
});

// GET /api/puntoInteres/:id
router.get("/:id", async (req, res, next) => {
  try {
    const item = await service.getById(req.params.id);

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
});

router.post("/", validatePuntoInteresPayload({ partial: false }), async (req, res, next) => {
  try {
    const created = await service.create(req.body);

    res.status(201).json({
      message: "Punto de interés registrado correctamente",
      data: created
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", validatePuntoInteresPayload({ partial: true }), async (req, res, next) => {
  try {
    const updated = await service.update(req.params.id, req.body);

    res.status(200).json({
      message: "Punto de interés actualizado correctamente",
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
      message: "Punto de interés eliminado correctamente",
      data: deleted
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

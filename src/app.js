"use strict"

require('dotenv').config()

const express = require("express");
const cors = require("cors");

const routerApi = require('./routes');
const AppError = require('./utils/appError.js')

const {
  notFoundHandler,
  logErrors,
  errorHandler
} = require("./middlewares/error.handler.js");

const app = express()

const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
.split(',')
.map(o => o.trim())
.filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) { return callback(null, true); }
    if (allowedOrigins.length === 0) { return callback(null, true); }
    if (allowedOrigins.includes(origin)) { return callback(null, true); }

    return callback(new AppError(403, `El origen ${origin} no está permitido en CORS.`));
  }
}));

app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
});

app.get('/', (req, res) => {
  res.status(200).json({
    name: "API de Optibus León, Gto",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      estaciones: "/api/estaciones",
      geojson: "/api/estaciones/geojson"
    }
  })
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "El servidor funciona correctamente",
    timestamp: new Date().toISOString()
  })
});

routerApi(app);

app.use(notFoundHandler);
app.use(logErrors);
app.use(errorHandler);

module.exports = app
"use strict"

const express = require("express")

const estacionesRouter = require("./estaciones.router")
const lineasRouter = require("./lineas.router")
const puntoInteresRouter = require("./puntoInteres.router")
const reportesRouter = require("./reportes.router")
const usuariosRouter = require("./usuarios.router")
const zonasRouter = require("./zonas.router")

function routerApi(app){
  const apiRouter = express.Router()

  app.use("/api", apiRouter)

  apiRouter.use("/estaciones", estacionesRouter)
  apiRouter.use("/lineas", lineasRouter)
  apiRouter.use("/puntoInteres", puntoInteresRouter)
  apiRouter.use("/reportes", reportesRouter)
  apiRouter.use("/usuarios", usuariosRouter)
  apiRouter.use("/zonas", zonasRouter)
}

module.exports = routerApi
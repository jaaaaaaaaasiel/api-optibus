"use strict"

const AppError = require("../utils/appError")

function notFoundHandler(req, res, next){
  next(
    new AppError(
      404,
      `No existe la ruta ${req.method} ${req.originalUrl}.`
    )
  )
}

// Un middleware de errores en Express DEBE tener 4 parámetros (err, req, res, next)
function logErrors(err, req, res, next){
  console.error("————————— ERROR —————————")
  console.error("Fecha:", new Date().toISOString())
  console.error("Metodo:", req.method)
  console.error("Ruta:", req.originalUrl)
  console.error("Mensaje:", err.message)

  if(err.stack){
    console.error(err.stack)
  }

  console.error("————————————————————————\n")

  next(err);
}

function errorHandler(err, req, res, next){
  if(res.headersSent){
    return next(err);
  }

  if(err instanceof SyntaxError && err.status === 400 && "body" in err){
    return res.status(400).json({
      error: {
        status: 400,
        message: "El cuerpo del Json tiene un error de sintaxis",
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Errores de Mongo/Mongoose que no son AppError
  if(err.code === 11000){
    err = new AppError(
      409,
      "Ya existe un registro con ese valor, que debe ser único",
      err.keyValue || null
    )
  } else if(err.code === 16755){
    // MongoDB rechazó una geometría (polígono que se cruza, puntos consecutivos repetidos, etc.)
    err = new AppError(
      400,
      "La geometría enviada no es válida (por ejemplo, un polígono que se cruza a sí mismo o puntos consecutivos repetidos)"
    )
  } else if(err.name === "CastError"){
    err = new AppError(400, `Valor no válido para el campo ${err.path}`)
  } else if(err.name === "ValidationError"){
    err = new AppError(
      400,
      "La información enviada no es válida",
      Object.values(err.errors).map((e) => e.message)
    )
  }

  const statusCode = err.statusCode || 500
  const message =
    statusCode === 500
      ? "Ocurrio un error interno en el servidor"
      : err.message

  res.status(statusCode).json({
    error:{
      status: statusCode,
      message,
      details: err.details || null,
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  })
}

module.exports = {notFoundHandler, logErrors, errorHandler}

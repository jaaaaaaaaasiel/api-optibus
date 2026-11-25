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

function logErrors(err, req, res){
  console.error("————————— ERROR —————————")
  console.error("Fecha:", new Date().toISOString())
  console.error("Metodo:", req.method)
  console.error("Ruta:", req.originalUrl)
  console.error("Mensaje:", err.mensaje)

  if(err.stack){
    console.error(err.stack)
  }

  console.error("————————————————————————\n")

  next(err);
}

function errorHandler(err, req, res, next){
  if(res.headerSent){
    return nexte(err);
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
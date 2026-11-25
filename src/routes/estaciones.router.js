"use strict";

const express = require("express");
const logErrors = require('../middlewares/error.handler')

const EstacionesService = require("../services/estaciones.service");

const { validateEstacionPayload,  validateEstacionQuery } = require('../middlewares/estacion.validator');


const router = express.Router();
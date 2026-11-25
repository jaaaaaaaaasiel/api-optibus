"use strict";

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { connectDatabase, disconnectDatabase } = require('../config/database');

const UsuarioModel = require('../models/usuario.model');
const ZonaModel = require('../models/zona.model');
const EstacionModel = require('../models/estacion.model');
const LineaModel = require('../models/linea.model');
const PuntoInteresModel = require('../models/puntoInteres.model');
const ReporteModel = require('../models/reporte.model');

const MODELS = [
    UsuarioModel,
    ZonaModel,
    EstacionModel,
    LineaModel,
    PuntoInteresModel,
    ReporteModel
];

async function initCollectionsAndIndexes(models) {
    for (const Model of models) {
        await Model.createCollection();
        await Model.createIndexes();
    }
}

async function resolverZonaId(geometry) {
    if (!geometry) return null;
    const zona = await ZonaModel.findOne({
        area: {
            $geoIntersects: {
                $geometry: geometry
            }
        }
    }).select('_id');

    return zona ? zona._id : null;
}

async function seedUsuarios() {
    const adminPassword = await bcrypt.hash('Admin1234', 10);
    const userPassword = await bcrypt.hash('User1234', 10);

    const data = [
        {
            nombre: 'Administrador SIT León',
            email: 'admin.optibus@leon.gob.mx',
            password: adminPassword,
            rol: 'admin',
            activo: true
        },
        {
            nombre: 'Jasiel Usuario',
            email: 'jasiel.user@ejemplo.com',
            password: userPassword,
            rol: 'user',
            activo: true
        }
    ];

    return UsuarioModel.insertMany(data);
}

async function seedZonas() {
    const data = [
        {
            nombre: 'Zona Centro',
            color: '#2A9D8F',
            area: {
                type: 'Polygon',
                coordinates: [[
                    [-101.6950, 21.1320],
                    [-101.6680, 21.1320],
                    [-101.6680, 21.1120],
                    [-101.6950, 21.1120],
                    [-101.6950, 21.1320]
                ]]
            }
        },
        {
            nombre: 'Zona Sur / Delta',
            color: '#E9C46A',
            area: {
                type: 'Polygon',
                coordinates: [[
                    [-101.6450, 21.1050],
                    [-101.6050, 21.1050],
                    [-101.6050, 21.0720],
                    [-101.6450, 21.0720],
                    [-101.6450, 21.1050]
                ]]
            }
        }
    ];

    return ZonaModel.insertMany(data);
}

async function seedEstaciones() {
    const rawEstaciones = [
        {
            nombre: 'Estación Terminal Delta',
            type: 'terminal_transferencia',
            estado: 'operativa',
            location: {
                type: 'Point',
                coordinates: [-101.6234, 21.0876]
            }
        },
        {
            nombre: 'Estación Poliforum',
            type: 'paradero_troncal',
            estado: 'operativa',
            location: {
                type: 'Point',
                coordinates: [-101.6789, 21.1165]
            }
        },
        {
            nombre: 'Estación Zona Centro',
            type: 'paradero_troncal',
            estado: 'operativa',
            location: {
                type: 'Point',
                coordinates: [-101.6825, 21.1218]
            }
        }
    ];

    // insertMany no dispara pre('save'), por eso calculamos zonaId aquí
    const docs = await Promise.all(
        rawEstaciones.map(async (est) => ({
            ...est,
            zonaId: await resolverZonaId(est.location)
        }))
    );

    return EstacionModel.insertMany(docs);
}

async function seedLineas(estacionesInsertadas) {
    const estacionDelta = estacionesInsertadas[0]?._id;
    const estacionPoliforum = estacionesInsertadas[1]?._id;
    const estacionCentro = estacionesInsertadas[2]?._id;

    const estacionesIds = [estacionDelta, estacionPoliforum, estacionCentro].filter(Boolean);

    const data = [
        {
            codigo: 'L-01',
            nombre: 'Troncal 1 - Delta - San Jerónimo',
            color: '#E63946',
            estaciones: estacionesIds,
            recorrido: {
                type: 'LineString',
                coordinates: [
                    [-101.6234, 21.0876],
                    [-101.6520, 21.1010],
                    [-101.6789, 21.1165],
                    [-101.6825, 21.1218]
                ]
            }
        },
        {
            codigo: 'L-04',
            nombre: 'Troncal 4 - Delta - Centro',
            color: '#457B9D',
            estaciones: [estacionDelta, estacionCentro].filter(Boolean),
            recorrido: {
                type: 'LineString',
                coordinates: [
                    [-101.6234, 21.0876],
                    [-101.6480, 21.1060],
                    [-101.6825, 21.1218]
                ]
            }
        }
    ];

    return LineaModel.insertMany(data);
}

async function seedPuntosInteres() {
    const rawPuntos = [
        {
            nombre: 'Plaza Principal León',
            description: 'Punto céntrico de referencia junto a Presidencia Municipal y Catedral.',
            location: {
                type: 'Point',
                coordinates: [-101.6835, 21.1221]
            }
        },
        {
            nombre: 'Estadio León',
            description: 'Recinto deportivo y de eventos sobre Blvd. Adolfo López Mateos.',
            location: {
                type: 'Point',
                coordinates: [-101.6698, 21.1304]
            }
        }
    ];

    const docs = await Promise.all(
        rawPuntos.map(async (punto) => ({
            ...punto,
            zonaId: await resolverZonaId(punto.location)
        }))
    );

    return PuntoInteresModel.insertMany(docs);
}

async function seedReportes(usuariosInsertados, estacionesInsertadas) {
    const usuarioId = usuariosInsertados[1]?._id || usuariosInsertados[0]?._id;
    const estacionId = estacionesInsertadas[0]?._id;

    if (!usuarioId || !estacionId) {
        return [];
    }

    const data = [
        {
            nombre: 'Saturación en andenes por la mañana',
            type: 'saturacion',
            description: 'Alta afluencia de pasajeros esperando unidades troncales entre 7:30 y 8:30 am.',
            estado: 'pendiente',
            location: estacionesInsertadas[0].location,
            usuarioId,
            estacionId
        }
    ];

    return ReporteModel.insertMany(data);
}

async function runSeed() {
    try {
        await connectDatabase();

        // Asegura que existan las 6 colecciones y sus índices (2dsphere, unique)
        await initCollectionsAndIndexes(MODELS);

        // Limpia las colecciones en orden inverso a dependencias
        await ReporteModel.deleteMany({});
        await LineaModel.deleteMany({});
        await PuntoInteresModel.deleteMany({});
        await EstacionModel.deleteMany({});
        await ZonaModel.deleteMany({});
        await UsuarioModel.deleteMany({});

        const usuarios = await seedUsuarios();
        const zonas = await seedZonas();
        const estaciones = await seedEstaciones();
        const lineas = await seedLineas(estaciones);
        const puntosInteres = await seedPuntosInteres();
        const reportes = await seedReportes(usuarios, estaciones);

        console.log(`Usuarios insertados: ${usuarios.length}`);
        console.log(`Zonas insertadas: ${zonas.length}`);
        console.log(`Estaciones insertadas: ${estaciones.length}`);
        console.log(`Líneas insertadas: ${lineas.length}`);
        console.log(`Puntos de interés insertados: ${puntosInteres.length}`);
        console.log(`Reportes insertados: ${reportes.length}`);
    } catch (error) {
        console.error('Error al ejecutar el seed:', error.message);
        process.exitCode = 1;
    } finally {
        await disconnectDatabase();
    }
}

runSeed();
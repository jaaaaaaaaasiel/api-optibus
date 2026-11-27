"use strict";

const app = require('./app');
const { connectDatabase,disconnectDatabase } = require("./config/database");

const PORT = Number(process.env.PORT) || 3000;

async function starServer() {

    try {
        await connectDatabase();
        const server = app.listen(PORT, () => {
            const base = `https://api-optibus.onrender.com`;

            console.log('');
            console.log('—————————————————————————————————');
            console.log('   API de Optibus León, Gto');
            console.log('—————————————————————————————————');
            console.log('');
            console.log(`Servidor: ${base}`);
            console.log(`Health: ${base}/api/health`);
            console.log('');
            console.log('Estaciones');
            console.log(`  Datos: ${base}/api/estaciones`);
            console.log(`  GeoJSON: ${base}/api/estaciones/geojson`);
            console.log(`  GeoJSON por id: ${base}/api/estaciones/:id/geojson`);
            console.log(`  Por id: ${base}/api/estaciones/:id`);
            console.log('');
            console.log('Puntos de interés');
            console.log(`  Datos: ${base}/api/puntoInteres`);
            console.log(`  GeoJSON: ${base}/api/puntoInteres/geojson`);
            console.log(`  GeoJSON por id: ${base}/api/puntoInteres/:id/geojson`);
            console.log(`  Por id: ${base}/api/puntoInteres/:id`);
            console.log('');
            console.log('Reportes');
            console.log(`  Datos: ${base}/api/reportes`);
            console.log(`  GeoJSON: ${base}/api/reportes/geojson`);
            console.log(`  GeoJSON por id: ${base}/api/reportes/:id/geojson`);
            console.log(`  Por id: ${base}/api/reportes/:id`);
            console.log('');
            console.log('Líneas');
            console.log(`  Datos: ${base}/api/lineas`);
            console.log(`  Por num. de estaciones: ${base}/api/lineas/num-estaciones/:num`);
            console.log(`  Por id: ${base}/api/lineas/:id`);
            console.log('');
            console.log('Usuarios');
            console.log(`  Datos: ${base}/api/usuarios`);
            console.log(`  Por id: ${base}/api/usuarios/:id`);
            console.log('');
            console.log('Zonas');
            console.log(`  Datos: ${base}/api/zonas`);
            console.log(`  Por id: ${base}/api/zonas/:id`);
            console.log('—————————————————————————————————');
            console.log('');
        });

        function shutdown(signal) {
            console.log(`Se recibió ${signal}. Cerrando el servidor...`);
            server.close(async () => {
                await disconnectDatabase();
                console.log('Servidor cerrado exitosamente');
                process.exit(0);
            });
        }

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    } catch (error) {
        console.error('No se pudo conectar a MongoDB', error.message);
        process.exit(1);
    }
}

starServer();
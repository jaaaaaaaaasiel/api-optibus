"use strict";

const app = require('./app');
const { connectDatabase,disconnectDatabase } = require("./config/database");

const PORT = Number(process.env.PORT) || 3000;

async function starServer() {

    try {
        await connectDatabase();
        const server = app.listen(PORT, () => {
            const base = `http://localhost:${PORT}`;

            console.log('');
            console.log('—————————————————————————————————');
            console.log('   API de Optibus León, Gto');
            console.log('—————————————————————————————————');
            console.log('');
            console.log(`Servidor: ${base}`);
            console.log(`Health: ${base}/api/health`);
            console.log('');
            console.log('Incidentes');
            console.log(`  Datos: ${base}/api/incidents`);
            console.log(`  GeoJSON: ${base}/api/incidents/geojson`);
            console.log(`  Por id: ${base}/api/incidents/:id`);
            console.log('');
            console.log('Paradas de autobús');
            console.log(`  Datos: ${base}/api/bus-stops`);
            console.log(`  GeoJSON: ${base}/api/bus-stops/geojson`);
            console.log(`  Por id: ${base}/api/bus-stops/:id`);
            console.log('');
            console.log('Hospitales');
            console.log(`  Datos: ${base}/api/hospitals`);
            console.log(`  GeoJSON: ${base}/api/hospitals/geojson`);
            console.log(`  Por id: ${base}/api/hospitals/:id`);
            console.log('');
            console.log('Estaciones de emergencia');
            console.log(`  Datos: ${base}/api/emergency-stations`);
            console.log(`  GeoJSON: ${base}/api/emergency-stations/geojson`);
            console.log(`  Por id: ${base}/api/emergency-stations/:id`);
            console.log('');
            console.log('Estacionamientos');
            console.log(`  Datos: ${base}/api/parkings`);
            console.log(`  GeoJSON: ${base}/api/parkings/geojson`);
            console.log(`  Por id: ${base}/api/parkings/:id`);
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
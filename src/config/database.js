"use strict";

const mongoose = require('mongoose');
const dns = require('node:dns');


async function connectDatabase() {
    if (dns.getServers().every((s) => s === '127.0.0.1' || s === '::1')) {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
    }
    const uri = process.env.MONGODB_URI;
    if (!uri) { throw new Error("Falta la variable MONGODB_URI en el archivo .env"); }
    await mongoose.connect(uri);
    console.log(`MongoDB conectado a la base: ${mongoose.connection.name}`);
}

async function disconnectDatabase() {
    await mongoose.disconnect();
}

module.exports = {
    connectDatabase,
    disconnectDatabase
};
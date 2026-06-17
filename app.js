/**
 * =============================================================================
 * SERVIDOR PRINCIPAL: app.js
 * Rol: Desarrollador Backend Senior
 * Propósito: Orquestación central de la aplicación y montaje de módulos
 * =============================================================================
 */

// Cargar variables de entorno del archivo .env
require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir de forma estática la carpeta Menus
app.use(express.static('Menus'));

// Mapear rutas de frontend de forma explícita
app.get('/menu.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Menus', 'menu.html'));
});

app.get('/login_proveedor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Menus', 'login_proveedor.html'));
});

app.get('/dashboard_proveedor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Menus', 'dashboard_proveedor.html'));
});

// Importar y montar el router de Menús/Proveedor
const menusRouter = require('./Menus/menus_backend');
app.use('/', menusRouter);

// Manejador por defecto para servir el frontend de menús si no coincide ninguna API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'Menus', 'menu.html'));
});

// Levantar el servidor
app.listen(3000, () => {
    console.log("Servidor corriendo en el puerto 3000");
    console.log('===========================================================');
    console.log(`🚀 SERVIDOR CENTRAL INICIADO CORRECTAMENTE`);
    console.log(`🔗 URL local: http://localhost:3000`);
    console.log(`📂 Servidor sirviendo estáticos desde la carpeta /Menus`);
    console.log('===========================================================');
});

module.exports = app; // Exportable para pruebas de integración o testing

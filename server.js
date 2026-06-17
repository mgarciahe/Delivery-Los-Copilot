/**
 * =============================================================================
 * CENTRAL ENTRY POINT: server.js
 * Propósito: Configurar el servidor Express, montar los controladores y endpoints,
 * y servir las vistas estáticas del cliente y del repartidor.
 * =============================================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// --- CONEXIÓN DE BASE DE DATOS (MVC) ---
const pool = require('./src/models/db');

// --- IMPORTACIÓN DE CONTROLADORES ---
const authController = require('./src/controllers/authController');
const menusController = require('./src/controllers/menusController');
const providerController = require('./src/controllers/providerController');
const riderController = require('./src/controllers/riderController');

// =============================================================================
// ENRUTAMIENTO DE APIs REST (MVC)
// =============================================================================

// 1. Endpoints Públicos de Menús (Consumidor)
app.get('/api/restaurantes', menusController.getRestaurantes);
app.get('/api/platillos', menusController.getPlatillos);
app.post('/api/orders', menusController.createOrder); // Registro de pedidos de clientes en MySQL

// 2. Endpoints de Registro y Autenticación del Proveedor (Restaurante)
app.post('/api/provider/register', authController.registerProvider);
app.post('/api/provider/login', authController.loginProvider);

// 3. Endpoints Seguros de Gestión del Proveedor (Protegidos con JWT Middleware)
app.get('/api/provider/menus', authController.authenticateProvider, providerController.getProviderMenus);
app.post('/api/provider/menus', authController.authenticateProvider, providerController.createProviderMenu);
app.put('/api/provider/menus/:id', authController.authenticateProvider, providerController.updateProviderMenu);
app.delete('/api/provider/menus/:id', authController.authenticateProvider, providerController.deleteProviderMenu);
app.get('/api/provider/orders', authController.authenticateProvider, providerController.getProviderOrders);
app.put('/api/provider/orders/:id/status', authController.authenticateProvider, providerController.updateProviderOrderStatus);
app.get('/api/provider/analytics', authController.authenticateProvider, providerController.getProviderAnalytics);

// 4. Endpoints del Módulo de Repartidores (Riders - Pedro)
app.get('/api/repartidor', riderController.getRider);
app.post('/api/repartidor', riderController.updateRider);
app.post('/api/repartidor/disponibilidad', riderController.toggleDisponibilidad);
app.post('/api/repartidor/alertas', riderController.toggleAlertas);
app.post('/api/repartidor/gps', riderController.toggleGps);
app.get('/api/pedidos/disponibles', riderController.getDisponibleOrders);
app.post('/api/pedidos/simular-oferta', riderController.simularOferta);
app.post('/api/pedidos/aceptar', riderController.aceptarPedido);
app.post('/api/pedidos/rechazar', riderController.rechazarPedido);
app.post('/api/pedidos/entregado', riderController.completarPedido);

// =============================================================================
// SERVICIO DE ARCHIVOS ESTÁTICOS (VISTAS)
// =============================================================================

// Servir la subruta independiente del repartidor
app.use('/repartidor', express.static(path.join(__dirname, 'src', 'views', 'repartidor')));

// Servir la aplicación principal SPA (Cliente + Portal Proveedor)
app.use(express.static(path.join(__dirname, 'src', 'views')));

// Fallback: Redirigir cualquier otra petición HTML a la SPA principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
});

// =============================================================================
// ARRANQUE DEL SERVIDOR
// =============================================================================
app.listen(PORT, () => {
    console.log(`=============================================================`);
    console.log(`🚀 SERVIDOR UNIFICADO "LOS COPILOTS" ACTIVO EN PUERTO ${PORT}`);
    console.log(`🔗 Portal del Cliente y Socios: http://localhost:${PORT}`);
    console.log(`🔗 Panel del Repartidor: http://localhost:${PORT}/repartidor`);
    console.log(`📦 Arquitectura MVC estructurada y activa.`);
    console.log(`=============================================================`);
});

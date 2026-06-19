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

// 1. Endpoints de Menús (Consumidor) y Órdenes (Protegida)
app.get('/api/restaurantes', menusController.getRestaurantes);
app.get('/api/platillos', menusController.getPlatillos);
app.post('/api/orders', authController.authenticateCustomer, menusController.createOrder); // Registro de pedidos protegido con JWT
app.get('/api/orders/:id', menusController.getOrderStatus);

// 1.5. Endpoints de Registro y Autenticación del Cliente (Consumidor)
app.post('/api/customer/register', authController.registerCustomer);
app.post('/api/customer/login', authController.loginCustomer);

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

// 4. Endpoints de Registro y Autenticación del Repartidor (Rider)
app.post('/api/rider/register', authController.registerRider);
app.post('/api/rider/login', authController.loginRider);

// 5. Endpoints Seguros del Módulo de Repartidores (Riders - Protegidos con JWT)
app.get('/api/repartidor', authController.authenticateRider, riderController.getRider);
app.post('/api/repartidor', authController.authenticateRider, riderController.updateRider);
app.post('/api/repartidor/disponibilidad', authController.authenticateRider, riderController.toggleDisponibilidad);
app.post('/api/repartidor/alertas', authController.authenticateRider, riderController.toggleAlertas);
app.post('/api/repartidor/gps', authController.authenticateRider, riderController.toggleGps);
app.get('/api/pedidos/disponibles', authController.authenticateRider, riderController.getDisponibleOrders);
// app.post('/api/pedidos/simular-oferta', authController.authenticateRider, riderController.simularOferta);
app.post('/api/pedidos/aceptar', authController.authenticateRider, riderController.aceptarPedido);
app.post('/api/pedidos/rechazar', authController.authenticateRider, riderController.rechazarPedido);
app.post('/api/pedidos/entregado', authController.authenticateRider, riderController.completarPedido);

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

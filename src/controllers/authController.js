/**
 * =============================================================================
 * CONTROLLER: authController.js
 * Propósito: Registro, autenticación de restaurantes (proveedores) y middleware JWT
 * =============================================================================
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../models/db');

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_de_delivery_copilot_2026';

/**
 * Middleware: Verificar token JWT del Proveedor
 */
const authenticateProvider = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado. No se proporcionó un token de autenticación.'
        });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            success: false,
            message: 'Formato de token inválido. El formato requerido es "Bearer <token>".'
        });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Inyectar el payload decodificado en req.proveedor
        req.proveedor = decoded;
        next();
    } catch (error) {
        console.error('❌ Error de validación de token JWT:', error.message);
        
        let errorMessage = 'Token inválido o expirado.';
        if (error.name === 'TokenExpiredError') {
            errorMessage = 'El token de autenticación ha expirado.';
        }

        return res.status(403).json({
            success: false,
            message: errorMessage
        });
    }
};

/**
 * POST /api/provider/register
 * Registro de un nuevo restaurante
 */
const registerProvider = async (req, res) => {
    const { nombre, direccion, telefono, email, password, distancia_km, tiempo_entrega_min } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Los campos nombre, email y password son obligatorios.'
        });
    }

    try {
        const [existing] = await pool.query('SELECT id FROM restaurantes WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está registrado por otro restaurante.'
            });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const dist = distancia_km !== undefined ? distancia_km : parseFloat((Math.random() * 5).toFixed(1));
        const tiempo = tiempo_entrega_min !== undefined ? tiempo_entrega_min : Math.floor(Math.random() * 30) + 10;

        const [result] = await pool.query(
            `INSERT INTO restaurantes (nombre, direccion, telefono, email, password, distancia_km, tiempo_entrega_min, activo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [nombre, direccion || null, telefono || null, email, passwordHash, dist, tiempo]
        );

        res.status(201).json({
            success: true,
            message: 'Restaurante registrado exitosamente.',
            data: {
                id: result.insertId,
                nombre,
                email,
                distancia_km: dist,
                tiempo_entrega_min: tiempo
            }
        });
    } catch (error) {
        console.error('❌ Error en el registro de restaurante:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al procesar el registro.'
        });
    }
};

/**
 * POST /api/provider/login
 * Inicio de sesión del restaurante
 */
const loginProvider = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email y password son campos requeridos.'
        });
    }

    try {
        const [rows] = await pool.query(
            'SELECT id, nombre, email, password, activo FROM restaurantes WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas. Correo electrónico o contraseña incorrectos.'
            });
        }

        const restaurante = rows[0];

        if (!restaurante.activo) {
            return res.status(403).json({
                success: false,
                message: 'Este restaurante se encuentra inactivo. Contacte al administrador.'
            });
        }

        const match = await bcrypt.compare(password, restaurante.password);
        if (!match) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas. Correo electrónico o contraseña incorrectos.'
            });
        }

        const token = jwt.sign(
            { id: restaurante.id, nombre: restaurante.nombre, email: restaurante.email },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            message: 'Autenticación exitosa.',
            token,
            restaurante: {
                id: restaurante.id,
                nombre: restaurante.nombre,
                email: restaurante.email
            }
        });
    } catch (error) {
        console.error('❌ Error en el login de restaurante:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor durante el inicio de sesión.'
        });
    }
};

module.exports = {
    authenticateProvider,
    registerProvider,
    loginProvider
};

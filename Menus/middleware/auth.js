/**
 * =============================================================================
 * MIDDLEWARE: auth.js
 * Propósito: Verificación y decodificación de tokens JWT para Proveedores (Restaurantes)
 * =============================================================================
 */

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Obtener la cabecera Authorization
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado. No se proporcionó un token de autenticación.'
        });
    }

    // El formato esperado es: Bearer <TOKEN>
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            success: false,
            message: 'Formato de token inválido. El formato requerido es "Bearer <token>".'
        });
    }

    const token = parts[1];

    try {
        // Verificar firma y validez del token
        const secret = process.env.JWT_SECRET || 'super_secret_key_de_delivery_copilot_2026';
        const decoded = jwt.verify(token, secret);
        
        // Asignar el payload (ej. { id: 1, nombre: 'Taco Bell' }) a req.proveedor
        req.proveedor = decoded;
        
        next();
    } catch (error) {
        console.error('❌ Error de validación de JWT:', error.message);
        
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

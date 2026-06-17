/**
 * =============================================================================
 * MODEL: db.js
 * Propósito: Centralizar y exportar el pool de conexiones a MySQL usando mysql2
 * =============================================================================
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'delivery_los_copilot',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

try {
    pool = mysql.createPool(dbConfig);
    console.log('✅ Pool de conexiones de MySQL (MVC) inicializado correctamente.');

    // Probar conexión asíncronamente
    (async () => {
        try {
            const connection = await pool.getConnection();
            console.log('✅ Conexión de prueba a base de datos establecida.');
            connection.release();
        } catch (dbError) {
            console.error('❌ ERROR CRÍTICO al conectar con MySQL en el arranque de la base de datos:');
            console.error('Mensaje:', dbError.message);
            console.error('Código de error:', dbError.code);
            console.error('Asegúrate de que el servidor MySQL local esté encendido y que las credenciales en .env sean correctas.');
        }
    })();
} catch (error) {
    console.error('❌ Error al crear el pool de conexiones de MySQL:', error.message);
}

module.exports = pool;

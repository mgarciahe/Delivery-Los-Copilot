/**
 * =============================================================================
 * MIGRATION: migrate-riders.js
 * Propósito: Crear la tabla 'repartidores' en MySQL automáticamente.
 * =============================================================================
 */
const pool = require('./db');

async function migrate() {
    try {
        console.log('🔄 Iniciando migración para tabla "repartidores"...');
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS \`repartidores\` (
                \`id\` INT AUTO_INCREMENT COMMENT 'Clave primaria autoincremental',
                \`nombre\` VARCHAR(100) NOT NULL COMMENT 'Nombre completo del repartidor',
                \`correo\` VARCHAR(100) UNIQUE NOT NULL COMMENT 'Correo de acceso',
                \`password\` VARCHAR(255) NOT NULL COMMENT 'Contraseña encriptada con bcrypt',
                \`moto_marca\` VARCHAR(50) NULL COMMENT 'Marca de la motocicleta',
                \`moto_modelo\` VARCHAR(50) NULL COMMENT 'Modelo de la motocicleta',
                \`moto_placa\` VARCHAR(20) NULL COMMENT 'Placa del vehículo',
                \`moto_color\` VARCHAR(20) NULL COMMENT 'Color del vehículo',
                \`licencia_numero\` VARCHAR(50) NULL COMMENT 'Número de licencia',
                \`licencia_expiracion\` DATE NULL COMMENT 'Fecha de expiración de la licencia',
                \`disponible\` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = Disponible, 0 = No disponible',
                \`alertas_activas\` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Sí, 0 = No',
                \`gps_activo\` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = Sí, 0 = No',
                \`ganancias_acumuladas\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Ganancias acumuladas',
                \`puntos_acumulados\` INT NOT NULL DEFAULT 0 COMMENT 'Puntos acumulados',
                \`pedidos_hoy\` INT NOT NULL DEFAULT 0 COMMENT 'Pedidos entregados hoy',
                \`pedido_activo\` TEXT NULL COMMENT 'JSON stringified del pedido activo',
                \`historial_entregas\` TEXT NULL COMMENT 'JSON stringified del historial de entregas',
                \`creado_en\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de registro',
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await pool.query(createTableQuery);
        console.log('✅ Tabla "repartidores" creada o ya existente en la base de datos.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando la migración:', error);
        process.exit(1);
    }
}

migrate();

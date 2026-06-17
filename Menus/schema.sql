-- =============================================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS Y DATOS DE PRUEBA
-- Proyecto: Delivery 'Los Copilot' (Sección Menús)
-- Rol: Administrador de Bases de Datos (DBA) & Backend Developer Senior
-- Motor de Base de Datos: MySQL 8.0+
-- Optimizado para: MySQL Workbench & Node.js (mysql2/mysql)
-- =============================================================================

-- 1. CREACIÓN DEL ESQUEMA / BASE DE DATOS
CREATE DATABASE IF NOT EXISTS `delivery_los_copilot` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `delivery_los_copilot`;

-- Limpieza previa de tablas en orden correcto debido a restricciones de Foreign Keys
DROP TABLE IF EXISTS `detalle_pedidos`;
DROP TABLE IF EXISTS `pedidos`;
DROP TABLE IF EXISTS `platillos`;
DROP TABLE IF EXISTS `restaurantes`;

-- =============================================================================
-- TABLA: restaurantes (Estructura Original)
-- =============================================================================
CREATE TABLE `restaurantes` (
    `id` INT AUTO_INCREMENT COMMENT 'Clave primaria autoincremental',
    `nombre` VARCHAR(100) NOT NULL COMMENT 'Nombre comercial del restaurante',
    `direccion` VARCHAR(255) NULL COMMENT 'Dirección física del establecimiento',
    `telefono` VARCHAR(20) NULL COMMENT 'Teléfono de contacto',
    `distancia_km` DECIMAL(3, 1) NOT NULL DEFAULT 0.0 COMMENT 'Distancia en kilómetros al usuario',
    `tiempo_entrega_min` INT NOT NULL DEFAULT 0 COMMENT 'Tiempo estimado de entrega en minutos',
    `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Estado del restaurante: 1 = Activo, 0 = Inactivo',
    `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de registro',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLA: platillos (o menus)
-- =============================================================================
CREATE TABLE `platillos` (
    `id` INT AUTO_INCREMENT COMMENT 'Clave primaria autoincremental del platillo',
    `id_restaurante` INT NOT NULL COMMENT 'Relación 1 a muchos con la tabla restaurantes',
    `nombre` VARCHAR(100) NOT NULL COMMENT 'Nombre del platillo',
    `descripcion` VARCHAR(255) NULL COMMENT 'Detalle de los ingredientes o presentación',
    `precio` DECIMAL(10, 2) NOT NULL COMMENT 'Precio exacto de venta al público',
    `categoria` VARCHAR(50) NOT NULL COMMENT 'Categoría de agrupación (ej. combos, antojos, postres)',
    `disponible` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Disponibilidad del platillo: 1 = Disponible, 0 = Agotado',
    `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de registro',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_platillos_restaurantes`
        FOREIGN KEY (`id_restaurante`)
        REFERENCES `restaurantes` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- ÍNDICES DE OPTIMIZACIÓN (Semáforo de Precios)
-- =============================================================================
CREATE INDEX `idx_categoria_precio` ON `platillos` (`categoria`, `precio`);
CREATE INDEX `idx_restaurante_categoria` ON `platillos` (`id_restaurante`, `categoria`);

-- =============================================================================
-- INSERCIÓN DE DATOS DE PRUEBA (DATA SEEDING ORIGINAL - REMOVIDO PARA PRODUCCIÓN)
-- =============================================================================



-- =============================================================================
-- ACTUALIZACIÓN DE LA BASE DE DATOS (AGREGADO AL FINAL DEL SCRIPT)
-- =============================================================================

-- 1. Comando ALTER TABLE a la tabla restaurantes para agregar email y password
ALTER TABLE `restaurantes` 
    ADD COLUMN `email` VARCHAR(100) UNIQUE COMMENT 'Correo electrónico único de acceso' AFTER `telefono`,
    ADD COLUMN `password` VARCHAR(255) NULL COMMENT 'Contraseña encriptada con bcrypt' AFTER `email`;

-- 2. Estructura relacional simulada para las tablas pedidos y detalle_pedidos
CREATE TABLE `pedidos` (
    `id` INT AUTO_INCREMENT COMMENT 'Clave primaria autoincremental del pedido',
    `id_restaurante` INT NOT NULL COMMENT 'Relación con el restaurante que procesa el pedido',
    `cliente_nombre` VARCHAR(100) NOT NULL COMMENT 'Nombre del cliente',
    `direccion_entrega` VARCHAR(255) NOT NULL COMMENT 'Dirección de envío',
    `telefono_cliente` VARCHAR(20) NOT NULL COMMENT 'Teléfono de contacto',
    `total` DECIMAL(10, 2) NOT NULL COMMENT 'Total del pedido',
    `estado` VARCHAR(50) NOT NULL DEFAULT 'Pendiente' COMMENT 'Estado del pedido (Pendiente, Preparando, Enviado, Entregado, Cancelado)',
    `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del pedido',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_pedidos_restaurantes`
        FOREIGN KEY (`id_restaurante`)
        REFERENCES `restaurantes` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `detalle_pedidos` (
    `id` INT AUTO_INCREMENT COMMENT 'Clave primaria del detalle',
    `id_pedido` INT NOT NULL COMMENT 'Relación con la cabecera de la orden',
    `id_platillo` INT NOT NULL COMMENT 'Relación con el platillo',
    `cantidad` INT NOT NULL COMMENT 'Cantidad solicitada',
    `precio_unitario` DECIMAL(10, 2) NOT NULL COMMENT 'Precio unitario cobrado',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_detalle_pedidos_pedidos`
        FOREIGN KEY (`id_pedido`)
        REFERENCES `pedidos` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_detalle_pedidos_platillos`
        FOREIGN KEY (`id_platillo`)
        REFERENCES `platillos` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices adicionales para optimizar joins de pedidos y agregaciones analíticas
CREATE INDEX `idx_pedidos_restaurante_fecha` ON `pedidos` (`id_restaurante`, `creado_en` DESC);
CREATE INDEX `idx_detalle_pedidos_platillo` ON `detalle_pedidos` (`id_platillo`);

-- =============================================================================
-- INSERCIÓN Y ACTUALIZACIONES DE PRUEBA (REMOVIDOS PARA PRODUCCIÓN)
-- =============================================================================

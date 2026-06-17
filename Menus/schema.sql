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
DROP TABLE IF EXISTS `platillos`;
DROP TABLE IF EXISTS `restaurantes`;

-- =============================================================================
-- TABLA: restaurantes
-- =============================================================================
CREATE TABLE `restaurantes` (
    `id` INT AUTO_INCREMENT COMMENT 'Clave primaria autoincremental',
    `nombre` VARCHAR(100) NOT NULL COMMENT 'Nombre comercial del restaurante',
    `direccion` VARCHAR(255) NULL COMMENT 'Dirección física del establecimiento',
    `telefono` VARCHAR(20) NULL COMMENT 'Teléfono de contacto',
    `distancia_km` DECIMAL(3, 1) NOT NULL DEFAULT 0.0 COMMENT 'Distancia en kilómetros al usuario',
    `tiempo_entrega_min` INT NOT NULL DEFAULT 0 COMMENT 'Tiempo estimado de entrega en minutos',
    -- TINYINT(1) es el estándar en MySQL para representar booleanos.
    -- Los drivers de Node.js (como mysql2) mapean automáticamente TINYINT(1) a booleano true/false.
    `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Estado del restaurante: 1 = Activo (true), 0 = Inactivo (false)',
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
    -- DECIMAL(10,2) almacena valores numéricos exactos de punto fijo.
    -- Previene problemas de redondeo y pérdida de precisión de punto flotante (Double/Float) en operaciones con dinero.
    `precio` DECIMAL(10, 2) NOT NULL COMMENT 'Precio exacto de venta al público',
    `categoria` VARCHAR(50) NOT NULL COMMENT 'Categoría de agrupación (ej. combos, antojos, postres)',
    -- Igual que en restaurantes, TINYINT(1) se mapea a booleano en Node.js.
    `disponible` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Disponibilidad del platillo: 1 = Disponible, 0 = Agotado',
    `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de registro',
    PRIMARY KEY (`id`),
    -- Restricción de integridad referencial
    CONSTRAINT `fk_platillos_restaurantes`
        FOREIGN KEY (`id_restaurante`)
        REFERENCES `restaurantes` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- ÍNDICES DE OPTIMIZACIÓN (Semáforo de Precios)
-- =============================================================================
-- Para calcular el semáforo de precios (saber cuál es el más caro o barato de una misma categoría),
-- el backend ejecutará constantemente consultas agrupadas o filtradas por la columna 'categoria'
-- y ordenadas o evaluadas por 'precio'.
-- Un índice compuesto (categoria, precio) optimiza estas consultas al permitir búsquedas directas
-- y ordenación eficiente en memoria (evitando filesort).
CREATE INDEX `idx_categoria_precio` ON `platillos` (`categoria`, `precio`);

-- Adicionalmente, el driver de MySQL requiere buscar platillos de un restaurante en particular.
-- MySQL crea automáticamente un índice para la foreign key, pero especificamos este para consultas 
-- frecuentes que combinen restaurante y categoría.
CREATE INDEX `idx_restaurante_categoria` ON `platillos` (`id_restaurante`, `categoria`);


-- =============================================================================
-- 2. INSERCIÓN DE DATOS DE PRUEBA (DATA SEEDING)
-- =============================================================================

-- Restaurantes obligatorios (Exactamente 5 locales)
INSERT INTO `restaurantes` (`id`, `nombre`, `direccion`, `telefono`, `distancia_km`, `tiempo_entrega_min`, `activo`) VALUES
(1, 'Taco Bell', 'Centro Comercial Altamira, Local 12', '2244-1111', 1.5, 15, 1),
(2, 'McDonalds', 'Bulevar Los Próceres, Plaza Salvador del Mundo', '2255-2222', 2.8, 22, 1),
(3, 'Pollo Campero', 'Avenida Franklin Roosevelt y 49 Av. Sur', '2273-6000', 3.2, 25, 1),
(4, 'El Pinche', 'Centro Comercial Multiplaza, Nivel 2', '2288-4444', 4.0, 30, 1),
(5, 'Pupusería La Bendición', 'Calle Principal Planes de Renderos, No. 45', '2299-5555', 0.8, 10, 1);

-- Platillos (Exactamente 2 por cada uno de los 5 restaurantes = 10 registros)
-- Se repiten las categorías ('combos' y 'antojos') con distintos precios para probar el semáforo.
INSERT INTO `platillos` (`id_restaurante`, `nombre`, `descripcion`, `precio`, `categoria`, `disponible`) VALUES
-- Platillos Taco Bell (id_restaurante = 1)
(1, 'Combo Big Bell Box', 'Incluye 1 burrito, 1 taco, papas fritas y bebida mediana', 5.50, 'combos', 1),
(1, 'Fiesta Fries con Queso', 'Papas fritas sazonadas con salsa de queso caliente', 2.75, 'antojos', 1),

-- Platillos McDonalds (id_restaurante = 2)
(2, 'Combo Big Mac Gigante', 'Hamburguesa de dos pisos de carne de res, papas y gaseosa grande', 6.99, 'combos', 1),
(2, 'Papas Fritas Medianas', 'Clásicas papas fritas saladas crujientes', 1.85, 'antojos', 1),

-- Platillos Pollo Campero (id_restaurante = 3)
(3, 'Combo Campero de 3 Piezas', '3 piezas de pollo tradicional, acompañamiento y bebida', 7.25, 'combos', 1),
(3, 'Flan de Caramelo Campero', 'Postre cremoso clásico con baño de caramelo casero', 2.10, 'postres', 1),

-- Platillos El Pinche (id_restaurante = 4)
(4, 'Combo Tacos Al Pastor', '5 tacos de tortilla de maíz con carne al pastor, piña, cilantro y cebolla', 8.50, 'combos', 1),
(4, 'Volcán de Queso y Chorizo', 'Tortilla de maíz tostada con queso fundido y chorizo encima', 3.25, 'antojos', 1),

-- Platillos Pupusería La Bendición (id_restaurante = 5)
(5, 'Combo Familiar de Pupusas', '6 pupusas revueltas más 2 bebidas típicas a elección', 4.50, 'combos', 1),
(5, 'Pupusa Especial de Queso con Loroco', 'Pupusa de maíz con abundante queso y loroco fresco', 1.25, 'antojos', 1);

-- =============================================================================
-- CONSULTAS DE VERIFICACIÓN / PRUEBAS DE CONCEPTO PARA EL SEMÁFORO DE PRECIOS
-- =============================================================================
-- Estas consultas demuestran cómo el backend puede consumir el índice idx_categoria_precio
-- para calcular de forma sumamente rápida el semáforo (Mínimo, Máximo y Promedio de cada categoría).

-- Consulta A: Resumen de límites de precio por categoría (Semáforo general)
-- SELECT 
--     categoria, 
--     MIN(precio) AS precio_mas_barato, 
--     MAX(precio) AS precio_mas_caro,
--     ROUND(AVG(precio), 2) AS precio_promedio
-- FROM platillos
-- WHERE disponible = 1
-- GROUP BY categoria;

-- Consulta B: Obtener platillos con su estado de semáforo calculado en base a los límites
-- (Ejemplo de lógica que el backend de Node.js implementará de forma óptima)
-- SELECT 
--     p.nombre AS platillo,
--     r.nombre AS restaurante,
--     p.categoria,
--     p.precio,
--     CASE 
--         WHEN p.precio = lims.min_precio THEN 'VERDE (Más barato)'
--         WHEN p.precio = lims.max_precio THEN 'ROJO (Más caro)'
--         ELSE 'AMARILLO (Intermedio)'
--     END AS semaforo
-- FROM platillos p
-- JOIN restaurantes r ON p.id_restaurante = r.id
-- JOIN (
--     SELECT categoria, MIN(precio) AS min_precio, MAX(precio) AS max_precio 
--     FROM platillos 
--     GROUP BY categoria
-- ) lims ON p.categoria = lims.categoria
-- ORDER BY p.categoria, p.precio ASC;

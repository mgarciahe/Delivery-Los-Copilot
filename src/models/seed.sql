USE `delivery_los_copilot`;

-- Insertar los 5 restaurantes obligatorios (Contraseña por defecto para todos: 123456)
INSERT INTO `restaurantes` (`id`, `nombre`, `direccion`, `telefono`, `email`, `password`, `distancia_km`, `tiempo_entrega_min`, `activo`) VALUES
(1, 'Taco Bell', 'Calle Principal Zona 10', '2200-1111', 'tacobell@delivery.com', '$2b$10$y6/aE4973hCagXn50Hl3k.r2N/x2aR7Q9hM4wD2C1c6c5C7e8m2yG', 1.5, 20, 1),
(2, 'McDonalds', 'Avenida Reforma Zona 9', '2200-2222', 'mcdonalds@delivery.com', '$2b$10$y6/aE4973hCagXn50Hl3k.r2N/x2aR7Q9hM4wD2C1c6c5C7e8m2yG', 2.3, 25, 1),
(3, 'Pollo Campero', 'Calzada Roosevelt', '2200-3333', 'campero@delivery.com', '$2b$10$y6/aE4973hCagXn50Hl3k.r2N/x2aR7Q9hM4wD2C1c6c5C7e8m2yG', 3.0, 30, 1),
(4, 'El Pinche', 'Centro Comercial Pradera', '2200-4444', 'elpinche@delivery.com', '$2b$10$y6/aE4973hCagXn50Hl3k.r2N/x2aR7Q9hM4wD2C1c6c5C7e8m2yG', 4.1, 35, 1),
(5, 'Pupusería El Portal', 'Mercado Central Zona 1', '2200-5555', 'pupuseria@delivery.com', '$2b$10$y6/aE4973hCagXn50Hl3k.r2N/x2aR7Q9hM4wD2C1c6c5C7e8m2yG', 0.8, 15, 1);

-- Insertar platillos de prueba en categorías 'combos' y 'antojos' con precios variados para validar el semáforo
INSERT INTO `platillos` (`id_restaurante`, `nombre`, `descripcion`, `precio`, `categoria`, `disponible`) VALUES
(1, 'Combo Taco Gigante', '2 Tacos gigantes, papas y bebida grande', 45.00, 'combos', 1),
(1, 'Antojo de Nachos', 'Nachos con queso, frijoles y guacamole', 25.00, 'antojos', 1),
(2, 'Combo Big Mac', 'Hamburguesa Big Mac, papas y bebida mediana', 55.00, 'combos', 1),
(2, 'Antojo McFlurry', 'Helado suave con galleta Oreo', 18.00, 'antojos', 1),
(3, 'Combo Super Campero', '3 Piezas de pollo, papas, ensalada y bebida', 60.00, 'combos', 1),
(3, 'Antojo Empanadas', '3 Empanadas de pollo con salsa', 20.00, 'antojos', 1),
(4, 'Combo Tacos de Asada', '3 Tacos de asada con cebollitas y cebollín', 65.00, 'combos', 1),
(4, 'Antojo Gringas', 'Tortilla de harina con queso y carne al pastor', 30.00, 'antojos', 1),
(5, 'Combo Pupusas Mixtas', '3 Pupusas revueltas con curtido, salsa y bebida', 35.00, 'combos', 1),
(5, 'Antojo Tamalito de Elote', '1 Tamalito con crema', 12.00, 'antojos', 1);

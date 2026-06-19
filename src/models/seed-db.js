const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // Permitir múltiples declaraciones SQL juntas
};

async function runSeed() {
    console.log('🔄 Iniciando inicialización y población de base de datos...');
    
    let connection;
    try {
        // 1. Conectar a MySQL
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión a MySQL establecida.');

        // 2. Leer y ejecutar schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('⏳ Creando base de datos y tablas...');
        await connection.query(schemaSql);
        console.log('✅ Base de datos y tablas creadas con éxito.');

        // 3. Seleccionar la base de datos
        await connection.query('USE `delivery_los_copilot`');

        // 4. Generar contraseña hash real para los restaurantes
        const rawPassword = '123456';
        const passwordHash = bcrypt.hashSync(rawPassword, 10);
        console.log(`🔑 Generando contraseña encriptada (bcrypt) para los restaurantes...`);

        // 5. Insertar restaurantes
        console.log('⏳ Insertando restaurantes...');
        const restaurantes = [
            [1, 'Taco Bell', 'Calle Principal Zona 10', '2200-1111', 'tacobell@delivery.com', passwordHash, 1.5, 20, 1],
            [2, 'McDonalds', 'Avenida Reforma Zona 9', '2200-2222', 'mcdonalds@delivery.com', passwordHash, 2.3, 25, 1],
            [3, 'Pollo Campero', 'Calzada Roosevelt', '2200-3333', 'campero@delivery.com', passwordHash, 3.0, 30, 1],
            [4, 'El Pinche', 'Centro Comercial Pradera', '2200-4444', 'elpinche@delivery.com', passwordHash, 4.1, 35, 1],
            [5, 'Pupusería El Portal', 'Mercado Central Zona 1', '2200-5555', 'pupuseria@delivery.com', passwordHash, 0.8, 15, 1]
        ];

        for (const rest of restaurantes) {
            await connection.query(
                `INSERT INTO \`restaurantes\` (\`id\`, \`nombre\`, \`direccion\`, \`telefono\`, \`email\`, \`password\`, \`distancia_km\`, \`tiempo_entrega_min\`, \`activo\`) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                rest
            );
        }
        console.log('✅ 5 Restaurantes insertados con contraseña "123456".');

        // 5.5. Insertar cliente semilla
        console.log('⏳ Insertando cliente semilla...');
        const clientPasswordHash = bcrypt.hashSync('123456', 10);
        await connection.query(
            `INSERT INTO \`clientes\` (\`id\`, \`nombre\`, \`apellido\`, \`email\`, \`password\`) 
             VALUES (?, ?, ?, ?, ?)`,
            [1, 'Miguel', 'García', 'miguel@delivery.com', clientPasswordHash]
        );
        console.log('✅ Cliente semilla "miguel@delivery.com" insertado con contraseña "123456".');

        // 6. Insertar platillos
        console.log('⏳ Insertando platillos de prueba...');
        const platillos = [
            [1, 'Combo Taco Gigante', '2 Tacos gigantes, papas y bebida grande', 45.00, 'combos', 1],
            [1, 'Antojo de Nachos', 'Nachos con queso, frijoles y guacamole', 25.00, 'antojos', 1],
            [2, 'Combo Big Mac', 'Hamburguesa Big Mac, papas y bebida mediana', 55.00, 'combos', 1],
            [2, 'Antojo McFlurry', 'Helado suave con galleta Oreo', 18.00, 'antojos', 1],
            [3, 'Combo Super Campero', '3 Piezas de pollo, papas, ensalada y bebida', 60.00, 'combos', 1],
            [3, 'Antojo Empanadas', '3 Empanadas de pollo con salsa', 20.00, 'antojos', 1],
            [4, 'Combo Tacos de Asada', '3 Tacos de asada con cebollitas y cebollín', 65.00, 'combos', 1],
            [4, 'Antojo Gringas', 'Tortilla de harina con queso y carne al pastor', 30.00, 'antojos', 1],
            [5, 'Combo Pupusas Mixtas', '3 Pupusas revueltas con curtido, salsa y bebida', 35.00, 'combos', 1],
            [5, 'Antojo Tamalito de Elote', '1 Tamalito con crema', 12.00, 'antojos', 1]
        ];

        for (const plat of platillos) {
            await connection.query(
                `INSERT INTO \`platillos\` (\`id_restaurante\`, \`nombre\`, \`descripcion\`, \`precio\`, \`categoria\`, \`disponible\`) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                plat
            );
        }
        console.log('✅ Platillos de prueba insertados con éxito.');
        console.log('🚀 Base de datos inicializada completamente.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runSeed();

# Delivery-Los-Copilot (Sección Menús)

Este repositorio contiene la sección de **Menús** de la aplicación similar a 'PedidosYa', desarrollada en equipo utilizando Node.js y MySQL.

---

## 🛠️ Arquitectura y Diseño de la Base de Datos

El diseño de la base de datos se encuentra detallado en el archivo [schema.sql](file:///c:/Users/mllan/OneDrive/Documentos/CREA_IA2026/proyecto_copilot/Delivery-Los-Copilot/Menus/schema.sql) y ha sido optimizado con buenas prácticas de nivel **Senior DBA**:

### 1. Relación y Estructura
* **`restaurantes`**: Almacena los locales obligatorios (Taco Bell, McDonalds, Pollo Campero, El Pinche y Pupusería). Incluye detalles adicionales como distancia (`distancia_km`) y tiempo estimado de entrega (`tiempo_entrega_min`).
* **`platillos`**: Almacena los menús correspondientes. Existe una relación **1 a Muchos** (un restaurante tiene muchos platillos) a través de una llave foránea (`id_restaurante`) con restricciones de integridad referencial `ON DELETE CASCADE` y `ON UPDATE CASCADE`.

### 2. Decisiones Clave de Tipos de Datos (DBA & Node.js Developer)
* **Precisión Financiera (`DECIMAL(10,2)`)**: Para el precio se utiliza `DECIMAL(10,2)` en lugar de `FLOAT` o `DOUBLE`. Esto asegura que MySQL almacene y redondee los precios con precisión decimal exacta, previniendo errores acumulativos y conflictos con los números de punto flotante en JavaScript.
* **Compatibilidad Booleana Nativa (`TINYINT(1)`)**: En MySQL, las columnas de estado (`activo` y `disponible`) se definen como `TINYINT(1)`. Los drivers más populares de Node.js (como `mysql2`) interpretan y mapean de manera nativa esta columna a booleanos en JavaScript (`true` / `false`), garantizando una integración limpia.
* **Índices de Optimización del Semáforo**:
  * `idx_categoria_precio` en `(categoria, precio)`: Optimiza la consulta que calcula el semáforo por categoría. Permite que el motor de MySQL extraiga los precios mínimos y máximos de cada categoría de manera inmediata mediante búsquedas indexadas y sin necesidad de ordenaciones costosas en disco (`filesort`).
  * `idx_restaurante_categoria` en `(id_restaurante, categoria)`: Acelera las búsquedas habituales cuando un cliente filtra la carta de un local particular por tipo de comida.

---

## ⚡ Guía de Instalación y Uso

### Paso 1: Configurar la Base de Datos en MySQL Workbench
1. Abre **MySQL Workbench** y conéctate a tu base de datos.
2. Abre y ejecuta el archivo [schema.sql](file:///c:/Users/mllan/OneDrive/Documentos/CREA_IA2026/proyecto_copilot/Delivery-Los-Copilot/Menus/schema.sql).
3. Este script creará la base de datos `delivery_los_copilot`, definirá las tablas, configurará los índices e insertará **10 datos de prueba** realistas para los 5 restaurantes requeridos, repitiendo las categorías `combos` y `antojos` a distintos precios para validar el semáforo.

### Paso 2: Configurar e Iniciar el Servidor Backend (Node.js)
1. Instala las dependencias necesarias en la carpeta del proyecto:
   ```bash
   npm install express mysql2
   ```
2. Asegúrate de tener configurado el pool de conexiones en el archivo [menus_backend.js](file:///c:/Users/mllan/OneDrive/Documentos/CREA_IA2026/proyecto_copilot/Delivery-Los-Copilot/Menus/menus_backend.js). Por defecto, utiliza las siguientes credenciales (puedes cambiarlas en el código o usar variables de entorno):
   * **Host:** `localhost`
   * **User:** `root`
   * **Password:** ` ` (Vacío)
   * **Database:** `delivery_los_copilot`
3. Ejecuta el servidor desde tu terminal:
   ```bash
   node Menus/menus_backend.js
   ```
4. Abre tu navegador e ingresa a: **`http://localhost:3000`** para interactuar con la aplicación.

---

## 🎨 Frontend y Semáforo de Precios
La aplicación calculará en tiempo real qué platillos son los más económicos y caros dentro de una misma categoría. La interfaz premium en [menu.html](file:///c:/Users/mllan/OneDrive/Documentos/CREA_IA2026/proyecto_copilot/Delivery-Los-Copilot/Menus/menu.html) utiliza **Glassmorphism** y **Modo Oscuro** para pintar dinámicamente las tarjetas de menú:
* 🟢 **Verde (Económico)**: El platillo más barato de esa categoría.
* 🟡 **Amarillo (Estándar)**: Platillos con precios intermedios.
* 🔴 **Rojo (Exclusivo)**: El platillo más caro de esa categoría.

La búsqueda por texto (`menu_view.js`) incluye un mecanismo de **Debounce (250ms)** para evitar saturar el servidor con múltiples consultas a la base de datos mientras el usuario escribe.

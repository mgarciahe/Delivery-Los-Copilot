# Prompts para Unificación del Proyecto - Antigravity IDE

Para unificar con éxito tres proyectos o carpetas de código independientes en una sola aplicación cohesiva utilizando un agente de IA en Antigravity IDE, lo ideal es estructurar la tarea en **dos fases**:
1. **Fase 1: Análisis y Plan de Arquitectura Unificada**
2. **Fase 2: Ejecución e Integración de Código**

A continuación se presentan los dos prompts diseñados bajo el framework de las **5 Claves del Prompting** (Rol, Contexto, Tarea/Objetivo, Instrucciones/Pasos, y Restricciones/Formato).

---

## Prompt 1: Análisis y Planificación de Unificación (Fase 1)

```markdown
# 1. ROL
Actúa como un Arquitecto de Software Senior y Líder Técnico experto en Node.js, Express, JavaScript y bases de datos relacionales (MySQL).

# 2. CONTEXTO
Somos un equipo de 4 estudiantes desarrollando una aplicación web de delivery unificada llamada "Los Copilots". Tres de mis compañeros desarrollaron partes independientes del sistema:
- Compañero 1: Creación del portal del cliente, catálogo, carrito y menú del usuario.
- Compañero 2: Creación del panel de repartidores, GPS y lógica de disponibilidad.
- Compañero 3: Creación del panel de proveedores (restaurantes) y gestión de menús/pedidos.
Yo soy el Integrador (Compañero 4) y tengo los tres repositorios/carpetas con sus respectivos archivos de frontend, backend y scripts SQL en mi espacio de trabajo. Necesito unificar todo en un solo servidor de producción unificado en Node.js/Express y una base de datos relacional MySQL integrada.

# 3. TAREA / OBJETIVO
Analiza las estructuras de carpetas, bases de datos (tablas, llaves foráneas y scripts SQL) y endpoints de backend de las tres aplicaciones y genera un Plan de Implementación detallado para integrarlas en una arquitectura unificada y limpia que comparta un único servidor Express y una sola base de datos MySQL.

# 4. INSTRUCCIONES / PASOS
1. Revisa las tablas y bases de datos de cada módulo para proponer un esquema SQL unificado que conecte clientes, restaurantes, platillos, repartidores y pedidos mediante relaciones relacionales correctas (llaves foráneas).
2. Propón una estructura de directorios limpia (ej. MVC: `/src/controllers`, `/src/models`, `/src/views`, `/src/views/repartidor`, etc.) que agrupe los frontends estáticos sin que colisionen sus estilos CSS o archivos JavaScript.
3. Diseña el esquema de enrutamiento unificado para el archivo `server.js` único (ej. `/api/auth`, `/api/provider`, `/api/repartidor`, `/api/pedidos`).
4. Identifica posibles colisiones de nombres de variables, funciones o dependencias en los archivos `package.json`.

# 5. RESTRICCIONES / FORMATO
- No modifiques ni escribas código todavía; enfócate exclusivamente en el diagnóstico y la planificación.
- Devuelve el resultado en formato Markdown estructurado que contenga:
  - Diagrama ER propuesto para la base de datos MySQL unificada.
  - Árbol de la nueva estructura de directorios unificada.
  - Lista de rutas y endpoints del servidor único.
  - Plan de migración de datos paso a paso.
```

---

## Prompt 2: Ejecución de la Integración y Fusión de Código (Fase 2)

```markdown
# 1. ROL
Actúa como un Ingeniero de Software Fullstack Senior especializado en refactorización de código e integración de sistemas web en Node.js, Express y bases de datos MySQL.

# 2. CONTEXTO
He revisado y aprobado el plan de arquitectura unificada para integrar los módulos de Cliente, Repartidor y Proveedor en un único servidor de "Los Copilots". Ahora es momento de fusionar físicamente el código de los tres repositorios en la estructura MVC del proyecto actual.

# 3. TAREA / OBJETIVO
Realiza la fusión e integración física de los módulos de frontend y backend de las 3 páginas en el servidor unificado y configura los scripts de inicialización de la base de datos MySQL compartida.

# 4. INSTRUCCIONES / PASOS
1. **Unificación del Servidor:** Configura o crea el archivo principal `server.js` para levantar un único puerto, sirviendo los archivos estáticos de cada módulo (ej. `/repartidor` para el portal de choferes, y `/` para el portal de clientes y socios) y registrando todos los routers y middlewares de autenticación de cada sección.
2. **Base de Datos Unificada:** Crea un script SQL único de creación de tablas (`schema.sql`) y un script de población de datos (`seed.js` o similar) con la encriptación de contraseñas usando bcrypt para que todos los usuarios semilla (cliente, repartidor y restaurantes) puedan iniciar sesión de forma real.
3. **Consolidación del Frontend:** Mueve los archivos HTML, CSS y JS de cada portal a sus rutas públicas respectivas, asegurándote de actualizar las rutas de las llamadas `fetch` en el JS cliente para que apunten a las APIs del servidor unificado.
4. **Prueba de Dependencias:** Integra los archivos `package.json` en uno solo con todas las dependencias requeridas (express, mysql2, bcrypt, jsonwebtoken, dotenv, etc.).

# 5. RESTRICCIONES / FORMATO
- El código resultante debe compilar y ejecutarse correctamente con el comando `npm run dev`.
- Mantén aislados los estilos de cada portal (ej. usando selectores específicos o archivos CSS independientes) para evitar que el diseño de una interfaz afecte a la otra.
- No borres funcionalidades previas; asegúrate de que la comunicación en tiempo real (polling o sockets) siga funcionando.
- Presenta los cambios en un plan de implementación detallado y confirma antes de sobreescribir archivos críticos del workspace.
```

# Registro de Solicitudes Académicas 🎓

## 📝 Descripción del Proyecto
Este proyecto consiste en el desarrollo colaborativo de una aplicación web funcional para el registro, visualización y gestión de solicitudes académicas estudiantiles. El sistema centraliza requerimientos relacionados con evaluaciones, asistencia, contenidos y plataforma, optimizando la organización y el seguimiento de los mismos por parte del cuerpo docente[cite: 1]. 

La aplicación incorpora una arquitectura limpia de desarrollo *frontend* utilizando **HTML5, CSS3, JavaScript (ES6+) y Bootstrap 5**, aplicando validaciones estrictas y manipulación dinámica del DOM sin dependencias de servidores externos.

---

## 👥 Integrantes del Equipo
*   **Integrante 1:** Samuel Giraldo 
*   **Integrante 2:** Sebastian Sanchez
*   **Integrante 3:** Cristopher Gonzalez

---

## 🚀 Características y Funcionalidades Implementadas
La aplicación se adaptó con un **Módulo de Login por Roles** que divide el entorno de trabajo según el usuario autenticado:

### 🔹 Vista del Estudiante
*   **Formulario de Ingreso Mínimo:** Permite registrar solicitudes con los campos obligatorios: Nombre, Asignatura, Tipo de Solicitud (Evaluación, Asistencia, Contenidos, Plataforma, Otro), Prioridad (Baja, Media, Alta), Fecha e Ingreso de Descripción.
*   **Privacidad por Cuenta:** El estudiante ingresa con su credencial (correo) y el sistema bloquea el formulario con sus datos, permitiéndole visualizar de forma exclusiva **únicamente sus requerimientos y el historial de respuestas del profesor**.
*   **Estado en Tiempo Real:** Visualización de etiquetas dinámicas que indican si el caso está `⏳ Pendiente` o `✓ Resuelto`.

### 🔹 Vista del Profesor / Académico
*   **Consola Global de Supervisión:** Oculta los formularios de ingreso para desplegar la tabla a pantalla completa, permitiendo auditar la totalidad de los requerimientos de la institución.
*   **Filtros de Información:** Selector dinámico para filtrar solicitudes según su nivel de prioridad (Alta, Media, Baja) o tipo.
*   **Módulo de Retroalimentación:** Apertura programática de un Modal de Bootstrap para inspeccionar la ficha del alumno, revisar el caso detallado y **redactar una respuesta oficial** que le aparecerá al alumno en su panel.
*   **Gestión de Registros:** Capacidad de remover o solucionar solicitudes del listado dinámico.

---

## 🛠️ Requerimientos Técnicos Cumplidos
*   **Estructura Semántica:** Uso correcto de etiquetas HTML5 (`<header>`, `<main>`, `<section>`).
*   **Separación de Capas:** División estricta de archivos independientes para HTML, CSS y JS.
*   **Validaciones del Lado del Cliente (JavaScript):**
    *   Inspección contra campos obligatorios vacíos antes de guardar.
    *   Validación de formato de correo institucional mediante expresiones regulares (RegEx).
    *   Validación de extensión mínima exigida para la descripción (Mínimo 15 caracteres).
*   **Seguridad Frontend (Sanitización):** Implementación de una función de escape de caracteres HTML para prevenir vulnerabilidades de inyección de código (XSS) en los nombres o descripciones reflejadas.

---

## 🧪 Casos de Prueba Mínimos Superados (Rúbrica)
De acuerdo a las directrices de la pauta de evaluación, el equipo verificó con éxito los siguientes comportamientos en la consola del navegador:
1.  **Prueba de Vacíos:** El formulario bloquea el envío e imprime un mensaje de alerta claro si faltan datos obligatorios.
2.  **Prueba de Correo:** El sistema rechaza strings de correo que no contengan `@` o dominios válidos.
3.  **Prueba de Longitud:** Descripciones menores a 15 caracteres disparan una advertencia de feedback.
4.  **Prueba de Inserción:** Al ingresar datos válidos, se genera un objeto en memoria y se añade dinámicamente una nueva fila a la tabla con alertas de confirmación.
5.  **Prueba de Eliminación:** El botón "Eliminar / Resolver" altera la longitud del arreglo global y redibuja la grilla limpiamente.
6.  **Prueba de Filtro:** El selector discrimina las filas en pantalla según el criterio seleccionado sin corromper la base de datos interna.

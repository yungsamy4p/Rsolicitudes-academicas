// Arreglo global para almacenar los objetos de solicitudes (Base de datos en memoria)
let solicitudes = [];

// Definición de la extensión mínima exigida para la descripción (Criterio de prueba)
const MIN_LONGITUD_DESCRIPCION = 15; 

// --- Captura de Elementos del DOM ---
const formulario = document.getElementById('solicitudForm');
const tablaBody = document.getElementById('tablaSolicitudesBody');
const filtroPrioridad = document.getElementById('filtroPrioridad');
const contadorSolicitudes = document.getElementById('contadorSolicitudes');
const alertPlaceholder = document.getElementById('liveAlertPlaceholder');

// --- Manejo de Eventos ---
document.addEventListener('DOMContentLoaded', () => {
    // Escuchar el envío del formulario
    formulario.addEventListener('submit', procesarFormulario);
    // Escuchar cambios en el selector del filtro
    filtroPrioridad.addEventListener('change', filtrarResultados);
    // Establecer la fecha actual de forma automática por comodidad de UX
    document.getElementById('fechaIngreso').valueAsDate = new Date();
});

// --- Función Principal al Enviar Formulario ---
function procesarFormulario(e) {
    e.preventDefault(); // Evita la recarga nativa de la página
    
    // Capturar datos del formulario
    const nombre = document.getElementById('nombreEstudiante').value.trim();
    const correo = document.getElementById('correoInstitucional').value.trim();
    const asignatura = document.getElementById('asignatura').value.trim();
    const tipo = document.getElementById('tipoSolicitud').value;
    const prioridad = document.getElementById('prioridad').value;
    const fecha = document.getElementById('fechaIngreso').value;
    const descripcion = document.getElementById('descripcion').value.trim();

    // --- Validaciones de Campos Mandatorios ---
    if (!nombre || !correo || !asignatura || !tipo || !prioridad || !fecha || !descripcion) {
        mostrarMensaje('Todos los campos marcados con asterisco (*) son obligatorios.', 'danger');
        return;
    }

    // Validación de Formato de Correo (RegEx estándar)
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoRegex.test(correo)) {
        mostrarMensaje('El correo institucional ingresado no tiene un formato válido.', 'danger');
        return;
    }

    // Validación de Extensión Mínima de la Descripción
    if (descripcion.length < MIN_LONGITUD_DESCRIPCION) {
        mostrarMensaje(`La descripción debe ser detallada (mínimo ${MIN_LONGITUD_DESCRIPCION} caracteres).`, 'danger');
        return;
    }

    // --- Creación del Objeto de Solicitud ---
    const nuevaSolicitud = {
        id: Date.now(), // ID único basado en timestamp para la eliminación segura
        nombre,
        correo,
        asignatura,
        tipo,
        prioridad,
        fecha,
        descripcion
    };

    // Almacenar en el arreglo global
    solicitudes.push(nuevaSolicitud);

    // Actualizar Interfaz Gráfica
    renderizarTabla(solicitudes);
    mostrarMensaje('¡Solicitud académica registrada de manera exitosa!', 'success');
    
    // Limpiar el formulario de forma segura
    formulario.reset();
    document.getElementById('fechaIngreso').valueAsDate = new Date(); // Reajustar fecha por defecto
}

// --- Función de Renderizado Dinámico de la Tabla ---
function renderizarTabla(listaSolicitudes) {
    // Limpiar filas anteriores por completo
    tablaBody.innerHTML = '';

    if (listaSolicitudes.length === 0) {
        tablaBody.innerHTML = `
            <tr id="filaVacia">
                <td colspan="5" class="text-center py-4 text-muted style="font-style: italic;">
                    No se encontraron registros coincidentes.
                </td>
            </tr>
        `;
        actualizarContador(0);
        return;
    }

    // Generar filas dinámicamente
    listaSolicitudes.forEach(solicitud => {
        const tr = document.createElement('tr');
        
        // Determinar estilo de la etiqueta según prioridad
        let badgeClass = 'badge-baja';
        if (solicitud.prioridad === 'Alta') badgeClass = 'badge-alta';
        if (solicitud.prioridad === 'Media') badgeClass = 'badge-media';

        tr.innerHTML = `
            <td>
                <div class="fw-bold">${escapeHTML(solicitud.nombre)}</div>
                <small class="text-muted d-block" style="font-size: 0.75rem;">${escapeHTML(solicitud.correo)}</small>
            </td>
            <td>
                <div>${escapeHTML(solicitud.asignatura)}</div>
                <span class="badge bg-light text-dark border">${escapeHTML(solicitud.tipo)}</span>
            </td>
            <td>
                <span class="badge ${badgeClass}">${solicitud.prioridad}</span>
            </td>
            <td>
                <small class="text-secondary">${solicitud.fecha}</small>
            </td>
            <td class="text-center">
                <button class="btn btn-outline-danger btn-sm px-2 py-1" onclick="eliminarSolicitud(${solicitud.id})">
                    Eliminar
                </button>
            </td>
        `;
        
        // Agregar fila al contenedor del DOM
        tablaBody.appendChild(tr);
    });

    actualizarContador(listaSolicitudes.length);
}

// --- Función para Eliminar Solicitudes ---
window.eliminarSolicitud = function(id) {
    // Filtrar el arreglo excluyendo el ID seleccionado
    solicitudes = solicitudes.filter(sol => sol.id !== id);
    
    // Aplicar el filtro de vista actual si estuviera activo al redibujar
    filtrarResultados();
    mostrarMensaje('La solicitud ha sido eliminada del sistema.', 'warning');
};

// --- Función para Filtrar Datos ---
function filtrarResultados() {
    const criterio = filtroPrioridad.value;
    
    if (criterio === 'TODAS') {
        renderizarTabla(solicitudes);
    } else {
        const solicitudesFiltradas = solicitudes.filter(sol => sol.prioridad === criterio);
        renderizarTabla(solicitudesFiltradas);
    }
}

// --- Componente de Alertas / Mensajes Dinámicos ---
function mostrarMensaje(mensaje, tipo) {
    alertPlaceholder.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show shadow-sm" role="alert">
            <div>${mensaje}</div>
            <button type="submit" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    // Cierre automático pasados los 5 segundos para mejorar el flujo de uso
    setTimeout(() => {
        const alertNode = alertPlaceholder.querySelector('.alert');
        if (alertNode) {
            const bsAlert = bootstrap.Alert.getInstance(alertNode) || new bootstrap.Alert(alertNode);
            bsAlert.close();
        }
    }, 5000);
}

// --- Helpers de Soporte de Interfaz ---
function actualizarContador(cantidad) {
    contadorSolicitudes.textContent = `${cantidad} ${cantidad === 1 ? 'registro' : 'registros'}`;
}

// Prevenir inyección de código (XSS) al reflejar strings dinámicos en la UI
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
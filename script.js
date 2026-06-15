/**
 * EVALUACIÓN INTEGRADA UMM - PROGRAMACIÓN WEB
 * Sistema de Registro de Solicitudes Académicas con Panel de Retroalimentación
 */

// --- Base de Datos Semilla en Memoria ---
let solicitudes = [
    { 
        id: 1, 
        nombre: "Juan Pérez", 
        correo: "juan.perez@umm.cl", 
        asignatura: "Programación Web", 
        tipo: "Evaluación", 
        prioridad: "Alta", 
        fecha: "2026-06-15", 
        descripcion: "Problemas con el despliegue del examen en el servidor local.",
        respuesta: "Estimado Juan, se ha habilitado un servidor de contingencia para que rinda su evaluación hoy hasta las 20:00 hrs.",
        estado: "Resuelta"
    },
    { 
        id: 2, 
        nombre: "María López", 
        correo: "maria.lopez@umm.cl", 
        asignatura: "Bases de Datos", 
        tipo: "Asistencia", 
        prioridad: "Media", 
        fecha: "2026-06-14", 
        descripcion: "Justificativo médico cargado por inasistencia al laboratorio del jueves.",
        respuesta: "",
        estado: "Pendiente"
    }
];

const MIN_LONGITUD_DESCRIPCION = 15; // Criterio de pruebas del PDF
let usuarioLogueado = { username: "", rol: "" };
let idSolicitudSeleccionada = null; 

// =======================================================
// INTERFACES Y CONTROL DE ACCESO (LOGIN)
// =======================================================

window.manejarLogin = function(e) {
    if (e) e.preventDefault();
    
    const userField = document.getElementById('loginUser');
    const passField = document.getElementById('loginPassword');
    const rolField = document.getElementById('loginRol');

    const user = userField.value.trim();
    const pass = passField.value;
    const rol = rolField.value;

    if (!user || !pass || !rol) {
        mostrarMensajeLogin('Todos los campos de acceso son obligatorios.', 'danger');
        return;
    }

    // Normalizar usuario a minúsculas para evitar fallas tipográficas en los filtros
    usuarioLogueado.username = user.toLowerCase();
    usuarioLogueado.rol = rol;

    const loginContainer = document.getElementById('loginContainer');
    const dashboardContainer = document.getElementById('dashboardContainer');

    if (loginContainer && dashboardContainer) {
        loginContainer.classList.add('d-none');
        dashboardContainer.classList.remove('d-none');
    }

    configurarEntornoPorRol();
};

function configurarEntornoPorRol() {
    const txtSesionRol = document.getElementById('txtSesionRol');
    const txtSesionUsuario = document.getElementById('txtSesionUsuario');
    const columnaFormulario = document.getElementById('columnaFormulario');
    const columnaTabla = document.getElementById('columnaTabla');
    const txtTablaHeader = document.getElementById('txtTablaHeader');

    if (txtSesionRol) txtSesionRol.textContent = usuarioLogueado.rol;
    if (txtSesionUsuario) txtSesionUsuario.textContent = usuarioLogueado.username;

    if (usuarioLogueado.rol === 'profesor') {
        if (columnaFormulario) columnaFormulario.classList.add('d-none');
        if (columnaTabla) columnaTabla.className = "col-lg-12"; 
        if (txtTablaHeader) txtTablaHeader.textContent = "Consola de Solicitudes Recibidas (Docente)";
    } else {
        if (columnaFormulario) columnaFormulario.classList.remove('d-none');
        if (columnaTabla) columnaTabla.className = "col-lg-8"; 
        if (txtTablaHeader) txtTablaHeader.textContent = "Mis Solicitudes e Historial de Respuestas";
        
        // CORRECCIÓN UX: Forzar autocompletado y bloqueo del input de correo
        const correoInst = document.getElementById('correoInstitucional');
        if (correoInst) {
            if (usuarioLogueado.username.includes('@')) {
                correoInst.value = usuarioLogueado.username;
            } else {
                correoInst.value = usuarioLogueado.username + "@umm.cl";
            }
            correoInst.setAttribute("disabled"); // Bloqueo de seguridad
        }
    }

    filtrarResultados();
}

window.manejarLogout = function() {
    usuarioLogueado = { username: "", rol: "" };
    const loginContainer = document.getElementById('loginContainer');
    const dashboardContainer = document.getElementById('dashboardContainer');
    
    if (loginContainer && dashboardContainer) {
        dashboardContainer.classList.add('d-none');
        loginContainer.classList.remove('d-none');
    }
};

// =======================================================
// PROCESAMIENTO Y VALIDACIÓN DEL FORMULARIO
// =======================================================

function procesarFormulario(e) {
    if (e) e.preventDefault();
    
    const nombre = document.getElementById('nombreEstudiante').value.trim();
    const asignatura = document.getElementById('asignatura').value.trim();
    const tipo = document.getElementById('tipoSolicitud').value;
    const prioridad = document.getElementById('prioridad').value;
    const fecha = document.getElementById('fechaIngreso').value;
    const descripcion = document.getElementById('descripcion').value.trim();

    // CORRECCIÓN DE PERSISTENCIA: Extraer el correo directamente de la sesión activa
    let correo = usuarioLogueado.username;
    if (!correo.includes('@')) {
        correo = usuarioLogueado.username + "@umm.cl";
    }

    // Criterio 1: Validar campos obligatorios vacíos
    if (!nombre || !correo || !asignatura || !tipo || !prioridad || !fecha || !descripcion) {
        mostrarMensaje('Error: Todos los campos marcados con asterisco (*) son requeridos.', 'danger');
        return;
    }

    // Criterio 2: Formato de correo institucional válido
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoRegex.test(correo)) {
        mostrarMensaje('Error: El formato de correo de la sesión no es válido.', 'danger');
        return;
    }

    // Criterio 3: Extensión mínima del cuerpo del texto
    if (descripcion.length < MIN_LONGITUD_DESCRIPCION) {
        mostrarMensaje(`Error: La descripción debe detallar el problema (mínimo ${MIN_LONGITUD_DESCRIPCION} caracteres).`, 'danger');
        return;
    }

    // Registro del objeto en el almacenamiento local
    solicitudes.push({ 
        id: Date.now(), 
        nombre, 
        correo: correo.toLowerCase(),
        asignatura, 
        tipo, 
        prioridad, 
        fecha, 
        descripcion,
        respuesta: "",
        estado: "Pendiente"
    });

    filtrarResultados(); // Re-renderizar la grilla con el filtro activo
    mostrarMensaje('¡Confirmación: Su solicitud ha sido ingresada de forma exitosa!', 'success');
    
    // Limpieza segura del formulario manteniendo el bloqueo de correo
    const formElement = document.getElementById('solicitudForm');
    if (formElement) {
        formElement.reset();
        document.getElementById('fechaIngreso').valueAsDate = new Date();
        const correoInst = document.getElementById('correoInstitucional');
        if (correoInst) {
            correoInst.value = correo;
        }
    }
}

// =======================================================
// RENDERIZADO DE COMPONENTES DE TABLA Y FILTROS
// =======================================================

function renderizarTabla(listaSolicitudes) {
    const tablaBody = document.getElementById('tablaSolicitudesBody');
    const contadorSolicitudes = document.getElementById('contadorSolicitudes');
    if (!tablaBody) return;

    tablaBody.innerHTML = '';

    let filtradas = [...listaSolicitudes];
    
    // FILTRO DE PRIVACIDAD EN CAPAS: El estudiante solo audita sus propios registros
    if (usuarioLogueado.rol === 'estudiante') {
        let cuentaEstudiante = usuarioLogueado.username;
        if (!cuentaEstudiante.includes('@')) {
            cuentaEstudiante = usuarioLogueado.username + "@umm.cl";
        }
        
        filtradas = listaSolicitudes.filter(sol => {
            return sol.correo.toLowerCase() === cuentaEstudiante.toLowerCase() ||
                   sol.nombre.toLowerCase() === cuentaEstudiante.toLowerCase();
        });
    }

    // Estado vacío en pantalla
    if (filtradas.length === 0) {
        tablaBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted" style="font-style: italic;">No registras solicitudes académicas en esta sección.</td></tr>`;
        if (contadorSolicitudes) contadorSolicitudes.textContent = "0 registros";
        return;
    }

    // Inyección dinámica de celdas
    filtradas.forEach(sol => {
        const tr = document.createElement('tr');
        let badgeClass = sol.prioridad === 'Alta' ? 'badge-alta' : (sol.prioridad === 'Media' ? 'badge-media' : 'badge-baja');
        
        let celdaDescripcion = `
            <div class="text-wrap" style="max-width: 250px;">
                <strong>Detalle:</strong> ${escapeHTML(sol.descripcion)}
            </div>
        `;
        
        if (sol.estado === 'Resuelta') {
            celdaDescripcion += `
                <div class="mt-2 small p-2 bg-success-subtle text-success rounded border border-success-subtle">
                    <strong>✓ Respuesta del Docente:</strong> ${escapeHTML(sol.respuesta)}
                </div>
            `;
        } else {
            celdaDescripcion += `
                <div class="mt-1 small text-warning" style="font-size: 0.8rem;">
                    ⏳ Esperando revisión del docente...
                </div>
            `;
        }

        let botonesAccion = '';
        if (usuarioLogueado.rol === 'profesor') {
            if (sol.estado === 'Pendiente') {
                botonesAccion = `<button class="btn btn-primary btn-sm me-1" onclick="abrirModalRespuesta(${sol.id})">Responder</button>`;
            } else {
                botonesAccion = `<button class="btn btn-outline-secondary btn-sm me-1" onclick="abrirModalRespuesta(${sol.id})">Ver Ficha</button>`;
            }
            botonesAccion += `<button class="btn btn-outline-danger btn-sm" onclick="eliminarSolicitud(${sol.id})">Eliminar</button>`;
        } else {
            botonesAccion = `
                <button class="btn btn-outline-primary btn-sm me-1" onclick="abrirModalRespuesta(${sol.id})">Ver Ficha</button>
                <button class="btn btn-outline-danger btn-sm" onclick="eliminarSolicitud(${sol.id})" ${sol.estado === 'Resuelta' ? 'disabled' : ''}>Eliminar</button>
            `;
        }

        tr.innerHTML = `
            <td><div class="fw-bold">${escapeHTML(sol.nombre)}</div><small class="text-muted d-block">${escapeHTML(sol.correo)}</small></td>
            <td><div>${escapeHTML(sol.asignatura)}</div><span class="badge bg-light text-dark border" style="font-size:0.75rem;">${escapeHTML(sol.tipo)}</span></td>
            <td>${celdaDescripcion}</td>
            <td><span class="badge ${badgeClass}">${sol.prioridad}</span></td>
            <td><small class="text-secondary">${sol.fecha}</small></td>
            <td class="text-center"><div class="d-flex justify-content-center align-items-center h-100">${botonesAccion}</div></td>
        `;
        tablaBody.appendChild(tr);
    });

    if (contadorSolicitudes) contadorSolicitudes.textContent = `${filtradas.length} registros`;
}

// =======================================================
// CONTROL DE MODALES DE RESPUESTA
// =======================================================

window.abrirModalRespuesta = function(id) {
    idSolicitudSeleccionada = id;
    const sol = solicitudes.find(s => s.id === id);
    if (!sol) return;

    document.getElementById('modalNombre').textContent = sol.nombre;
    document.getElementById('modalCorreo').textContent = sol.correo;
    document.getElementById('modalAsignatura').textContent = sol.asignatura;
    document.getElementById('modalTipo').textContent = sol.tipo;
    document.getElementById('modalDescripcion').textContent = sol.descripcion;

    const badgePrioridad = document.getElementById('modalPrioridad');
    badgePrioridad.textContent = sol.prioridad;
    badgePrioridad.className = "badge " + (sol.prioridad === 'Alta' ? 'badge-alta' : (sol.prioridad === 'Media' ? 'badge-media' : 'badge-baja'));

    const inputRespuesta = document.getElementById('txtRespuestaProfesor');
    const btnGuardar = document.getElementById('btnGuardarRespuesta');
    const labelRespuesta = document.getElementById('lblRespuesta');

    if (sol.estado === 'Resuelta') {
        inputRespuesta.value = sol.respuesta;
        inputRespuesta.disabled = true;
        if (btnGuardar) btnGuardar.classList.add('d-none');
        if (labelRespuesta) labelRespuesta.textContent = "Respuesta Oficial del Académico:";
    } else {
        inputRespuesta.value = '';
        if (usuarioLogueado.rol === 'estudiante') {
            inputRespuesta.value = "Aún no se ha emitido una respuesta oficial.";
            inputRespuesta.disabled = true;
            if (btnGuardar) btnGuardar.classList.add('d-none');
            if (labelRespuesta) labelRespuesta.textContent = "Estado de la Respuesta:";
        } else {
            inputRespuesta.disabled = false;
            if (btnGuardar) btnGuardar.classList.remove('d-none');
            if (labelRespuesta) labelRespuesta.textContent = "Respuesta u Orientación Académica *";
        }
    }

    const modalElement = document.getElementById('respuestaModal');
    const modalInstancia = bootstrap.Modal.getOrCreateInstance(modalElement);
    modalInstancia.show();
};

// Vinculación segura del botón de despacho de respuestas del Modal
const btnGuardar = document.getElementById('btnGuardarRespuesta');
if (btnGuardar) {
    btnGuardar.addEventListener('click', () => {
        const textoRespuesta = document.getElementById('txtRespuestaProfesor').value.trim();

        if (!textoRespuesta) {
            alert("Por favor, redacte una respuesta válida para el estudiante.");
            return;
        }

        const sol = solicitudes.find(s => s.id === idSolicitudSeleccionada);
        if (sol) {
            sol.respuesta = textoRespuesta;
            sol.estado = "Resuelta";
        }

        const modalElement = document.getElementById('respuestaModal');
        const modalInstancia = bootstrap.Modal.getInstance(modalElement);
        if (modalInstancia) modalInstancia.hide();

        filtrarResultados();
        mostrarMensaje('¡La respuesta académica ha sido despachada con éxito!', 'success');
    });
}

// =======================================================
// COMPONENTES AUXILIARES Y FILTROS
// =======================================================

window.eliminarSolicitud = function(id) {
    if (confirm("¿Está seguro de que desea eliminar permanentemente este requerimiento del sistema?")) {
        solicitudes = solicitudes.filter(sol => sol.id !== id);
        filtrarResultados();
    }
};

function filtrarResultados() {
    const filter = document.getElementById('filtroPrioridad');
    const criterio = filter ? filter.value : 'TODAS';
    
    if (criterio === 'TODAS') {
        renderizarTabla(solicitudes);
    } else {
        renderizarTabla(solicitudes.filter(sol => sol.prioridad === criterio));
    }
}

function mostrarMensaje(mensaje, tipo) {
    const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
    if (!alertPlaceholder) return;
    alertPlaceholder.innerHTML = `<div class="alert alert-${tipo} alert-dismissible fade show shadow-sm" role="alert"><div>${mensaje}</div><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
}

function mostrarMensajeLogin(mensaje, tipo) {
    const loginAlertPlaceholder = document.getElementById('loginAlertPlaceholder');
    if (!loginAlertPlaceholder) return;
    loginAlertPlaceholder.innerHTML = `<div class="alert alert-${tipo} py-2 small shadow-sm" role="alert">${mensaje}</div>`;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// --- Escucha de carga del Ciclo de Vida del DOM ---
document.addEventListener('DOMContentLoaded', () => {
    const formSolicitud = document.getElementById('solicitudForm');
    if (formSolicitud) formSolicitud.addEventListener('submit', procesarFormulario);

    const filter = document.getElementById('filtroPrioridad');
    if (filter) filter.addEventListener('change', filtrarResultados);

    const inputFecha = document.getElementById('fechaIngreso');
    if (inputFecha) inputFecha.valueAsDate = new Date();
});
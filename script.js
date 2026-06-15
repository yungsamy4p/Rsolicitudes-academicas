/**
 * EVALUACIÓN INTEGRADA UMM - PROGRAMACIÓN WEB
 * Sistema de Registro de Solicitudes Académicas con Panel de Retroalimentación
 */

// --- Base de Datos en Memoria ---
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
        respuesta: "Estimado, se ha habilitado un servidor de contingencia para que rinda su evaluación hoy hasta las 20:00 hrs.",
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

const MIN_LONGITUD_DESCRIPCION = 15; 
let usuarioLogueado = { username: "", rol: "" };
let idSolicitudSeleccionada = null; // Variable de control para el Modal

// --- Función de Login ---
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

    usuarioLogueado.username = user;
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
        if (txtTablaHeader) txtTablaHeader.textContent = "Mis Solicitudes Ingresadas";
        
        const correoInst = document.getElementById('correoInstitucional');
        if (correoInst && usuarioLogueado.username.includes('@')) {
            correoInst.value = usuarioLogueado.username;
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

// --- Procesar Formulario de Registro (Estudiante) ---
function procesarFormulario(e) {
    if (e) e.preventDefault();
    
    const nombre = document.getElementById('nombreEstudiante').value.trim();
    const correo = document.getElementById('correoInstitucional').value.trim();
    const asignatura = document.getElementById('asignatura').value.trim();
    const tipo = document.getElementById('tipoSolicitud').value;
    const prioridad = document.getElementById('prioridad').value;
    const fecha = document.getElementById('fechaIngreso').value;
    const descripcion = document.getElementById('descripcion').value.trim();

    if (!nombre || !correo || !asignatura || !tipo || !prioridad || !fecha || !descripcion) {
        mostrarMensaje('Error: Todos los campos del formulario son obligatorios.', 'danger');
        return;
    }

    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoRegex.test(correo)) {
        mostrarMensaje('Error: Formato de correo inválido.', 'danger');
        return;
    }

    if (descripcion.length < MIN_LONGITUD_DESCRIPCION) {
        mostrarMensaje(`Error: La descripción debe tener al menos ${MIN_LONGITUD_DESCRIPCION} caracteres.`, 'danger');
        return;
    }

    // Insertar con estado por defecto "Pendiente" y respuesta vacía
    solicitudes.push({ 
        id: Date.now(), 
        nombre, 
        correo, 
        asignatura, 
        tipo, 
        prioridad, 
        fecha, 
        descripcion,
        respuesta: "",
        estado: "Pendiente"
    });

    filtrarResultados(); 
    mostrarMensaje('¡Solicitud registrada correctamente en la plataforma!', 'success');
    
    const formulario = document.getElementById('solicitudForm');
    if (formulario) {
        formulario.reset();
        document.getElementById('fechaIngreso').valueAsDate = new Date();
    }
}

// --- Renderizar Tabla Dinámica ---
function renderizarTabla(listaSolicitudes) {
    const tablaBody = document.getElementById('tablaSolicitudesBody');
    const contadorSolicitudes = document.getElementById('contadorSolicitudes');
    if (!tablaBody) return;

    tablaBody.innerHTML = '';

    let filtradas = [...listaSolicitudes];
    if (usuarioLogueado.rol === 'estudiante') {
        filtradas = listaSolicitudes.filter(sol => 
            sol.correo.toLowerCase() === usuarioLogueado.username.toLowerCase() ||
            sol.nombre.toLowerCase().includes(usuarioLogueado.username.toLowerCase())
        );
    }

    if (filtradas.length === 0) {
        tablaBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted" style="font-style: italic;">No hay registros para mostrar.</td></tr>`;
        if (contadorSolicitudes) contadorSolicitudes.textContent = "0 registros";
        return;
    }

    filtradas.forEach(sol => {
        const tr = document.createElement('tr');
        
        // Estilos de prioridades
        let badgeClass = sol.prioridad === 'Alta' ? 'badge-alta' : (sol.prioridad === 'Media' ? 'badge-media' : 'badge-baja');
        
        // Renderizado del cuerpo del mensaje o la respuesta oficial
        let celdaDescripcion = `
            <div class="text-truncate" style="max-width: 220px;" title="${escapeHTML(sol.descripcion)}">
                ${escapeHTML(sol.descripcion)}
            </div>
        `;
        if (sol.estado === 'Resuelta') {
            celdaDescripcion += `
                <div class="mt-1 small p-1 bg-success-subtle text-success rounded border border-success-subtle" style="font-size: 0.8rem;">
                    <strong>Resp:</strong> ${escapeHTML(sol.respuesta)}
                </div>
            `;
        }

        // Configuración de botones de Acción por Rol
        let botonesAccion = '';
        if (usuarioLogueado.rol === 'profesor') {
            if (sol.estado === 'Pendiente') {
                botonesAccion = `<button class="btn btn-primary btn-sm me-1" onclick="abrirModalRespuesta(${sol.id})">Responder</button>`;
            } else {
                botonesAccion = `<button class="btn btn-outline-secondary btn-sm me-1" onclick="abrirModalRespuesta(${sol.id})">Ver Ficha</button>`;
            }
            botonesAccion += `<button class="btn btn-outline-danger btn-sm" onclick="eliminarSolicitud(${sol.id})">Eliminar</button>`;
        } else {
            // El estudiante solo elimina si está pendiente; si ya está resuelta no puede borrarla para mantener constancia
            botonesAccion = `<button class="btn btn-outline-danger btn-sm" onclick="eliminarSolicitud(${sol.id})" ${sol.estado === 'Resuelta' ? 'disabled' : ''}>Eliminar</button>`;
        }

        tr.innerHTML = `
            <td><div class="fw-bold">${escapeHTML(sol.nombre)}</div><small class="text-muted d-block">${escapeHTML(sol.correo)}</small></td>
            <td><div>${escapeHTML(sol.asignatura)}</div><span class="badge bg-light text-dark border" style="font-size:0.75rem;">${escapeHTML(sol.tipo)}</span></td>
            <td>${celdaDescripcion}</td>
            <td><span class="badge ${badgeClass}">${sol.prioridad}</span></td>
            <td><small class="text-secondary">${sol.fecha}</small></td>
            <td class="text-center"><div class="d-flex justify-content-center">${botonesAccion}</div></td>
        `;
        tablaBody.appendChild(tr);
    });

    if (contadorSolicitudes) contadorSolicitudes.textContent = `${filtradas.length} registros`;
}

// --- Controlador del Modal de Respuesta ---
window.abrirModalRespuesta = function(id) {
    idSolicitudSeleccionada = id;
    const sol = solicitudes.find(s => s.id === id);
    if (!sol) return;

    // Cargar datos estáticos en la ficha del Modal
    document.getElementById('modalNombre').textContent = sol.nombre;
    document.getElementById('modalCorreo').textContent = sol.correo;
    document.getElementById('modalAsignatura').textContent = sol.asignatura;
    document.getElementById('modalTipo').textContent = sol.tipo;
    document.getElementById('modalDescripcion').textContent = sol.descripcion;

    const badgePrioridad = document.getElementById('modalPrioridad');
    badgePrioridad.textContent = sol.prioridad;
    badgePrioridad.className = "badge " + (sol.prioridad === 'Alta' ? 'badge-alta' : (sol.prioridad === 'Media' ? 'badge-media' : 'badge-baja'));

    const inputRespuesta = document.getElementById('txtRespuestaProfesor');
    const contenedorForm = document.getElementById('contenedorFormRespuesta');
    const btnGuardar = document.getElementById('btnGuardarRespuesta');

    // Adaptar Modal si la solicitud ya fue respondida con anterioridad
    if (sol.estado === 'Resuelta') {
        inputRespuesta.value = sol.respuesta;
        inputRespuesta.disabled = true;
        btnGuardar.classList.add('d-none');
    } else {
        inputRespuesta.value = '';
        inputRespuesta.disabled = false;
        btnGuardar.classList.remove('d-none');
    }

    // Inicializar y mostrar el Modal de Bootstrap de forma programática
    const modalElement = document.getElementById('respuestaModal');
    const modalInstancia = bootstrap.Modal.getOrCreateInstance(modalElement);
    modalInstancia.show();
};

// --- Guardar Respuesta del Profesor ---
document.getElementById('btnGuardarRespuesta').addEventListener('click', () => {
    const textoRespuesta = document.getElementById('txtRespuestaProfesor').value.trim();

    if (!textoRespuesta) {
        alert("Por favor, redacte una respuesta válida para el estudiante.");
        return;
    }

    // Modificar la solicitud directamente en la base de datos en memoria
    const sol = solicitudes.find(s => s.id === idSolicitudSeleccionada);
    if (sol) {
        sol.respuesta = textoRespuesta;
        sol.estado = "Resuelta";
    }

    // Cerrar el modal de manera limpia
    const modalElement = document.getElementById('respuestaModal');
    const modalInstancia = bootstrap.Modal.getInstance(modalElement);
    if (modalInstancia) modalInstancia.hide();

    // Actualizar interfaz
    filtrarResultados();
    mostrarMensaje('¡La respuesta académica ha sido despachada con éxito!', 'success');
});

window.eliminarSolicitud = function(id) {
    if (confirm("¿Está seguro de que desea eliminar permanentemente este requerimiento del sistema?")) {
        solicitudes = solicitudes.filter(sol => sol.id !== id);
        filtrarResultados();
    }
};

function filtrarResultados() {
    const filtro = document.getElementById('filtroPrioridad');
    const criterio = filtro ? filtro.value : 'TODAS';
    
    if (criterio === 'TODAS') {
        renderizarTabla(solicitudes);
    } else {
        renderizarTabla(solicitudes.filter(sol => sol.prioridad === criterio));
    }
}

// --- Mensajes de Feedback ---
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

// --- Inicializadores ---
document.addEventListener('DOMContentLoaded', () => {
    const formSolicitud = document.getElementById('solicitudForm');
    if (formSolicitud) formSolicitud.addEventListener('submit', procesarFormulario);

    const filtro = document.getElementById('filtroPrioridad');
    if (filtro) filtro.addEventListener('change', filtrarResultados);

    const inputFecha = document.getElementById('fechaIngreso');
    if (inputFecha) inputFecha.valueAsDate = new Date();
});
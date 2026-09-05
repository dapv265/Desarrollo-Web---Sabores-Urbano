// Actualizar el reloj en tiempo real
function actualizarReloj() {
    const reloj = document.getElementById('reloj');
    const ahora = new Date();
    reloj.textContent = ahora.toLocaleTimeString('es-CL');
}
setInterval(actualizarReloj, 1000);
actualizarReloj();

// FunciÃ³n para mover ticket a "En PreparaciÃ³n"
function moverAPreparacion(idTicket) {
    const ticket = document.getElementById(idTicket);
    const listaPreparacion = document.getElementById('lista-preparacion');
    
    // Cambiar clases visuales
    ticket.classList.remove('urgente');
    ticket.classList.add('en-proceso');
    
    // Cambiar el botÃ³n
    const boton = ticket.querySelector('.btn-accion');
    boton.textContent = 'Marcar como Listo';
    boton.className = 'btn-accion btn-listo';
    
    // Reemplazar la funciÃ³n del botÃ³n (usando onclick por simplicidad en esta entrega)
    boton.setAttribute('onclick', `moverAListos('${idTicket}')`);
    
    // Mover el elemento en el DOM
    listaPreparacion.appendChild(ticket);
}

// FunciÃ³n para mover ticket a "Listos"
function moverAListos(idTicket) {
    const ticket = document.getElementById(idTicket);
    const listaListos = document.getElementById('lista-listos');
    
    // Cambiar clases visuales
    ticket.classList.remove('en-proceso');
    ticket.classList.add('completado');
    
    // Ocultar o deshabilitar el botÃ³n porque ya terminÃ³ el flujo
    const boton = ticket.querySelector('.btn-accion');
    boton.style.display = 'none';
    
    // Mover el elemento en el DOM
    listaListos.appendChild(ticket);
}
// Arreglo donde se guardan los clientes registrados.
// (Es un prototipo de frontend: si recargas la página, se
// vuelve a los datos de ejemplo de aquí abajo).

let clientes = [];

// Elementos de la página
const formulario = document.getElementById("formCliente");
const cuerpoTabla = document.getElementById("cuerpoTabla");
const mensaje = document.getElementById("mensaje");

// Dibuja todas las filas de la tabla según el arreglo "clientes"
function mostrarClientes() {

    if (clientes.length === 0) {
        cuerpoTabla.innerHTML = "<tr><td colspan='5'>No hay clientes registrados.</td></tr>";
        return;
    }

    let filas = "";

    for (let i = 0; i < clientes.length; i++) {

        filas += `
            <tr>
                <td>${clientes[i].nombre}</td>
                <td>${clientes[i].rut}</td>
                <td>${clientes[i].telefono}</td>
                <td>${clientes[i].correo}</td>
                <td>
                    <button type="button" onclick="eliminarCliente(${i})">Eliminar</button>
                </td>
            </tr>
        `;

    }

    cuerpoTabla.innerHTML = filas;

}

// Elimina un cliente según su posición en el arreglo
function eliminarCliente(indice) {

    let nuevoArreglo = [];

    for (let i = 0; i < clientes.length; i++) {
        if (i !== indice) {
            nuevoArreglo[nuevoArreglo.length] = clientes[i];
        }
    }

    clientes = nuevoArreglo;
    mostrarClientes();

}

// Captura el envío del formulario, valida y agrega el cliente nuevo
formulario.addEventListener("submit", function (evento) {

    evento.preventDefault();

    const datosFormulario = new FormData(formulario);

    const nombre = datosFormulario.get("nombre");
    const rut = datosFormulario.get("rut");
    const telefono = datosFormulario.get("telefono");
    const correo = datosFormulario.get("correo");

    console.log("Nombre:", nombre);
    console.log("RUT:", rut);
    console.log("Telefono:", telefono);
    console.log("Correo:", correo);

    if (nombre === "" || rut === "" || correo === "") {
        mensaje.innerHTML = "Por favor completa los campos obligatorios.";
        return;
    }

    if (rut.includes(".") === true) {
        mensaje.innerHTML = "El RUT no debe llevar puntos, solo el guion. Ejemplo: 12345678-9";
        return;
    }

    if (rut.includes("-") === false) {
        mensaje.innerHTML = "El RUT debe llevar guion antes del dígito verificador. Ejemplo: 12345678-9";
        return;
    }

    let repetido = false;

    for (let i = 0; i < clientes.length; i++) {
        if (clientes[i].rut === rut) {
            repetido = true;
        }
    }

    if (repetido === true) {
        mensaje.innerHTML = "Ya existe un cliente registrado con el RUT " + rut + ".";
        return;
    }

    clientes[clientes.length] = {
        nombre: nombre,
        rut: rut,
        telefono: telefono,
        correo: correo
    };

    mensaje.innerHTML = "Cliente " + nombre + " registrado correctamente.";

    formulario.reset();
    mostrarClientes();

});

// Se dibuja la tabla apenas carga la página
mostrarClientes();

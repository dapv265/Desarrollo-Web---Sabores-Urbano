
var listaLocales = [
    {
        codigo: "LOC-01",
        nombre: "Sucursal Santiago Centro",
        direccion: "Moneda 850",
        apertura: "12:00",
        cierre: "23:00",
        estado: "Operativo"
    },
    {
        codigo: "LOC-02",
        nombre: "Sucursal Providencia",
        direccion: "Av. Pedro de Valdivia 520",
        apertura: "12:30",
        cierre: "00:00",
        estado: "En Mantención"
    }
];

function mostrarLocales() {
    var tbody = document.getElementById("cuerpoTabla");
    tbody.innerHTML = "";

    for (var i = 0; i < listaLocales.length; i++) {
        var fila = document.createElement("tr");

        fila.innerHTML = 
            "<td>" + listaLocales[i].codigo + "</td>" +
            "<td>" + listaLocales[i].nombre + "</td>" +
            "<td>" + listaLocales[i].direccion + "</td>" +
            "<td>" + listaLocales[i].apertura + " - " + listaLocales[i].cierre + "</td>" +
            "<td>" + listaLocales[i].estado + "</td>" +
            "<td><button class='btn-eliminar' onclick='borrarLocal(" + i + ")'>Eliminar</button></td>";

        tbody.appendChild(fila);
    }
}

// Guardar nuevo local desde el formulario
document.getElementById("formularioLocal").addEventListener("submit", function(evento) {
    evento.preventDefault();

    var nuevoLocal = {
        codigo: document.getElementById("codigo").value,
        nombre: document.getElementById("nombre").value,
        direccion: document.getElementById("direccion").value,
        apertura: document.getElementById("horaApertura").value,
        cierre: document.getElementById("horaCierre").value,
        estado: document.getElementById("estado").value
    };

    listaLocales.push(nuevoLocal);
    mostrarLocales();

    document.getElementById("formularioLocal").reset();
    alert("Local agregado con éxito.");
});

// Eliminar un local de la lista
function borrarLocal(indice) {
    if (confirm("¿Estás seguro de eliminar este local?")) {
        listaLocales.splice(indice, 1);
        mostrarLocales();
    }
}

// Carga inicial
mostrarLocales();
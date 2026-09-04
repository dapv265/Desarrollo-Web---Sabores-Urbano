// =========================================================
// SABORES URBANOS — Mapa de mesas (RF3)
// Todo vive solo en memoria del navegador: no hay backend.
// =========================================================

const estadoLabel = {
  disponible: 'Disponible',
  reservada: 'Reservada',
  ocupada: 'Ocupada',
  limpieza: 'Pendiente de limpieza',
  fuera: 'Fuera de servicio'
};

const mesasIniciales = [
  { numero:'T-01', zona:'Terraza', capacidad:4, estado:'disponible', forma:'round' },
  { numero:'T-02', zona:'Terraza', capacidad:2, estado:'ocupada',    forma:'square' },
  { numero:'T-03', zona:'Terraza', capacidad:6, estado:'reservada',  forma:'round' },
  { numero:'T-04', zona:'Terraza', capacidad:4, estado:'disponible', forma:'square' },
  { numero:'M-05', zona:'Salón principal', capacidad:4, estado:'ocupada',    forma:'square' },
  { numero:'M-06', zona:'Salón principal', capacidad:4, estado:'disponible', forma:'round' },
  { numero:'M-07', zona:'Salón principal', capacidad:2, estado:'limpieza',   forma:'square' },
  { numero:'M-08', zona:'Salón principal', capacidad:6, estado:'ocupada',    forma:'square' },
  { numero:'M-09', zona:'Salón principal', capacidad:8, estado:'reservada',  forma:'round' },
  { numero:'M-10', zona:'Salón principal', capacidad:4, estado:'fuera',      forma:'square' },
  { numero:'M-11', zona:'Salón principal', capacidad:4, estado:'disponible', forma:'square' },
  { numero:'M-12', zona:'Salón principal', capacidad:4, estado:'ocupada',    forma:'round' },
  { numero:'B-13', zona:'Barra',   capacidad:3, estado:'ocupada',    forma:'square' },
];

let mesas = [];
let filtroZona = 'todas';
let filtroEstado = 'todos';
let filaAbierta = null; // numero de la mesa cuya fila de edicion esta abierta

const zoneRows = {
  'Terraza': document.querySelector('.schematic-row[data-zone-row="Terraza"]'),
  'Salón principal': document.querySelector('.schematic-row[data-zone-row="Salón principal"]'),
  'Barra': document.querySelector('.schematic-row[data-zone-row="Barra"]'),
};

const ledgerBody = document.getElementById('ledger-body');
const plantilla = document.getElementById('plantilla-edicion');

// ---------------------------------------------------------
// Render: celda del esquema
// ---------------------------------------------------------
function renderCelda(mesa){
  const existente = document.querySelector(`.cell[data-numero="${mesa.numero}"]`);
  if(existente) existente.remove();

  const cell = document.createElement('div');
  cell.className = `cell st-${mesa.estado}${mesa.forma === 'round' ? ' round' : ''}`;
  cell.dataset.numero = mesa.numero;
  cell.dataset.zona = mesa.zona;
  cell.dataset.estado = mesa.estado;
  cell.innerHTML = `<span class="cell-num">${mesa.numero}</span><span class="cell-cap">${mesa.capacidad}p</span>`;
  cell.addEventListener('click', () => abrirEdicion(mesa.numero, true));
  zoneRows[mesa.zona].appendChild(cell);
}

// ---------------------------------------------------------
// Render: fila del libro de mesas
// ---------------------------------------------------------
function renderFila(mesa){
  const existente = document.querySelector(`tr.mesa-row[data-numero="${mesa.numero}"]`);
  if(existente) existente.remove();

  const tr = document.createElement('tr');
  tr.className = 'mesa-row';
  tr.dataset.numero = mesa.numero;
  tr.dataset.zona = mesa.zona;
  tr.dataset.estado = mesa.estado;
  tr.innerHTML = `
    <td class="t-num">${mesa.numero}</td>
    <td>${mesa.zona}</td>
    <td>${mesa.capacidad} personas</td>
    <td class="t-estado estado-texto-${mesa.estado}">${estadoLabel[mesa.estado]}</td>
    <td class="t-arrow">＋</td>
  `;
  tr.addEventListener('click', () => abrirEdicion(mesa.numero, false));
  ledgerBody.appendChild(tr);
  return tr;
}

function renderTodo(){
  mesas.forEach(m => { renderCelda(m); renderFila(m); });
  actualizarConteo();
  aplicarFiltros();
}

function actualizarConteo(){
  document.getElementById('conteo-mesas').textContent = `${mesas.length} registradas`;
}

// ---------------------------------------------------------
// Selección + edición inline (funciona desde el esquema y desde la tabla)
// ---------------------------------------------------------
function abrirEdicion(numero, vieneDelEsquema){
  // si ya estaba abierta la misma fila, la cerramos (toggle)
  if(filaAbierta === numero){
    cerrarEdicion();
    return;
  }
  cerrarEdicion();
  filaAbierta = numero;

  const mesa = mesas.find(m => m.numero === numero);
  marcarSeleccion(numero);

  const filaMesa = document.querySelector(`tr.mesa-row[data-numero="${numero}"]`);
  const nodo = plantilla.content.cloneNode(true);
  const fila = nodo.querySelector('.ledger-edit-row');

  fila.querySelector('.edit-num').textContent = numero;
  fila.querySelector('.e-zona').value = mesa.zona;
  fila.querySelector('.e-capacidad').value = mesa.capacidad;
  fila.querySelector('.e-estado').value = mesa.estado;

  fila.querySelector('.e-guardar').addEventListener('click', () => guardarEdicion(numero, fila));
  fila.querySelector('.e-eliminar').addEventListener('click', () => eliminarMesa(numero));
  fila.querySelector('.e-cerrar').addEventListener('click', cerrarEdicion);

  filaMesa.after(fila);

  if(vieneDelEsquema){
    filaMesa.scrollIntoView({ behavior:'smooth', block:'center' });
  }
}

// quita la clase "selected" de cualquier fila/celda que la tenga
function limpiarSeleccion(){
  const marcados = document.querySelectorAll('.mesa-row.selected, .cell.selected');
  for(let i = 0; i < marcados.length; i++){
    marcados[i].classList.remove('selected');
  }
}

function cerrarEdicion(){
  const abierta = document.querySelector('.ledger-edit-row');
  if(abierta) abierta.remove();
  filaAbierta = null;
  limpiarSeleccion();
}

function marcarSeleccion(numero){
  limpiarSeleccion();
  const fila = document.querySelector(`tr.mesa-row[data-numero="${numero}"]`);
  const celda = document.querySelector(`.cell[data-numero="${numero}"]`);
  if(fila) fila.classList.add('selected');
  if(celda) celda.classList.add('selected');
}

// ---------------------------------------------------------
// Guardar / eliminar
// ---------------------------------------------------------
function guardarEdicion(numero, filaEdicion){
  const mesa = mesas.find(m => m.numero === numero);
  mesa.zona = filaEdicion.querySelector('.e-zona').value;
  mesa.capacidad = filaEdicion.querySelector('.e-capacidad').value;
  mesa.estado = filaEdicion.querySelector('.e-estado').value;

  renderCelda(mesa);
  const nuevaFila = renderFila(mesa);
  cerrarEdicion();
  marcarSeleccion(numero);
  aplicarFiltros();

  mostrarFeedback(`Guardado — Mesa ${mesa.numero}: ${mesa.zona}, ${mesa.capacidad} personas, estado "${estadoLabel[mesa.estado]}".`);
}

function eliminarMesa(numero){
  mesas = mesas.filter(m => m.numero !== numero);
  const celdaVieja = document.querySelector(`.cell[data-numero="${numero}"]`);
  if(celdaVieja) celdaVieja.remove();
  const filaVieja = document.querySelector(`tr.mesa-row[data-numero="${numero}"]`);
  if(filaVieja) filaVieja.remove();
  cerrarEdicion();
  actualizarConteo();
  mostrarFeedback(`Eliminada — la mesa ${numero} ya no aparece en el plano.`);
}

function mostrarFeedback(texto){
  const fb = document.getElementById('feedback-general');
  fb.textContent = texto;
  fb.hidden = false;
}

// ---------------------------------------------------------
// Filtros por zona / estado (afectan esquema y libro)
// ---------------------------------------------------------
const filterTabs = document.querySelectorAll('.filter-tab');
for(let i = 0; i < filterTabs.length; i++){
  const btn = filterTabs[i];
  btn.addEventListener('click', () => {
    const tipo = btn.dataset.filterType;
    const hermanos = document.querySelectorAll(`.filter-tab[data-filter-type="${tipo}"]`);
    for(let j = 0; j < hermanos.length; j++){
      hermanos[j].classList.remove('active');
    }
    btn.classList.add('active');
    if(tipo === 'zona') filtroZona = btn.dataset.value;
    if(tipo === 'estado') filtroEstado = btn.dataset.value;
    aplicarFiltros();
  });
}

function aplicarFiltros(){
  const celdas = document.querySelectorAll('.cell');
  for(let i = 0; i < celdas.length; i++){
    const cell = celdas[i];
    const zonaOk = filtroZona === 'todas' || cell.dataset.zona === filtroZona;
    const estadoOk = filtroEstado === 'todos' || cell.dataset.estado === filtroEstado;
    cell.classList.toggle('hidden-filter', !(zonaOk && estadoOk));
  }
  const filas = document.querySelectorAll('.mesa-row');
  for(let i = 0; i < filas.length; i++){
    const row = filas[i];
    const zonaOk = filtroZona === 'todas' || row.dataset.zona === filtroZona;
    const estadoOk = filtroEstado === 'todos' || row.dataset.estado === filtroEstado;
    row.style.display = (zonaOk && estadoOk) ? '' : 'none';
  }
}

// ---------------------------------------------------------
// Agregar nueva mesa
// ---------------------------------------------------------
const btnMostrarNueva = document.getElementById('btn-mostrar-nueva');
const formNueva = document.getElementById('form-nueva');

btnMostrarNueva.addEventListener('click', () => {
  formNueva.hidden = !formNueva.hidden;
  btnMostrarNueva.textContent = formNueva.hidden ? '+ Agregar mesa' : '– Ocultar formulario';
});

document.getElementById('btn-cancelar-nueva').addEventListener('click', () => {
  formNueva.reset();
  formNueva.hidden = true;
  btnMostrarNueva.textContent = '+ Agregar mesa';
});

formNueva.addEventListener('submit', function(e){
  e.preventDefault();
  const numero = document.getElementById('n-numero').value.trim();
  const zona = document.getElementById('n-zona').value;
  const capacidad = document.getElementById('n-capacidad').value;
  const estado = document.getElementById('n-estado').value;

  if(!numero) return;
  if(mesas.some(m => m.numero === numero)){
    mostrarFeedback(`Ya existe una mesa con el número ${numero}. Usa un número distinto.`);
    return;
  }

  const nuevaMesa = { numero, zona, capacidad, estado, forma: Math.random() > 0.5 ? 'round' : 'square' };
  mesas.push(nuevaMesa);
  renderCelda(nuevaMesa);
  renderFila(nuevaMesa);
  actualizarConteo();
  aplicarFiltros();

  mostrarFeedback(`Agregada — Mesa ${numero} · ${zona} · ${capacidad} personas · Estado: ${estadoLabel[estado]}.`);

  formNueva.reset();
  document.getElementById('n-capacidad').value = 4;
  formNueva.hidden = true;
  btnMostrarNueva.textContent = '+ Agregar mesa';

  const celdaNueva = document.querySelector(`.cell[data-numero="${numero}"]`);
  if(celdaNueva) celdaNueva.scrollIntoView({ behavior:'smooth', block:'center' });
});

// ---------------------------------------------------------
// Inicio
// ---------------------------------------------------------
mesas = mesasIniciales.slice();
renderTodo();

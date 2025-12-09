// Función para mostrar el formulario seleccionado
function mostrarFormulario(idFormulario) {
    // Ocultar todos los formularios
    document.getElementById('vuelos').style.display = 'none';
    document.getElementById('hoteles').style.display = 'none';
    document.getElementById('autos').style.display = 'none';

    // Remover la clase 'activo' de todos los botones
    document.getElementById('btnVuelos').classList.remove('activo');
    document.getElementById('btnHoteles').classList.remove('activo');
    document.getElementById('btnAutos').classList.remove('activo');

    // Mostrar el formulario deseado
    document.getElementById(idFormulario).style.display = 'block';

    // Añadir la clase 'activo' al botón presionado
    document.getElementById('btn' + idFormulario.charAt(0).toUpperCase() + idFormulario.slice(1)).classList.add('activo');
}

/* ===================================================
   0️⃣ Mapa de códigos IATA para ciudades
   =================================================== */
const codigosIATA = {
    "La Paz, Bolivia": "LPB",
    "Santa Cruz, Bolivia": "VVI",
    "Cochabamba, Bolivia": "CBB",
    "Sucre, Bolivia": "SRE",
    "Tarija, Bolivia": "TJA",
    "Buenos Aires, Argentina": "EZE",
    "Santiago, Chile": "SCL",
    "Lima, Perú": "LIM",
    "Bogotá, Colombia": "BOG",
    "Quito, Ecuador": "UIO",
    "Montevideo, Uruguay": "MVD",
    "Asunción, Paraguay": "ASU",
    "Caracas, Venezuela": "CCS",
    "Miami, USA": "MIA",
    "New York, USA": "JFK",
    "Los Angeles, USA": "LAX",
    "Houston, USA": "IAH",
    "Cancún, México": "CUN",
    "Madrid, España": "MAD",
    "Barcelona, España": "BCN",
    "París, Francia": "CDG",
    "Londres, Reino Unido": "LHR",
    "Roma, Italia": "FCO",
    "Lisboa, Portugal": "LIS",
    "Sao Paulo, Brasil": "GRU",
    "Rio de Janeiro, Brasil": "GIG"
};

/* ===================================================
   1️⃣ Función buscarVuelos() 
   =================================================== */
async function buscarVuelos() {
    const origenNombre = document.getElementById("origen").value;
    const destinoNombre = document.getElementById("destino").value;
    const fechaIda = document.getElementById("fechaida").value;
    const fechaVuelta = document.getElementById("fecharetorno").value;
    
    // OBTENER VALORES DE ADULTOS Y NIÑOS
    const numAdultos = parseInt(document.getElementById("nropasajeros").value);
    const numNinos = parseInt(document.getElementById("nropasajerosmenores").value);
    const totalPasajeros = numAdultos + numNinos;
    
    const tipoVuelo = document.querySelector('input[name="seleccion"]:checked').value;

    // VALIDACIÓN: Máximo 9 pasajeros
    if (totalPasajeros === 0) {
        alert("Debe seleccionar al menos 1 pasajero (adulto o niño).");
        return;
    }

    if (totalPasajeros > 9) {
        alert(`Error: El número máximo de pasajeros (adultos + niños) es 9. Usted seleccionó ${totalPasajeros}.`);
        return;
    }
    
    // GUARDAR LAS CANTIDADES DE PASAJEROS EN SESSION STORAGE
    sessionStorage.setItem('adultos', numAdultos);
    sessionStorage.setItem('ninos', numNinos);

    // Guardar info de búsqueda
    localStorage.setItem("infoBusqueda", JSON.stringify({
        tipoVuelo,
        origenNombre,
        destinoNombre,
        fechaIda,
        fechaVuelta,
        pasajeros: totalPasajeros 
    }));

    // Convertir ciudad a IATA
    const origen = codigosIATA[origenNombre];
    const destino = codigosIATA[destinoNombre];

    if (!origen || !destino) {
        alert("Selecciona ciudades válidas de la lista.");
        return;
    }

    try {
        // --- Lógica de la API de Amadeus (Vuelos) ---
        const tokenResponse = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                client_id: "0KA3uPvakMmHLMDWE2AKgcVxhfcAzMnL",
                client_secret: "LwlGqgvHjhfRYgrb"
            })
        });
        const token = (await tokenResponse.json()).access_token;

        // Buscar IDA
        const vueloIdaResp = await fetch(
            `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origen}&destinationLocationCode=${destino}&departureDate=${fechaIda}&adults=${numAdultos}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const vueloIdaData = await vueloIdaResp.json();
        localStorage.setItem("resultadosVuelosIda", JSON.stringify(vueloIdaData));

        // Solo ida → redirige directo
        if (tipoVuelo === "soloida") {
            localStorage.removeItem("resultadosVuelosVuelta"); 
            window.location.href = "resultado_busqueda.html";
            return;
        }

        // Si es ida y vuelta → buscar vuelta
        const vueloVueltaResp = await fetch(
            `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${destino}&destinationLocationCode=${origen}&departureDate=${fechaVuelta}&adults=${numAdultos}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const vueloVueltaData = await vueloVueltaResp.json();
        localStorage.setItem("resultadosVuelosVuelta", JSON.stringify(vueloVueltaData));

        window.location.href = "resultado_busqueda.html";
    } catch (error) {
        console.error("Error al buscar vuelos:", error);
        alert("Hubo un error al buscar vuelos o en la conexión a la API.");
    }
}

/* ===================================================
   2️⃣ Función buscarHoteles() - CORREGIDA CON TUS IDS
   =================================================== */
async function buscarHoteles() {
    // 1. Obtener valores del formulario de hoteles (USANDO TUS IDS: ciudad, fechaentrada, fechasalida)
    const destinoNombre = document.getElementById("ciudad").value; 
    const fechaCheckIn = document.getElementById("fechaentrada").value; 
    const fechaCheckOut = document.getElementById("fechasalida").value; 
    
    // Usaremos nroadultos para la validación de huéspedes
    const nroHuespedes = parseInt(document.getElementById("nroadultos").value); 

    // 2. Validaciones básicas
    if (!destinoNombre || !fechaCheckIn || !fechaCheckOut) {
        alert("Por favor, completa la ciudad, la fecha de entrada y la fecha de salida.");
        return;
    }
    
    if (new Date(fechaCheckIn) >= new Date(fechaCheckOut)) {
        alert("La fecha de salida debe ser posterior a la fecha de entrada.");
        return;
    }

    if (nroHuespedes < 1) {
        alert("Debe seleccionar al menos 1 adulto por habitación.");
        return;
    }
    
    // Convertir ciudad a IATA
    const ciudadIATA = codigosIATA[destinoNombre];
    if (!ciudadIATA) {
        alert("Selecciona un destino de hotel válido de la lista de ciudades disponibles (ej: 'Madrid, España').");
        return;
    }

    // 3. Guardar información de la búsqueda
    localStorage.setItem("infoBusquedaHotel", JSON.stringify({
        destino: destinoNombre,
        checkIn: fechaCheckIn,
        checkOut: fechaCheckOut,
        huespedes: nroHuespedes,
        ciudadIATA: ciudadIATA 
    }));

    try {
        // A. OBTENER TOKEN DE AMADEUS 
        const tokenResponse = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                client_id: "0KA3uPvakMmHLMDWE2AKgcVxhfcAzMnL",
                client_secret: "LwlGqgvHjhfRYgrb"
            })
        });
        const token = (await tokenResponse.json()).access_token;

        // B. BUSCAR HOTELES POR CÓDIGO DE CIUDAD IATA
        const urlHoteles = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${ciudadIATA}&subType=HOTEL,APART`;

        const hotelesResp = await fetch(urlHoteles, { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        
        const hotelesData = await hotelesResp.json();
        
        // Guardar los resultados de la búsqueda de hoteles
        localStorage.setItem("resultadosHoteles", JSON.stringify(hotelesData));

        // 4. Redirigir a la página de resultados de hotel
        window.location.href = "resultado_hoteles.html";
        
    } catch (error) {
        console.error("Error al buscar hoteles:", error);
        alert("Hubo un error al buscar hoteles o en la conexión a la API.");
    }
}

/* ===================================================
   3️⃣ Función buscarAutos() (Placeholder)
   =================================================== */
function buscarAutos() {
    alert("Función Buscar Autos aún no implementada.");
}

/* ===================================================
   4️⃣ Autocompletado de ciudades
   =================================================== */
const ciudades = Object.keys(codigosIATA);

function autocompletar(input, lista) {
    input.addEventListener("input", () => {
        const dataListId = input.getAttribute("list");
        const dataList = document.getElementById(dataListId);
        dataList.innerHTML = "";

        const valor = input.value.toLowerCase();
        const coincidencias = lista.filter(c => c.toLowerCase().includes(valor));

        coincidencias.forEach(c => {
            const option = document.createElement("option");
            option.value = c;
            dataList.appendChild(option);
        });
    });
}


/* ===================================================
   5️⃣ Bloquear Fecha de Retorno si Solo Ida
   =================================================== */
function actualizarFechaRetorno() {
    const soloIda = document.getElementById("soloida");
    const fechaRetorno = document.getElementById("fecharetorno");
    if (soloIda.checked) {
        fechaRetorno.disabled = true;
        fechaRetorno.value = "";
    } else {
        fechaRetorno.disabled = false;
    }
}


/* ===================================================
   6️⃣ Lógica DOMContentLoaded (Inicialización)
   =================================================== */
document.addEventListener('DOMContentLoaded', function() {
    // --- Lógica de la sesión ---
    const usuarioLogeado = sessionStorage.getItem('usuarioLogeado');
    const estadoSesionElement = document.getElementById('estadoSesion');

    if (estadoSesionElement && usuarioLogeado) {
        
        const nombreSpan = document.createElement('span');
        nombreSpan.textContent = usuarioLogeado;
        nombreSpan.style.fontWeight = 'bold';
        nombreSpan.style.color = '#1d4e89'; 

        const cerrarSesionLink = document.createElement('a');
        cerrarSesionLink.href = '#';
        cerrarSesionLink.textContent = ' (Cerrar Sesión)';
        cerrarSesionLink.style.marginLeft = '10px';
        cerrarSesionLink.style.color = '#CC0000';
        cerrarSesionLink.style.textDecoration = 'none';
        
        cerrarSesionLink.onclick = function(e) {
            e.preventDefault(); 
            sessionStorage.clear(); 
            localStorage.removeItem('historialReservas'); 
            alert('Sesión cerrada. Serás redirigido.');
            window.location.href = 'principal.html'; 
        };

        estadoSesionElement.innerHTML = '';
        estadoSesionElement.appendChild(nombreSpan);
        estadoSesionElement.appendChild(cerrarSesionLink);
    } else if (estadoSesionElement) {
         estadoSesionElement.innerHTML = '<a href="inicio_sesion.html" id="entrar">Entrar</a>';
    }
    // --- Fin de manejo de la sesión ---


    // ASIGNAR LOS EVENTOS CLIC PARA CAMBIAR FORMULARIO
    const btnVuelos = document.getElementById('btnVuelos');
    const btnHoteles = document.getElementById('btnHoteles');
    const btnAutos = document.getElementById('btnAutos');
    const soloIda = document.getElementById("soloida");
    const idaVuelta = document.getElementById("idavuelta");

    if (btnVuelos) btnVuelos.addEventListener('click', () => mostrarFormulario('vuelos'));
    if (btnHoteles) btnHoteles.addEventListener('click', () => mostrarFormulario('hoteles'));
    if (btnAutos) btnAutos.addEventListener('click', () => mostrarFormulario('autos'));
    
    // Eventos para actualizar la fecha de retorno
    if (soloIda) soloIda.addEventListener("change", actualizarFechaRetorno);
    if (idaVuelta) idaVuelta.addEventListener("change", actualizarFechaRetorno);

    // Configuración de autocompletado general
    // Creación de Datalists (necesario si no están en HTML)
    const createDatalist = (id) => {
        let dl = document.getElementById(id);
        if (!dl) {
            dl = document.createElement("datalist");
            dl.id = id;
            document.body.appendChild(dl);
        }
    };
    
    // 1. Vuelos
    createDatalist("ciudadesOrigen");
    createDatalist("ciudadesDestino");
    document.getElementById("origen").setAttribute("list", "ciudadesOrigen");
    document.getElementById("destino").setAttribute("list", "ciudadesDestino");
    autocompletar(document.getElementById("origen"), ciudades);
    autocompletar(document.getElementById("destino"), ciudades);

    // 2. Hoteles
    const inputDestinoHotel = document.getElementById("ciudad"); // <-- LEE EL ID 'ciudad'
    if (inputDestinoHotel) {
        createDatalist("ciudadesHotel");
        inputDestinoHotel.setAttribute("list", "ciudadesHotel");
        autocompletar(inputDestinoHotel, ciudades);
    }
    
    // Inicialización al cargar la página
    mostrarFormulario('vuelos');
    actualizarFechaRetorno();
});
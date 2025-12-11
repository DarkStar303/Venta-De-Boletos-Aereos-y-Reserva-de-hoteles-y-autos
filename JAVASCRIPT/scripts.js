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
   1️⃣ Función buscarVuelos() - IMPLEMENTACIÓN SIMULADOR
   =================================================== */
function buscarVuelos() {
    const origenNombre = document.getElementById("origen").value;
    const destinoNombre = document.getElementById("destino").value;
    const fechaIda = document.getElementById("fechaida").value;
    const fechaVuelta = document.getElementById("fecharetorno").value;
    
    // OBTENER VALORES DE PASAJEROS
    const numAdultos = parseInt(document.getElementById("nropasajeros").value) || 0;
    const numNinos = parseInt(document.getElementById("nropasajerosmenores").value) || 0;
    const totalPasajeros = numAdultos + numNinos;
    
    // Obtiene el valor del radio seleccionado (soloida o idavuelta)
    const tipoVuelo = document.querySelector('input[name="seleccion"]:checked').value;

    // VALIDACIONES
    if (totalPasajeros === 0) {
        alert("Debe seleccionar al menos 1 pasajero (adulto o niño).");
        return;
    }
    if (totalPasajeros > 9) {
        alert(`Error: El número máximo de pasajeros (adultos + niños) es 9. Usted seleccionó ${totalPasajeros}.`);
        return;
    }
    const origen = codigosIATA[origenNombre];
    const destino = codigosIATA[destinoNombre];
    if (!origen || !destino) {
        alert("Selecciona ciudades válidas de la lista.");
        return;
    }

    // GUARDAR INFO DE BÚSQUEDA Y PASAJEROS
    sessionStorage.setItem('adultos', numAdultos);
    sessionStorage.setItem('ninos', numNinos);
    localStorage.setItem("infoBusqueda", JSON.stringify({
        tipoVuelo,
        origenNombre,
        destinoNombre,
        fechaIda,
        fechaVuelta,
        pasajeros: totalPasajeros 
    }));

    // ===========================================
    // SIMULADOR DE DATOS DE VUELOS (Generación Ficticia)
    // ===========================================

    // --- Simular datos de IDA ---
    const resultadosSimuladosIda = {
        data: [
            { 
                id: "V_IDA_1", aerolinea: "Air Sim", 
                precio: (250 * totalPasajeros) + Math.floor(Math.random() * 100), 
                duracion: "6h 30m", origen: origen, destino: destino, 
                salida: fechaIda + "T08:00:00", llegada: fechaIda + "T14:30:00" 
            },
            { 
                id: "V_IDA_2", aerolinea: "SimuJets", 
                precio: (350 * totalPasajeros) + Math.floor(Math.random() * 150), 
                duracion: "7h 15m", origen: origen, destino: destino, 
                salida: fechaIda + "T15:30:00", llegada: fechaIda + "T22:45:00" 
            }
        ]
    };
    localStorage.setItem("resultadosVuelosIda", JSON.stringify(resultadosSimuladosIda));

    // Si es solo ida → redirige directo
    if (tipoVuelo === "soloida") {
        localStorage.removeItem("resultadosVuelosVuelta"); 
        window.location.href = "resultado_busqueda.html";
        return;
    }

    // Si es ida y vuelta → Simular datos de VUELTA
    const resultadosSimuladosVuelta = {
        data: [
            { 
                id: "V_VTA_1", aerolinea: "Air Sim", 
                precio: (260 * totalPasajeros) + Math.floor(Math.random() * 90), 
                duracion: "6h 45m", origen: destino, destino: origen, 
                salida: fechaVuelta + "T10:00:00", llegada: fechaVuelta + "T16:45:00" 
            },
            { 
                id: "V_VTA_2", aerolinea: "Global Sim", 
                precio: (340 * totalPasajeros) + Math.floor(Math.random() * 120), 
                duracion: "7h 00m", origen: destino, destino: origen, 
                salida: fechaVuelta + "T18:00:00", llegada: fechaVuelta + "T01:00:00" 
            }
        ]
    };
    localStorage.setItem("resultadosVuelosVuelta", JSON.stringify(resultadosSimuladosVuelta));

    // Redirigir a la página de resultados
    window.location.href = "resultado_busqueda.html";
}


/* ===================================================
   2️⃣ Función buscarHoteles() - ORIGINAL (Usa API Amadeus)
   =================================================== */
async function buscarHoteles() {
    const destinoNombre = document.getElementById("ciudad").value;  
    const fechaCheckIn = document.getElementById("fechaentrada").value;  
    const fechaCheckOut = document.getElementById("fechasalida").value;  
    const nroHuespedes = parseInt(document.getElementById("nroadultos").value);  

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
    
    const ciudadIATA = codigosIATA[destinoNombre];
    if (!ciudadIATA) {
        alert("Selecciona un destino de hotel válido de la lista.");
        return;
    }

    localStorage.setItem("infoBusquedaHotel", JSON.stringify({
        destino: destinoNombre,
        checkIn: fechaCheckIn,
        checkOut: fechaCheckOut,
        huespedes: nroHuespedes,
        ciudadIATA: ciudadIATA  
    }));

    try {
        // --- Lógica de la API de Amadeus (Hoteles) ---
        // (Se ignora la implementación real de API aquí por simplicidad)
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

        const urlHoteles = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${ciudadIATA}&subType=HOTEL,APART`;

        const hotelesResp = await fetch(urlHoteles, {  
            headers: { Authorization: `Bearer ${token}` }  
        });
        const hotelesData = await hotelesResp.json();
        
        localStorage.setItem("resultadosHoteles", JSON.stringify(hotelesData));
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
    
    // Verifica si el radio 'Solo Ida' está marcado
    if (soloIda && soloIda.checked) {
        fechaRetorno.disabled = true;
        fechaRetorno.value = "";
    } else if (fechaRetorno) {
        fechaRetorno.disabled = false;
    }
}

/* ===================================================
   6️⃣ Lógica DOMContentLoaded (Inicialización y Sesión)
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
        cerrarSesionLink.href = 'index.html';
        cerrarSesionLink.textContent = ' (Cerrar Sesión)';
        cerrarSesionLink.style.marginLeft = '10px';
        cerrarSesionLink.style.color = '#CC0000';
        cerrarSesionLink.style.textDecoration = 'none';
        
        cerrarSesionLink.onclick = function(e) {
            e.preventDefault(); 
            sessionStorage.clear(); 
            localStorage.removeItem('historialReservas'); 
            alert('Sesión cerrada. Serás redirigido.');
            window.location.href = 'index.html'; 
        };

        estadoSesionElement.innerHTML = '';
        estadoSesionElement.appendChild(nombreSpan);
        estadoSesionElement.appendChild(cerrarSesionLink);
    } else if (estadoSesionElement) {
         estadoSesionElement.innerHTML = '<a href="inicio_sesion.html" id="entrar">Entrar</a>';
    }
    // --- Fin de manejo de la sesión ---


    // ASIGNAR EVENTOS CLIC PARA CAMBIAR FORMULARIO
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

    // Función para asegurar que el datalist exista
    const createDatalist = (id) => {
        let dl = document.getElementById(id);
        if (!dl) {
            dl = document.createElement("datalist");
            dl.id = id;
            document.body.appendChild(dl);
        }
    };
    
    // 1. Vuelos - Autocompletado
    const inputOrigenVuelo = document.getElementById("origen");
    const inputDestinoVuelo = document.getElementById("destino");
    if (inputOrigenVuelo && inputDestinoVuelo) {
        createDatalist("ciudadesOrigen");
        createDatalist("ciudadesDestino");
        autocompletar(inputOrigenVuelo, ciudades);
        autocompletar(inputDestinoVuelo, ciudades);
    }

    // 2. Hoteles - Autocompletado
    const inputDestinoHotel = document.getElementById("ciudad"); 
    if (inputDestinoHotel) {
        createDatalist("ciudadesHotel");
        autocompletar(inputDestinoHotel, ciudades);
    }
    
    // Inicialización al cargar la página
    mostrarFormulario('vuelos');
    actualizarFechaRetorno();
});
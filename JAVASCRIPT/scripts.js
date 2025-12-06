/* ===================================================
   0️⃣ Mapa de códigos IATA para ciudades
   =================================================== */
const codigosIATA = {
    // Bolivia
    "La Paz, Bolivia": "LPB",
    "Santa Cruz, Bolivia": "VVI",
    "Cochabamba, Bolivia": "CBB",
    "Sucre, Bolivia": "SRE",
    "Tarija, Bolivia": "TJA",

    // América Latina
    "Buenos Aires, Argentina": "EZE",
    "Santiago, Chile": "SCL",
    "Lima, Perú": "LIM",
    "Bogotá, Colombia": "BOG",
    "Quito, Ecuador": "UIO",
    "Montevideo, Uruguay": "MVD",
    "Asunción, Paraguay": "ASU",
    "Caracas, Venezuela": "CCS",

    // Norteamérica
    "Miami, USA": "MIA",
    "New York, USA": "JFK",
    "Los Angeles, USA": "LAX",
    "Houston, USA": "IAH",
    "Cancún, México": "CUN",

    // Europa
    "Madrid, España": "MAD",
    "Barcelona, España": "BCN",
    "París, Francia": "CDG",
    "Londres, Reino Unido": "LHR",
    "Roma, Italia": "FCO",
    "Lisboa, Portugal": "LIS",

    // Otros
    "Sao Paulo, Brasil": "GRU",
    "Rio de Janeiro, Brasil": "GIG"
};

/* ===================================================
   1️⃣ Función buscarVuelos() -> se llama al presionar el botón
   =================================================== */
async function buscarVuelos() {
    const origenNombre = document.getElementById("origen").value;
    const destinoNombre = document.getElementById("destino").value;
    const fechaIda = document.getElementById("fechaida").value;
    const fechaVuelta = document.getElementById("fecharetorno").value;
    const pasajeros = document.getElementById("nropasajeros").value;

    if (!origenNombre || !destinoNombre || !fechaIda) {
        alert("Por favor, completa origen, destino y fecha de ida.");
        return;
    }

    // Convertir nombre de ciudad a código IATA
    const origen = codigosIATA[origenNombre];
    const destino = codigosIATA[destinoNombre];

    if (!origen || !destino) {
        alert("Selecciona un origen y destino válido de la lista.");
        return;
    }

    try {
        // Obtener token Amadeus
        const tokenResponse = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                client_id: "0KA3uPvakMmHLMDWE2AKgcVxhfcAzMnL",
                client_secret: "LwlGqgvHjhfRYgrb"
            })
        });
        const tokenData = await tokenResponse.json();
        const token = tokenData.access_token;

        // Llamada a la API de vuelos
        const vueloResponse = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origen}&destinationLocationCode=${destino}&departureDate=${fechaIda}&adults=${pasajeros}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const vueloData = await vueloResponse.json();

        // Guardar resultados
        localStorage.setItem("resultadosVuelos", JSON.stringify(vueloData));

        // Redirigir a resultados
        window.location.href = "resultado_busqueda.html";
    } catch (error) {
        console.error("Error al buscar vuelos:", error);
        alert("Hubo un error al buscar vuelos. Intenta nuevamente.");
    }
}

/* ===================================================
   2️⃣ Autocompletado de ciudades
   =================================================== */
const ciudades = Object.keys(codigosIATA); // usa las claves de codigosIATA

function autocompletar(input, lista) {
    input.addEventListener("input", () => {
        let dataListId = input.getAttribute("list");
        let dataList = document.getElementById(dataListId);
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

document.getElementById("origen").setAttribute("list", "ciudadesOrigen");
document.getElementById("destino").setAttribute("list", "ciudadesDestino");

let datalistOrigen = document.createElement("datalist");
datalistOrigen.id = "ciudadesOrigen";
document.body.appendChild(datalistOrigen);

let datalistDestino = document.createElement("datalist");
datalistDestino.id = "ciudadesDestino";
document.body.appendChild(datalistDestino);

autocompletar(document.getElementById("origen"), ciudades);
autocompletar(document.getElementById("destino"), ciudades);

/* ===================================================
   3️⃣ Bloquear Fecha de Retorno si Solo Ida
   =================================================== */
const soloIda = document.getElementById("soloida");
const idaVuelta = document.getElementById("idavuelta");
const fechaRetorno = document.getElementById("fecharetorno");

function actualizarFechaRetorno() {
    if (soloIda.checked) {
        fechaRetorno.disabled = true;
        fechaRetorno.value = "";
    } else {
        fechaRetorno.disabled = false;
    }
}

soloIda.addEventListener("change", actualizarFechaRetorno);
idaVuelta.addEventListener("change", actualizarFechaRetorno);
actualizarFechaRetorno();

/* ===================================================
   4️⃣ Mostrar resultados de vuelos
   =================================================== */
function mostrarVuelos() {
    const resultados = JSON.parse(localStorage.getItem("resultadosVuelos")) || {};
    const vuelos = Array.isArray(resultados.data) ? resultados.data : [];
    const contenedor = document.getElementById("resultados");
    if (!contenedor) return;

    if (vuelos.length === 0) {
        contenedor.innerHTML = "<p>No se encontraron vuelos.</p>";
        return;
    }

    contenedor.innerHTML = "";

    function obtenerLogo(aerolinea) {
        switch(aerolinea) {
            case "LA": return "Boliviana.svg";
            case "AV": return "Avianca.svg";
            case "BO": return "Boa.svg";
            default: return "default.svg";
        }
    }

    vuelos.forEach(vuelo => {
        const itinerarios = vuelo.itineraries || [];
        if (itinerarios.length === 0) return;

        const segmentos = itinerarios[0].segments || [];
        if (segmentos.length === 0) return;

        const origen = segmentos[0].departure.iataCode;
        const destino = segmentos[segmentos.length - 1].arrival.iataCode;
        const salida = segmentos[0].departure.at.slice(11,16);
        const llegada = segmentos[segmentos.length - 1].arrival.at.slice(11,16);
        const aerolinea = segmentos[0].carrierCode;
        const precio = vuelo.price?.total || "N/A";
        const escala = segmentos.length > 1 ? `${segmentos.length - 1} escala(s)` : "Directo";

        const card = document.createElement("article");
        card.classList.add("cuadroResultado");
        card.innerHTML = `
            <div class="informacion">
                <img src="img/logos/${obtenerLogo(aerolinea)}" alt="${aerolinea}" class="aerolinea">
                <div class="detalles">
                    <h4 class="textoaerolinea">${aerolinea}</h4>
                    <h5 class="escala">${escala}</h5>
                    <p class="ruta">${origen} - ${destino}</p>
                    <p class="equipaje">1 maleta facturada</p>
                    <p class="tiempo">${salida} - ${llegada}</p>
                </div>
            </div>
            <div class="precio">
                <p>${precio} Bs</p>
            </div>
            <div class="seleccion">
                <a href="#" class="boton seleccionarVuelo">Seleccionar</a>
            </div>
        `;
        contenedor.appendChild(card);

        // Evento click para guardar vuelo y redirigir
        const boton = card.querySelector(".seleccionarVuelo");
        boton.addEventListener("click", (e) => {
            e.preventDefault();
            const vueloSeleccionado = { origen, destino, salida, llegada, aerolinea, precio, escala };
            localStorage.setItem("vueloSeleccionado", JSON.stringify(vueloSeleccionado));
            window.location.href = "llenar datos.html"; // aquí va el nombre correcto
        });
    });
}

/* ===================================================
   Ejecutar mostrarVuelos al cargar resultado_busqueda.html
   =================================================== */
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("resultados")) {
        mostrarVuelos();
    }
});


require('dotenv').config({ path: '/etc/secrets/.env' });
const express = require('express');
const axios = require('axios');
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER; 
const client = twilio(accountSid, authToken);

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const apiUrlBus = 'https://api.contigosanmarcos.com/status?count=1';
const apiUrlAforo = 'https://contador-production-5202.up.railway.app/contador';
const apiBaseUrl = 'https://api-0cws.onrender.com';

async function obtenerInformacionDelBus() {
  try {
    const response = await axios.get(apiUrlBus);
    const { positions, last_stop } = response.data;

    const lastStopName = last_stop ? last_stop.name : 'Desconocida';
    const lastStopDistance = last_stop ? last_stop.distance?.toFixed(2) : 'Desconocida';

    const velocity = positions[0]?.velocity || 'Desconocida'; 
    const estado = velocity !== 'Desconocida' && velocity > 0 ? 'En camino...' : 'Recogiendo pasajeros'; 

    const lat = positions[0]?.lt || 'Desconocida';
    const lng = positions[0]?.lg || 'Desconocida';

    const mapsLink = lat !== 'Desconocida' && lng !== 'Desconocida' 
      ? `https://www.google.com/maps?q=${lat},${lng}` 
      : 'Desconocida';

    const mensaje = `*Información del Burrito* 🚍
    📍 Paradero: ${lastStopName}
    📍 Distancia: ${lastStopDistance} m
    📍 Estado: ${estado} 
    📍 Velocidad: ${velocity} km/h
    📍 Ubicación: ${mapsLink}`;
    return mensaje;
  } catch (error) {
    console.error('Error al obtener la información del bus:', error);
    return 'No se pudo obtener la información del bus en este momento.';
  }
}

async function obtenerAforoDelBus() {
  try {
    const response = await axios.get(apiUrlAforo);
    const { suben , bajan , subenParadero , bajanParadero } = response.data;

    const diferencia = suben - bajan;
    const mensaje = `*Información de Aforo* 🚍
    👤 Aforo actual: ${diferencia}
    En el último paradero:
    👤 Subieron: ${subenParadero}
    👤 Bajaron: ${bajanParadero}
    `;
    return mensaje;
  } catch (error) {
    console.error('Error al obtener la información de aforo:', error);
    return 'No se pudo obtener la información de aforo en este momento.';
  }
}

async function desbloquearPuertas() {
  try {
    const response = await fetch(`${apiBaseUrl}/actualizar-puertas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puerta1: 180, puerta2: 180 })
    });
    const data = await response.json();
    console.log("Puertas actualizadas:", data);
    return "Puertas desbloqueadas exitosamente.";
  } catch (error) {
    console.error("Error al actualizar puertas:", error);
    return "Hubo un error al intentar desbloquear las puertas.";
  }
}

app.get('/', (req, res) => {
  res.send('¡Servidor funcionando!');
});

app.post('/webhook', async (req, res) => {
  const message = req.body.Body.trim().toLowerCase(); 
  const from = req.body.From; 

  let responseMessage = 'Lo siento, no entiendo ese comando.';

  if (message === 'bus') {
    responseMessage = await obtenerInformacionDelBus();
  } else if (message === 'ayuda') {
    responseMessage = 'Envía "bus" para obtener la información del bus o "aforo" para el estado de las personas.';
  } else if (message === 'aforo') {
    responseMessage = await obtenerAforoDelBus();
  } else if (message === 'si') {
    responseMessage = await desbloquearPuertas();
  } else if (message === 'no') {
    responseMessage = 'Operación cancelada. Las puertas no se han desbloqueado.';
  }

  await client.messages.create({
    body: responseMessage,
    from: fromNumber, 
    to: from         
  });

  res.send('<Response></Response>'); 
});

app.listen(3000, () => {
  console.log('Servidor escuchando en el puerto 3000');
});

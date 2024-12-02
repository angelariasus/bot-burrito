require('dotenv').config({ path: '/etc/secrets/.env' });
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const axios = require('axios');

// Obtener las credenciales de Twilio desde las variables de entorno
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const number = process.env.YOUR_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN);
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER);

// Crear una instancia de Express
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// URL de la API
const apiUrl = 'https://api.contigosanmarcos.com/status?count=1'; // Reemplaza con la URL de tu API

// Función para obtener la información del bus
async function obtenerInformacionDelBus() {
  try {
    const response = await axios.get(apiUrl);
    const { positions, last_stop } = response.data;

    // Asegurarse de que last_stop no sea null
    const lastStopName = last_stop ? last_stop.name : 'Desconocida';
    const lastStopDistance = last_stop ? last_stop.distance?.toFixed(2) : 'Desconocida';
    const lastStopHasReached = last_stop && last_stop.has_reached !== undefined ? (last_stop.has_reached ? 'Sí' : 'No') : 'Desconocida';

    const batteryStatus = positions[0]?.bat !== null ? positions[0]?.bat : 'Desconocida';

    const mensaje = `🚍 **Información del Bus** 🚍
    📍 Posición actual:
       - Latitud: ${positions[0]?.lt || 'Desconocida'}
       - Longitud: ${positions[0]?.lg || 'Desconocida'}
       - Velocidad: ${positions[0]?.velocity || 'Desconocida'} km/h
       - Batería: ${batteryStatus}%

    🛑 Última parada:
       - Nombre: ${lastStopName}
       - Distancia: ${lastStopDistance} km
       - Llegó: ${lastStopHasReached}

    📅 Hora del reporte: ${new Date(positions[0]?.timestamp?.secs_since_epoch * 1000).toLocaleString()}`;

    return mensaje;

  } catch (error) {
    console.error('Error al obtener la información del bus:', error);
    return 'No se pudo obtener la información del bus en este momento.';
  }
}

// Ruta que recibe los mensajes entrantes
app.post('/webhook', async (req, res) => {
  const message = req.body.Body.trim().toLowerCase(); // Obtén el mensaje y conviértelo a minúsculas
  const from = req.body.From; // Número que envió el mensaje

  let responseMessage = 'Lo siento, no entiendo ese comando.';

  // Comandos predefinidos
  if (message === 'bus') {
    responseMessage = await obtenerInformacionDelBus();
  } else if (message === 'ayuda') {
    responseMessage = 'Envía "bus" para obtener la información del bus.';
  }

  // Enviar la respuesta a WhatsApp
  await client.messages.create({
    body: responseMessage,
    from: fromNumber,  // Tu número de Twilio
    to: number          // Número del usuario
  });

  res.send('<Response></Response>'); // Respuesta vacía de Twilio
});

// Inicia el servidor en el puerto 3000
app.listen(3000, () => {
  console.log('Servidor escuchando en el puerto 3000');
});

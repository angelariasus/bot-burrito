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

const apiUrl = 'https://api.contigosanmarcos.com/status?count=1';

async function obtenerInformacionDelBus() {
  try {
    const response = await axios.get(apiUrl);
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
       📍 Ubicación: ${mapsLink}
    `;
    return mensaje;
  } catch (error) {
    console.error('Error al obtener la información del bus:', error);
    return 'No se pudo obtener la información del bus en este momento.';
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
    responseMessage = 'Envía "bus" para obtener la información del bus.';
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

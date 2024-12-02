const twilio = require('twilio');
const axios = require('axios');

const accountSid = TWILIO_ACCOUNT_SID;
const authToken = TWILIO_AUTH_TOKEN;
const fromNumber = TWILIO_PHONE_NUMBER; 
const toNumber = YOUR_PHONE_NUMBER; 

// Cliente de Twilio
const client = twilio(accountSid, authToken);

// Función para obtener datos desde tu API
async function getDataFromAPI() {
  try {
    const response = await axios.get('https://yourapiurl.com'); // Reemplaza con la URL de tu API
    return response.data;
  } catch (error) {
    console.error('Error al obtener datos de la API:', error);
  }
}

// Función para enviar el mensaje
async function sendMessage() {
  const data = await getDataFromAPI();
  if (data) {
    const position = data.positions[0]; // Tomando la primera posición
    const lastStop = data.last_stop;

    // Formato de mensaje
    const message = `🚍 **Información del Bus** 🚍
📍 **Posición actual**:
   - Latitud: ${position.lt}
   - Longitud: ${position.lg}
   - Velocidad: ${position.velocity} km/h
   - Batería: ${position.bat}%

🛑 **Última parada**:
   - Nombre: ${lastStop.name}
   - Distancia: ${lastStop.distance.toFixed(2)} km
   - Llegó: ${lastStop.has_reached ? 'Sí' : 'No'}

📅 **Hora del reporte**: ${new Date(position.timestamp.secs_since_epoch * 1000).toLocaleString()}`;

    client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message
    })
    .then(message => console.log(`Mensaje enviado: ${message.sid}`))
    .catch(error => console.error('Error al enviar mensaje:', error));
  }
}

// Escuchar mensajes y responder al comando '!burrito'
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// Middleware para parsear las solicitudes de webhook de Twilio
app.use(bodyParser.urlencoded({ extended: false }));

// Endpoint para recibir mensajes de WhatsApp
app.post('/webhook', (req, res) => {
  const incomingMessage = req.body.Body.trim();

  if (incomingMessage === '!burrito') {
    sendMessage();
    res.send('<Response></Response>'); // Responder vacío para confirmar que se recibió el mensaje
  } else {
    res.send('<Response><Message>No entendí el comando. Usa !burrito.</Message></Response>');
  }
});

// Iniciar el servidor
app.listen(3000, () => {
  console.log('Servidor escuchando en el puerto 3000');
});


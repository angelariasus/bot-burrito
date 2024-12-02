require('dotenv').config();

const twilio = require('twilio');
const axios = require('axios');
const express = require('express');
const app = express();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER; 
const toNumber = process.env.YOUR_PHONE_NUMBER; 

const client = twilio(accountSid, authToken);

const getApiData = async () => {
  try {
    const response = await axios.get('https://api.contigosanmarcos.com/status?count=1'); 
    return response.data;
  } catch (error) {
    console.error('Error al obtener datos de la API:', error);
    return null;
  }
};

app.post('/webhook', express.urlencoded({ extended: false }), async (req, res) => {
  const incomingMessage = req.body.Body.trim().toLowerCase();

  if (incomingMessage === '!burrito') {
    const apiData = await getApiData();

    if (apiData) {
      const positions = apiData.positions[0];
      const lastStop = apiData.last_stop;

      const message = `
        **Posición actual:**
        - Latitud: ${positions.lt}
        - Longitud: ${positions.lg}
        - Velocidad: ${positions.velocity} km/h
        - Batería: ${positions.bat}%

        **Última parada:**
        - Nombre: ${lastStop.name}
        - Distancia: ${lastStop.distance.toFixed(2)} km
      `;

      client.messages.create({
        body: message,
        from: fromNumber,
        to: toNumber
      }).then((message) => {
        console.log('Mensaje enviado:', message.sid);
      }).catch((error) => {
        console.error('Error al enviar el mensaje:', error);
      });
    } else {
      client.messages.create({
        body: 'No se pudo obtener la información.',
        from: fromNumber,
        to: toNumber
      });
    }
  }

  res.send('');
});

app.listen(3000, () => {
  console.log('Servidor escuchando en el puerto 3000');
});

const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('Cliente conectado');
    
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Ruta para obtener la lista de puertos seriales disponibles
app.get('/api/ports', async (req, res) => {
    try {
        const ports = await SerialPort.list();
        res.json(ports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Variable global para mantener la conexión del puerto serial
let serialConnection = null;
let parser = null;

// Ruta para configurar el puerto serial
app.post('/api/connect', async (req, res) => {
    const { path, baudRate, dataBits, stopBits, parity } = req.body;
    
    try {
        if (serialConnection) {
            serialConnection.close();
        }

        serialConnection = new SerialPort({
            path,
            baudRate: parseInt(baudRate),
            dataBits: parseInt(dataBits),
            stopBits: parseInt(stopBits),
            parity
        });

        parser = serialConnection.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        parser.on('data', (data) => {
            console.log('Datos recibidos:', data);
            // Emitir los datos a todos los clientes conectados
            io.emit('serialData', data);
        });

        res.json({ message: 'Conexión establecida exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para enviar datos al puerto serial
app.post('/api/send', (req, res) => {
    const { data } = req.body;
    
    if (!serialConnection) {
        return res.status(400).json({ error: 'Puerto serial no conectado' });
    }

    try {
        serialConnection.write(data);
        res.json({ message: 'Datos enviados exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para desconectar el puerto serial
app.post('/api/disconnect', (req, res) => {
    if (serialConnection) {
        serialConnection.close();
        serialConnection = null;
        parser = null;
        res.json({ message: 'Desconectado exitosamente' });
    } else {
        res.status(400).json({ error: 'No hay conexión activa' });
    }
});

httpServer.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 
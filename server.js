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
            // console.log('Datos recibidos:', data);
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
    const { data, isHex } = req.body;
    
    console.log('📦 Datos recibidos:', {
        data,
        isHex,
        dataLength: data.length
    });
    
    if (!serialConnection) {
        console.log('❌ Error: Puerto serial no conectado');
        return res.status(400).json({ error: 'Puerto serial no conectado' });
    }

    try {
        let dataToSend;
        if (isHex) {
            console.log('🔄 Procesando datos HEX');
            const cleanHex = data.replace(/\s+/g, '');
            console.log('   - HEX limpio:', cleanHex);
            dataToSend = Buffer.from(cleanHex, 'hex');
            console.log('   - Buffer creado:', dataToSend);
        } else {
            console.log('🔄 Procesando datos ASCII');
            dataToSend = data;
            console.log('   - Datos a enviar:', dataToSend);
            // Mostrar bytes que se enviarán
            const bytes = Buffer.from(dataToSend);
            console.log('   - Bytes a enviar:', bytes);
        }

        console.log('📤 Intentando escribir en el puerto:', {
            dataType: typeof dataToSend,
            length: dataToSend.length,
            content: dataToSend
        });

        serialConnection.write(dataToSend, (err) => {
            if (err) {
                console.log('❌ Error al escribir en el puerto:', {
                    name: err.name,
                    message: err.message,
                    stack: err.stack
                });
                return res.status(500).json({ error: err.message });
            }
            console.log('✅ Datos enviados exitosamente');
            res.json({ message: 'Datos enviados exitosamente' });
        });
    } catch (error) {
        console.log('❌ Error en el procesamiento:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
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
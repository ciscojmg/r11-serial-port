document.addEventListener('DOMContentLoaded', () => {
    const portSelect = document.getElementById('portSelect');
    const baudRate = document.getElementById('baudRate');
    const dataBits = document.getElementById('dataBits');
    const stopBits = document.getElementById('stopBits');
    const parity = document.getElementById('parity');
    const connectBtn = document.getElementById('connectBtn');
    const sendBtn = document.getElementById('sendBtn');
    const sendData = document.getElementById('sendData');
    const receivedData = document.getElementById('receivedData');
    const sendLocationCmd = document.getElementById('sendLocationCmd');
    const sendWhereCmd = document.getElementById('sendWhereCmd');
    const sendSmsTestCmd = document.getElementById('sendSmsTestCmd');

    // Referencias a elementos del dashboard
    const dashboardElements = {
        imei: document.getElementById('imei'),
        version: document.getElementById('version'),
        imsi: document.getElementById('imsi'),
        iccid: document.getElementById('iccid'),
        gpsStatus: document.getElementById('gps-status'),
        gsmStatus: document.getElementById('gsm-status'),
        serverStatus: document.getElementById('server-status'),
        batteryStatus: document.getElementById('battery-status'),
        adcStatus: document.getElementById('adc-status'),
        accStatus: document.getElementById('acc-status'),
        gpsTime: document.getElementById('gps-time'),
        systemTime: document.getElementById('system-time'),
        serverConnection: document.getElementById('server-connection')
    };

    let isConnected = false;
    
    // Inicializar Socket.IO
    const socket = io();

    // Definición de comandos predefinidos
    const predefinedCommands = {
        locationCommand: {
            hex: '78780D8000014C4A44570001620C0D0A',
            description: 'Solicitud de localización inmediata (LJDW)',
            isHex: true
        },
        whereCommand: {
            data: 'WHERE#\r\n',
            description: 'Solicitud de localización (WHERE)',
            isHex: false
        },
        smsTestCommand: {
            data: 'AT%TEST=SMS[][WHERE#]\r\n',
            description: 'Prueba de comando SMS para solicitud de ubicación',
            isHex: false
        }
    };

    // Función para procesar las tramas recibidas
    function processFrame(data) {
        const line = data.trim();
        
        // Extraer valores usando expresiones regulares
        const imeiMatch = line.match(/\[  IMEI   \]-> (\d+)/);
        const versionMatch = line.match(/\[ VERSION \]-> (.+)/);
        const imsiMatch = line.match(/\[  IMSI   \]-> (.+)/);
        const iccidMatch = line.match(/\[  ICCID  \]-> (.+)/);
        const ipPortMatch = line.match(/\[ IP&PORT \]-> (.+)/);
        const gpsStatusMatch = line.match(/\[==   GPS   ==\] ->     < (.+) >/);
        const gsmStatusMatch = line.match(/\[==   GSM   ==\] ->     < (.+) >/);
        const serverStatusMatch = line.match(/\[== SERVER  ==\] ->     < (.+) >/);
        const accStatusMatch = line.match(/\[==   ACC   ==\] ->     < (.+) >/);
        const adcBatMatch = line.match(/\[== ADC\+BAT ==\] ->  \[ (.+),(.+) \]/);
        const gpsTimeMatch = line.match(/\[== GPS TIME==\] ->  \[  (.+)  \]/);
        const systemTimeMatch = line.match(/\[==SYTEMTIME==\] ->  \[(.+)\]/);

        // Actualizar el dashboard
        if (imeiMatch) {
            dashboardElements.imei.textContent = imeiMatch[1];
        }
        if (versionMatch) {
            dashboardElements.version.textContent = versionMatch[1];
        }
        if (imsiMatch) {
            dashboardElements.imsi.textContent = imsiMatch[1] || 'No disponible';
        }
        if (iccidMatch) {
            dashboardElements.iccid.textContent = iccidMatch[1] || 'No disponible';
        }
        if (gpsStatusMatch) {
            const status = gpsStatusMatch[1];
            dashboardElements.gpsStatus.textContent = status;
            dashboardElements.gpsStatus.className = getStatusClass(status);
        }
        if (gsmStatusMatch) {
            const status = gsmStatusMatch[1];
            dashboardElements.gsmStatus.textContent = status;
            dashboardElements.gsmStatus.className = getStatusClass(status);
        }
        if (serverStatusMatch) {
            const status = serverStatusMatch[1];
            dashboardElements.serverStatus.textContent = status;
            dashboardElements.serverStatus.className = getStatusClass(status);
        }
        if (accStatusMatch) {
            const status = accStatusMatch[1];
            dashboardElements.accStatus.textContent = status;
            dashboardElements.accStatus.className = getStatusClass(status);
        }
        if (adcBatMatch) {
            dashboardElements.adcStatus.textContent = `${adcBatMatch[1]}V`;
            dashboardElements.batteryStatus.textContent = `${adcBatMatch[2]}V`;
        }
        if (gpsTimeMatch) {
            dashboardElements.gpsTime.textContent = gpsTimeMatch[1];
        }
        if (systemTimeMatch) {
            dashboardElements.systemTime.textContent = systemTimeMatch[1];
        }
        if (ipPortMatch) {
            dashboardElements.serverConnection.textContent = ipPortMatch[1];
        }
    }

    // Función para determinar la clase CSS según el estado
    function getStatusClass(status) {
        const baseClasses = 'mt-2 text-lg font-semibold';
        switch (status.toUpperCase()) {
            case 'OK':
            case 'ON':
                return `${baseClasses} text-green-600`;
            case 'LOW':
            case 'OFF':
                return `${baseClasses} text-red-600`;
            case 'SRH':
                return `${baseClasses} text-yellow-600`;
            case 'CHK':
                return `${baseClasses} text-blue-600`;
            default:
                return `${baseClasses} text-gray-600`;
        }
    }

    // Escuchar datos del puerto serial
    socket.on('serialData', (data) => {
        const messageElement = document.createElement('div');
        messageElement.className = 'text-green-600 mb-1';
        messageElement.textContent = data;
        receivedData.appendChild(messageElement);
        receivedData.scrollTop = receivedData.scrollHeight;

        // Procesar la trama para actualizar el dashboard
        processFrame(data);
    });

    // Cargar la lista de puertos disponibles
    async function loadPorts() {
        try {
            const response = await fetch('/api/ports');
            const ports = await response.json();
            
            portSelect.innerHTML = '<option value="">Seleccionar puerto...</option>';
            ports.forEach(port => {
                const option = document.createElement('option');
                option.value = port.path;
                option.textContent = `${port.path} - ${port.manufacturer || 'Desconocido'}`;
                portSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar puertos:', error);
            alert('Error al cargar la lista de puertos');
        }
    }

    // Conectar/Desconectar del puerto serial
    async function toggleConnection() {
        if (!isConnected) {
            if (!portSelect.value) {
                alert('Por favor seleccione un puerto');
                return;
            }

            const config = {
                path: portSelect.value,
                baudRate: baudRate.value,
                dataBits: parseInt(dataBits.value),
                stopBits: parseInt(stopBits.value),
                parity: parity.value
            };

            try {
                const response = await fetch('/api/connect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(config)
                });

                if (!response.ok) throw new Error('Error en la conexión');

                isConnected = true;
                connectBtn.textContent = 'Desconectar';
                connectBtn.classList.replace('bg-blue-500', 'bg-red-500');
                connectBtn.classList.replace('hover:bg-blue-600', 'hover:bg-red-600');
                
                // Deshabilitar configuración mientras está conectado
                portSelect.disabled = true;
                baudRate.disabled = true;
                dataBits.disabled = true;
                stopBits.disabled = true;
                parity.disabled = true;

                // Limpiar el área de mensajes al conectar
                receivedData.innerHTML = '<div class="text-blue-600 mb-2">Conexión establecida...</div>';

            } catch (error) {
                console.error('Error al conectar:', error);
                alert('Error al establecer la conexión');
            }
        } else {
            try {
                const response = await fetch('/api/disconnect', {
                    method: 'POST'
                });

                if (!response.ok) throw new Error('Error al desconectar');

                isConnected = false;
                connectBtn.textContent = 'Conectar';
                connectBtn.classList.replace('bg-red-500', 'bg-blue-500');
                connectBtn.classList.replace('hover:bg-red-600', 'hover:bg-blue-600');
                
                // Habilitar configuración
                portSelect.disabled = false;
                baudRate.disabled = false;
                dataBits.disabled = false;
                stopBits.disabled = false;
                parity.disabled = false;

                // Agregar mensaje de desconexión
                const messageElement = document.createElement('div');
                messageElement.className = 'text-red-600 mb-2';
                messageElement.textContent = 'Desconectado del puerto serial';
                receivedData.appendChild(messageElement);

                // Resetear valores del dashboard
                Object.values(dashboardElements).forEach(element => {
                    if (element) {
                        element.textContent = '-';
                        if (element.className.includes('text-')) {
                            element.className = 'mt-2 text-lg font-semibold text-gray-600';
                        }
                    }
                });

            } catch (error) {
                console.error('Error al desconectar:', error);
                alert('Error al desconectar');
            }
        }
    }

    // Función para validar si una cadena es hexadecimal válida
    function isValidHex(str) {
        return /^[0-9A-Fa-f]+$/.test(str.replace(/\s/g, ''));
    }

    // Enviar datos
    async function sendDataToPort() {
        if (!isConnected) {
            alert('Por favor conecte el puerto primero');
            return;
        }

        const data = sendData.value.trim();
        const isHexMode = document.querySelector('input[name="dataFormat"][value="hex"]').checked;

        if (!data) {
            alert('Por favor ingrese datos para enviar');
            return;
        }

        try {
            let dataToSend;
            if (isHexMode) {
                if (!isValidHex(data)) {
                    alert('Por favor ingrese datos hexadecimales válidos (0-9, A-F)');
                    return;
                }
                dataToSend = data.replace(/\s/g, ''); // Remover espacios en blanco
            } else {
                dataToSend = data + '\r\n'; // Agregar CR+LF para comandos ASCII
            }

            const response = await fetch('/api/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    data: dataToSend,
                    isHex: isHexMode
                })
            });

            if (!response.ok) throw new Error('Error al enviar datos');

            // Limpiar el campo de entrada después de enviar
            sendData.value = '';
            
            // Agregar el mensaje enviado al área de visualización
            const messageElement = document.createElement('div');
            messageElement.className = 'text-blue-600 mb-1';
            messageElement.textContent = `Enviado (${isHexMode ? 'HEX' : 'ASCII'}): ${data}`;
            receivedData.appendChild(messageElement);
            receivedData.scrollTop = receivedData.scrollHeight;

        } catch (error) {
            alert('Error al enviar datos');
        }
    }

    // Función para enviar comandos
    async function sendCommand(command) {
        if (!isConnected) {
            alert('Por favor conecte el puerto primero');
            return;
        }

        try {
            const response = await fetch('/api/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    data: command.isHex ? command.hex : command.data,
                    isHex: command.isHex
                })
            });

            if (!response.ok) throw new Error('Error al enviar comando');

            // Agregar el mensaje enviado al área de visualización
            const messageElement = document.createElement('div');
            messageElement.className = 'text-purple-600 mb-1';
            messageElement.textContent = `Comando enviado: ${command.description}`;
            receivedData.appendChild(messageElement);
            receivedData.scrollTop = receivedData.scrollHeight;

        } catch (error) {
            alert('Error al enviar el comando');
        }
    }

    // Event Listeners
    connectBtn.addEventListener('click', toggleConnection);
    sendBtn.addEventListener('click', sendDataToPort);
    sendData.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendDataToPort();
    });

    // Event listeners para los comandos predefinidos
    sendLocationCmd.addEventListener('click', () => {
        sendCommand(predefinedCommands.locationCommand);
    });

    sendWhereCmd.addEventListener('click', () => {
        sendCommand(predefinedCommands.whereCommand);
    });

    sendSmsTestCmd.addEventListener('click', () => {
        sendCommand(predefinedCommands.smsTestCommand);
    });

    // Cargar puertos al iniciar
    loadPorts();
}); 
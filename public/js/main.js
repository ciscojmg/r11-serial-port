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
    const clearBtn = document.getElementById('clearBtn');

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
    let shouldAutoScroll = true;
    let lastScrollHeight = 0;
    
    // Inicializar Socket.IO
    const socket = io();

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

    // Función para manejar el auto-scroll
    function handleScroll() {
        const currentScroll = receivedData.scrollTop + receivedData.clientHeight;
        const scrollDiff = Math.abs(currentScroll - lastScrollHeight);
        
        // Si el usuario ha scrolleado hacia arriba (más de 30px de diferencia)
        if (scrollDiff > 30) {
            shouldAutoScroll = (currentScroll >= receivedData.scrollHeight - 50);
        }
        
        lastScrollHeight = receivedData.scrollHeight;
    }

    // Función para agregar mensajes al área de recepción
    function appendMessage(message, className = '') {
        const messageElement = document.createElement('div');
        messageElement.className = className + ' mb-1';
        messageElement.textContent = message;
        receivedData.appendChild(messageElement);
        
        // Auto-scroll solo si estamos cerca del final
        const isNearBottom = receivedData.scrollHeight - receivedData.scrollTop - receivedData.clientHeight < 100;
        if (isNearBottom) {
            receivedData.scrollTop = receivedData.scrollHeight;
        }
    }

    // Event listener para el scroll
    receivedData.addEventListener('scroll', handleScroll);

    // Event listener para el botón de limpieza
    clearBtn.addEventListener('click', () => {
        receivedData.innerHTML = '';
        shouldAutoScroll = true;
        lastScrollHeight = 0;
    });

    // Manejo de conexión Socket.IO
    socket.on('connect', () => {
        appendMessage('WebSocket conectado', 'text-gray-600');
    });

    socket.on('disconnect', () => {
        appendMessage('WebSocket desconectado', 'text-gray-600');
    });

    // Escuchar datos del puerto serial
    socket.on('serialData', (data) => {
        const messageElement = document.createElement('div');
        messageElement.className = 'text-green-600 mb-1';
        messageElement.textContent = data;
        receivedData.appendChild(messageElement);
        
        // Solo hacer scroll si shouldAutoScroll es true
        if (shouldAutoScroll) {
            receivedData.scrollTop = receivedData.scrollHeight;
        }

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

    // Función para enviar datos
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
                dataToSend = data.replace(/\s/g, '');
            } else {
                // Solo agregar # si es un comando (empieza con AT o es un comando conocido)
                if (data.startsWith('AT') || 
                    ['WHERE', 'STATUS', 'VERSION', 'PARAM'].some(cmd => data.startsWith(cmd))) {
                    dataToSend = data.endsWith('#') ? data : data + '#';
                } else {
                    dataToSend = data;
                }
                // Agregar CR+LF para modo ASCII
                dataToSend = dataToSend + '\r\n';
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

            sendData.value = '';
            
            // Agregar el mensaje enviado al área de visualización
            const messageElement = document.createElement('div');
            messageElement.className = 'text-blue-600 mb-1';
            messageElement.textContent = `Enviado: ${dataToSend.replace('\r\n', '')}`;
            receivedData.appendChild(messageElement);
            
            // Solo hacer scroll si shouldAutoScroll es true
            if (shouldAutoScroll) {
                receivedData.scrollTop = receivedData.scrollHeight;
            }

        } catch (error) {
            alert('Error al enviar datos');
        }
    }

    // Event Listeners
    connectBtn.addEventListener('click', toggleConnection);
    sendBtn.addEventListener('click', sendDataToPort);
    sendData.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendDataToPort();
    });

    // Elementos del generador de tramas
    const customCommand = document.getElementById('customCommand');
    const sequenceNumber = document.getElementById('sequenceNumber');
    const generateFrameBtn = document.getElementById('generateFrameBtn');
    const previewLength = document.getElementById('previewLength');
    const previewContentLength = document.getElementById('previewContentLength');
    const previewCommand = document.getElementById('previewCommand');
    const previewSequence = document.getElementById('previewSequence');
    const previewChecksum = document.getElementById('previewChecksum');

    // Función para actualizar la vista previa de la trama
    function updateFramePreview() {
        const command = customCommand.value.trim();
        const sequence = sequenceNumber.value.trim() || '0001';  // Cambiado a 0001 como valor inicial

        // Convertir comando a hex
        const commandHex = textToHex(command);
        
        // Calcular longitudes según el manual
        // Instruction length = Server flag (4 bytes) + Command content length (N)
        const instructionLength = 4 + (commandHex.length / 2);
        
        // Packet length = protocol (1) + instruction length (1) + server flag (4) + command content (N) + serial number (2) + error check (2)
        const packetLength = 1 + 1 + 4 + (commandHex.length / 2) + 2 + 2;

        // Actualizar vista previa principal
        previewLength.textContent = packetLength.toString(16).padStart(2, '0').toUpperCase();
        previewContentLength.textContent = instructionLength.toString(16).padStart(2, '0').toUpperCase();
        previewCommand.textContent = commandHex;
        previewSequence.textContent = sequence;

        // Actualizar detalles en la tabla
        document.getElementById('previewLengthDetail').textContent = packetLength.toString(16).padStart(2, '0').toUpperCase();
        document.getElementById('previewContentLengthDetail').textContent = instructionLength.toString(16).padStart(2, '0').toUpperCase();
        document.getElementById('previewCommandDetail').textContent = commandHex;
        document.getElementById('previewSequenceDetail').textContent = sequence;

        // Calcular CRC-ITU (desde packet length hasta information serial number)
        const dataForCrc = 
            packetLength.toString(16).padStart(2, '0') +
            '80' +
            instructionLength.toString(16).padStart(2, '0') +
            '00000000' +
            commandHex +
            sequence;
        
        const crc = calculateCRC16(dataForCrc);
        const checksumHex = crc.toString(16).padStart(4, '0').toUpperCase();
        
        // Actualizar checksum en ambos lugares
        previewChecksum.textContent = checksumHex;
        document.getElementById('previewChecksumDetail').textContent = checksumHex;
    }

    // Función para convertir texto a hexadecimal
    function textToHex(text) {
        return Array.from(text).map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    // Función para calcular CRC-16 (CRC-ITU)
    function calculateCRC16(data) {
        let crc = 0xFFFF;
        for (let i = 0; i < data.length; i += 2) {
            crc ^= parseInt(data.substr(i, 2), 16);
            for (let j = 0; j < 8; j++) {
                if (crc & 0x0001) {
                    crc = (crc >> 1) ^ 0x8408;
                } else {
                    crc >>= 1;
                }
            }
        }
        return crc;
    }

    // Función para generar y enviar la trama completa
    function generateAndSendFrame() {
        if (!isConnected) {
            alert('Por favor conecte el puerto primero');
            return;
        }

        const command = customCommand.value.trim();
        if (!command) {
            alert('Por favor ingrese un comando');
            return;
        }

        const sequence = sequenceNumber.value.trim() || '0001';
        const commandHex = textToHex(command);
        
        // Calcular longitudes según el manual
        // Instruction length = Server flag (4 bytes) + Command content length (N)
        const instructionLength = 4 + (commandHex.length / 2);
        
        // Packet length = protocol (1) + instruction length (1) + server flag (4) + command content (N) + serial number (2) + error check (2)
        const packetLength = 1 + 1 + 4 + (commandHex.length / 2) + 2 + 2;

        // Construir la trama
        const dataForCrc = 
            packetLength.toString(16).padStart(2, '0').toUpperCase() +
            '80' +
            instructionLength.toString(16).padStart(2, '0').toUpperCase() +
            '00000000' +
            commandHex +
            sequence;
        
        const crc = calculateCRC16(dataForCrc);
        const checksumHex = crc.toString(16).padStart(4, '0').toUpperCase();
        
        // Trama completa
        const frame = 
            '7878' +
            dataForCrc +
            checksumHex +
            '0D0A';

        // Enviar la trama
        fetch('/api/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                data: frame,
                isHex: true
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Error al enviar la trama');
            appendMessage(`Trama enviada: ${frame}`, 'text-blue-600');
        })
        .catch(error => {
            alert('Error al enviar la trama');
            console.error('Error:', error);
        });
    }

    // Event listeners para el generador de tramas
    customCommand.addEventListener('input', updateFramePreview);
    sequenceNumber.addEventListener('input', event => {
        // Validar entrada hexadecimal y longitud
        event.target.value = event.target.value.replace(/[^0-9A-Fa-f]/g, '').substr(0, 4).toUpperCase();
        updateFramePreview();
    });
    generateFrameBtn.addEventListener('click', generateAndSendFrame);

    // Actualizar vista previa inicial
    updateFramePreview();

    // Cargar puertos al iniciar
    loadPorts();

    // Lista de checksums CRC-16 para probar
    const CRC_VARIANTS = [
        { name: 'CRC-16/ARC', result: 'A5CB' },
        { name: 'CRC-16/CDMA2000', result: '2AD2' },
        { name: 'CRC-16/CMS', result: 'DD70' },
        { name: 'CRC-16/DDS-110', result: 'D183' },
        { name: 'CRC-16/DECT-R', result: 'E85A' },
        { name: 'CRC-16/DECT-X', result: 'E85B' },
        { name: 'CRC-16/DNP', result: '4081' },
        { name: 'CRC-16/EN-13757', result: 'D63F' },
        { name: 'CRC-16/GENIBUS', result: '5FFD' },
        { name: 'CRC-16/GSM', result: '113E' },
        { name: 'CRC-16/IBM-3740', result: 'A002' },
        { name: 'CRC-16/IBM-SDLC', result: 'BA60' },
        { name: 'CRC-16/ISO-IEC-14443-3-A', result: 'ED16' },
        { name: 'CRC-16/KERMIT', result: '86ED' },
        { name: 'CRC-16/LJ1200', result: 'F04F' },
        { name: 'CRC-16/M17', result: '93A0' },
        { name: 'CRC-16/MAXIM-DOW', result: '5A34' },
        { name: 'CRC-16/MCRF4XX', result: '459F' },
        { name: 'CRC-16/MODBUS', result: '1A8B' },
        { name: 'CRC-16/NRSC-5', result: 'FB91' },
        { name: 'CRC-16/OPENSAFETY-A', result: '8F63' },
        { name: 'CRC-16/OPENSAFETY-B', result: '1698' },
        { name: 'CRC-16/PROFIBUS', result: '5314' },
        { name: 'CRC-16/RIELLO', result: '3455' },
        { name: 'CRC-16/SPI-FUJITSU', result: '292D' },
        { name: 'CRC-16/T10-DIF', result: '734C' },
        { name: 'CRC-16/TELEDISK', result: '54B7' },
        { name: 'CRC-16/TMS37157', result: '50B9' },
        { name: 'CRC-16/UMTS', result: 'DF8D' },
        { name: 'CRC-16/USB', result: 'E574' },
        { name: 'CRC-16/XMODEM', result: 'EEC1' }
    ];

    let currentCRCIndex = 0;
    let isTestRunning = false;
    let testInterval = null;

    // Función para enviar una trama con un checksum específico
    async function sendFrameWithChecksum(checksum) {
        const baseFrame = '7878108000A00000000504152414D23';
        const frame = baseFrame + '0001' + checksum + '0D0A';
        
        try {
            const response = await fetch('/api/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    data: frame,
                    isHex: true
                })
            });

            if (!response.ok) throw new Error('Error al enviar la trama');
            
            appendMessage(`Enviando trama con ${CRC_VARIANTS[currentCRCIndex].name}`, 'text-blue-600');
            appendMessage(`Trama: ${frame}`, 'text-blue-600');
        } catch (error) {
            appendMessage('Error al enviar la trama', 'text-red-600');
            console.error('Error:', error);
        }
    }

    // Función para ejecutar el test de CRC
    function runCRCTest() {
        if (currentCRCIndex >= CRC_VARIANTS.length) {
            currentCRCIndex = 0;
            if (!document.getElementById('loopTest').checked) {
                stopTest();
                return;
            }
        }

        sendFrameWithChecksum(CRC_VARIANTS[currentCRCIndex].result);
        currentCRCIndex++;
    }

    // Función para iniciar el test
    function startTest() {
        if (!isConnected) {
            alert('Por favor conecte el puerto primero');
            return;
        }

        isTestRunning = true;
        document.getElementById('startStopTest').textContent = 'Detener Test';
        document.getElementById('startStopTest').classList.replace('bg-green-500', 'bg-red-500');
        
        runCRCTest();
        testInterval = setInterval(runCRCTest, 4000); // 4 segundos entre cada trama
    }

    // Función para detener el test
    function stopTest() {
        isTestRunning = false;
        clearInterval(testInterval);
        document.getElementById('startStopTest').textContent = 'Iniciar Test';
        document.getElementById('startStopTest').classList.replace('bg-red-500', 'bg-green-500');
    }

    // Función para alternar el test
    function toggleTest() {
        if (isTestRunning) {
            stopTest();
        } else {
            startTest();
        }
    }

    // Agregar elementos de control al DOM
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'mb-4 p-4 bg-white rounded-lg shadow-lg';
    controlsDiv.innerHTML = `
        <h3 class="text-xl font-semibold mb-4">Test de Variantes CRC</h3>
        <div class="flex items-center gap-4">
            <button id="startStopTest" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Iniciar Test
            </button>
            <label class="inline-flex items-center">
                <input type="checkbox" id="loopTest" class="form-checkbox text-blue-600">
                <span class="ml-2">Repetir continuamente</span>
            </label>
            <span id="currentVariant" class="text-gray-600"></span>
        </div>
    `;

    // Insertar los controles después del primer div.mb-8
    const firstSection = document.querySelector('div.mb-8');
    firstSection.parentNode.insertBefore(controlsDiv, firstSection.nextSibling);

    // Event listener para el botón de test
    document.getElementById('startStopTest').addEventListener('click', toggleTest);
}); 
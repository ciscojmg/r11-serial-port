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

    let isConnected = false;
    
    // Inicializar Socket.IO
    const socket = io();

    // Escuchar datos del puerto serial
    socket.on('serialData', (data) => {
        const messageElement = document.createElement('div');
        messageElement.className = 'text-green-600 mb-1';
        messageElement.textContent = data;
        receivedData.appendChild(messageElement);
        receivedData.scrollTop = receivedData.scrollHeight;
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

            } catch (error) {
                console.error('Error al desconectar:', error);
                alert('Error al desconectar');
            }
        }
    }

    // Enviar datos
    async function sendDataToPort() {
        if (!isConnected) {
            alert('Por favor conecte el puerto primero');
            return;
        }

        const data = sendData.value;
        if (!data) {
            alert('Por favor ingrese datos para enviar');
            return;
        }

        try {
            const response = await fetch('/api/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data })
            });

            if (!response.ok) throw new Error('Error al enviar datos');

            // Limpiar el campo de entrada después de enviar
            sendData.value = '';
            
            // Agregar el mensaje enviado al área de visualización
            const messageElement = document.createElement('div');
            messageElement.className = 'text-blue-600 mb-1';
            messageElement.textContent = `Enviado: ${data}`;
            receivedData.appendChild(messageElement);
            receivedData.scrollTop = receivedData.scrollHeight;

        } catch (error) {
            console.error('Error al enviar datos:', error);
            alert('Error al enviar datos');
        }
    }

    // Event Listeners
    connectBtn.addEventListener('click', toggleConnection);
    sendBtn.addEventListener('click', sendDataToPort);
    sendData.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendDataToPort();
    });

    // Cargar puertos al iniciar
    loadPorts();
}); 
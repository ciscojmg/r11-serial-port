# 🛰️ Interfaz de Comunicación Serial R11

Una interfaz web moderna y potente para la comunicación serial con dispositivos R11, diseñada para facilitar la configuración, monitoreo y control del dispositivo a través de una interfaz intuitiva.

![Vista Principal de la Interfaz](https://github.com/ciscojmg/r11-serial-port/blob/main/docs/main-interface.png)

## ✨ Características

- 🔌 **Configuración del Puerto Serial**
  - Selección de puerto COM
  - Configuración de baudios, bits de datos, paridad y bits de parada
  - Conexión/desconexión con un solo clic

- 📡 **Generador de Tramas**
  - Interfaz visual para crear tramas GT06
  - Previsualización en tiempo real
  - Cálculo automático de checksum
  - Validación de formato

- 📊 **Monitor de Estado**
  - Información del dispositivo (IMEI, IMSI, ICCID)
  - Estado de GPS, GSM y conexión al servidor
  - Monitoreo de batería y entradas ADC
  - Tiempo GPS y del sistema

- 💻 **Interfaz Moderna**
  - Diseño responsive
  - Tema claro y limpio
  - Feedback visual en tiempo real
  - Manejo de errores intuitivo

## 🚀 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/ciscojmg/r11-serial-port.git
cd r11-serial-port
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar el entorno**
```bash
cp .env.example .env
```

4. **Iniciar el servidor**
```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 📸 Guía de Uso

### Configuración Inicial
![Configuración del Puerto](https://github.com/ciscojmg/r11-serial-port/blob/main/docs/port-config.png)
1. Selecciona el puerto COM correspondiente a tu dispositivo
2. Configura los parámetros de comunicación (por defecto: 9600 baudios, 8N1)
3. Haz clic en "Conectar"

### Envío de Comandos
![Generador de Tramas](https://github.com/ciscojmg/r11-serial-port/blob/main/docs/frame-generator.png)
1. Utiliza el generador de tramas para crear comandos
2. Ingresa el comando ASCII y el número de secuencia
3. La trama se generará automáticamente con el formato correcto
4. Haz clic en "Generar y Enviar"

### Monitoreo
![Panel de Estado](https://github.com/ciscojmg/r11-serial-port/blob/main/docs/status-panel.png)
- Visualiza el estado del dispositivo en tiempo real
- Monitorea las tramas recibidas
- Verifica la conexión y estado de los sistemas

## 📁 Estructura de Directorios

```
r11-serial-port/
├── docs/
│   └── images/          # Imágenes para documentación
├── public/
│   ├── images/         # Imágenes de la interfaz
│   ├── js/            # Scripts del cliente
│   └── index.html     # Interfaz principal
├── server.js          # Servidor Node.js
└── package.json       # Dependencias y scripts
```

## 📸 Capturas de Pantalla

Para agregar las capturas de pantalla al proyecto:

1. Crear el directorio de imágenes:
```bash
mkdir -p docs/images
```

2. Guardar las siguientes imágenes en `/docs/images/`:
- `main-interface.png` - Vista completa de la interfaz
- `port-config.png` - Sección de configuración del puerto
- `frame-generator.png` - Generador de tramas
- `status-panel.png` - Panel de estado del dispositivo

## 🛠️ Tecnologías Utilizadas

- Node.js
- Express
- Socket.IO
- Serialport
- Tailwind CSS

## 📝 Notas de Uso

- Asegúrate de tener los drivers correctos instalados para tu dispositivo
- Los puertos COM requieren permisos de administrador en algunos sistemas
- La velocidad de baudios debe coincidir con la configuración del dispositivo
- Los comandos ASCII se envían automáticamente con CR+LF

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles. 
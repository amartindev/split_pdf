# Divisor de PDFs

Una aplicación web moderna en React que permite dividir archivos PDF en múltiples rangos de páginas.

## Características

- 📄 Subir archivos PDF
- ✂️ Dividir PDFs en múltiples rangos de páginas
- ➕ Agregar múltiples rangos de división
- 💾 Descargar cada archivo dividido individualmente
- 📦 Descargar todos los archivos divididos con un solo clic
- 🎨 Interfaz moderna y responsive

## Instalación

1. Instala las dependencias:
```bash
npm install
```

## Uso

1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. Abre tu navegador en la URL que se muestra (generalmente `http://localhost:5173`)

3. Sube un archivo PDF haciendo clic en el área de carga

4. Define los rangos de páginas que deseas dividir:
   - **Desde**: Página inicial del rango
   - **Hasta**: Página final del rango
   - **Nombre (opcional)**: Nombre personalizado para el archivo resultante

5. Haz clic en "Agregar Rango" para crear más divisiones

6. Haz clic en "Dividir PDF" para procesar el archivo

7. Descarga los archivos individuales o usa el botón "Descargar Todos los Archivos" para obtener todos a la vez

## Tecnologías Utilizadas

- React 18
- Vite
- pdf-lib (para manipulación de PDFs)
- CSS moderno con gradientes y animaciones

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción


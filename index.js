const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
// Configurar Multer para guardar temporalmente en 'uploads/'
const upload = multer({ dest: 'uploads/' });

app.use(cors()); // Importante para que tu web no sea bloqueada

// Ruta de prueba para saber si el servidor vive
app.get('/', (req, res) => {
    res.send('Servidor Vloitz Converter: ACTIVO 🟢');
});

app.post('/convert', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).send('No se subió video');

    const inputPath = req.file.path;
    const outputPath = `uploads/${req.file.filename}_fixed.mp4`;

    console.log(`[PROCESANDO] Recibido: ${req.file.originalname} -> ${req.file.filename}`);

    ffmpeg(inputPath)
        .outputOptions([
            '-c:v libx264',       // <--- CAMBIO: Re-codificar a H.264 (Estándar WhatsApp)
            '-preset ultrafast',  // <--- CAMBIO: Para que sea rápido en el servidor
            '-c:a aac',           // AUDIO: Convertir a AAC
            '-b:a 128k',
            '-movflags +faststart'
        ])
        /*.outputOptions([
            '-c:v copy',          // VIDEO: Solo copiar (Ultra rápido, 0 pérdida)
            '-c:a aac',           // AUDIO: Convertir Opus a AAC (Compatible Apple/WhatsApp)
            '-b:a 128k',          // Calidad de audio estándar
            '-movflags +faststart' // Optimizado para streaming web
        ])*/
        .save(outputPath)
        .on('end', () => {
            console.log("✅ Conversión exitosa. Enviando al cliente...");
            res.download(outputPath, 'story_fixed.mp4', (err) => {
                // Limpieza: Borrar archivos temporales del servidor
                try {
                    fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    console.log("🧹 Archivos temporales limpiados.");
                } catch(e) { console.error("Error limpiando:", e); }
            });
        })
        .on('error', (err) => {
            console.error("❌ Error FFmpeg:", err);
            res.status(500).send('Error en conversión');
            try { fs.unlinkSync(inputPath); } catch(e){}
        });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor listo en puerto ${PORT}`));

const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

// CONFIGURACIÓN DE SEGURIDAD (CORS)
// Solo permite peticiones desde tu dominio oficial
app.use(cors({
    origin: 'https://vloitz.github.io',
    optionsSuccessStatus: 200
}));

app.get('/', (req, res) => res.send('Vloitz Server V71: Mixer Ready 🎛️'));

// CONFIGURACIÓN PARA RECIBIR 2 ARCHIVOS
const cpUpload = upload.fields([{ name: 'video', maxCount: 1 }, { name: 'audio', maxCount: 1 }]);

app.post('/merge', cpUpload, (req, res) => {
    // Validación estricta: ¿Llegaron los dos?
    if (!req.files || !req.files['video'] || !req.files['audio']) {
        return res.status(400).send('Faltan archivos (se requiere video y audio)');
    }

    const videoPath = req.files['video'][0].path;
    const audioPath = req.files['audio'][0].path;
    const outputPath = `uploads/${Date.now()}_final.mp4`;

    console.log("🎛️ Iniciando mezcla Video + Audio...");

    ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions([
            '-c:v copy',          // COPIAR VIDEO (No gastar CPU)
            '-c:a aac',           // CONVERTIR AUDIO A AAC (WhatsApp)
            '-b:a 128k',
            '-map 0:v:0',         // Usar video del archivo 0
            '-map 1:a:0',         // Usar audio del archivo 1
            '-shortest',          // Cortar al terminar el más corto
            '-movflags +faststart'
        ])
        .save(outputPath)
        .on('end', () => {
            console.log("✅ Mezcla completada.");
            res.download(outputPath, 'story.mp4', (err) => {
                // Limpieza
                try {
                    fs.unlinkSync(videoPath);
                    fs.unlinkSync(audioPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                } catch(e) {}
            });
        })
        .on('error', (err) => {
            console.error("❌ Error Mezcla:", err);
            res.status(500).send('Error mezclando archivos');
            try { fs.unlinkSync(videoPath); fs.unlinkSync(audioPath); } catch(e){}
        });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server V71 activo en ${PORT}`));

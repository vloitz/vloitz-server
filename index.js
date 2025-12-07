const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());

app.get('/', (req, res) => res.send('Vloitz Server V69: Universal (Convert + Merge) 🟢'));

// --- RUTA 1: CONVERSIÓN SIMPLE (Para V69) ---
app.post('/convert', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).send('Falta video');

    const inputPath = req.file.path;
    const outputPath = `uploads/${req.file.filename}_fixed.mp4`;

    console.log(`[CONVERT] Procesando: ${req.file.originalname}`);

    ffmpeg(inputPath)
        .outputOptions([
            '-c:v copy',          // Copiar video (Rápido)
            '-c:a aac',           // Convertir audio a AAC
            '-b:a 128k',
            '-movflags +faststart'
        ])
        .save(outputPath)
        .on('end', () => {
            res.download(outputPath, 'story.mp4', () => {
                try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch(e){}
            });
        })
        .on('error', (err) => {
            console.error("Error Convert:", err);
            res.status(500).send('Error conversión');
            try { fs.unlinkSync(inputPath); } catch(e){}
        });
});

// --- RUTA 2: MEZCLA (Para futuros experimentos) ---
const cpUpload = upload.fields([{ name: 'video', maxCount: 1 }, { name: 'audio', maxCount: 1 }]);
app.post('/merge', cpUpload, (req, res) => {
    // ... (Lógica de mezcla si se necesita a futuro)
    res.status(501).send("Usa /convert por ahora");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server V69 listo en ${PORT}`));

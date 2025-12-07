const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());

app.get('/', (req, res) => res.send('Vloitz Server V68: Mixer Active 🎛️'));

// NUEVO ENDPOINT: Recibe video y audio por separado
const cpUpload = upload.fields([{ name: 'video', maxCount: 1 }, { name: 'audio', maxCount: 1 }]);

app.post('/merge', cpUpload, (req, res) => {
    if (!req.files['video'] || !req.files['audio']) {
        return res.status(400).send('Faltan archivos (video o audio)');
    }

    const videoPath = req.files['video'][0].path;
    const audioPath = req.files['audio'][0].path;
    const outputPath = `uploads/${Date.now()}_final.mp4`;

    console.log("🎛️ Mezclando Streams...");

    ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions([
            '-c:v copy',          // VIDEO: Copia directa (Calidad Original Intacta)
            '-c:a aac',           // AUDIO: Convertir a AAC (WhatsApp)
            '-b:a 128k',
            '-map 0:v:0',         // Tomar video del archivo 0
            '-map 1:a:0',         // Tomar audio del archivo 1
            '-shortest',          // Cortar al terminar el más corto (Sincronización)
            '-movflags +faststart'
        ])
        .save(outputPath)
        .on('end', () => {
            console.log("✅ Mezcla terminada.");
            res.download(outputPath, 'story.mp4', (err) => {
                try {
                    fs.unlinkSync(videoPath);
                    fs.unlinkSync(audioPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                } catch(e) {}
            });
        })
        .on('error', (err) => {
            console.error("❌ Error Mezcla:", err);
            res.status(500).send('Error mezclando');
            try { fs.unlinkSync(videoPath); fs.unlinkSync(audioPath); } catch(e){}
        });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server V68 en puerto ${PORT}`));

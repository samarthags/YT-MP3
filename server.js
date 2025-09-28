const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve frontend
app.use(express.static('public'));

// Download & convert route
app.get('/download', async (req, res) => {
    const url = req.query.url;

    if (!url || !ytdl.validateURL(url)) {
        return res.status(400).send('Invalid YouTube URL');
    }

    try {
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        const outputPath = path.resolve(__dirname, `${title}.mp3`);

        ffmpeg(ytdl(url, { quality: 'highestaudio' }))
            .audioBitrate(128)
            .save(outputPath)
            .on('end', () => {
                res.download(outputPath, `${title}.mp3`, () => fs.unlinkSync(outputPath));
            })
            .on('error', err => {
                console.error(err);
                res.status(500).send('Error converting video');
            });

    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
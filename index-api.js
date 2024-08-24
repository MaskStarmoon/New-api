const axios = require('axios');
const express = require('express');
const app = express();

app.use(express.json());

const apiKey = 'AIzaSyDzl0gJet-jwNiWrAtK-sg6a6mEHsYYPXU';

const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

app.get('/gemini', async (req, res) => {
    // Ambil parameter text dari URL query string
    const text = req.query.text;

    // Validasi jika parameter text kosong atau tidak ada
    if (!text) {
        return res.status(400).json({
            error: "Prompt query parameter is required"
        });
    }

    try {
        // Data yang akan dikirim ke API
        const data = {
            contents: [
                {
                    parts: [
                        {
                            text: text
                        }
                    ]
                }
            ]
        };

        // Lakukan permintaan POST ke API Gemini
        const response = await axios.post(apiEndpoint, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // author API
        const author = "I M Range";

        // Ambil jawaban dari respons API
        const result = response.data.candidates[0].content.parts[0].text;

        // Kirimkan objek dengan jawaban
        res.json({ author, result });
    } catch (error) {
        // Tangani kesalahan
        console.error('Error fetching data from API:', error);
        res.status(500).json({ error: 'Error fetching data from API' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});

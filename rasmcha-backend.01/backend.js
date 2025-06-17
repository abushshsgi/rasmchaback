const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS sozlamalari: Frontend ilovasidan kelgan so'rovlarga ruxsat berish
app.use(cors({
    origin: 'http://localhost:3000', // Frontend ilovangiz manzilini shu yerga yozing
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON va URL-kodlangan so'rovlarni qabul qilish
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Yuklangan rasmlarni saqlash papkasi mavjudligini tekshirish
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// Multer orqali fayl yuklashni sozlash
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Fayl nomini noyob qilish
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Rasmlar haqidagi ma'lumotlarni vaqtinchalik saqlash (hozircha database yo'q)
let imagesData = [];

// Rasm yuklash endpointi
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Rasm yuklanmadi.' });
    }

    const { type, title, description } = req.body; // Frontenddan keladigan rasm turi (regular/banner)
    const backendBaseUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    const imageUrl = `${backendBaseUrl}/uploads/${req.file.filename}`;
    
    const newImage = {
        id: imagesData.length + 1,
        url: imageUrl,
        name: req.file.filename,
        type: type || 'regular', // Agar tur berilmasa, 'regular' bo'ladi
        title: title || '',
        description: description || ''
    };
    imagesData.push(newImage);

    res.status(200).json({ message: 'Rasm muvaffaqiyatli yuklandi!', image: newImage });
});

// Yuklangan rasmlarni static qilib ko'rsatish endpointi
app.use('/images', express.static(UPLOAD_DIR));

// Barcha rasmlar haqidagi ma'lumotlarni olish endpointi
app.get('/api/images', (req, res) => {
    res.status(200).json(imagesData);
});

// Serverni ishga tushirish
app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} manzilida ishga tushdi`);
}); 
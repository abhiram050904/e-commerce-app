const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const productRoutes=require('./routes/productRoutes')
const cookieParser=require('cookie-parser')
const cors=require('cors')
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: '*' // This sets Access-Control-Allow-Origin: *
  }));

app.use('/api/auth', authRoutes);
app.use('/api/products',productRoutes)

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB connected successfully');
})
.catch((error) => {
    console.error('MongoDB connection failed:', error.message);
});


console.log("redis url is",process.env.REDIS_CONNECT)

const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

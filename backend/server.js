require('dotenv').config();
const express = require('express');
const mongoose =require('mongoose');
const cors = require('cors');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// define
app.get('/', (req, res)=>{
    res.json({message: 'Employee Management API is running...'});
});

// port
const PORT = process.env.PORT || 5000;

// connect db
mongoose.connect(process.env.MONGODB_URI)
    .then(()=>{
        console.log('MONGODB connected');
        app.listen(PORT, ()=>{
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err =>{
        console.error('MONGODB connection error:', err);
    })

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require('./routes/authRoutes');
const registrationRoutes = require('./routes/registrationRoutes')
const path = require('path');
const onboardingRoutes = require('./routes/onboardingRoutes');
const hrRoutes = require('./routes/hrRoutes')
const documentRoutes = require("./routes/documentRoutes");
const personalInfoRoutes = require("./routes/personalInfoRoutes");


dotenv.config();


const app = express();
connectDB();

app.use(cors()); 
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: "Server is running!" });
});

app.use('/api/auth', authRoutes);
app.use('/api/registration', registrationRoutes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/documents', documentRoutes);
// manage to hrRoutes
app.use('/api/hr', hrRoutes);



// error middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')

require("dotenv").config();

//importa validadores de autentificacion
const { verifyToken } = require('./middlewares/auth.middlewares');

//rutas
const authRoutes = require('./routes/auth.route');
const usersRoutes = require('./routes/users.route');
const writingsRoutes = require('./routes/writings.route');
const filesAssetsRoutes = require('./routes/AssetFile.ruote');
const departamentRoutes = require('./routes/departament.route');

// Conexión a la base de datos
mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'error al conectar a la base de datos'));


// Middleware
app.use(cookieParser())
app.use(bodyParser.json());
app.use('/api/v1/', authRoutes)
app.use('/api/v1/', usersRoutes)
app.use('/api/v1/document/', writingsRoutes)
app.use('/api/v1/assets/file/', filesAssetsRoutes)
app.use('/api/v1/departament/', departamentRoutes)


// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor en funcionamiento en el puerto ${PORT}`);
});

//Utilizacion de libreria back-end express 
const express = require('express');

// importa controlador de autentificacion 
const authController = require('../controllers/auth.controller');

//importa validadores de autentificacion
const { validateEmail, validatePassword, verifyAccessToken } = require('../middlewares/auth.middlewares');

const {extractTokens} = require('../middlewares/extractToken.middlewares');

const { requireRefreshToken } = require('../middlewares/refreshToken.middleware');

//utilizacion de funcion para enrutamiento
const router = express.Router();

//enruta la informacion hacia el controlador de autenticacion
router.post('/login',  authController.login);
router.post('/register', verifyAccessToken, validateEmail, validatePassword, authController.register);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', extractTokens, authController.logout);


//exporta el modulo para que pueda ser utilizada en otro archivo
module.exports = router;




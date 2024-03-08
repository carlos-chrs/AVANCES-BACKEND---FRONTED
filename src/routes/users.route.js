//Utilizacion de libreria back-end express 
const express = require('express');

// importa modelo y controlador de usuarios 
const UserModel = require('../models/users.model');
const userController = require('../controllers/user.controller');

const {  verifyAccessToken } = require('../middlewares/auth.middlewares');


//utilizacion de funcion para enrutamiento
const router = express.Router();

//enruta la informacion hacia el controlador de usuarios
router.get('/head-department', verifyAccessToken, userController.getAllDepartmentHead); // ruta para obtener todos los jefe de departamento
router.get('/users', verifyAccessToken, userController.getAll);
router.get('/users/search', verifyAccessToken, userController.getByName);
router.get('/users/:userId', verifyAccessToken, userController.getById);
router.patch('/users/:userId', verifyAccessToken, userController.patchById);
router.delete('/users/:userId', verifyAccessToken, userController.deleteById);

//exporta el modulo para que pueda ser utilizada en otro archivo
module.exports = router;



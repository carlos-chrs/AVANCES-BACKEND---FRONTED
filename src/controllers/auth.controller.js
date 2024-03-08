const UserModel = require('../models/users.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passwordUtils = require('../utils/pass.util');
const { response } = require('express');


exports.login = (req, res) => {
    UserModel.findOne({ email: req.body.email }).then(async (user) => {
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        let salt = user.password.split('$')[0];
        let hash = crypto.createHmac('sha512', salt)
            .update(req.body.password)
            .digest("base64");

        if (user.password !== salt + "$" + hash) {
            
            if(user?.resetPassword){

                const decryptResult = decryptPassword(user?.resetPassword, req.body.password);

                if(!decryptResult){
                    return res.status(401).send({ message: 'error al descifrar la contraseña' }); 
                }

                if (user.password === decryptResult.salt + "$" + decryptResult.hash) {

                    if(user.resetPasswordExpires > Date.now()) {
                        user.resetPassword = undefined;
                        user.resetPasswordExpires = undefined;
                        return res.status(401).send({ message: 'La contraseña temporal ya expiro' }); 
                    }
                
                    // Genera token de restablecimiento de contraseña
                     const resetPasswordToken = generateResetPasswordToken();

                     if(!resetPasswordToken){
                        return res.status(401).send({ message: 'Ocurrio un error al generar el token para el cambio de contraseña' }); 
                     }

                    user.resetPassword = undefined;
                    user.resetPasswordExpires = undefined;
                
                    // Almacenar el token y su fecha de expiración en el usuario
                    user.resetPasswordToken = resetPasswordToken;
                    user.resetPasswordTokenExpires = new Date(Date.now() + 60 * 10 * 1000); 
                    await user.save(); 

                res.json({ 
                    resetPasswordToken: resetPasswordToken,
                    message: 'Tienes solo 10 minutos para resetear la contraseña',
                    message2: 'Al terminar los 10 minutos tendras que perdirle al administrador que resetee nuevamente la contraseña'
                });

            }  

            return res.status(401).send({ message: 'Invalid password' });

            }

            return res.status(401).send({ message: 'Invalid password' });
        }
        user.loggedOut = false;
        await user.save();
        
        let token = jwt.sign({ id: user._id, permissionLevel: user.permissionLevel }, process.env.SECRET_KEY, 
            { expiresIn:  process.env.AUTH_ACCESS_TOKEN_EXPIRY } );
        
        let refreshToken = generateRefreshToken(user, res);
        user.refreshToken = refreshToken;

        const savedUser = await user.save();

        res.cookie("refreshToken", savedUser.refreshToken, {
            httpOnly: true,
            secure: !(process.env.MODO === "dev"),
            expires: new Date(Date.now() + 60 * 60 *24 * 1000),
        });

        res.json({ accessToken: token });

    }).catch((error) => {
        console.error(error);
        res.status(500).send({ message: 'Error during login', error: error });
    });
};


exports.register = (req, res) => {
    if (req.user?.permissionLevel !== 1) {
        return res.status(403).send({ message: 'Permiso insuficiente para registrar usuarios' });
    }
    // Verifica si el usuario ya existe por su dirección de correo electrónico
    UserModel.findOne({ email: req.body.email }).then((existingUser) => {
        if (existingUser) {
            return res.status(400).send({ message: 'El email esta en uso' });
        }

        // Crea un nuevo usuario
        let salt = crypto.randomBytes(16).toString('base64');
        let hash = crypto.createHmac('sha512', salt)
            .update(req.body.password)
            .digest('base64');

        const newUser = new UserModel({
            name: req.body.name,
            email: req.body.email,
            password: `${salt}$${hash}`,
            permissionLevel: req.body.permissionLevel, //  nivel de permiso 
        });

        // Guardar el nuevo usuario en la base de datos
        newUser.save().then((savedUser) => {
            savedUser.save().then(() => {
                res.status(201).send({ message: 'Usuario registrado exitosamente' });
            }).catch((error) => {
                res.status(500).send({ message: 'Error al crear al usuario', error: error });
            });
        }).catch((error) => {
            res.status(500).send({ message: 'Error al crear al usuario', error: error });
        });
    });
};


exports.refreshToken = (req, res) => {

    let refreshToken = req.cookies?.refreshToken;

    if (!refreshToken)  return res.status(401).send({ message: 'Necesitas autentificarte' });

    // Buscar al usuario por refreshToken
    UserModel.findOne({ refreshToken: refreshToken, loggedOut: false }).then((user) => {
        if (!user) {
            return res.status(401).send({ message: 'Token de actualización no válido' });
        }

        // Generar nuevo token de acceso
        let token = jwt.sign({ id: user._id, permissionLevel: user.permissionLevel }, 
            process.env.SECRET_KEY, { expiresIn: process.env.AUTH_ACCESS_TOKEN_EXPIRY});    

        res.status(200).send({ accessToken: token });

    }).catch((error) => {
        res.status(500).send({ message: 'Error al actualizar el token de acceso', error: error });
    });
};

exports.logout = (req, res) => {
    const userId = req.user.id;
    const accessToken = req.accessToken;
    const refreshToken = req.refreshToken;
    UserModel.findByIdAndUpdate(userId, {  loggedOut: true,
    }, { new: true }).then((user)  => {
        if (accessToken && refreshToken) {
            user.revokedTokens.push({ accessToken, refreshToken });
            user.save();
        }
        res.clearCookie("refreshToken");
        res.json({ message: 'Cierre de sesión exitoso' });
    }).catch((error) => {
        res.status(500).send({ message: 'Error al actualizar el estado de la sesión', error: error });
    });
};


exports.resetPassword = async (req, res) => {
    try{
        const { userId } = req.params.id; 

        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).send({ message: 'Usuario no encontrado' });
        }

        // Genera una contraseña temporal de 1 hora
        const temporaryPassword = generateTemporaryPassword();
        const temporaryPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); 

        if (!temporaryPassword) {
            return res.status(404).send({ message: 'Ocurrio un error al generar la contraseña temporal' });
        }

        // Encripta la contraseña temporal y almacenarla en el usuario
        user.resetPassword = encryptPassword(temporaryPassword);

        if (!user.resetPassword) {
            return res.status(404).send({ message: 'ocurrio un error al encriptar la contraseña' });
        }

        user.resetPasswordExpires = temporaryPasswordExpiry;
        await user.save();

        // posible envio a correo electronico si es necesario (pendiente)

        res.status(200).send({ message: 'Contraseña temporal generada exitosamente' });

    }catch(error) {
        res.status(500).send({ message: 'Error interno del servidor' });
    }
};


exports.changeForgottenPassword = async (req, res) => {
    try{
        const { resetPasswordToken, newPassword } = req.body;

        const user = await UserModel.findOne({
            resetPasswordToken: resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            return res.status(400).send({ error: 'Token inválido o expirado' });
        }

        // Restablecer la contraseña
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).send({ message: 'Contraseña restablecida exitosamente' });
    }catch(error){
        res.status(500).send({ error: 'Error interno del servidor' });
    }
};

function generateTemporaryPassword() {
    try{
        let length = 12
        // Defirne los caracteres permitidos en la contraseña temporal
        const allowedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        // se crea un buffer aleatorio
        const randomBytes = crypto.randomBytes(length);
    
        // Se crea una contraseña temporal basada en el buffer aleatorio y los caracteres permitidos
        const temporaryPassword = Array.from(randomBytes)
            .map(byte => allowedChars[byte % allowedChars.length])
            .join('');
    
        return temporaryPassword

    }catch(error){

        return null;

    }
}


function generateRefreshToken(user) {
      return  jwt.sign({ id: user._id, permissionLevel: user.permissionLevel },
         process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.AUTH_REFRESH_TOKEN_EXPIRY });
}
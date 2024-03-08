
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const validateEmail = [
    body('email').notEmpty().isEmail().trim(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: "Formato de email invalido" });
        }
        next();
    }
];

const validatePassword = [
    body('password').notEmpty().isLength({ min: 8 }).matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: "Formato de contraseña invalido" });
        }
        next();
    }
];

function verifyAccessToken(req, res, next) {
    let accessToken = req.headers?.authorization;

    if (!accessToken || !accessToken.startsWith("Bearer ")) {
        return res.status(401).send({ message: 'Necesitas autentificarte' });
    }
    accessToken = accessToken.split(' ')[1];
    const { id } = jwt.verify(accessToken, process.env.SECRET_KEY); 
    const userId = id;

    UserModel.findOne({ _id: userId, revokedTokens: accessToken }).then((user) => {
        if (!user) {
            jwt.verify(accessToken, process.env.SECRET_KEY, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Token de acceso inválido' });
                }
                
                req.user = decoded;
                next();
            });
        } else {
            return res.status(401).send({ message: 'Token de acceso revocado' });
        }
    }).catch((error) => {
        res.status(500).send({ message: 'Error al verificar el token de acceso', error: error });
    });
}

module.exports = { validateEmail, validatePassword, verifyAccessToken };
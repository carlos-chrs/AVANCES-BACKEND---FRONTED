const UserModel = require('../models/users.model');
const jwt = require('jsonwebtoken');

exports.getAll = (req, res) => {
    try{
        if (req.user.permissionLevel !== 1) {
            return res.status(403).send({ message: 'Permiso insuficiente para obtener usuarios' });
        }
        UserModel.find().select('-password').then((result) => {
            result = result.map((user) => {
                if(!result){
                    return res.status(404).json({ error: 'No existen registros de usuarios' });
                }
                user = user.toJSON();
                delete user._id;
                delete user.__v;
                return user;
            });
            res.status(200).send(result);
        });
        }catch(error){
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
};

exports.getAllDepartmentHead = (req, res) => {
    try {
        if (req.user.permissionLevel !== 1) {
            return res.status(403).send({ message: 'Permiso insuficiente para obtener a los jefes de departamentos' });
        }
        // Filtra usuarios por nivel de permiso (en este caso, 2 para jefes de departamento)
        UserModel.find({ permissionLevel: 2 })
            .select('-password')
            .populate('departament', 'name') // Incluye el nombre del departamento asociado
            .then((result) => {
                if (!result || result.length === 0) {
                    return res.status(404).json({ error: 'No existen registros de jefes de departamento' });
                }

                result = result.map((user) => {
                    user = user.toJSON();
                    delete user._id;
                    delete user.__v;
                    return user;
                });

                res.status(200).send(result);
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.getById = (req, res) => {
    try{
        UserModel.findById(req.params.userId).select('-password').then((result) => {
        if(!result){
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        result = result.toJSON();
        delete result._id;
        delete result.__v;
        res.status(200).send(result);
    });
        }catch(error){
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
};

exports.patchById = async (req, res) => {
    try {
        const updatedUser = await UserModel.findByIdAndUpdate(req.params.userId, req.body, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const sanitizedUser = updatedUser.toJSON();
        delete sanitizedUser._id;
        delete sanitizedUser.__v;
        res.status(200).json(sanitizedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'El email ingresado debe ser distinto al existente' });
    }
};

exports.deleteById = async (req, res) => {
    try {
        if (req.user.permissionLevel !== 1) {
            return res.status(403).send({ message: 'Permiso insuficiente para eliminar al usuario' });
        }
        const deletedUser = await UserModel.findByIdAndDelete(req.params.userId);
        if (!deletedUser) {
            return res.status(404).json({ error: 'El usuario que trata de eliminar no existe' });
        }
        res.status(200).json({ message: 'El usuario ha sido eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.getByName = async (req, res) => {
    try {

        if (req.user.permissionLevel !== 1) {
            return res.status(403).send({ message: 'Permiso insuficiente buscar usuarios' });
        }

        const { nombre } = req.query;

        if (!nombre) {
            return res.status(400).json({ error: 'El parámetro de consulta "nombre" es necesario para la búsqueda' });
        }

        const result = await UserModel.find({ name: { $regex: new RegExp(nombre, 'i') } })
            .select('-password')
            .populate('departament', 'name');

        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'No se encontraron usuarios con el nombre proporcionado' });
        }

        const users = result.map((user) => {
            user = user.toJSON();
            delete user._id;
            delete user.__v;
            return user;
        });

        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};


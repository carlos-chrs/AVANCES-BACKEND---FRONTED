
//importa el modelo del escrito (oficio)
const Written = require('../models/writings.model');

// Importa la función de validación para datos del archivo
const { writtenDataMiddleware, writtenUpdateDataMiddleware } = require('../middlewares/validator.middlewares.js');
const { validationResult } = require('express-validator');

// Importa el servicio que genera el pdf
const { generarPDF } = require('../services/generatePDF.service.js');

// Importa el modelo de archivos
const { FileModel } = require('../models/AssetFiles.model.js');

// Importa el modelo y servicio de los departamentos
const { DepartamentModel } = require('../models/departments.model.js');
const { getDepartamentSeries } = require('../services/departament.service.js');

//const DOMPurify = require('dompurify');

//Importa biblioteca para normalizar caracteres
const  NFC  = require('unorm');

const guardarArchivo = async (req, res) => {
    try {
        const nuevoArchivo = new Written(req.body);

        //nuevoArchivo.contexto =  DOMPurify.sanitize(nuevoArchivo.contexto);

        // Aplica los middleware de validación
        await Promise.all(writtenDataMiddleware.map(validation => validation.run(req)));

        nuevoArchivo.fecha = Date.now();

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          const errorMessages = errors.array().map(error => error.msg);
          return res.status(400).json({ errors: errorMessages[0] });
        }
       
            // Almacena los datos en MongoDB
            await nuevoArchivo.save();


            // Genera el número de oficio de manera serial
            const nombreDepartamento = nuevoArchivo.departamentoEmisor;
            const archivosTotales = await Written.countDocuments({ departamentoEmisor: nombreDepartamento });
            const serieOficio = await getDepartamentSeries(nombreDepartamento, archivosTotales);

            // Actualiza el número de oficio en la base de datos
            await Written.findByIdAndUpdate(nuevoArchivo._id, { serieOficio });

            // Genera el PDF
            const { pdfBuffer } = await generarPDF(nuevoArchivo, serieOficio);

            // Envia el PDF como respuesta
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=archivo.pdf');
            res.send(pdfBuffer);
       
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error interno del servidor' });
    }
};

const previewWritten = async (req, res) => {
    try {
            const nuevoArchivo = new Written(req.body);

            nuevoArchivo.fecha = Date.now();
            // Genera el número de oficio de manera serial
            const nombreDepartamento = nuevoArchivo.departamentoEmisor;
            const archivosTotales = await Written.countDocuments({ departamentoEmisor: nombreDepartamento }) +1 || 1;
            const serieOficio = await getDepartamentSeries(nombreDepartamento, archivosTotales);
        
            // Genera el PDF
            const { pdfBuffer } = await generarPDF(nuevoArchivo, serieOficio);

            // Envia el PDF como respuesta
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=archivo.pdf');
            res.send(pdfBuffer);
       
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error interno del servidor' });
    }
};

const allGetFiles = async (req, res) => {
    try {
        const writings = await Written.find().select('-__v');

        res.status(200).json(writings);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error interno del servidor' });
    }
};

const getFilesByIdUser = async (req, res) => {
    try {

        const idUsuario = req.params.id;

        const writings = await Written.find({idUsuario}).select('-idUsuario -departamento -__v');

        res.status(200).json(writings);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error interno del servidor' });
    }
};


const getFileById = async (req, res) => {
    try {
        const _id = req.params.id;
        const written = await Written.findById({_id});
        
        if (!written)       
        res.status(404).send({error: 'Archivo no encontrado' }); 
        else res.status(200).json(written);

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error interno del servidor' });
    }
};

const updateFileById = async (req, res) => {
    try {
        // Aplica middleware de validación para la actualización
        await Promise.all(writtenUpdateDataMiddleware.map(validation => validation.run(req)));

        // Si hay errores de validación, envia una respuesta 400 Bad Request (error de petición) 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({ errors: errorMessages });
        }
        const writtenUpdate = await Written.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if(!writtenUpdate) {
            res.status(404).send({error: 'No se encontro el archivo a actualizar'});
        }else{

        // Generar el nuevo PDF
       /*  const { pdfBuffer } = await generarPDF(writtenUpdate, writtenUpdate.numeroOficio);

        res.status(200).json({ archivo: writtenUpdate, file: pdfBuffer }); */

        res.status(200).json(writtenUpdate);

        }

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error interno del servidor' });
    }
};


const deleteFileById = async (req, res) => {
    try {

        const writtenDelete = await Written.findByIdAndDelete(req.params.id);
        if(!writtenDelete){
            res.status(404).send({ error: 'No se encontro el archivo a eliminar' });
        }
        res.status(200).json({ message: 'Archivo eliminado exitosamente' });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error interno del servidor' });
    }
};

const searchDataFiles = async (req, res) => {
    try {
        const { numeroOficio, fechaInicio, fechaFin, emisor, asunto } = req.query;

        const query = {};

        if (numeroOficio) {
            query.serieOficio = numeroOficio;
        }

        if (fechaInicio && fechaFin) {
            query.fecha = { $gte: new Date(fechaInicio), $lte: new Date(fechaFin) };
        }

        if (emisor) {
            query.emisor = { $regex: new RegExp(emisor, 'i') };
        }

        if (asunto) {
            
            query.asunto = { $regex: new RegExp(asunto, 'i') };
        }

        const writings = await Written.find(query).select('-__v');

        if(!writings){
         return   res.status(404).send({ error: 'No se encontro ningun archivo con los parametros ingresados'});

        }

        res.status(200).json(writings);

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error interno del servidor' });
    }
};

module.exports = { guardarArchivo, previewWritten, allGetFiles, getFilesByIdUser, getFileById, updateFileById, deleteFileById, searchDataFiles};
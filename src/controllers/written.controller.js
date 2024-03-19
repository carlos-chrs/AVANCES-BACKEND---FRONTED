
//importa el modelo del escrito (oficio)
const Written = require('../models/writings.model');

// Importa la función de validación para datos del archivo
//const { writtenDataMiddleware, writtenUpdateDataMiddleware } = require('../middlewares/writen.middlewares.js');
const { validationResult } = require('express-validator');

// Importa el servicio que genera el pdf
const { generarPDF } = require('../utils/generatePDF.util.js');

// Importa el modelo de archivos
//const { settingPageModel } = require('../models/AssetFiles.model.js');

// Importa el modelo y servicio de los departamentos
//const { DepartmentModel } = require('../models/departments.model.js');
const { getDepartmentSeries } = require('../services/department.service.js');
const { paginationOptions, paginationArray } = require('../utils/paginationOptions.util.js');

//const DOMPurify = require('dompurify');


// const DOMPurify = require('dompurify');
// const { JSDOM } = require('jsdom');
// const cheerio = require('cheerio');

const guardarArchivo = async (req, res) => {
    try {
        const nuevoArchivo = new Written(req.body);

        // const window = new JSDOM('').window;
        // const purify = DOMPurify(window);

        //  nuevoArchivo.campos = nuevoArchivo.campos.map(campo => {
        //     return {       
        //         text:  purify.sanitize(campo.text),
        //         font: campo.font,
        //         alignment: campo.alignment,
        //         bold: campo.bold,
        //         };
        // });
 
        //nuevoArchivo.contexto =  purify.sanitize(nuevoArchivo.puesto.text);

        // Aplica los middleware de validación
        //await Promise.all(writtenDataMiddleware.map(validation => validation.run(req)));

        nuevoArchivo.fecha = Date.now();

        // const errors = validationResult(req);
        // if (!errors.isEmpty()) {
        //   const errorMessages = errors.array().map(error => error.msg);
        //   return res.status(400).json({ errors: errorMessages[0] });
        // }

       /*  const $ = cheerio.load(nuevoArchivo.contexto);
        const documentoJson = { serieOficio: $('span').text().replace('serie Oficio: ', '') }; */
    

            // Genera el número de oficio de manera serial
            const nombreDepartamento = nuevoArchivo.departamentoEmisor;
            const archivosTotales = await Written.countDocuments({ departamentoEmisor: nombreDepartamento });
            const serieOficio = await getDepartmentSeries(nombreDepartamento, archivosTotales) +1 || 1;
            nuevoArchivo.serieOficio = serieOficio

            // Actualiza el número de oficio en la base de datos
           // await Written.findByIdAndUpdate(nuevoArchivo._id, { serieOficio });

            // Genera el PDF
            const { pdfBuffer } = await generarPDF(nuevoArchivo, serieOficio);

            // Almacena los datos en MongoDB
            await nuevoArchivo.save();

            // Envia el PDF como respuesta
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=archivo.pdf');
            res.send(pdfBuffer); 
            //res.send(documentoJson);
       
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
            const serieOficio = await getDepartmentSeries(nombreDepartamento, archivosTotales);
        
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

        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10;

        const select = '-__v';

        const options = paginationOptions(page, limit, select, null);

        if(!options){
        return res.status(421).send({error: 'Ocurrio un error al generar las opciones de paginación'});    
        }

        const writings = await Written.paginate({}, options);
        //const writings = await Written.find().select('-__v');

        res.status(200).json(writings);

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error interno del servidor' });
    }
};

const getFilesByIdUser = async (req, res) => {
    try {

        const idUsuario = req.params.id;
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10;

        const select = '-idUsuario -departamento -__v';

        const options = paginationOptions(page, limit, select);

        if(!options){
        return res.status(421).send({error: 'Ocurrio un error al generar las opciones de paginación'});    
        }

        const writings = await Written.paginate({ idUsuario }, options);

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
     
        if (typeof req.body.campos === 'object' && !Array.isArray(req.body.campos)) {

            const fieldUpdate = req.body.campos;
            const written = await Written.findById(req.params.id);
            const index = written.campos.findIndex(item => item.id === fieldUpdate._id);

            if (index === -1) {
                return res.status(404).json({ error: 'No se encontró el campo a actualizar' });
            }
    
            written.campos[index] = fieldUpdate;

            const writtenUpdate = await written.save();

            return res.status(200).json({ mensaje: 'Campo actualizado exitosamente', writtenUpdate});
        }

        const camposKeys = Object.keys(req.body.campos);
        if (camposKeys.length < 7) {
    
            const written = await Written.findById(req.params.id);


            if (!written) {
                return res.status(404).json({ error: 'No se encontró el archivo a actualizar' });
            }
      
            camposKeys.forEach(key => {
                const filedUpdate = req.body.campos[key];
                const index = written.campos.findIndex(item => item.id === filedUpdate._id);
                if (index !== -1) {
                    written.campos[index] = filedUpdate;
                }
            });
         
            const writtenUpdate = await written.save();
            return res.status(200).json({ mensaje: 'Campos actualizados exitosamente', archivoActualizado: writtenUpdate });
        }

 
        const  writtenUpdate = await Written.findByIdAndUpdate(req.params.id, req.body, { new: true });
     

        if(!writtenUpdate) {
            return res.status(404).send({error: 'No se encontro el archivo a actualizar'});
        }

        // Genera el nuevo PDF
       /*  const { pdfBuffer } = await generarPDF(writtenUpdate, writtenUpdate.numeroOficio);

        res.status(200).json({ archivo: writtenUpdate, file: pdfBuffer }); */

        return res.status(200).json(writtenUpdate);

    } catch (error) {
        //console.error(error);
       return res.status(500).send({ error: 'Error interno del servidor' });
    }
};


const deleteFileById = async (req, res) => {
    try {

        const writtenDelete = await Written.findByIdAndDelete(req.params.id);
        if(!writtenDelete){
            return res.status(404).send({ error: 'No se encontro el archivo a eliminar' });
        }
        res.status(200).json({ message: 'Archivo eliminado exitosamente' });

    } catch (error) {
        res.status(500).send({ error: 'Error interno del servidor' });
    }
};

const searchDataFiles = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10;

        const { numeroOficio, fechaInicio, fechaFin, emisor, asunto } = req.query;


        const query = {};

        if (numeroOficio) {
            query.serieOficio = numeroOficio;
        }

        if (fechaInicio && fechaFin) {

            if(fechaInicio === fechaFin){
                query.fecha = { $gte: new Date(fechaInicio) };
            }
            else
            query.fecha = { $gte: new Date(fechaInicio), $lte: new Date(fechaFin) };
        }

        const additionalFieldSearch = { $or: [] };

        if (emisor) {
            additionalFieldSearch.$or.push({
                'campos.name': 'emisor',
                'campos.text': { $regex: new RegExp(emisor, 'i') }
            });
        }

        if (asunto) {
            additionalFieldSearch.$or.push({
                'campos.name': 'asunto',
                'campos.text': { $regex: new RegExp(asunto, 'i') }
            });
        }

        if (additionalFieldSearch.$or.length > 0) {
            query.$and = [additionalFieldSearch];
        }     

        // let writings = await Written.find(query).select('-__v');

        // if(!writings){
        //  return   res.status(404).send({ error: 'No se encontro ningun archivo con los parametros ingresados'});

        // }

        // writings = await paginationArray(1, 10, writings);

        const select = '-__v';

        const options = await paginationOptions(page, limit, select, null);

        if(!options){
        return res.status(421).send({error: 'Ocurrio un error al generar las opciones de paginación'});    
        }

        const writings = await Written.paginate( query , options);

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
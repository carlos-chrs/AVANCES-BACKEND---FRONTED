const { FileModel } = require('../models/AssetFiles.model'); 
const { FontFileModel } = require('../models/fonts.model');
const fs = require('fs');
const path = require('path');
const assetMiddleware = require('../middlewares/assetFile.middleware');;

// la función saveUtilsData manejar la subida de archivos
const saveAssetFont = async (req, res) => {
    try {
         // Middleware para filtrar archivos de fuente y manejo de errores de multer
         assetMiddleware.fontUpload(req, res, async (err) => {

        // Almacena los archivos en MongoDB
        const fonts = req.files.map(font => ({
            name: font.filename,
            url: font.path
        }));

        await FontFileModel.create(fonts);
        res.status(200).send({menssage: 'Archivo guardado exitosamente'});
    });

    } catch (error) {
        console.error(error);
        res.status(500).send({error: 'Error interno del servidor'});
    }
};

const saveAssetImage = async (req, res) => {
    try {
        
            // Obtiene el tipo de archivo y el nombre del archivo
            const type = req.body.tipo;
            const nameFile = req.files[0].filename;

            // Busca la imagen existente en la base de datos
            const existingFile = await FileModel.findOne({ type: type });


            if(!existingFile){
                const newAsset = {
                    type: type,
                    name: nameFile,
                    url:path.join(__dirname, `../assets/${type}/${nameFile}`),
            };
            const image = new FileModel(newAsset);
            await image.save();

            return res.status(200).send({ message: 'Archivo guardado exitosamente' });
            }

        // Si hay una imagen existente, la elimína de la carpeta "assets"
        if (existingFile) {
            const existingPath = path.join(__dirname, `../assets/${type}/${existingFile.name}`);
            await new Promise((resolve, reject) => {
                fs.unlink(existingPath, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        // Guarda la nueva imagen en la base de datos
        const newAsset = {
            type: type,
            name: nameFile,
            url: `/assets/${type}/${nameFile}`,
        };

        await FileModel.findOneAndUpdate({ type: type }, newAsset, { upsert: true, new: true });

        res.status(200).send({ message: 'Archivo guardado exitosamente' });
    
    } catch (error) {
        console.error(error);
        res.status(500).send({error: 'Error interno del servidor'});
    }
};

const getAllFonts = async (req, res) => {
    try {

        const fonts = await FontFileModel.find();

        if(!fonts) {
            res.status(404).json({error: 'No se encontraron fuentes'});
        }
        res.status(200).json(fonts);
    } catch (error) {
        console.error(error);
        res.status(500).send({error: 'Error interno del servidor'});
    }
};

const SaveSelectFonts = async (req, res) => {
    try{
        const type = 'fonts';
        const nameFile = req.body.nombre;
    
        // Busca si existe una fuente seleccionada en la base de datos
        const existingFont = await FileModel.findOne({ type: type });
    

    // Si existe una fuente seleccionada en la base de datos
    if (existingFont) {
        const assetFont = {
            type: type,
            name: nameFile,
            url: `/assets/${type}/${nameFile}`,
        };
        
        await FileModel.findOneAndUpdate({ type: type }, assetFont, { upsert: true, new: true });
        
       return res.status(200).send({ message: 'Archivo guardado exitosamente' });
        
    }
    
    // si no existe una fuente seleccionada en la base de datos
    const newAsset = {
        type: type,
        name: nameFile,
        url: `/assets/${type}/${nameFile}`,
    };
    
    const asset = new FileModel(newAsset);
    await asset.save(newAsset);
    
    res.status(200).send({ message: 'Archivo guardado exitosamente' });
    }catch(error) {
        res.status(500).send({ error: 'Error interno del servidor' });
    }

    };

    const deleteFontById = async (req, res) => {

        try{
            const fontId = req.params.id;
        
            const font = await FontFileModel.findById(fontId);

            // Obtener el nombre de la fuente
            const nameFont = font.name;
    
            // Eliminar los archivos relacionados con el nombre de la fuente
            const deleteFontConfig = await FileModel.deleteMany({ name: nameFont });
    
            // Eliminar la fuente por ID
            const deleteFont = await FontFileModel.findByIdAndDelete(fontId);

            if (!deleteFont) {
                return res.status(404).send({ error: 'No se encontró la fuente con el nombre proporcionado' });
            }

            res.status(200).json( { message: 'Archivo eliminado exitosamente' } );

        }catch(error){
            console.error(error);
            res.status(500).send({ error: 'Error interno del servidor' });
        }    
                
    };



module.exports = { saveAssetFont, saveAssetImage, getAllFonts, SaveSelectFonts, deleteFontById };



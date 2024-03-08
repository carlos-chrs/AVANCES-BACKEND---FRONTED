const { FileModel } = require('../models/AssetFiles.model');
const path = require('path');

const getUrlFont = async (tipoFuente, estilo) => {

    try {
        // Busca la fuente en la base de datos por tipo
        const fuente = await FileModel.findOne({ type: tipoFuente });

        // Si se encuentra la fuente, devuelve su URL
        if (fuente) {
            return fuente.url;
        }

        // Si no se encuentra la fuente, devuelve la ruta predeterminada
        return path.join(__dirname, '../assets/fonts/Montserrat-Regular.ttf');
    } catch (error) {
        // Maneja cualquier error de la base de datos o de la operación
        console.error('Error al obtener la fuente:', error);
        return null; // O podrías lanzar el error si prefieres
    }
};

const getUrlImagen = async (typeFile) => {

    try {
        // Busca la imagen en la base de datos por tipo
        const image = await FileModel.findOne({ type: typeFile });

        // Si se encuentra la imagen, devuelve su URL
        if (image) {

            return path.join(__dirname, `${image.url}`)
        }
        if(typeFile === 'letterheads'){
             // Si no se encuentra la imagen letterheads, devuelve la ruta predeterminada
        return path.join(__dirname, '../assets/letterheads/MP-1.PNG');
        }

        // Si no se encuentra la imagen logo, devuelve la ruta predeterminada
        return path.join(__dirname, '../assets/logos/ME-1.PNG');

    } catch (error) {
        // Maneja cualquier error de la base de datos o de la operación
        console.error('Error al obtener la fuente:', error);
        return null; // O podrías lanzar el error si prefieres
    }
};

module.exports = { getUrlFont, getUrlImagen };
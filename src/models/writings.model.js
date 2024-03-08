const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const writtenSchema = new Schema({
    lugar: String,
    fecha: Date,
    serieOficio: String,
    asunto: String,
    destinatario: String,
    puesto: String,
    contexto: String,
    emisor: String,
    ocupacionEmisor: String,
    departamentoEmisor: String,
    rubricas: String,
    ccp: String,
    departamento: { type: Schema.Types.ObjectId, ref: 'Departament' },
    idUsuario: { type: Schema.Types.ObjectId, ref: 'User' }
});

const Written = mongoose.model('writings', writtenSchema);

module.exports = Written;
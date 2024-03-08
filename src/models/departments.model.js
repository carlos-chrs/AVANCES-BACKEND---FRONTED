const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const departamentSchema = new Schema({
    name: {type: String, required: true},
    series: {type: String, required: true}
});

const DepartamentModel = mongoose.model('Departament', departamentSchema);

module.exports =  {DepartamentModel};
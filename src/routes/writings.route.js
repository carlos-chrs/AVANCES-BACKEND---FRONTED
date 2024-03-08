const express = require('express');
const writtenController = require('../controllers/written.controller');

const router = express.Router();

router.post('/preview-document', writtenController.previewWritten);
router.post('/save-document', writtenController.guardarArchivo);
router.get('/get', writtenController.allGetFiles);
router.get('/get/search', writtenController.searchDataFiles);
router.get('/user/get/:id', writtenController.getFilesByIdUser)
router.get('/get/:id', writtenController.getFileById);
router.patch('/update/:id', writtenController.updateFileById);
router.delete('/delete/:id', writtenController.deleteFileById);

module.exports = router;


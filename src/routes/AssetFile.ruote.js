const express = require('express');
const fileController = require('../controllers/AssetFile.controller');
const assetMiddleware = require('../middlewares/assetFile.middleware');

const router = express.Router();

router.post(
    '/save-asset-data',
    assetMiddleware.fontUpload.array('archivos'),
    assetMiddleware.multerErrorHandler,
    fileController.saveAssetFont
);

router.post(
    '/save-asset-image',
    assetMiddleware.imageUpload.array('archivos'),
    assetMiddleware.multerErrorHandler,
    fileController.saveAssetImage
);

module.exports = router;


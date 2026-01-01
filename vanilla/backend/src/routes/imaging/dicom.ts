import { Router } from 'express';
import { DicomService } from '../../services/DicomService';
import { authMiddleware } from '../../middleware/auth';
import multer from 'multer';

const router = Router();
const dicomService = new DicomService();

// Configure multer for DICOM file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept DICOM files
    if (file.mimetype === 'application/dicom' || file.originalname.endsWith('.dcm')) {
      cb(null, true);
    } else {
      cb(new Error('Only DICOM files are allowed'));
    }
  },
});

// DICOMweb WADO-RS Routes (Retrieve)
/**
 * GET /api/imaging/dicom/studies/:studyInstanceUID
 * Retrieve entire study (WADO-RS)
 */
router.get(
  '/studies/:studyInstanceUID',
  authMiddleware,
  async (req, res) => {
    try {
      const study = await dicomService.retrieveStudy(req.params.studyInstanceUID);
      res.setHeader('Content-Type', 'multipart/related; type="application/dicom"');
      res.send(study);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve study',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/dicom/studies/:studyInstanceUID/series/:seriesInstanceUID
 * Retrieve entire series (WADO-RS)
 */
router.get(
  '/studies/:studyInstanceUID/series/:seriesInstanceUID',
  authMiddleware,
  async (req, res) => {
    try {
      const series = await dicomService.retrieveSeries(
        req.params.studyInstanceUID,
        req.params.seriesInstanceUID
      );
      res.setHeader('Content-Type', 'multipart/related; type="application/dicom"');
      res.send(series);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve series',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/dicom/studies/:studyInstanceUID/series/:seriesInstanceUID/instances/:sopInstanceUID
 * Retrieve specific instance (WADO-RS)
 */
router.get(
  '/studies/:studyInstanceUID/series/:seriesInstanceUID/instances/:sopInstanceUID',
  authMiddleware,
  async (req, res) => {
    try {
      const instance = await dicomService.retrieveInstance(
        req.params.studyInstanceUID,
        req.params.seriesInstanceUID,
        req.params.sopInstanceUID
      );
      res.setHeader('Content-Type', 'application/dicom');
      res.send(instance);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve instance',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/dicom/studies/:studyInstanceUID/series/:seriesInstanceUID/instances/:sopInstanceUID/frames/:frameNumber
 * Retrieve specific frame (WADO-RS)
 */
router.get(
  '/studies/:studyInstanceUID/series/:seriesInstanceUID/instances/:sopInstanceUID/frames/:frameNumber',
  authMiddleware,
  async (req, res) => {
    try {
      const frame = await dicomService.retrieveFrame(
        req.params.studyInstanceUID,
        req.params.seriesInstanceUID,
        req.params.sopInstanceUID,
        parseInt(req.params.frameNumber)
      );
      res.setHeader('Content-Type', 'image/jpeg'); // or image/png based on transfer syntax
      res.send(frame);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve frame',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/dicom/studies/:studyInstanceUID/thumbnail
 * Get study thumbnail
 */
router.get(
  '/studies/:studyInstanceUID/thumbnail',
  authMiddleware,
  async (req, res) => {
    try {
      const thumbnail = await dicomService.generateStudyThumbnail(
        req.params.studyInstanceUID,
        parseInt(req.query.size as string) || 200
      );
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(thumbnail);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate thumbnail',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// DICOMweb STOW-RS Routes (Store)
/**
 * POST /api/imaging/dicom/studies
 * Store DICOM instances (STOW-RS)
 */
router.post(
  '/studies',
  authMiddleware,
  upload.array('files', 1000), // Max 1000 files per upload
  async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No DICOM files provided' });
      }

      const result = await dicomService.storeInstances(files, req.user);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to store instances',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/dicom/studies/:studyInstanceUID
 * Store instances to specific study (STOW-RS)
 */
router.post(
  '/studies/:studyInstanceUID',
  authMiddleware,
  upload.array('files', 1000),
  async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No DICOM files provided' });
      }

      const result = await dicomService.storeInstancesToStudy(
        req.params.studyInstanceUID,
        files,
        req.user
      );
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to store instances',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// DICOM Metadata Routes
/**
 * GET /api/imaging/dicom/studies/:studyInstanceUID/metadata
 * Get study metadata in DICOM JSON format
 */
router.get(
  '/studies/:studyInstanceUID/metadata',
  authMiddleware,
  async (req, res) => {
    try {
      const metadata = await dicomService.getStudyMetadata(req.params.studyInstanceUID);
      res.json(metadata);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve metadata',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/dicom/studies/:studyInstanceUID/series/:seriesInstanceUID/metadata
 * Get series metadata in DICOM JSON format
 */
router.get(
  '/studies/:studyInstanceUID/series/:seriesInstanceUID/metadata',
  authMiddleware,
  async (req, res) => {
    try {
      const metadata = await dicomService.getSeriesMetadata(
        req.params.studyInstanceUID,
        req.params.seriesInstanceUID
      );
      res.json(metadata);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve metadata',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/dicom/studies/:studyInstanceUID/series/:seriesInstanceUID/instances/:sopInstanceUID/metadata
 * Get instance metadata in DICOM JSON format
 */
router.get(
  '/studies/:studyInstanceUID/series/:seriesInstanceUID/instances/:sopInstanceUID/metadata',
  authMiddleware,
  async (req, res) => {
    try {
      const metadata = await dicomService.getInstanceMetadata(
        req.params.studyInstanceUID,
        req.params.seriesInstanceUID,
        req.params.sopInstanceUID
      );
      res.json(metadata);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve metadata',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// DICOM Rendering Routes
/**
 * GET /api/imaging/dicom/studies/:studyInstanceUID/series/:seriesInstanceUID/instances/:sopInstanceUID/rendered
 * Get rendered image (JPEG/PNG)
 */
router.get(
  '/studies/:studyInstanceUID/series/:seriesInstanceUID/instances/:sopInstanceUID/rendered',
  authMiddleware,
  async (req, res) => {
    try {
      const windowCenter = req.query.windowCenter ? parseInt(req.query.windowCenter as string) : undefined;
      const windowWidth = req.query.windowWidth ? parseInt(req.query.windowWidth as string) : undefined;
      const quality = req.query.quality ? parseInt(req.query.quality as string) : 90;

      const rendered = await dicomService.renderInstance(
        req.params.studyInstanceUID,
        req.params.seriesInstanceUID,
        req.params.sopInstanceUID,
        { windowCenter, windowWidth, quality }
      );

      res.setHeader('Content-Type', 'image/jpeg');
      res.send(rendered);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to render instance',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/dicom/verify
 * Verify DICOM file integrity
 */
router.post(
  '/verify',
  authMiddleware,
  upload.single('file'),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const verification = await dicomService.verifyDicomFile(file.buffer);
      res.json(verification);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to verify DICOM file',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/dicom/anonymize
 * Anonymize DICOM file
 */
router.post(
  '/anonymize',
  authMiddleware,
  upload.single('file'),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const anonymized = await dicomService.anonymizeDicom(file.buffer, req.body.options);
      res.setHeader('Content-Type', 'application/dicom');
      res.setHeader('Content-Disposition', 'attachment; filename="anonymized.dcm"');
      res.send(anonymized);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to anonymize DICOM file',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;

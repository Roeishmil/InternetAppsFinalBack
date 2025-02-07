// fileRouter.ts
import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

const fileRouter = express.Router();

// Add a custom interface to extend Request
interface CustomRequest extends Request {
    swagger?: {
        params?: {
            [key: string]: {
                value: unknown;
            };
        };
    };
}
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB


// Storage configuration
const storage = multer.diskStorage({
    destination: async function (req: CustomRequest, file: Express.Multer.File, cb) {
        try {
            const imgId = ( req.query.imgId || req.body.imgId ) as string;
            if (!imgId) {
                return cb(new Error("imgId is required"), "");
            }

            const userDir = path.join("storage", imgId);
            
            // Create user directory if it doesn't exist
            await fs.mkdir(userDir, { recursive: true });
            cb(null, userDir);
        } catch (error) {
            cb(error as Error, "");
        }
    },
    filename: function (req: Request, file: Express.Multer.File, cb) {
        // Sanitize filename
        const originalName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, '');
        const timestamp = Date.now();
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${originalName}-${timestamp}${ext}`);
    }
});

// Multer configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    }
});

/**
 * @swagger
 * /storage:
 *   post:
 *     summary: Upload a file
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: imgId
 *         required: true
 *         schema:
 *           type: string
 *         description: Img ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
fileRouter.post('/', async (req: Request, res: Response) => {
    try {
        upload.single('file')(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ 
                    error: "File upload error", 
                    details: err.message 
                });
            } else if (err) {
                return res.status(400).json({ 
                    error: err.message 
                });
            }

            if (!req.file) {
                return res.status(400).json({ 
                    error: "No file uploaded" 
                });
            }

            const userId = req.body.userId;
            const fileUrl = `/storage/${userId}/${req.file.filename}`;
            
            res.status(200).json({
                message: "File uploaded successfully",
                filename: req.file.filename,
                url: fileUrl,
                size: req.file.size,
                mimetype: req.file.mimetype
            });
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ 
            error: "Internal server error" 
        });
    }
});

/**
 * @swagger
 * /storage/{imgId}/{filename}:
 *   get:
 *     summary: Download a file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: imgId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       404:
 *         description: File not found
 */
fileRouter.get('/:imgId/:filename', async (req: Request, res: Response) => {
    try {
        const filePath = path.join(
            "storage", 
            req.params.imgId, 
            req.params.filename
        );

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ 
                error: "File not found" 
            });
        }

        // Send file
        res.download(filePath);
    } catch (error) {
        console.error('File download error:', error);
        res.status(500).json({ 
            error: "Internal server error" 
        });
    }
});

/**
 * @swagger
 * /storage/{imgId}:
 *   get:
 *     summary: List all files by id
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: imgId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of files
 */
fileRouter.get('/:imgId', async (req: Request, res: Response) => {
    try {
        const userDir = path.join("storage", req.params.imgId);

        // Create directory if it doesn't exist
        await fs.mkdir(userDir, { recursive: true });

        // Read directory
        const files = await fs.readdir(userDir);
        
        // Get file stats
        const fileDetails = await Promise.all(
            files.map(async (filename) => {
                const filePath = path.join(userDir, filename);
                const stats = await fs.stat(filePath);
                return {
                    filename,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    url: `/storage/${req.params.imgId}/${filename}`
                };
            })
        );

        res.json({ files: fileDetails });
    } catch (error) {
        console.error('File listing error:', error);
        res.status(500).json({ 
            error: "Internal server error" 
        });
    }
});

export default fileRouter;
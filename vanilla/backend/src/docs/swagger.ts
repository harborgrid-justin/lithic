/**
 * Swagger/OpenAPI Configuration
 *
 * API documentation using Swagger UI
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

/**
 * Swagger Options
 */
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lithic Healthcare Platform API',
      version: '1.0.0',
      description: 'Enterprise healthcare platform API documentation',
      contact: {
        name: 'Lithic Health',
        email: 'api@lithichealth.com',
        url: 'https://lithichealth.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://staging-api.lithichealth.com',
        description: 'Staging server',
      },
      {
        url: 'https://api.lithichealth.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
            details: {
              type: 'object',
            },
          },
        },
        Patient: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            mrn: {
              type: 'string',
              description: 'Medical Record Number',
            },
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other', 'unknown'],
            },
            email: {
              type: 'string',
              format: 'email',
            },
            phone: {
              type: 'string',
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
              },
            },
          },
          required: ['mrn', 'firstName', 'lastName', 'dateOfBirth', 'gender'],
        },
        Appointment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            patientId: {
              type: 'string',
              format: 'uuid',
            },
            providerId: {
              type: 'string',
              format: 'uuid',
            },
            startTime: {
              type: 'string',
              format: 'date-time',
            },
            endTime: {
              type: 'string',
              format: 'date-time',
            },
            type: {
              type: 'string',
              enum: ['in-person', 'telemedicine', 'phone'],
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'confirmed', 'cancelled', 'completed', 'no-show'],
            },
            reason: {
              type: 'string',
            },
          },
          required: ['patientId', 'providerId', 'startTime', 'endTime', 'type'],
        },
        Prescription: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            patientId: {
              type: 'string',
              format: 'uuid',
            },
            providerId: {
              type: 'string',
              format: 'uuid',
            },
            medicationName: {
              type: 'string',
            },
            medicationCode: {
              type: 'string',
              description: 'NDC or RxNorm code',
            },
            dosage: {
              type: 'string',
            },
            quantity: {
              type: 'number',
            },
            refills: {
              type: 'number',
            },
            status: {
              type: 'string',
              enum: ['draft', 'active', 'cancelled', 'completed'],
            },
          },
        },
        Observation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            patientId: {
              type: 'string',
              format: 'uuid',
            },
            code: {
              type: 'string',
              description: 'LOINC code',
            },
            display: {
              type: 'string',
            },
            value: {
              oneOf: [
                { type: 'number' },
                { type: 'string' },
              ],
            },
            unit: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled'],
            },
            effectiveDate: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'Patients',
        description: 'Patient management endpoints',
      },
      {
        name: 'Appointments',
        description: 'Appointment scheduling endpoints',
      },
      {
        name: 'Prescriptions',
        description: 'E-prescribing endpoints',
      },
      {
        name: 'Clinical',
        description: 'Clinical documentation endpoints',
      },
      {
        name: 'Laboratory',
        description: 'Laboratory order and results endpoints',
      },
      {
        name: 'Imaging',
        description: 'Imaging order and PACS endpoints',
      },
      {
        name: 'Billing',
        description: 'Billing and claims endpoints',
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting endpoints',
      },
      {
        name: 'FHIR',
        description: 'FHIR R4 interoperability endpoints',
      },
      {
        name: 'HL7',
        description: 'HL7v2 integration endpoints',
      },
      {
        name: 'Webhooks',
        description: 'Webhook management endpoints',
      },
    ],
  },
  apis: [
    './src/routes/**/*.ts',
    './src/routes/**/*.js',
  ],
};

/**
 * Generate Swagger specification
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Setup Swagger documentation
 */
export function setupSwagger(app: Application): void {
  // Serve Swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Lithic Healthcare API Documentation',
      customfavIcon: '/favicon.ico',
    })
  );

  // Serve OpenAPI spec as JSON
  app.get('/api/docs/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Swagger documentation available at /api/docs');
}

/**
 * Example endpoint documentation
 *
 * @swagger
 * /api/v1/patients:
 *   get:
 *     summary: Get all patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of patients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/v1/patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

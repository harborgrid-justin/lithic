/**
 * FHIR R4 Routes
 *
 * RESTful endpoints for FHIR R4 resource operations
 */

import { Router, Request, Response, NextFunction } from 'express';
import { defaultFHIRClient, FHIRError, FHIRResourceType } from '../../integrations/fhir/client';
import {
  PatientTransformer,
  ObservationTransformer,
  ConditionTransformer,
  MedicationRequestTransformer,
} from '../../integrations/fhir/transformers';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * Error handler for FHIR operations
 */
const handleFHIRError = (error: any, res: Response) => {
  if (error instanceof FHIRError) {
    logger.error('FHIR Operation Error', {
      statusCode: error.statusCode,
      message: error.message,
      operationOutcome: error.operationOutcome,
    });

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      operationOutcome: error.operationOutcome,
    });
  }

  logger.error('Unexpected FHIR Error', { error: error.message });
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};

/**
 * GET /fhir/metadata
 * Get FHIR server capability statement
 */
router.get('/metadata', async (req: Request, res: Response) => {
  try {
    const capabilities = await defaultFHIRClient.capabilities();

    res.json({
      success: true,
      data: capabilities,
    });
  } catch (error) {
    handleFHIRError(error, res);
  }
});

/**
 * GET /fhir/:resourceType/:id
 * Read a specific FHIR resource by ID
 */
router.get('/:resourceType/:id', async (req: Request, res: Response) => {
  try {
    const { resourceType, id } = req.params;

    const resource = await defaultFHIRClient.read(
      resourceType as FHIRResourceType,
      id
    );

    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    handleFHIRError(error, res);
  }
});

/**
 * GET /fhir/:resourceType
 * Search FHIR resources
 */
router.get('/:resourceType', async (req: Request, res: Response) => {
  try {
    const { resourceType } = req.params;
    const searchParams = req.query as any;

    const bundle = await defaultFHIRClient.search(
      resourceType as FHIRResourceType,
      searchParams
    );

    res.json({
      success: true,
      data: bundle,
      total: bundle.total,
    });
  } catch (error) {
    handleFHIRError(error, res);
  }
});

/**
 * POST /fhir/:resourceType
 * Create a new FHIR resource
 */
router.post('/:resourceType', async (req: Request, res: Response) => {
  try {
    const { resourceType } = req.params;
    const resource = req.body;

    const created = await defaultFHIRClient.create(
      resourceType as FHIRResourceType,
      resource
    );

    res.status(201).json({
      success: true,
      data: created,
    });
  } catch (error) {
    handleFHIRError(error, res);
  }
});

/**
 * PUT /fhir/:resourceType/:id
 * Update a FHIR resource
 */
router.put('/:resourceType/:id', async (req: Request, res: Response) => {
  try {
    const { resourceType, id } = req.params;
    const resource = req.body;

    const updated = await defaultFHIRClient.update(
      resourceType as FHIRResourceType,
      id,
      resource
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    handleFHIRError(error, res);
  }
});

/**
 * PATCH /fhir/:resourceType/:id
 * Patch a FHIR resource
 */
router.patch('/:resourceType/:id', async (req: Request, res: Response) => {
  try {
    const { resourceType, id } = req.params;
    const patch = req.body;

    const patched = await defaultFHIRClient.patch(
      resourceType as FHIRResourceType,
      id,
      patch
    );

    res.json({
      success: true,
      data: patched,
    });
  } catch (error) {
    handleFHIRError(error, res);
  }
});

/**
 * DELETE /fhir/:resourceType/:id
 * Delete a FHIR resource
 */
router.delete('/:resourceType/:id', async (req: Request, res: Response) => {
  try {
    const { resourceType, id } = req.params;

    await defaultFHIRClient.delete(resourceType as FHIRResourceType, id);

    res.status(204).send();
  } catch (error) {
    handleFHIRError(error, res);
  }
});

/**
 * GET /fhir/:resourceType/:id/_history
 * Get resource version history
 */
router.get('/:resourceType/:id/_history', async (req: Request, res: Response) => {
  try {
    const { resourceType, id } = req.params;

    const history = await defaultFHIRClient.history(
      resourceType as FHIRResourceType,
      id
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    handleFHIRError(error, res);
  }
});

/**
 * POST /fhir
 * Execute transaction/batch bundle
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const bundle = req.body;

    const result = await defaultFHIRClient.transaction(bundle);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleFHIRError(error, res);
  }
});

/**
 * POST /fhir/:resourceType/$validate
 * Validate a FHIR resource
 */
router.post('/:resourceType/$validate', async (req: Request, res: Response) => {
  try {
    const { resourceType } = req.params;
    const resource = req.body;
    const { profile } = req.query;

    const outcome = await defaultFHIRClient.validate(
      resourceType as FHIRResourceType,
      resource,
      profile as string | undefined
    );

    res.json({
      success: true,
      data: outcome,
    });
  } catch (error) {
    handleFHIRError(error, res);
  }
});

/**
 * POST /fhir/:resourceType/:id/$operation
 * Execute a named operation on a resource
 */
router.post(
  '/:resourceType/:id/$:operation',
  async (req: Request, res: Response) => {
    try {
      const { resourceType, id, operation } = req.params;
      const parameters = req.body;

      const result = await defaultFHIRClient.operation(
        operation,
        resourceType as FHIRResourceType,
        id,
        parameters
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleFHIRError(error, res);
    }
  }
);

/**
 * POST /fhir/$graphql
 * Execute GraphQL query
 */
router.post('/$graphql', async (req: Request, res: Response) => {
  try {
    const { query, variables } = req.body;

    const result = await defaultFHIRClient.graphql(query, variables);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleFHIRError(error, res);
  }
});

/**
 * GET /fhir/patients/:id/everything
 * Get patient $everything operation
 */
router.get('/patients/:id/everything', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await defaultFHIRClient.operation(
      'everything',
      'Patient',
      id
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleFHIRError(error, res);
  }
});

/**
 * POST /fhir/patients/:id/match
 * Patient matching operation
 */
router.post('/patients/:id/match', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parameters = req.body;

    const result = await defaultFHIRClient.operation(
      'match',
      'Patient',
      id,
      parameters
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleFHIRError(error, res);
  }
});

/**
 * GET /fhir/sync/patients
 * Sync patients from FHIR server
 */
router.get('/sync/patients', async (req: Request, res: Response) => {
  try {
    const { _count = 100, _since } = req.query;

    const searchParams: any = {
      _count,
    };

    if (_since) {
      searchParams._lastUpdated = `gt${_since}`;
    }

    const bundle = await defaultFHIRClient.search('Patient', searchParams);

    const internalPatients = bundle.entry?.map((entry) =>
      PatientTransformer.fromFHIR(entry.resource)
    );

    res.json({
      success: true,
      data: internalPatients,
      total: bundle.total,
    });
  } catch (error) {
    handleFHIRError(error, res);
  }
});

/**
 * POST /fhir/sync/observations
 * Sync observations to FHIR server
 */
router.post('/sync/observations', async (req: Request, res: Response) => {
  try {
    const observations = req.body.observations;

    const fhirObservations = observations.map((obs: any) =>
      ObservationTransformer.toFHIR(obs)
    );

    // Create batch bundle
    const bundle = {
      resourceType: 'Bundle',
      type: 'batch',
      entry: fhirObservations.map((obs: any) => ({
        request: {
          method: 'POST',
          url: 'Observation',
        },
        resource: obs,
      })),
    };

    const result = await defaultFHIRClient.transaction(bundle);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleFHIRError(error, res);
  }
});

export default router;

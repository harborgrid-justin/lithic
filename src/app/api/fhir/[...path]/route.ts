/**
 * FHIR R4 API Endpoint
 * Implements FHIR REST API with full CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fhirClient } from '@/lib/fhir/client';
import {
  patientToFHIR,
  patientFromFHIR,
  observationToFHIR,
  encounterToFHIR,
  medicationToFHIR,
} from '@/lib/fhir/transformers';
import { createSearchBundle, createTransactionBundle } from '@/lib/fhir/resources';
import { db } from '@/lib/db';

// Authentication middleware (placeholder - implement with your auth system)
async function authenticateRequest(request: NextRequest): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  // Implement your JWT validation here
  return { userId: 'user-id' };
}

/**
 * GET /api/fhir/[resourceType]/[id]
 * GET /api/fhir/[resourceType]?param=value
 * GET /api/fhir/metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [resourceType, id] = params.path;

    // Handle capability statement
    if (resourceType === 'metadata') {
      const capabilities = await fhirClient.capabilities();
      return NextResponse.json(capabilities);
    }

    // Handle read by ID
    if (id) {
      const resource = await readResource(resourceType, id);
      if (!resource) {
        return NextResponse.json(
          {
            resourceType: 'OperationOutcome',
            issue: [
              {
                severity: 'error',
                code: 'not-found',
                diagnostics: `${resourceType}/${id} not found`,
              },
            ],
          },
          { status: 404 }
        );
      }
      return NextResponse.json(resource);
    }

    // Handle search
    const searchParams: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      searchParams[key] = value;
    });

    const results = await searchResources(resourceType, searchParams);
    return NextResponse.json(results);
  } catch (error) {
    console.error('FHIR GET error:', error);
    return NextResponse.json(
      {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'exception',
            diagnostics: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fhir/[resourceType]
 * POST /api/fhir/ (for bundles)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const [resourceType] = params.path;

    // Handle bundle/transaction
    if (!resourceType || body.resourceType === 'Bundle') {
      const result = await processBundle(body);
      return NextResponse.json(result);
    }

    // Validate resource type matches
    if (body.resourceType !== resourceType) {
      return NextResponse.json(
        {
          resourceType: 'OperationOutcome',
          issue: [
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: 'Resource type mismatch',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Create resource
    const created = await createResource(resourceType, body);
    return NextResponse.json(created, {
      status: 201,
      headers: {
        Location: `${request.nextUrl.origin}/api/fhir/${resourceType}/${created.id}`,
      },
    });
  } catch (error) {
    console.error('FHIR POST error:', error);
    return NextResponse.json(
      {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'exception',
            diagnostics: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/fhir/[resourceType]/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const [resourceType, id] = params.path;

    if (!id) {
      return NextResponse.json(
        {
          resourceType: 'OperationOutcome',
          issue: [
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: 'Resource ID required for update',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Validate resource type and ID match
    if (body.resourceType !== resourceType || (body.id && body.id !== id)) {
      return NextResponse.json(
        {
          resourceType: 'OperationOutcome',
          issue: [
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: 'Resource type or ID mismatch',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Update resource
    const updated = await updateResource(resourceType, id, body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('FHIR PUT error:', error);
    return NextResponse.json(
      {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'exception',
            diagnostics: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fhir/[resourceType]/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [resourceType, id] = params.path;

    if (!id) {
      return NextResponse.json(
        {
          resourceType: 'OperationOutcome',
          issue: [
            {
              severity: 'error',
              code: 'invalid',
              diagnostics: 'Resource ID required for delete',
            },
          ],
        },
        { status: 400 }
      );
    }

    await deleteResource(resourceType, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('FHIR DELETE error:', error);
    return NextResponse.json(
      {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'exception',
            diagnostics: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * Read a resource by type and ID
 */
async function readResource(resourceType: string, id: string): Promise<any> {
  switch (resourceType) {
    case 'Patient': {
      const patient = await db.patient.findUnique({ where: { id } });
      return patient ? patientToFHIR(patient as any) : null;
    }
    case 'Observation': {
      const observation = await db.observation.findUnique({ where: { id } });
      return observation ? observationToFHIR(observation as any) : null;
    }
    case 'Encounter': {
      const encounter = await db.encounter.findUnique({ where: { id } });
      return encounter ? encounterToFHIR(encounter as any) : null;
    }
    case 'MedicationRequest': {
      const medication = await db.prescription.findUnique({ where: { id } });
      return medication ? medicationToFHIR(medication as any) : null;
    }
    default:
      throw new Error(`Resource type ${resourceType} not supported`);
  }
}

/**
 * Search resources
 */
async function searchResources(
  resourceType: string,
  params: Record<string, string>
): Promise<any> {
  const { _count = '50', _offset = '0', ...searchParams } = params;
  const limit = parseInt(_count);
  const offset = parseInt(_offset);

  switch (resourceType) {
    case 'Patient': {
      const where: any = {};

      if (searchParams.identifier) {
        where.mrn = searchParams.identifier;
      }
      if (searchParams.family) {
        where.lastName = { contains: searchParams.family, mode: 'insensitive' };
      }
      if (searchParams.given) {
        where.firstName = { contains: searchParams.given, mode: 'insensitive' };
      }
      if (searchParams.birthdate) {
        where.dateOfBirth = new Date(searchParams.birthdate);
      }
      if (searchParams.gender) {
        where.gender = searchParams.gender.toUpperCase();
      }

      const [patients, total] = await Promise.all([
        db.patient.findMany({
          where,
          take: limit,
          skip: offset,
        }),
        db.patient.count({ where }),
      ]);

      const resources = patients.map(p => patientToFHIR(p as any));
      return createSearchBundle(resources, total);
    }

    case 'Observation': {
      const where: any = {};

      if (searchParams.patient) {
        where.patientId = searchParams.patient.replace('Patient/', '');
      }
      if (searchParams.code) {
        where.code = searchParams.code;
      }
      if (searchParams.date) {
        where.effectiveDate = new Date(searchParams.date);
      }
      if (searchParams.category) {
        where.category = searchParams.category;
      }

      const [observations, total] = await Promise.all([
        db.observation.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { effectiveDate: 'desc' },
        }),
        db.observation.count({ where }),
      ]);

      const resources = observations.map(o => observationToFHIR(o as any));
      return createSearchBundle(resources, total);
    }

    case 'Encounter': {
      const where: any = {};

      if (searchParams.patient) {
        where.patientId = searchParams.patient.replace('Patient/', '');
      }
      if (searchParams.date) {
        where.startDate = new Date(searchParams.date);
      }
      if (searchParams.status) {
        where.status = searchParams.status.toUpperCase();
      }

      const [encounters, total] = await Promise.all([
        db.encounter.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { startDate: 'desc' },
        }),
        db.encounter.count({ where }),
      ]);

      const resources = encounters.map(e => encounterToFHIR(e as any));
      return createSearchBundle(resources, total);
    }

    default:
      throw new Error(`Resource type ${resourceType} not supported for search`);
  }
}

/**
 * Create a new resource
 */
async function createResource(resourceType: string, resource: any): Promise<any> {
  switch (resourceType) {
    case 'Patient': {
      const patientData = patientFromFHIR(resource);
      const created = await db.patient.create({
        data: patientData as any,
      });
      return patientToFHIR(created as any);
    }
    default:
      throw new Error(`Resource type ${resourceType} not supported for create`);
  }
}

/**
 * Update a resource
 */
async function updateResource(
  resourceType: string,
  id: string,
  resource: any
): Promise<any> {
  switch (resourceType) {
    case 'Patient': {
      const patientData = patientFromFHIR(resource);
      const updated = await db.patient.update({
        where: { id },
        data: patientData as any,
      });
      return patientToFHIR(updated as any);
    }
    default:
      throw new Error(`Resource type ${resourceType} not supported for update`);
  }
}

/**
 * Delete a resource
 */
async function deleteResource(resourceType: string, id: string): Promise<void> {
  switch (resourceType) {
    case 'Patient':
      await db.patient.delete({ where: { id } });
      break;
    default:
      throw new Error(`Resource type ${resourceType} not supported for delete`);
  }
}

/**
 * Process a FHIR bundle (batch/transaction)
 */
async function processBundle(bundle: any): Promise<any> {
  if (bundle.type !== 'transaction' && bundle.type !== 'batch') {
    throw new Error('Only transaction and batch bundles are supported');
  }

  const responseEntries = await Promise.all(
    bundle.entry?.map(async (entry: any) => {
      try {
        const { method, url } = entry.request;
        const resource = entry.resource;

        let response: any = { status: '200 OK' };

        if (method === 'POST') {
          const resourceType = url;
          const created = await createResource(resourceType, resource);
          response = {
            status: '201 Created',
            location: `${resourceType}/${created.id}`,
          };
        } else if (method === 'PUT') {
          const [resourceType, id] = url.split('/');
          await updateResource(resourceType, id, resource);
          response = { status: '200 OK' };
        } else if (method === 'DELETE') {
          const [resourceType, id] = url.split('/');
          await deleteResource(resourceType, id);
          response = { status: '204 No Content' };
        } else if (method === 'GET') {
          const [resourceType, id] = url.split('/');
          const result = id
            ? await readResource(resourceType, id)
            : await searchResources(resourceType, {});
          response = {
            status: '200 OK',
            resource: result,
          };
        }

        return {
          response,
        };
      } catch (error) {
        return {
          response: {
            status: '500 Internal Server Error',
            outcome: {
              resourceType: 'OperationOutcome',
              issue: [
                {
                  severity: 'error',
                  code: 'exception',
                  diagnostics: error instanceof Error ? error.message : 'Unknown error',
                },
              ],
            },
          },
        };
      }
    }) || []
  );

  return {
    resourceType: 'Bundle',
    type: `${bundle.type}-response`,
    entry: responseEntries,
  };
}

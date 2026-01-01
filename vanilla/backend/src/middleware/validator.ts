import { Request, Response, NextFunction } from 'express';
import Joi, { ObjectSchema } from 'joi';
import { sendValidationError } from '../utils/response';

export interface ValidationSchema {
  body?: ObjectSchema;
  query?: ObjectSchema;
  params?: ObjectSchema;
}

/**
 * Validate request using Joi schema
 */
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: any[] = [];

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(
          ...error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            type: 'body',
          }))
        );
      }
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(
          ...error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            type: 'query',
          }))
        );
      }
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.push(
          ...error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            type: 'params',
          }))
        );
      }
    }

    if (errors.length > 0) {
      sendValidationError(res, errors);
      return;
    }

    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  // ID parameter
  id: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  }),

  // Email
  email: Joi.string().email().required(),

  // Password (HIPAA compliant)
  password: Joi.string()
    .min(12)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .required()
    .messages({
      'string.min': 'Password must be at least 12 characters long',
      'string.pattern.base':
        'Password must contain uppercase, lowercase, number, and special character',
    }),

  // Phone number
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid phone number format',
    }),

  // Date
  date: Joi.date().iso().optional(),

  // Date range
  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  }),
};

// User schemas
export const userSchemas = {
  register: {
    body: Joi.object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      firstName: Joi.string().min(1).max(100).required(),
      lastName: Joi.string().min(1).max(100).required(),
      phone: commonSchemas.phone,
      role: Joi.string().valid('admin', 'doctor', 'nurse', 'patient', 'staff').default('patient'),
      organizationId: Joi.string().uuid().optional(),
    }),
  },

  login: {
    body: Joi.object({
      email: commonSchemas.email,
      password: Joi.string().required(),
      rememberMe: Joi.boolean().default(false),
    }),
  },

  updateProfile: {
    body: Joi.object({
      firstName: Joi.string().min(1).max(100).optional(),
      lastName: Joi.string().min(1).max(100).optional(),
      phone: commonSchemas.phone,
      dateOfBirth: commonSchemas.date,
      address: Joi.object({
        street: Joi.string().max(200).optional(),
        city: Joi.string().max(100).optional(),
        state: Joi.string().max(100).optional(),
        zipCode: Joi.string().max(20).optional(),
        country: Joi.string().max(100).optional(),
      }).optional(),
    }),
  },

  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: commonSchemas.password,
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'Passwords do not match',
      }),
    }),
  },
};

// Patient schemas
export const patientSchemas = {
  create: {
    body: Joi.object({
      firstName: Joi.string().min(1).max(100).required(),
      lastName: Joi.string().min(1).max(100).required(),
      email: commonSchemas.email,
      phone: commonSchemas.phone,
      dateOfBirth: Joi.date().iso().required(),
      gender: Joi.string().valid('male', 'female', 'other').required(),
      ssn: Joi.string().optional(), // Encrypted
      address: Joi.object({
        street: Joi.string().max(200).required(),
        city: Joi.string().max(100).required(),
        state: Joi.string().max(100).required(),
        zipCode: Joi.string().max(20).required(),
        country: Joi.string().max(100).default('USA'),
      }).required(),
      emergencyContact: Joi.object({
        name: Joi.string().max(200).required(),
        relationship: Joi.string().max(100).required(),
        phone: commonSchemas.phone.required(),
      }).optional(),
      insuranceInfo: Joi.object({
        provider: Joi.string().max(200).required(),
        policyNumber: Joi.string().max(100).required(),
        groupNumber: Joi.string().max(100).optional(),
      }).optional(),
    }),
  },

  update: {
    params: commonSchemas.id,
    body: Joi.object({
      firstName: Joi.string().min(1).max(100).optional(),
      lastName: Joi.string().min(1).max(100).optional(),
      phone: commonSchemas.phone,
      address: Joi.object({
        street: Joi.string().max(200).optional(),
        city: Joi.string().max(100).optional(),
        state: Joi.string().max(100).optional(),
        zipCode: Joi.string().max(20).optional(),
        country: Joi.string().max(100).optional(),
      }).optional(),
      emergencyContact: Joi.object({
        name: Joi.string().max(200).optional(),
        relationship: Joi.string().max(100).optional(),
        phone: commonSchemas.phone,
      }).optional(),
    }),
  },

  search: {
    query: Joi.object({
      q: Joi.string().optional(),
      dateOfBirth: commonSchemas.date,
      ...commonSchemas.pagination.extract(['page', 'pageSize', 'sortBy', 'sortOrder']),
    }),
  },
};

// Appointment schemas
export const appointmentSchemas = {
  create: {
    body: Joi.object({
      patientId: Joi.string().uuid().required(),
      doctorId: Joi.string().uuid().required(),
      appointmentDate: Joi.date().iso().min('now').required(),
      duration: Joi.number().integer().min(15).max(240).default(30),
      type: Joi.string()
        .valid('consultation', 'follow-up', 'procedure', 'emergency')
        .required(),
      reason: Joi.string().min(1).max(500).required(),
      notes: Joi.string().max(2000).optional(),
    }),
  },

  update: {
    params: commonSchemas.id,
    body: Joi.object({
      appointmentDate: Joi.date().iso().min('now').optional(),
      duration: Joi.number().integer().min(15).max(240).optional(),
      status: Joi.string()
        .valid('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show')
        .optional(),
      notes: Joi.string().max(2000).optional(),
    }),
  },

  search: {
    query: Joi.object({
      patientId: Joi.string().uuid().optional(),
      doctorId: Joi.string().uuid().optional(),
      status: Joi.string().optional(),
      ...commonSchemas.dateRange.extract(['startDate', 'endDate']),
      ...commonSchemas.pagination.extract(['page', 'pageSize']),
    }).or('patientId', 'doctorId', 'startDate'),
  },
};

const validators = {
  validate,
  commonSchemas,
  userSchemas,
  patientSchemas,
  appointmentSchemas,
};

export default validators;

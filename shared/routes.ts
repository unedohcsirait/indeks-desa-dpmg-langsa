import { z } from 'zod';
import { insertVillageSchema, insertAssessmentSchema, insertUserSchema, villages, assessments, insertDimensionSchema, insertSubDimensionSchema, insertIndicatorSchema, insertIndicatorAspectSchema } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required"),
      }),
      responses: {
        200: z.object({
          success: z.boolean(),
          user: z.object({
            id: z.number(),
            username: z.string(),
            email: z.string(),
          }),
        }),
        401: z.object({ message: z.string() }),
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.object({
          id: z.number(),
          username: z.string(),
          email: z.string(),
        }),
        401: z.object({ message: z.string() }),
      },
    },
    profile: {
      method: 'PUT' as const,
      path: '/api/auth/profile',
      input: z.object({
        username: z.string().min(1).optional(),
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
      }),
      responses: {
        200: z.object({
          id: z.number(),
          username: z.string(),
          email: z.string(),
        }),
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
      },
    },
  },
  villages: {
    list: {
      method: 'GET' as const,
      path: '/api/villages',
      input: z.object({
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof villages.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/villages/:id',
      responses: {
        200: z.custom<typeof villages.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/villages',
      input: insertVillageSchema,
      responses: {
        201: z.custom<typeof villages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/villages/:id',
      input: insertVillageSchema.partial(),
      responses: {
        200: z.custom<typeof villages.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/villages/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  assessments: {
    list: {
      method: 'GET' as const,
      path: '/api/assessments',
      input: z.object({
        villageId: z.coerce.number().optional(),
        year: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof assessments.$inferSelect & { village: typeof villages.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/assessments/:id',
      responses: {
        200: z.custom<typeof assessments.$inferSelect & { village: typeof villages.$inferSelect; values: any[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/assessments',
      input: insertAssessmentSchema,
      responses: {
        201: z.custom<typeof assessments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    calculate: {
      method: 'POST' as const,
      path: '/api/assessments/:id/calculate',
      responses: {
        200: z.custom<typeof assessments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    updateValues: {
      method: 'PUT' as const,
      path: '/api/assessments/:id/values',
      input: z.object({
        values: z.array(z.object({
          indicatorCode: z.string(),
          aspect: z.string().optional(),
          value: z.number().min(1).max(5),
        })),
      }),
      responses: {
        200: z.void(),
        404: errorSchemas.notFound,
      },
    },
    export: {
      method: 'GET' as const,
      path: '/api/assessments/:id/export',
      responses: {
        200: z.any(), // Binary file
      },
    },
    exportBulk: {
      method: 'GET' as const,
      path: '/api/assessments/export/bulk',
      input: z.object({
        year: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.any(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/assessments/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  indicators: {
    dimensions: {
      list: {
        method: 'GET' as const,
        path: '/api/indicators/dimensions',
        responses: {
          200: z.array(z.any()),
        },
      },
      get: {
        method: 'GET' as const,
        path: '/api/indicators/dimensions/:id',
        responses: {
          200: z.any(),
          404: errorSchemas.notFound,
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/indicators/dimensions',
        input: insertDimensionSchema,
        responses: {
          201: z.any(),
          400: errorSchemas.validation,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/indicators/dimensions/:id',
        input: insertDimensionSchema.partial(),
        responses: {
          200: z.any(),
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/indicators/dimensions/:id',
        responses: {
          204: z.void(),
          404: errorSchemas.notFound,
        },
      },
    },
    subDimensions: {
      list: {
        method: 'GET' as const,
        path: '/api/indicators/sub-dimensions',
        responses: {
          200: z.array(z.any()),
        },
      },
      get: {
        method: 'GET' as const,
        path: '/api/indicators/sub-dimensions/:id',
        responses: {
          200: z.any(),
          404: errorSchemas.notFound,
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/indicators/sub-dimensions',
        input: insertSubDimensionSchema,
        responses: {
          201: z.any(),
          400: errorSchemas.validation,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/indicators/sub-dimensions/:id',
        input: insertSubDimensionSchema.partial(),
        responses: {
          200: z.any(),
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/indicators/sub-dimensions/:id',
        responses: {
          204: z.void(),
          404: errorSchemas.notFound,
        },
      },
    },
    indicators: {
      list: {
        method: 'GET' as const,
        path: '/api/indicators/indicators',
        responses: {
          200: z.array(z.any()),
        },
      },
      get: {
        method: 'GET' as const,
        path: '/api/indicators/indicators/:id',
        responses: {
          200: z.any(),
          404: errorSchemas.notFound,
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/indicators/indicators',
        input: insertIndicatorSchema,
        responses: {
          201: z.any(),
          400: errorSchemas.validation,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/indicators/indicators/:id',
        input: insertIndicatorSchema.partial(),
        responses: {
          200: z.any(),
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/indicators/indicators/:id',
        responses: {
          204: z.void(),
          404: errorSchemas.notFound,
        },
      },
    },
    aspects: {
      list: {
        method: 'GET' as const,
        path: '/api/indicators/aspects',
        responses: {
          200: z.array(z.any()),
        },
      },
      get: {
        method: 'GET' as const,
        path: '/api/indicators/aspects/:id',
        responses: {
          200: z.any(),
          404: errorSchemas.notFound,
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/indicators/aspects',
        input: insertIndicatorAspectSchema,
        responses: {
          201: z.any(),
          400: errorSchemas.validation,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/indicators/aspects/:id',
        input: insertIndicatorAspectSchema.partial(),
        responses: {
          200: z.any(),
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/indicators/aspects/:id',
        responses: {
          204: z.void(),
          404: errorSchemas.notFound,
        },
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

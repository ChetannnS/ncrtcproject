const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'NCRTC Bus Management API',
    version: '1.0.0',
    description: 'Demo API for fleet operations, route planning, duty scheduling, incidents, notices, and trip history.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'System' },
    { name: 'Authentication' },
    { name: 'Dashboard' },
    { name: 'Fleet' },
    { name: 'Routes' },
    { name: 'Duties' },
    { name: 'Incidents' },
    { name: 'Notices' },
    { name: 'Trip history' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin1' },
          password: { type: 'string', example: 'password' },
        },
      },
      RouteInput: {
        type: 'object',
        required: ['name', 'depot_id'],
        properties: {
          name: { type: 'string', example: 'Airport Link' },
          depot_id: { type: 'integer', example: 1 },
          stops: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, eta: { type: 'string' } } } },
        },
      },
      IncidentInput: {
        type: 'object',
        required: ['type', 'severity', 'description'],
        properties: {
          type: { type: 'string', example: 'panic' },
          severity: { type: 'string', enum: ['P1', 'P2', 'P3'] },
          description: { type: 'string', example: 'Driver requested emergency assistance.' },
          vehicle_id: { type: 'integer', nullable: true },
          depot_id: { type: 'integer', nullable: true },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: { tags: ['System'], summary: 'Health check', responses: { 200: { description: 'Service is healthy' } } },
    },
    '/api/login': {
      post: {
        tags: ['Authentication'], summary: 'Log in and receive a JWT',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: { 200: { description: 'JWT and user profile' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/api/dashboard': {
      get: { tags: ['Dashboard'], summary: 'Get dashboard totals', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Fleet, route, incident, and notice totals' } } },
    },
    '/api/vehicles': {
      get: { tags: ['Fleet'], summary: 'Get current fleet positions', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Vehicles with live demo positions' } } },
    },
    '/api/routes': {
      get: { tags: ['Routes'], summary: 'List routes', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Route collection' } } },
      post: {
        tags: ['Routes'], summary: 'Create a route (admin or depot manager)', security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RouteInput' } } } },
        responses: { 201: { description: 'Created route' }, 403: { description: 'Role is not permitted' } },
      },
    },
    '/api/routes/{id}': {
      put: {
        tags: ['Routes'], summary: 'Update a route', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RouteInput' } } } },
        responses: { 200: { description: 'Updated route' } },
      },
      delete: {
        tags: ['Routes'], summary: 'Delete a route', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Route deleted' } },
      },
    },
    '/api/duties': {
      get: { tags: ['Duties'], summary: 'List duties (drivers see their own)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Duty collection' } } },
      post: {
        tags: ['Duties'], summary: 'Create a tomorrow draft duty (admin or depot manager)', security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['driver_id', 'vehicle_id', 'route_id', 'start_time'],
                properties: {
                  driver_id: { type: 'integer' },
                  vehicle_id: { type: 'integer' },
                  route_id: { type: 'integer' },
                  start_time: { type: 'string', example: '07:00' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Draft duty created' }, 409: { description: 'Driver already has a duty tomorrow' } },
      },
    },
    '/api/duties/{id}': {
      put: {
        tags: ['Duties'], summary: 'Edit a tomorrow draft duty', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Draft duty updated' }, 409: { description: 'Duty is not an editable draft' } },
      },
    },
    '/api/duties/{id}/reopen': {
      patch: {
        tags: ['Duties'], summary: 'Reopen a published tomorrow duty as a draft', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Duty reopened for editing' } },
      },
    },
    '/api/duties/{id}/publish': {
      patch: {
        tags: ['Duties'], summary: 'Publish a tomorrow duty (admin or depot manager)', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Duty published' }, 403: { description: 'Role is not permitted' } },
      },
    },
    '/api/duties/{id}/acknowledge': {
      patch: {
        tags: ['Duties'], summary: 'Acknowledge your assigned duty (driver)', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Duty acknowledged' } },
      },
    },
    '/api/incidents': {
      get: { tags: ['Incidents'], summary: 'List incidents', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Incident queue' } } },
      post: {
        tags: ['Incidents'], summary: 'Create an incident', security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/IncidentInput' } } } },
        responses: { 201: { description: 'Created incident' } },
      },
    },
    '/api/incidents/{id}/status': {
      patch: {
        tags: ['Incidents'], summary: 'Update status and/or assign an incident', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  assigned_to: { type: 'string' },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Incident updated' } },
      },
    },
    '/api/notices': {
      get: {
        tags: ['Notices'],
        summary: 'List notices and read receipts',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Notice collection' } },
      },
    },
    '/api/notices/{id}/read': {
      post: {
        tags: ['Notices'], summary: 'Mark a notice read', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Read receipt stored' } },
      },
    },
    '/api/trips': {
      get: {
        tags: ['Trip history'],
        summary: 'List historical trips',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Past trips available for replay' } },
      },
    },
    '/api/trips/{id}': {
      get: {
        tags: ['Trip history'], summary: 'Get trip route path for map replay', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Trip metadata and coordinate path' }, 404: { description: 'Trip not found' } },
      },
    },
  },
};

export default openApiSpec;

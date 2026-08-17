import swaggerJsdoc from "swagger-jsdoc";
import { env, isDevelopment } from "./env";

const servers = [
  ...(isDevelopment
    ? [
        {
          url: `http://localhost:${env.PORT}/api/v1`,
          description: "Development server",
        },
      ]
    : []),
  {
    url: `https://socket-be.udayhasan.dev/api/v1`,
    description: "Production server",
  },
];

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Socket API",
      version: "1.0.0",
      description: "Production grade REST API for Socket",
      contact: {
        name: "API Support",
        email: "support@socket.com",
      },
    },
    servers,
    components: {
      securitySchemes: {
        // Cookie-based auth — browser sends cookies automatically
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
        },
      },
      schemas: {
        // Reusable success response schema
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operation successful" },
            data: { type: "object" },
          },
        },
        // Reusable error response schema
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Something went wrong" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  // Scan these files for JSDoc swagger comments
  apis: ["./src/module/**/*.routes.ts", "./src/module/**/*.route.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

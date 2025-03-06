import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LUA Platform API",
      version: "1.0.0",
      description: "API documentation for LUA Platform",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
  },
  apis: ["./swagger.yaml"], // Path to API route files
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
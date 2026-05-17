const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const doctorRoutes = require('./routes/doctors');
const billingRoutes = require('./routes/billing');
const { initDb } = require('./models/database');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MediCare Clinic API',
      version: '1.0.0',
      description: 'Clinic Appointment & Patient Management System API'
    },
    servers: [{ url: process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [path.join(__dirname, 'routes', '*.js')]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/billing', billingRoutes);

// Serve frontend static files in production
const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
const fs = require('fs');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

// Initialize DB then start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`MediCare Clinic API running at http://localhost:${PORT}`);
    console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;

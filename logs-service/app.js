const dns = require('dns');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const pino = require('pino');
const Log = require('./models/log.model');

dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const app = express();
const logger = pino();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        logger.info('Logs service connected to MongoDB Atlas');
    })
    .catch((error) => {
        logger.error(error, 'MongoDB connection error');
    });

async function saveLog(service, method, endpoint, message, status) {
    try {
        logger.info({
            service,
            method,
            endpoint,
            status,
            message
        });

        const log = new Log({
            service,
            method,
            endpoint,
            message,
            status
        });

        await log.save();
    } catch (error) {
        logger.error(error, 'Could not save log');
    }
}

app.use((request, response, next) => {
    response.on('finish', () => {
        if (request.originalUrl !== '/api/logs' || request.method !== 'POST') {
            saveLog(
                'logs-service',
                request.method,
                request.originalUrl,
                'HTTP request received',
                response.statusCode
            );
        }
    });

    next();
});

app.get('/', (request, response) => {
    response.json({
        message: 'Logs service is running'
    });
});

app.post('/api/logs', async (request, response) => {
    try {
        const { service, method, endpoint, message, status } = request.body;

        if (!service || !method || !endpoint || !message || status === undefined) {
            return response.status(400).json({
                id: 400,
                message: 'Missing required log fields'
            });
        }

        const log = new Log({
            service,
            method,
            endpoint,
            message,
            status
        });

        const savedLog = await log.save();

        response.status(201).json(savedLog);
    } catch (error) {
        logger.error(error, 'Error saving log');

        response.status(500).json({
            id: 500,
            message: error.message
        });
    }
});

app.get('/api/logs', async (request, response) => {
    try {
        const logs = await Log.find({}).sort({
            created_at: -1
        });

        response.json(logs);
    } catch (error) {
        logger.error(error, 'Error getting logs');

        response.status(500).json({
            id: 500,
            message: error.message
        });
    }
});

const port = process.env.PORT || 3003;

app.listen(port, () => {
    logger.info(`Logs service is running on port ${port}`);
});
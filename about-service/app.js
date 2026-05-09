const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pino = require('pino');
const axios = require('axios');

dotenv.config();

const app = express();
const logger = pino();

app.use(cors());
app.use(express.json());

const developers = [
    {
        first_name: 'Noam',
        last_name: 'Zimer'
    },
    {
        first_name: 'Michelle',
        last_name: 'Aizikovich'
    },
    {
        first_name: 'Nour',
        last_name: 'Azizy'
    }
];

async function writeLog(request, response, message) {
    try {
        const logsServiceUrl = process.env.LOGS_SERVICE_URL;

        logger.info({
            service: 'about-service',
            method: request.method,
            endpoint: request.originalUrl,
            status: response.statusCode,
            message
        });

        if (logsServiceUrl) {
            await axios.post(`${logsServiceUrl}/api/logs`, {
                service: 'about-service',
                method: request.method,
                endpoint: request.originalUrl,
                status: response.statusCode,
                message
            });
        }
    } catch (error) {
        logger.error(error, 'Could not write log');
    }
}

app.use((request, response, next) => {
    response.on('finish', () => {
        writeLog(request, response, 'HTTP request received');
    });

    next();
});

app.get('/', (request, response) => {
    response.json({
        message: 'About service is running'
    });
});

app.get('/api/about', (request, response) => {
    response.json(developers);
});

const port = process.env.PORT || 3004;

app.listen(port, () => {
    logger.info(`About service is running on port ${port}`);
});
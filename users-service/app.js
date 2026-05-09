const dns = require('dns');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const pino = require('pino');
const axios = require('axios');
const User = require('./models/user.model');

dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const app = express();
const logger = pino();

app.use(cors());
app.use(express.json());

async function writeLog(request, response, message) {
    try {
        const logsServiceUrl = process.env.LOGS_SERVICE_URL;

        logger.info({
            service: 'users-service',
            method: request.method,
            endpoint: request.originalUrl,
            status: response.statusCode,
            message
        });

        if (logsServiceUrl) {
            await axios.post(`${logsServiceUrl}/api/logs`, {
                service: 'users-service',
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

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        logger.info('Connected to MongoDB Atlas');
    })
    .catch((error) => {
        logger.error(error, 'MongoDB connection error');
    });

async function getUserTotal(userid) {
    try {
        const costsServiceUrl = process.env.COSTS_SERVICE_URL;
        const result = await axios.get(`${costsServiceUrl}/api/total?userid=${userid}`);

        return result.data.total;
    } catch (error) {
        logger.error(error, 'Could not get user total');

        return 0;
    }
}

app.get('/', (request, response) => {
    response.json({
        message: 'Users service is running'
    });
});

app.post('/api/add', async (request, response) => {
    try {
        const { id, first_name, last_name, birthday } = request.body;

        if (!id || !first_name || !last_name || !birthday) {
            return response.status(400).json({
                id: 400,
                message: 'Missing required user fields'
            });
        }

        if (typeof id !== 'number') {
            return response.status(400).json({
                id: 400,
                message: 'User id must be a number'
            });
        }

        const birthDate = new Date(birthday);

        if (Number.isNaN(birthDate.getTime())) {
            return response.status(400).json({
                id: 400,
                message: 'Invalid birthday'
            });
        }

        if (birthDate > new Date()) {
            return response.status(400).json({
                id: 400,
                message: 'Birthday cannot be in the future'
            });
        }

        const existingUser = await User.findOne({ id });

        if (existingUser) {
            return response.status(400).json({
                id: 400,
                message: 'User already exists'
            });
        }

        const user = new User({
            id,
            first_name,
            last_name,
            birthday: birthDate
        });

        const savedUser = await user.save();

        response.status(201).json(savedUser);
    } catch (error) {
        logger.error(error, 'Error adding user');

        response.status(500).json({
            id: 500,
            message: error.message
        });
    }
});

app.get('/api/users', async (request, response) => {
    try {
        const users = await User.find({});

        response.json(users);
    } catch (error) {
        logger.error(error, 'Error getting users');

        response.status(500).json({
            id: 500,
            message: error.message
        });
    }
});

app.get('/api/users/:id', async (request, response) => {
    try {
        const userId = Number(request.params.id);

        if (Number.isNaN(userId)) {
            return response.status(400).json({
                id: 400,
                message: 'Invalid user id'
            });
        }

        const user = await User.findOne({ id: userId });

        if (!user) {
            return response.status(404).json({
                id: 404,
                message: 'User not found'
            });
        }

        const total = await getUserTotal(user.id);

        response.json({
            first_name: user.first_name,
            last_name: user.last_name,
            id: user.id,
            total
        });
    } catch (error) {
        logger.error(error, 'Error getting user');

        response.status(500).json({
            id: 500,
            message: error.message
        });
    }
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
    logger.info(`Users service is running on port ${port}`);
});
# Cost Manager RESTful Web Services

## Project Overview

This project is a RESTful Web Services system for managing users and cost items.

The system was developed for the **Asynchronous Server-Side Development** course.  
It uses a microservices-style architecture with four independent Node.js/Express services:

- **Users Service**
- **Costs Service**
- **Logs Service**
- **About Service**

The system stores data in **MongoDB Atlas** using **Mongoose** models and uses **Pino** for logging.

---

## Live Services

### Logs Service
https://cost-manager-logs-service-02im.onrender.com

### Users Service
https://cost-manager-users-service-h3qu.onrender.com

### Costs Service
https://cost-manager-costs-service-673p.onrender.com

### About Service
https://cost-manager-about-service-c2tt.onrender.com

---

## Technologies Used

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JavaScript
- Pino
- Axios
- CORS
- dotenv
- Python
- pytest
- requests
- Render
- GitHub

---

## Project Structure

```text
cost-manager-project/
│
├── about-service/
│   ├── app.js
│   ├── package.json
│
├── costs-service/
│   ├── app.js
│   ├── package.json
│   └── models/
│       ├── cost.model.js
│       └── report.model.js
│
├── logs-service/
│   ├── app.js
│   ├── package.json
│   └── models/
│       └── log.model.js
│
├── users-service/
│   ├── app.js
│   ├── package.json
│   └── models/
│       └── user.model.js
│
└── tests/
    ├── config.py
    ├── helpers.py
    ├── test_about.py
    ├── test_costs.py
    ├── test_logs.py
    └── test_users.py
```

---

## Services Description

### 1. Users Service

The Users Service manages users.

Main endpoints:

```http
POST /api/add
GET /api/users
GET /api/users/:id
```

Responsibilities:

- Add a new user
- Return all users
- Return a specific user by `id`
- Return the total cost amount of a specific user
- Validate user data
- Prevent duplicate users by `id`

---

### 2. Costs Service

The Costs Service manages cost items and monthly reports.

Main endpoints:

```http
POST /api/add
GET /api/report
GET /api/total
```

Responsibilities:

- Add a new cost item
- Validate cost data
- Validate allowed categories
- Check that the user exists before adding a cost item
- Return monthly reports
- Return total costs for a user

Allowed cost categories:

```text
food
health
housing
sports
education
```

---

### 3. Logs Service

The Logs Service stores log messages in MongoDB.

Main endpoints:

```http
GET /api/logs
POST /api/logs
```

Responsibilities:

- Store logs from all services
- Return saved logs
- Validate log data

Each service writes logs for HTTP requests using **Pino** and sends log records to the Logs Service.

---

### 4. About Service

The About Service returns the project developers.

Main endpoint:

```http
GET /api/about
```

The response contains only first name and last name for each team member.

---

## MongoDB Collections

The project uses the following MongoDB collections:

```text
users
costs
logs
reports
```

### users

Stores user data.

Example:

```json
{
  "id": 123123,
  "first_name": "mosh",
  "last_name": "israeli",
  "birthday": "1990-01-01"
}
```

### costs

Stores cost items.

Example:

```json
{
  "userid": 123123,
  "description": "milk 9",
  "category": "food",
  "sum": 8,
  "created_at": "2026-05-20T18:06:32.149Z"
}
```

### logs

Stores service logs.

### reports

Stores computed monthly reports.

---

## Computed Design Pattern

The Costs Service implements the **Computed Design Pattern** for monthly reports.

When a report is requested for a past month:

1. The service first checks whether the report already exists in the `reports` collection.
2. If the report exists, it returns the saved computed report.
3. If the report does not exist, it computes the report from the `costs` collection.
4. The computed report is saved in the `reports` collection.
5. The saved report can be reused in future requests.

For current and future months, the report is calculated directly from the `costs` collection.

---

## Environment Variables

Each service uses environment variables.

Example `.env` fields:

```env
PORT=3002
MONGO_URI=your_mongodb_atlas_connection_string
LOGS_SERVICE_URL=https://cost-manager-logs-service-02im.onrender.com
USERS_SERVICE_URL=https://cost-manager-users-service-h3qu.onrender.com
COSTS_SERVICE_URL=https://cost-manager-costs-service-673p.onrender.com
```

Important:  
The real `.env` files should not be uploaded to GitHub or included in the ZIP submission because they may contain sensitive information.

---

## API Examples

### Get Developers

```http
GET https://cost-manager-about-service-c2tt.onrender.com/api/about
```

### Get All Users

```http
GET https://cost-manager-users-service-h3qu.onrender.com/api/users
```

### Get User by ID

```http
GET https://cost-manager-users-service-h3qu.onrender.com/api/users/123123
```

### Add Cost

```http
POST https://cost-manager-costs-service-673p.onrender.com/api/add
```

Example body:

```json
{
  "userid": 123123,
  "description": "milk 9",
  "category": "food",
  "sum": 8
}
```

### Get Monthly Report

```http
GET https://cost-manager-costs-service-673p.onrender.com/api/report?id=123123&year=2026&month=5
```

Example response structure:

```json
{
  "userid": 123123,
  "year": 2026,
  "month": 5,
  "costs": [
    {
      "food": []
    },
    {
      "health": []
    },
    {
      "housing": []
    },
    {
      "sports": []
    },
    {
      "education": []
    }
  ]
}
```

### Get Logs

```http
GET https://cost-manager-logs-service-02im.onrender.com/api/logs
```

---

## Validation and Error Handling

The project validates input data in the API endpoints.

Examples of handled errors:

- Missing required user fields
- Duplicate user ID
- Missing required cost fields
- Invalid category
- Negative or invalid cost sum
- Invalid report parameters
- User does not exist
- Missing required log fields

Error responses are returned as JSON and include an `id` and a `message`.

Example:

```json
{
  "id": 400,
  "message": "Invalid category"
}
```

---

## Running Locally

Each service can be installed and run separately.

Example for one service:

```bash
cd users-service
npm install
npm start
```

The same process can be used for:

```text
about-service
users-service
costs-service
logs-service
```

Make sure the required `.env` variables are configured before running the services.

---

## Automated Tests

The project includes automated tests written in Python using:

- pytest
- requests

To install the test dependencies:

```bash
py -m pip install pytest requests
```

To run all tests from the project root:

```bash
py -m pytest tests -s
```

The tests cover:

- About Service endpoint
- Users Service endpoints
- Costs Service endpoints
- Logs Service endpoints
- Valid requests
- Invalid requests
- Validation errors
- Missing users
- Monthly reports
- Logging functionality

The final test run completed successfully:

```text
15 passed
```

---

## Deployment

The project is deployed using **Render**.

Each service is deployed separately as an independent web service:

```text
logs-service
users-service
costs-service
about-service
```

The source code is hosted on GitHub.

---

## Submission Notes

Before final submission, the MongoDB database should be cleaned.

The database should contain only the required demo user in the `users` collection:

```json
{
  "id": 123123,
  "first_name": "mosh",
  "last_name": "israeli",
  "birthday": "1990-01-01"
}
```

The following collections should be empty before submission:

```text
costs
logs
reports
```

The ZIP submission should not include:

```text
node_modules
.env
```

---

## Team Members

- Noam Zimer
- Michelle Aizikovich
- Nour Azizy

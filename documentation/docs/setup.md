---
sidebar_position: 2
---

# Getting Started

This guide will walk you through the process of setting up the LUA Platform on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed on your system:

- [Git](https://git-scm.com/downloads) - For cloning the repository
- [Docker](https://www.docker.com/get-started/) - For running the backend services
- [Node.js](https://nodejs.org/) (version 18.0 or higher) - For running the documentation locally

## Clone the Repository

First, clone the repository from GitHub using the following command:

```bash
git clone https://github.com/AbderrazakBouasker/LearnunderstandactPlatform.git
cd LearnunderstandactPlatform
```

## Initial Setup

Before starting the services, you need to perform some initial setup steps:

1. Create the Docker network:

```bash
sudo docker network create luaplatform-network
```

2. Create the environment configuration file from the example:

```bash
cp .env-example .env
```

3. Add the frontend hostname to your hosts file:

```bash
echo "127.0.0.1 luapp" | sudo tee -a /etc/hosts
```

## Starting the Backend

The backend services are containerized using Docker for easy setup and deployment.

1. Navigate to the backend directory:

```bash
cd backend
```

2. Start the Docker containers:

```bash
sudo docker compose up
```

This will start all the necessary services, including the API server, database, and any other dependencies.

3. The backend should now be running. You can access the API at:

```
http://localhost:5000
```

4. To view the Swagger API documentation, open the following URL in your browser:

```
http://localhost:5000/api-docs
```

This interactive documentation allows you to explore the available API endpoints.

## Starting the Frontend

To run the frontend application:

1. Navigate to the frontend directory:

```bash
cd ../frontend
```

2. Start the frontend Docker containers:

```bash
sudo docker compose up
```

3. The frontend should now be running and accessible at:

```
http://luapp
```

## Starting the Documentation Site

To run the documentation site locally:

1. Navigate to the documentation directory:

```bash
cd ../documentation
```

2. Install the dependencies:

```bash
npm install
```

3. Start the documentation development server:

```bash
npm start
```

4. The documentation site should now be available in your browser at:

```
http://localhost:3000
```

## Project Structure

The project is organized into the following main directories:

- `backend/` - Contains the API server and related services
- `documentation/` - Contains this documentation site
- `frontend/` - Contains the web client application

## Service URLs

Once everything is running, you can access the different components at:

- **Frontend Application**: http://luapp
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs
- **Documentation Site**: http://localhost:3000

## Next Steps

Now that you have the LUA Platform up and running, you can explore the [API documentation](/docs/apis) to understand how to interact with the backend services.

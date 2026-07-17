# Contributing to Confido AI

Welcome! Thank you for considering contributing to Confido AI. To make it as easy as possible to get started, this project is fully containerized using **Docker**. 

This means you do **not** need to install Node.js, Python, or MongoDB on your local machine. Everything runs in isolated containers!

## Getting Started (The Easy Way)

### Prerequisites
All you need installed on your machine is:
1. [Git](https://git-scm.com/)
2. [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Clone the Repository
Clone this repository to your local machine:
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL_HERE>
cd Confido-AI
```

### 2. Start the Application
We use Docker Compose to spin up the Database, Backend, ML Service, and Frontend all at once.

Navigate to the `docker` folder and run:
```bash
cd docker
docker compose up
```

*Note: The first time you run this, it may take a few minutes to download the base images and build the containers.*

### 3. Access the Application
Once the terminal shows that all containers are running and healthy, you can access the application in your browser:

- **Frontend Application**: [http://localhost:3001](http://localhost:3001)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Machine Learning API**: [http://localhost:8000](http://localhost:8000)

## Making Changes
The Docker containers are set up with **Hot Reloading**. 
This means you can edit the code in the `frontend`, `backend`, or `ml-service` folders using your favorite code editor (like VS Code), and the changes will automatically reflect in the running application without you having to restart the containers!

## Stopping the Application
To stop the application, you can either:
1. Press `Ctrl + C` in the terminal where Docker is running.
2. Run `docker compose down` in the `docker` directory to completely shut down and remove the containers.

## Troubleshooting
If you run into port conflicts (e.g., you already have MongoDB running locally), the `docker-compose.yml` file is configured to map to alternate ports to avoid collisions on your host machine.

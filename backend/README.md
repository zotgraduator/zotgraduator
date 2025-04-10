# Full Stack Application Backend

This is a Ruby on Rails API backend for a full stack application, with React as frontend.

## Getting Started

### Prerequisites

- Docker
- VS Code with Remote - Containers extension

### Setup

1. Open the project in VS Code
2. Click on "Reopen in Container" when prompted
3. The container will setup PostgreSQL and Ruby on Rails

### Running the Backend

Start the Rails server on port 3001:

```bash
rails server -p 3001
```

The API will be available at http://localhost:3001

### Database Setup

The database is automatically set up when the container is created. If you need to manually set up the database:

```bash
rails db:create
rails db:migrate
```

### Creating API Endpoints

Generate new controllers and models for your API:

```bash
rails generate controller api/v1/YourResource
rails generate model YourResource attribute:type
```

## Working with the Frontend

The React frontend should be configured to send API requests to `http://localhost:3001/api/v1/...`

Make sure CORS is properly configured in `config/initializers/cors.rb` to allow requests from your frontend origin.

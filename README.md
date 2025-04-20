# ZOTGRADUATOR

## Back end
Ruby on Rails Backend Setup with PostgreSQL
I'll guide you through setting up a Ruby on Rails backend with PostgreSQL. Let's break this down into manageable steps.

<!-- Step 1: Create a new Rails application with PostgreSQL
First, let's create a new Rails application configured to use PostgreSQL:
```
cd /workspaces/backend
rails new . --database=postgresql --api
``` -->

...

Step 7: Start your Docker containers
Now let's start the Docker containers:
```
docker-compose build
docker-compose up
```
This will build and start both your Rails application and PostgreSQL database.

Step 8: Set up the database
In a new terminal, run:
```
docker-compose exec web rails db:create db:migrate
```

----------------------


Docker Container Workflow Instructions
Since you're using VS Code's devcontainer feature, many of the traditional Docker commands are handled behind the scenes. Here's what you need to know:

Rebuilding the Container (if needed):

Click on the green button in the bottom-left corner of VS Code
Select "Rebuild Container" to rebuild with any configuration changes
Starting the Container:

The container should already be running if you're in VS Code
If not, click the green button and select "Reopen in Container"
Database Setup:

Open a terminal in VS Code
Run: bundle install (to install all gems including rack-cors)
Run: rails db:create db:migrate (to set up your database)
Starting the Rails Server:

Run: 
```
rails server -p 3001 -b 0.0.0.0
```
The -b 0.0.0.0 option is important for proper container networking
Testing the API:

Your API should now be accessible at http://localhost:3001
You can try visiting http://localhost:3001/health if you have a health check endpoint, or create a simple test endpoint
Troubleshooting:

If you can't connect to the database, check your database.yml file
Ensure the host is set to 'db' as that's the service name in docker-compose
Check logs with docker logs [container-name] if needed
Stopping the Server:

Use Ctrl+C in the terminal where the server is running
Viewing Container Logs (if needed from outside VS Code):

docker compose logs app or docker compose logs db
Creating Your First API Endpoint:

Run: rails generate controller api/v1/Health index
Edit the controller to return a simple JSON response
Test at http://localhost:3001/api/v1/health
Remember that in the VS Code devcontainer environment, most Docker operations are abstracted away - the container is automatically built and started for you. You mainly interact with the Rails commands directly in the terminal.



## Front end
Once you have this basic setup running, we can proceed to:
Creating models for your data (courses, users, etc.)
Setting up authentication
Building API endpoints
Connecting to your frontend
Would you like me to continue with any of these next steps?

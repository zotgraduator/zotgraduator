# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) to accept cross-origin AJAX requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # In development, allow requests from any origin for easier frontend development
    # For production, you would restrict this to your specific frontend domain
    origins '*'
    # Alternative restrictive configuration:
    # origins 'localhost:3000', '127.0.0.1:3000', 'localhost:5173', '127.0.0.1:5173'

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end

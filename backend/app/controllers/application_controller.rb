class ApplicationController < ActionController::API
  default_format :json
  format :json

  mount AccountApi
end

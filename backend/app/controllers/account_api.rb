require 'grape'

class AccountApi < Grape::API
  format :json
  prefix :api

  resource :account do
    desc "Create a new account"
    params do
      requires :account_id, type: String, desc: "Account ID"
      requires :firstname, type: String, desc: "First name of the user"
      requires :lastname, type: String, desc: "Last name of the user"
      requires :email, type: String, desc: "Email address of the user"
      optional :major, type: String, desc: "User's major"
      optional :year, type: String, desc: "User's year"
    end
    post do
      # use strong params pattern to prevent mass assignment vulnerabilities
      acct_params = params.slice(:account_id, :firstname, :lastname, :email, :major, :year)
      
      acct = Account.new(acct_params)
      if acct.save
        { status: 'success', message: "Account created successfully\n", account: acct.as_json }
      else
        error!({ status: 'error', message: "Account creation failed", errors: acct.errors.full_messages }, 422)
      end
    end
    
    desc "Find an account by ID"
    params do
      requires :account_id, type: String, desc: "Account ID"
    end
    get ':account_id' do
      acct = Account.find_by(account_id: params[:account_id])
      if acct
        { status: 'success', message: "Account found\n", account: acct.as_json }
      else 
        error!({ status: 'error', message: "Account not found for account_id: #{params[:account_id]}" }, 404)
      end
    end
  end
end
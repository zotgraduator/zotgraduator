class AccountApi < ActionController::API
  resource :account do
    desc "Create a new account"
    params do
      requires :username, type: String, desc: "Username for the account"
      requires :firstname, type: String, desc: "First name of the user"
      requires :lastname, type: String, desc: "Last name of the user"
      requires :email, type: String, desc: "Email address of the user"
      optional :major, type: String, desc: "User's major"
      optional :year, type: String, desc: "User's year"
      requires :password, type: String, desc: "Password for the account"
    end
    post do
      # use strong params pattern to prevent mass assignment vulnerabilities
      account_params = params.permit(:username, :firstname, :lastname, :email, :major, :year, :password)
      
      @account = Account.new(account_params)
      if @account.save
        { status: 'success', message: "Account created successfully", account_id: @account.id }
      else
        { status: 'error', message: "Account creation failed", errors: @account.errors.full_messages }
      end
    end
    
    desc "Find an account by credentials"
    params do
      requires :email, type: String, desc: "Email address of the user"
      requires :password, type: String, desc: "Password for the account"
    end
    get do
      @account = Account.find_by(email: params[:email], password: params[:password])
      if @account
        { status: 'success', message: "Account found", account: @account.as_json(except: [:password]) }
      else
        { status: 'error', message: "Invalid email or password" }
      end
    end
  end
end
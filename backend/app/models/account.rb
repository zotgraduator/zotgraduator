class Account < ApplicationRecord
  #TODO: add account_id validation either here or in frontend
  validates :account_id,
            presence:   true,           # must send an id
            uniqueness: true            # no dupes
  validates :firstname,
            :lastname,
            :email,
            presence:   true            # these all required
  validates :email,
            format:     { with: URI::MailTo::EMAIL_REGEXP }  # basic email check

end

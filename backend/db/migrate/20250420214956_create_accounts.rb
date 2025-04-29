class CreateAccounts < ActiveRecord::Migration[8.0]
  def change
    create_table :accounts do |t|
      t.string :account_id
      t.string :firstname
      t.string :lastname
      t.string :email
      t.string :major
      t.string :year

      t.timestamps
    end
  end
end

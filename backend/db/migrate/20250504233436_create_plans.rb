class CreatePlans < ActiveRecord::Migration[8.0]
  def change
    create_table :plans do |t|
      t.string :plan_id
      t.string :title
      t.string :description

      t.timestamps
    end
    add_index :schedules, :plan_id
  end
end

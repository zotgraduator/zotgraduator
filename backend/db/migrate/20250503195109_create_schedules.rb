class CreateSchedules < ActiveRecord::Migration[8.0]
  def change
    create_table :schedules do |t|
      t.string :schedule_id
      t.string :term
      t.integer :total_units

      t.timestamps
    end
    add_index :schedules, :schedule_id, unique: true
  end
end

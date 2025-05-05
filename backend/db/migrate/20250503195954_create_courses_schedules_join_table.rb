class CreateCoursesSchedulesJoinTable < ActiveRecord::Migration[8.0]
  def change
    create_join_table :courses, :schedules do |t|
      t.index :course_id
      t.index :schedule_id
    end
  end
end

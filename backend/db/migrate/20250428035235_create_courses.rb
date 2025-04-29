class CreateCourses < ActiveRecord::Migration[8.0]
  def change
    create_table :courses do |t|
      t.string :class_name
      t.string :title
      t.string :description
      t.integer :units
      t.jsonb :parsed_prerequisites
      t.string "overlaps_with", array: true, default: []
      t.string "same_as", array: true, default: []
      t.string :restriction
      t.string "grading_option", array: true, default: []

      t.timestamps
    end
    add_index :courses, :class_name
  end
end

class Courses < ApplicationRecord
  validates :class_name,
  presence: true,
  uniqueness: true
end

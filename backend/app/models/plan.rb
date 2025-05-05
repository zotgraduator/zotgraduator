class Plan < ApplicationRecord
  validates :plan_id,
  presence: true,
  uniqueness: true

  has_many :schedules
end

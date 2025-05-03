class Schedule < ApplicationRecord
  validates :schedule_id,
  presence: true,
  uniqueness: true

  has_and_belongs_to_many :courses
end

class Schedule < ApplicationRecord
  validates :schedule_id,
  presence: true,
  uniqueness: true

  has_many :courses
  belongs_to :plan
end

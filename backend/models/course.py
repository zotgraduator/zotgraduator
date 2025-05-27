from extensions import db
# from sqlalchemy.dialects.postgresql import JSONB

class Course(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  class_name = db.Column(db.String(16), unique=True, nullable=False)
  title = db.Column(db.String(128), nullable=False)
  description = db.Column(db.Text)
  units = db.Column(db.Integer)
  parsed_prerequisites = db.Column(db.JSON)
  overlaps_with = db.Column(db.JSON)
  same_as = db.Column(db.JSON)
  restriction = db.Column(db.String(128))
  grading_option = db.Column(db.JSON)

  def to_dict(self):
    return  {
      'id': self.id,
      'class_name': self.class_name,
      'title': self.title,
      'description': self.description,
      'units': self.units,
      'parsed_prerequisites': self.parsed_prerequisites,
      'overlaps_with': self.overlaps_with,
      'same_as': self.same_as,
      'restriction': self.restriction,
      'grading_option': self.grading_option
    }
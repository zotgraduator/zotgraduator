#!/usr/bin/env python
"""
This script imports course data from the JSON file into the database.
It handles both string and dictionary parsed_prerequisites formats.
"""
import json
import os
import sys
from pathlib import Path

# Add the parent directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models.course import Course
from extensions import db

def import_courses():
    app = create_app()
    
    # Path of json: "C:\Users\jaspl\Downloads\zotgraduator\frontend\src\data\course_data_with_logical_prereqs.json"
    # Use Path to get to the file
    json_path = Path(__file__).resolve().parent.parent.parent / 'frontend' / 'src' / 'data' / 'course_data_with_logical_prereqs.json'
    
    if not os.path.exists(json_path):
        print(f"Error: JSON file not found at {json_path}")
        return
    
    # Read the JSON file
    with open(json_path, 'r') as f:
        course_data = json.load(f)
    
    with app.app_context():
        # Clear existing courses
        Course.query.delete()
        
        # Add each course to the database
        for class_name, info in course_data.items():
            try:
                # Handle empty course entries
                if not info:
                    print(f"Skipping empty course entry: {class_name}")
                    continue
                
                # Parse units to integer if present
                units = info.get('units')
                if units and isinstance(units, str):
                    try:
                        units = int(units.strip())
                    except ValueError:
                        print(f"Warning: Could not convert units '{units}' to integer for {class_name}")
                        units = units.strip()
                        # print(units)
                
                # Create course object
                course = Course(
                    class_name=class_name,
                    title=info.get('title', ''),
                    description=info.get('description', ''),
                    units=units,
                    parsed_prerequisites=info.get('parsed_prerequisites'),
                    overlaps_with=info.get('overlaps_with'),
                    same_as=info.get('same_as'),
                    restriction=info.get('restriction', ''),
                    grading_option=info.get('grading_option')
                )
                
                db.session.add(course)
                print(f"Added course: {class_name}")
                
            except Exception as e:
                print(f"Error adding course {class_name}: {str(e)}")
        
        # Commit the changes
        db.session.commit()
        print(f"Successfully imported {Course.query.count()} courses")

if __name__ == "__main__":
    import_courses()

    # # Print out first 5 courses
    # with create_app().app_context():
    #     courses = Course.query.limit(5).all()
    #     for course in courses:
    #         print(course.to_dict())

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from planner import CoursePlanner
import pandas as pd
import os
import json
from course_utils import (
    load_course_prerequisites, 
    create_prerequisites_dag, 
    create_forward_dag,
    short_to_full_course_code,
    full_to_short_course_code
)
from scraper import scape_read_csv
from models.course import Course
from extensions import db

planner_bp = Blueprint('planner', __name__)

# Get the directory of the current file (planner_routes.py)
current_dir = os.path.dirname(os.path.abspath(__file__))
# Go up one level to the 'backend' directory
backend_dir = os.path.dirname(current_dir)
# Construct the path to the CSV file
CSV_FILE_PATH = os.path.join(backend_dir, 'courses_availability.csv')

def parse_availability_csv(csv_path):
    """Parse the courses_availability.csv file into a dictionary"""
    df = pd.read_csv(csv_path)
    course_dict = {}
    
    for _, row in df.iterrows():
        course_id = row['Course']
        availability = row['Availability']
        course_dict[course_id] = availability.split('+') if not pd.isnull(availability) else []
    
    return course_dict

@planner_bp.route('/generate', methods=['POST'])
@jwt_required(optional=True)
def generate_plan():
    """Generate an academic plan based on input parameters"""
    data = request.get_json()
    
    # Extract parameters from request
    major = data.get('major', 'Software Engineering')
    start_year = data.get('startYear', 2023)
    planned_years = data.get('plannedYears', 4)
    max_units_per_sem = data.get('maxUnitsPerSemester', 16)
    completed_courses = data.get('completedCourses', [])
    elective_courses = data.get('electiveCourses', [])
    sessions = data.get('sessions', ['Fall', 'Winter', 'Spring'])
    fixed_courses = data.get('fixedCourses', {})
    
    # Load course prerequisites
    prereqs_dict = load_course_prerequisites()
    prereqs_dag = create_prerequisites_dag(prereqs_dict)
    forward_dag = create_forward_dag(prereqs_dag)
    
    # Initialize the course planner with prerequisite information
    planner = CoursePlanner(
        data_path=CSV_FILE_PATH,
        planned_years=planned_years,
        max_units_per_sem=max_units_per_sem,
        completed_courses=completed_courses,
        sessions=sessions,
        prereqs_dag=prereqs_dag,
        forward_dag_input=forward_dag  # Note the renamed parameter
    )
    
    # Load course availability directly
    availability_dict = parse_availability_csv(CSV_FILE_PATH)
    
    # Filter courses based on availability and electives
    courses_avail = {}
    
    if elective_courses:
        # If electives are specified, use only those
        for course in elective_courses:
            if course in availability_dict:
                courses_avail[course] = availability_dict[course]
    else:
        # If no electives specified, use all available courses except completed ones
        for course, terms in availability_dict.items():
            if course not in completed_courses:
                courses_avail[course] = terms
    
    # Add fixed courses to the plan
    if fixed_courses:
        for term, courses in fixed_courses.items():
            planner.fixed_core_course(term, courses)
    
    # Sort courses by availability (courses with fewer available terms first)
    courses_avail = {k: v for k, v in sorted(courses_avail.items(), key=lambda item: len(item[1]))}
    
    # Generate the plan
    planner.build_plan(courses_avail)
    
    # Format the result for the frontend
    plan_result = {}
    for term, courses in planner.schedule.items():
        if courses:  # Only include terms with courses
            plan_result[term] = courses

    # display_schedule
    planner.display_schedule()
    
    # Add additional metadata about the plan
    result = {
        "success": True,
        "plan": plan_result,
        "metadata": {
            "major": major,
            "startYear": start_year,
            "plannedYears": planned_years,
            "maxUnitsPerSemester": max_units_per_sem,
            "sessions": sessions,
            "completedCourses": completed_courses,
            "electiveCourses": elective_courses
        }
    }
    
    return jsonify(result), 200

@planner_bp.route('/course-availability', methods=['GET'])
def get_course_availability():
    """Get a list of all available courses and when they're offered"""
    try:
        # Ensure the CSV_FILE_PATH is correct and the file exists
        if not os.path.exists(CSV_FILE_PATH):
            return jsonify({"error": "Course availability data not found on server."}), 500
            
        availability_data = scape_read_csv(CSV_FILE_PATH)
        return jsonify({"courses": availability_data}), 200
    except Exception as e:
        # Log the error for debugging
        print(f"Error reading course availability: {e}")
        return jsonify({"error": "Failed to load course availability"}), 500

@planner_bp.route('/completed-suggestions', methods=['GET'])
def get_completed_suggestions():
    """Get suggested courses for the completed courses dropdown"""
    try:
        # Ensure the CSV_FILE_PATH is correct and the file exists
        if not os.path.exists(CSV_FILE_PATH):
            return jsonify({"error": "Course data for suggestions not found on server."}), 500

        df = pd.read_csv(CSV_FILE_PATH)
        # Assuming the 'Course' column contains the course IDs
        if 'Course' not in df.columns:
            return jsonify({"error": "Invalid course data format for suggestions."}), 500
            
        suggestions = df['Course'].tolist()
        return jsonify({"suggestions": suggestions}), 200
    except Exception as e:
        # Log the error for debugging
        print(f"Error generating completed course suggestions: {e}")
        return jsonify({"error": "Failed to load completed course suggestions"}), 500

@planner_bp.route('/course-prerequisites', methods=['GET'])
def get_all_course_prerequisites():
    """Fetch all courses and their parsed prerequisites."""
    try:
        courses = Course.query.all()
        prerequisites_map = {
            course.class_name: course.parsed_prerequisites
            for course in courses if course.class_name and course.parsed_prerequisites
        }
        return jsonify({"prerequisites": prerequisites_map}), 200
    except Exception as e:
        print(f"Error fetching course prerequisites: {e}") # Log error
        return jsonify({"error": "Failed to load course prerequisites"}), 500

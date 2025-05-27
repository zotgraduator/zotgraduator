from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import pandas as pd
import json # Import the json module
from planner import CoursePlanner # Assuming CoursePlanner is in the same directory or accessible
from scraper import scape_read_csv # Assuming scraper.py is accessible
# models.course and extensions.db might not be needed if this is the only db interaction here
# from models.course import Course # Import the Course model
# from extensions import db # Import db instance

planner_bp = Blueprint('planner', __name__)

# Determine the correct path to the CSV file relative to this file
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir) # This should be the 'backend' directory
CSV_FILE_PATH = os.path.join(backend_dir, 'courses_availability.csv')
PREREQS_JSON_FILE_PATH = os.path.join(current_dir, 'course_data_with_logical_prereqs.json') # Path to the JSON file
print(f"[Planner Routes] CSV_FILE_PATH resolved to: {CSV_FILE_PATH}")
print(f"[Planner Routes] PREREQS_JSON_FILE_PATH resolved to: {PREREQS_JSON_FILE_PATH}")

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
@jwt_required(optional=True) # Allow anonymous access or use JWT if available
def generate_plan_route():
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
    print("[Planner Routes] Attempting to get course availability.")
    if not os.path.exists(CSV_FILE_PATH):
        print(f"[Planner Routes] Error: CSV file not found at {CSV_FILE_PATH}")
        return jsonify({"error": "Course availability data not found on server."}), 500
    
    try:
        availability_data = scape_read_csv(CSV_FILE_PATH)
        print(f"[Planner Routes] Course availability data loaded. Number of courses: {len(availability_data)}")
        return jsonify({"courses": availability_data}), 200
    except Exception as e:
        print(f"[Planner Routes] Error reading course availability from CSV: {e}")
        return jsonify({"error": "Failed to load course availability"}), 500

@planner_bp.route('/completed-suggestions', methods=['GET'])
def get_completed_suggestions():
    print("[Planner Routes] Attempting to get completed course suggestions.")
    if not os.path.exists(CSV_FILE_PATH):
        print(f"[Planner Routes] Error: CSV file not found at {CSV_FILE_PATH} for suggestions.")
        return jsonify({"error": "Course data for suggestions not found on server."}), 500
        
    try:
        df = pd.read_csv(CSV_FILE_PATH)
        if 'Course' not in df.columns:
            print("[Planner Routes] Error: 'Course' column missing in CSV for suggestions.")
            return jsonify({"error": "Invalid course data format for suggestions."}), 500
            
        suggestions = df['Course'].tolist()
        print(f"[Planner Routes] Completed course suggestions loaded. Number of suggestions: {len(suggestions)}")
        return jsonify({"suggestions": suggestions}), 200
    except Exception as e:
        print(f"[Planner Routes] Error generating completed course suggestions from CSV: {e}")
        return jsonify({"error": "Failed to load completed course suggestions"}), 500

@planner_bp.route('/course-prerequisites', methods=['GET'])
def get_all_course_prerequisites():
    """Fetch all courses and their parsed prerequisites from JSON file."""
    print("[Planner Routes] Attempting to get all course prerequisites from JSON file.")
    if not os.path.exists(PREREQS_JSON_FILE_PATH):
        print(f"[Planner Routes] Error: JSON prerequisites file not found at {PREREQS_JSON_FILE_PATH}")
        return jsonify({"error": "Course prerequisites data not found on server."}), 500
    
    try:
        with open(PREREQS_JSON_FILE_PATH, 'r') as f:
            all_course_data = json.load(f)
        
        prerequisites_map = {
            class_name: course_data.get("parsed_prerequisites")
            for class_name, course_data in all_course_data.items()
            if course_data.get("parsed_prerequisites") is not None # Ensure there are prereqs
        }
        print(f"[Planner Routes] Created prerequisites_map from JSON with {len(prerequisites_map)} entries.")
        return jsonify({"prerequisites": prerequisites_map}), 200
    except Exception as e:
        print(f"[Planner Routes] Error fetching course prerequisites from JSON: {e}") # Log error
        return jsonify({"error": "Failed to load course prerequisites"}), 500

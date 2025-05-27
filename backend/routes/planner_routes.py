from flask import Blueprint, jsonify, request
import os
import json
from flask_jwt_extended import jwt_required, get_jwt_identity
from scraper import scape_read_csv
import pandas as pd

planner_bp = Blueprint('planner', __name__)

@planner_bp.route('/course-availability', methods=['GET'])
def get_course_availability():
    """Get course availability data"""
    try:
        # Determine the path to the CSV file
        csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                               'courses_availability.csv')
        
        # For Vercel deployment, use the data directly if file not found
        if not os.path.exists(csv_path):
            # Read the file included in the deployment
            df = pd.read_csv('courses_availability.csv')
            course_availability = {}
            for _, row in df.iterrows():
                course_id = row['Course']
                availability = row['Availability']
                course_availability[course_id] = [] if pd.isnull(availability) else availability.split('+')
        else:
            # Use the scraper function for local development
            course_availability = scape_read_csv(csv_path)
        
        return jsonify({
            "courses": course_availability
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@planner_bp.route('/course-prereqs', methods=['GET'])
def get_course_prereqs():
    """Get course prerequisites data"""
    # For now, return a simplified mock of course prerequisites
    prereqs = {
        "CS 161": ["ICS 46", "ICS 6D"],
        "CS 122A": ["ICS 33"],
        "INF 43": ["ICS 32"],
        "ICS 139W": ["ICS 32"]
    }
    
    return jsonify({
        "prerequisites": prereqs
    }), 200

@planner_bp.route('/completed-suggestions', methods=['GET'])
def get_completed_suggestions():
    """Get suggested courses for the completed courses dropdown"""
    # Return a list of common courses that students might have completed
    suggestions = [
        "ICS 31", "ICS 32", "ICS 33", "ICS 45C", "ICS 45J", "ICS 46", "ICS 51",
        "ICS 6B", "ICS 6D", "ICS 6N", "MATH 2A", "MATH 2B", "STATS 67"
    ]
    
    return jsonify({
        "suggestions": suggestions
    }), 200

@planner_bp.route('/generate', methods=['POST'])
def generate_plan():
    """Generate a course plan based on provided parameters"""
    data = request.get_json()
    
    try:
        # Extract parameters
        major = data.get('major', 'Computer Science')
        start_year = data.get('startYear', 2023)
        planned_years = data.get('plannedYears', 4)
        max_units = data.get('maxUnitsPerSemester', 16)
        completed_courses = data.get('completedCourses', [])
        elective_courses = data.get('electiveCourses', [])
        sessions = data.get('sessions', ['Fall', 'Winter', 'Spring'])
        
        # For demo purposes, return a mock plan
        mock_plan = {}
        
        # Generate a term for each session in each planned year
        for year in range(planned_years):
            for session in sessions:
                term_key = f"{session}{year}"
                
                # Add some courses based on term
                if year == 0 and session == "Fall":
                    mock_plan[term_key] = ["ICS 6B", "CS 122A", "INF 43", "STATS 67"]
                elif year == 0 and session == "Winter":
                    mock_plan[term_key] = ["ICS 6D", "ICS 139W", "INF 101", "INF 113"]
                elif year == 0 and session == "Spring":
                    mock_plan[term_key] = ["CS 122B", "INF 115", "INF 131", "INF 133"]
                elif year == 1 and session == "Fall":
                    mock_plan[term_key] = ["CS 161", "CS 171", "INF 141", "INF 121"]
                elif year == 1 and session == "Winter":
                    mock_plan[term_key] = ["CS 132", "CS 178", "INF 151", "INF 143"]
                else:
                    # Add some of the elective courses for other terms
                    available_electives = [course for course in elective_courses 
                                          if course not in completed_courses]
                    term_courses = available_electives[:3]
                    # Pad with generic courses if needed
                    while len(term_courses) < 3:
                        term_courses.append(f"Elective {len(term_courses) + 1}")
                    
                    mock_plan[term_key] = term_courses
        
        return jsonify({
            "plan": mock_plan
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

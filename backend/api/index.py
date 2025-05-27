from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import pandas as pd
import json
import traceback
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Configure CORS
frontend_url = os.environ.get('FRONTEND_URL', 'https://zotgraduator.vercel.app')
CORS(app, resources={r"/*": {
    "origins": [frontend_url, "http://localhost:3000"],
    "supports_credentials": True,
    "allow_headers": ["Content-Type", "Authorization"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}})

# Add error handlers
@app.errorhandler(500)
def handle_500(e):
    logger.error(f"500 error: {str(e)}")
    logger.error(traceback.format_exc())
    return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.errorhandler(404)
def handle_404(e):
    return jsonify({"error": "Not found", "message": str(e)}), 404

# Root route for health check
@app.route('/', methods=['GET'])
def root():
    return jsonify({"status": "API is running"}), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    logger.info("Health check endpoint called")
    return jsonify({"status": "API is running!"}), 200

# Course availability endpoint
@app.route('/api/planner/course-availability', methods=['GET'])
def get_course_availability():
    """Get course availability data"""
    try:
        logger.info("Loading course availability data")
        
        # Path to the CSV file - assuming it's in the root directory
        csv_path = 'courses_availability.csv'
        
        # Read the CSV file using pandas
        df = pd.read_csv(csv_path)
        
        # Convert to dictionary
        course_dict = {}
        for _, row in df.iterrows():
            course_id = row['Course']
            availability = row['Availability']
            if pd.notna(availability):
                course_dict[course_id] = availability.split('+')
            else:
                course_dict[course_id] = []
        
        logger.info(f"Loaded {len(course_dict)} courses")
        return jsonify({"courses": course_dict}), 200
    
    except Exception as e:
        logger.error(f"Error in course-availability: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# Course prerequisites endpoint
@app.route('/api/planner/course-prereqs', methods=['GET'])
def get_course_prereqs():
    """Get course prerequisites data"""
    try:
        # Return a set of common prerequisites
        prereqs = {
            "CS 161": ["ICS 46", "ICS 6D"],
            "CS 122A": ["ICS 33"],
            "INF 43": ["ICS 32"],
            "ICS 139W": ["ICS 32"],
            "CS 122B": ["CS 122A"],
            "ICS 46": ["ICS 45C"],
            "ICS 45C": ["ICS 33"],
            "ICS 33": ["ICS 32"],
            "ICS 32": ["ICS 31"],
            "INF 101": ["INF 43"],
            "INF 113": ["INF 43"],
            "INF 115": ["INF 43"],
            "INF 131": ["INF 43"]
        }
        
        return jsonify({"prerequisites": prereqs}), 200
    
    except Exception as e:
        logger.error(f"Error in course-prereqs: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# Completed course suggestions endpoint
@app.route('/api/planner/completed-suggestions', methods=['GET'])
def get_completed_suggestions():
    """Get suggested courses for the completed courses dropdown"""
    try:
        # Return common courses that students might have completed
        suggestions = [
            "ICS 31", "ICS 32", "ICS 33", "ICS 45C", "ICS 45J", "ICS 46", "ICS 51",
            "ICS 6B", "ICS 6D", "ICS 6N", "MATH 2A", "MATH 2B", "STATS 67"
        ]
        
        return jsonify({"suggestions": suggestions}), 200
    
    except Exception as e:
        logger.error(f"Error in completed-suggestions: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# Plan generation endpoint
@app.route('/api/planner/generate', methods=['POST'])
def generate_plan():
    """Generate a course plan based on provided parameters"""
    try:
        data = request.get_json()
        logger.info(f"Received plan generation request: {json.dumps(data)}")
        
        # Extract parameters
        major = data.get('major', 'Computer Science')
        start_year = data.get('startYear', 2023)
        planned_years = data.get('plannedYears', 4)
        max_units = data.get('maxUnitsPerSemester', 16)
        completed_courses = data.get('completedCourses', [])
        elective_courses = data.get('electiveCourses', [])
        sessions = data.get('sessions', ['Fall', 'Winter', 'Spring'])
        
        # Get course availability data
        csv_path = 'courses_availability.csv'
        
        # Create a CoursePlanner instance directly
        import pandas as pd
        
        # Read the CSV data
        df = pd.read_csv(csv_path)
        
        # Convert to dictionary format
        course_availability = {}
        for _, row in df.iterrows():
            course_id = row['Course']
            availability = row['Availability']
            if pd.notna(availability):
                course_availability[course_id] = availability.split('+')
            else:
                course_availability[course_id] = []
        
        # Filter to include only requested electives and those with availability data
        filtered_courses = {}
        for course in elective_courses:
            if course in course_availability:
                filtered_courses[course] = course_availability[course]
        
        # Generate course schedule based on prerequisites
        from collections import defaultdict
        
        # Get course prerequisites
        prereqs = {
            "CS 161": ["ICS 46", "ICS 6D"],
            "CS 122A": ["ICS 33"],
            "INF 43": ["ICS 32"],
            "ICS 139W": ["ICS 32"],
            "CS 122B": ["CS 122A"],
            "ICS 46": ["ICS 45C"],
            "ICS 45C": ["ICS 33"],
            "ICS 33": ["ICS 32"],
            "ICS 32": ["ICS 31"],
            "INF 101": ["INF 43"],
            "INF 113": ["INF 43"],
            "INF 115": ["INF 43"],
            "INF 131": ["INF 43"]
        }
        
        # Create a DAG of courses and their prerequisites
        course_dag = defaultdict(list)
        for course, course_prereqs in prereqs.items():
            course_dag[course] = course_prereqs
            for prereq in course_prereqs:
                if prereq not in course_dag:
                    course_dag[prereq] = []
        
        # Track which courses have been scheduled or completed
        scheduled_courses = set(completed_courses)
        
        # Initialize the plan
        plan = defaultdict(list)
        
        # Core courses based on major
        core_courses = []
        if major == "Software Engineering":
            core_courses = [
                ("Fall0", ["ICS 6B", "CS 122A", "INF 43", "STATS 67"]),
                ("Winter0", ["ICS 6D", "ICS 139W", "INF 101", "INF 113"]),
                ("Spring0", ["CS 122B", "INF 115", "INF 131", "INF 133"]),
                ("Fall1", ["CS 161", "CS 171", "INF 141", "INF 121"])
            ]
        elif major == "Computer Science":
            core_courses = [
                ("Fall0", ["ICS 6B", "CS 122A", "ICS 53", "STATS 67"]),
                ("Winter0", ["ICS 6D", "ICS 139W", "CS 132", "CS 143A"]),
                ("Spring0", ["CS 122B", "CS 161", "CS 165", "CS 152"]),
                ("Fall1", ["CS 163", "CS 171", "CS 178", "CS 121"])
            ]
        elif major == "Informatics":
            core_courses = [
                ("Fall0", ["ICS 6B", "INF 43", "INF 113", "STATS 67"]),
                ("Winter0", ["ICS 6D", "ICS 139W", "INF 101", "INF 133"]),
                ("Spring0", ["INF 115", "INF 131", "INF 121", "INF 141"]),
                ("Fall1", ["INF 161", "INF 151", "INF 191A", "STATS 7"])
            ]
        else:  # Data Science
            core_courses = [
                ("Fall0", ["ICS 6B", "ICS 53", "STATS 67", "STATS 120A"]),
                ("Winter0", ["ICS 6D", "ICS 139W", "STATS 68", "STATS 120B"]),
                ("Spring0", ["CS 122A", "CS 178", "STATS 111", "STATS 120C"]),
                ("Fall1", ["CS 122B", "CS 161", "STATS 170A", "STATS 8"])
            ]
        
        # Add core courses to the plan
        for term, courses in core_courses:
            plan[term] = [c for c in courses if c not in scheduled_courses]
            scheduled_courses.update(courses)
        
        # Schedule elective courses
        def can_schedule(course, term_idx):
            # Check if all prerequisites are scheduled in earlier terms
            if course not in course_dag:
                return True
                
            prereqs = course_dag[course]
            for prereq in prereqs:
                if prereq not in scheduled_courses:
                    return False
                    
            # Check if course is available in this term
            if course in filtered_courses:
                term_season = term_idx.replace(str(term_idx[-1]), "")
                if term_season not in filtered_courses[course]:
                    return False
                    
            return True
        
        # Try to schedule remaining elective courses
        for year in range(planned_years):
            for season in sessions:
                term = f"{season}{year}"
                
                # Skip if term already has max courses
                if len(plan[term]) >= 4:
                    continue
                    
                # Try to schedule available courses
                for course in elective_courses:
                    if course in scheduled_courses:
                        continue
                        
                    if can_schedule(course, term) and len(plan[term]) < 4:
                        plan[term].append(course)
                        scheduled_courses.add(course)
        
        # Convert defaultdict to regular dict for JSON serialization
        final_plan = dict(plan)
        
        logger.info(f"Generated plan with {len(final_plan)} terms")
        return jsonify({"plan": final_plan}), 200
    
    except Exception as e:
        logger.error(f"Error in generate plan: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# For Vercel serverless
handler = app

if __name__ == "__main__":
    # Only for local development
    app.run(debug=True)

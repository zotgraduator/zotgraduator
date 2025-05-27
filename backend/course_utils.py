import json
import os
import pandas as pd

# Define mappings between shorthand and full course codes
COURSE_CODE_MAPPINGS = {
    'CS': 'COMPSCI',
    'CSE': 'CSE',
    'DAT': 'DATA',
    'GDI': 'GDIM',
    'ICS': 'I&C SCI',
    'INF': 'IN4MATX',
    'SE': 'SWE',
    'STA': 'STATS',
    'MATH': 'MATH'
}

# Reverse mappings for converting from full names to shorthand
REVERSE_MAPPINGS = {v: k for k, v in COURSE_CODE_MAPPINGS.items()}

def load_course_prerequisites():
    """Load course prerequisites from JSON file"""
    # Get the path to the JSON file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(current_dir, '../frontend/src/data/course_data_with_logical_prereqs.json')
    
    # Fall back to an alternative path if the first one doesn't exist
    if not os.path.exists(json_path):
        json_path = os.path.join(current_dir, '../data/course_data_with_logical_prereqs.json')
    
    # Check if file exists, return empty dict if not
    if not os.path.exists(json_path):
        print(f"Warning: Could not find prerequisites file at {json_path}")
        return {}
    
    # Load JSON data
    with open(json_path, 'r', encoding='utf-8') as f:
        course_data = json.load(f)
    
    # Extract prerequisites into a clean format
    prereqs_dict = {}
    for course_id, course_info in course_data.items():
        if 'parsed_prerequisites' in course_info and course_info['parsed_prerequisites'] != 'N/A':
            prereqs_dict[course_id] = course_info['parsed_prerequisites']
    
    return prereqs_dict

def short_to_full_course_code(short_code):
    """Convert a shorthand course code to its full version"""
    if ' ' not in short_code:
        return short_code
    
    dept, num = short_code.split(' ', 1)
    if dept in COURSE_CODE_MAPPINGS:
        return f"{COURSE_CODE_MAPPINGS[dept]} {num}"
    return short_code

def full_to_short_course_code(full_code):
    """Convert a full course code to its shorthand version"""
    if ' ' not in full_code:
        return full_code
    
    dept, num = full_code.split(' ', 1)
    if dept in REVERSE_MAPPINGS:
        return f"{REVERSE_MAPPINGS[dept]} {num}"
    return full_code

def extract_direct_prerequisites(prereq_structure):
    """Extract a flat list of direct prerequisites from a logical structure"""
    prereqs = []
    
    if isinstance(prereq_structure, str):
        return [prereq_structure]
    elif isinstance(prereq_structure, dict):
        if 'and' in prereq_structure:
            for item in prereq_structure['and']:
                prereqs.extend(extract_direct_prerequisites(item))
        elif 'or' in prereq_structure:
            # For OR relationships, we'll include all options as potential prerequisites
            for item in prereq_structure['or']:
                prereqs.extend(extract_direct_prerequisites(item))
    
    return prereqs

def get_all_prerequisites(course_id, prereqs_dict):
    """Get all prerequisites for a course including nested ones"""
    if course_id not in prereqs_dict:
        return []
    
    # Get direct prerequisites
    direct_prereqs = extract_direct_prerequisites(prereqs_dict[course_id])
    
    # Convert to short codes for matching with availability data
    short_prereqs = [full_to_short_course_code(p) for p in direct_prereqs]
    
    return short_prereqs

def create_prerequisites_dag(prereqs_dict):
    """Create a prerequisite directed acyclic graph from the prerequisites dictionary"""
    dag = {}
    
    # Process each course
    for course_id, prereq_structure in prereqs_dict.items():
        # Convert to short code
        short_course = full_to_short_course_code(course_id)
        
        # Get all prerequisites in short code format
        prereqs = get_all_prerequisites(course_id, prereqs_dict)
        
        # Add to DAG
        dag[short_course] = prereqs
    
    return dag

def create_forward_dag(prereqs_dag):
    """Create a forward DAG from a prerequisite DAG"""
    forward_dag = {}
    
    # Initialize all courses in the forward DAG
    for course in prereqs_dag:
        forward_dag[course] = []
    
    # For each course and its prerequisites
    for course, prereqs in prereqs_dag.items():
        # For each prerequisite, add the current course as a forward dependency
        for prereq in prereqs:
            if prereq not in forward_dag:
                forward_dag[prereq] = []
            forward_dag[prereq].append(course)
    
    return forward_dag

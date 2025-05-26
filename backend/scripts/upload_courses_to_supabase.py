import json
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import time

# Load environment variables (if using .env file)
load_dotenv()

# Supabase configuration
url = "https://lgsoszwnwkewajctxsud.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc29zendud2tld2FqY3R4c3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMTE5OTYsImV4cCI6MjA2Mzc4Nzk5Nn0.poGzn6fvWJt9uygLSuOtKb7ppDTTR3VYLSXE2Doqlgo"

# Initialize Supabase client
supabase: Client = create_client(url, key)

def process_json_field(value, field_name=None):
    """Process fields that need to be JSON arrays or null"""
    if value == "N/A" or not value:
        return None
    
    # Special handling for parsed_prerequisites field
    if field_name == "parsed_prerequisites":
        # If it's a simple string (like "I&C SCI 45C"), convert it to an array format
        if isinstance(value, str):
            return [value]
        # If it's a dict (complex prerequisites), wrap it in an array
        elif isinstance(value, dict):
            return [value]
    
    # For arrays like same_as and overlaps_with, convert to JSON array
    if isinstance(value, str):
        # Split by comma if it contains commas
        if "," in value:
            return [item.strip() for item in value.split(",")]
        else:
            return [value]
    
    # If it's already a structure (like parsed_prerequisites), return as is
    return value

def upload_courses():
    # Get the path to the JSON file
    script_dir = Path(__file__).parent
    json_file_path = script_dir / "course_data_with_logical_prereqs.json"
    
    print(f"Reading data from: {json_file_path}")
    
    # Read the JSON file
    with open(json_file_path, 'r') as file:
        course_data = json.load(file)
    
    print(f"Found {len(course_data)} courses in the file")
    
    # Counter for successful uploads
    success_count = 0
    error_count = 0
    
    # Process and upload each course
    for class_name, details in course_data.items():
        try:
            # Convert units to integer
            units = int(details.get("units", "0").split("-")[0]) if details.get("units") else None
            
            # Create the course record
            course_record = {
                "class_name": class_name,
                "title": details.get("title", ""),
                "description": details.get("description"),
                "units": units,
                "parsed_prerequisites": process_json_field(details.get("parsed_prerequisites"), "parsed_prerequisites"),
                "overlaps_with": process_json_field(details.get("overlaps_with")),
                "same_as": process_json_field(details.get("same_as")),
                "restriction": details.get("restriction"),
                "grading_option": details.get("grading_option")
            }
            
            # Insert the record into the database
            result = supabase.table("Course").insert(course_record).execute()
            
            # Check if the insertion was successful
            if result.data:
                success_count += 1
                print(f"Uploaded: {class_name}")
            else:
                error_count += 1
                print(f"Failed to upload: {class_name}")
                
            # Small delay to avoid rate limiting
            time.sleep(0.1)
            
        except Exception as e:
            error_count += 1
            print(f"Error uploading {class_name}: {str(e)}")
    
    print(f"Upload complete. Successfully uploaded {success_count} courses. Errors: {error_count}")

if __name__ == "__main__":
    upload_courses()

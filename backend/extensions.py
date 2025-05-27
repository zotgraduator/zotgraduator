from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
import os
import supabase

db = SQLAlchemy()
jwt = JWTManager()

# Initialize Supabase client
def get_supabase_client():
    url = os.environ.get('SUPABASE_URL') or 'https://lgsoszwnwkewajctxsud.supabase.co'
    key = os.environ.get('SUPABASE_KEY') or 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc29zendud2tld2FqY3R4c3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMTE5OTYsImV4cCI6MjA2Mzc4Nzk5Nn0.poGzn6fvWJt9uygLSuOtKb7ppDTTR3VYLSXE2Doqlgo'
    
    return supabase.create_client(url, key)

supabase_client = get_supabase_client()

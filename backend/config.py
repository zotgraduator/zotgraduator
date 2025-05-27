import os
from datetime import timedelta
import streamlit as st
from typing import NamedTuple
from utils import update_plot_dag

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    
    # Supabase connection information
    SUPABASE_URL = os.environ.get('SUPABASE_URL') or 'https://lgsoszwnwkewajctxsud.supabase.co'
    SUPABASE_KEY = os.environ.get('SUPABASE_KEY') or 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc29zendud2tld2FqY3R4c3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMTE5OTYsImV4cCI6MjA2Mzc4Nzk5Nn0.poGzn6fvWJt9uygLSuOtKb7ppDTTR3VYLSXE2Doqlgo'
    
    # Database connection
    # For PostgreSQL with Supabase (format: postgresql://user:password@host:port/database)
    # You'll need to get the actual connection string from Supabase dashboard
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///zotgraduator.db'
    
    # For local development, use SQLite
    if os.environ.get('FLASK_ENV') == 'development':
        SQLALCHEMY_DATABASE_URI = 'sqlite:///zotgraduator.db'
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS settings - Allow requests from frontend
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://zotgraduator.vercel.app')
    CORS_ORIGINS = [FRONTEND_URL, "http://localhost:3000"]
    
    # API URL for frontend to use
    API_URL = os.environ.get('API_URL') or 'https://zotgraduator-backend.vercel.app/api'

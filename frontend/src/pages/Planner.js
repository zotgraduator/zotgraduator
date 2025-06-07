import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { plansService } from '../services/plansService';
import '../styles/Planner.css';
import api from '../api/api';

function Planner() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're editing an existing plan
  const editingPlan = location.state?.plan || null;
  const isEditing = !!editingPlan;
  
  const [availableCourses, setAvailableCourses] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentYear, setCurrentYear] = useState(
    editingPlan ? editingPlan.start_year : new Date().getFullYear()
  );
  const [years, setYears] = useState([]);
  const [plan, setPlan] = useState({});
  const [draggedCourse, setDraggedCourse] = useState(null);
  const [showWarning, setShowWarning] = useState(null);
  
  // Save plan state
  const [planName, setPlanName] = useState(editingPlan?.name || '');
  const [planDescription, setPlanDescription] = useState(editingPlan?.description || '');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Terms for the academic year
  const terms = ['Fall', 'Winter', 'Spring'];
  
  // Initialize years and plan structure
  useEffect(() => {
    let initialYears;
    
    if (isEditing && editingPlan.planned_years) {
      initialYears = Array.from({ length: editingPlan.planned_years }, (_, i) => i);
    } else {
      initialYears = [0, 1, 2, 3]; // 4 years by default
    }
    
    setYears(initialYears);
    
    // Initialize plan structure
    const initialPlan = {};
    
    if (isEditing && editingPlan.plan_data) {
      // Load existing plan data
      Object.assign(initialPlan, editingPlan.plan_data);
    } else {
      // Create empty plan structure
      initialYears.forEach(yearOffset => {
        const academicYear = currentYear + yearOffset;
        terms.forEach(term => {
          initialPlan[`${term}${academicYear}`] = [];
        });
      });
    }
    
    setPlan(initialPlan);
  }, [currentYear, isEditing, editingPlan]);
  
  // Fetch course availability data
  useEffect(() => {
    const fetchCourseAvailability = async () => {
      try {
        setLoading(true);
        const response = await api.planner.getCourseAvailability();
        setAvailableCourses(response.data.courses);
        setFilteredCourses(Object.keys(response.data.courses));
      } catch (err) {
        console.error('Error fetching course availability:', err);
        setError('Failed to load course availability data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseAvailability();
  }, []);
  
  // Filter courses based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCourses(Object.keys(availableCourses));
      return;
    }
    
    const filtered = Object.keys(availableCourses).filter(
      course => course.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCourses(filtered);
  }, [searchTerm, availableCourses]);
  
  // Save plan function
  const handleSavePlan = async () => {
    if (!currentUser) {
      setError('You must be logged in to save plans');
      return;
    }
    
    if (!planName.trim()) {
      setError('Please enter a plan name');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const planData = {
        name: planName.trim(),
        description: planDescription.trim(),
        plan: plan,
        currentYear,
        years
      };
      
      if (isEditing) {
        await plansService.updatePlan(editingPlan.id, planData);
      } else {
        await plansService.savePlan(planData);
      }
      
      setSaveSuccess(true);
      setShowSaveDialog(false);
      
      // Show success message
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error saving plan:', err);
      setError(err.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };
  
  // Show save dialog
  const handleShowSaveDialog = () => {
    if (!currentUser) {
      setError('You must be logged in to save plans');
      return;
    }
    setShowSaveDialog(true);
  };
  
  // Close save dialog
  const handleCloseSaveDialog = () => {
    setShowSaveDialog(false);
    setError(null);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle drag start event
  const handleDragStart = (e, course) => {
    setDraggedCourse(course);
    e.dataTransfer.setData('text/plain', course);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle drag over event
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  // Handle drop event
  const handleDrop = (e, termId) => {
    e.preventDefault();
    
    if (!draggedCourse) return;
    
    // Check if course is already in the plan
    const isAlreadyInPlan = Object.values(plan).some(
      termCourses => termCourses.includes(draggedCourse)
    );
    
    // Extract term and year from termId
    const term = termId.replace(/\d+$/, '');
    const year = parseInt(termId.match(/\d+$/)[0]);
    
    // Check if course is available in this term
    const isTermAvailable = availableCourses[draggedCourse]?.includes(term);
    
    // If moving from one term to another, remove from original term
    if (isAlreadyInPlan) {
      // Create updated plan with course removed from all terms
      const updatedPlan = {};
      Object.entries(plan).forEach(([key, courses]) => {
        updatedPlan[key] = courses.filter(c => c !== draggedCourse);
      });
      
      // Add to new term
      updatedPlan[termId] = [...updatedPlan[termId], draggedCourse];
      setPlan(updatedPlan);
      
      // Show warning if needed
      if (!isTermAvailable) {
        setShowWarning({
          course: draggedCourse,
          term,
          message: `Warning: ${draggedCourse} is typically not offered in ${term}!`
        });
        setTimeout(() => setShowWarning(null), 3000);
      } else {
        setShowWarning(null);
      }
    } else {
      // Add course to the selected term
      setPlan(prev => ({
        ...prev,
        [termId]: [...prev[termId], draggedCourse]
      }));
      
      // Show warning if needed
      if (!isTermAvailable) {
        setShowWarning({
          course: draggedCourse,
          term,
          message: `Warning: ${draggedCourse} is typically not offered in ${term}!`
        });
        setTimeout(() => setShowWarning(null), 3000);
      } else {
        setShowWarning(null);
      }
    }
    
    setDraggedCourse(null);
  };
  
  // Handle removing a course from a term
  const handleRemoveCourse = (termId, course) => {
    setPlan(prev => ({
      ...prev,
      [termId]: prev[termId].filter(c => c !== course)
    }));
  };
  
  // Add a year to the plan
  const addYear = () => {
    const newYearOffset = Math.max(...years) + 1;
    setYears([...years, newYearOffset]);
    
    // Add new terms to the plan
    const newYear = currentYear + newYearOffset;
    const updatedPlan = { ...plan };
    
    terms.forEach(term => {
      updatedPlan[`${term}${newYear}`] = [];
    });
    
    setPlan(updatedPlan);
  };
  
  // Remove the last year from the plan
  const removeYear = () => {
    if (years.length <= 1) return;
    
    const lastYearOffset = Math.max(...years);
    const newYears = years.filter(y => y !== lastYearOffset);
    setYears(newYears);
    
    // Remove terms from the plan
    const lastYear = currentYear + lastYearOffset;
    const updatedPlan = { ...plan };
    
    terms.forEach(term => {
      delete updatedPlan[`${term}${lastYear}`];
    });
    
    setPlan(updatedPlan);
  };
  
  // Update the starting year
  const updateStartYear = (e) => {
    const newStartYear = parseInt(e.target.value);
    setCurrentYear(newStartYear);
  };
  
  // Check if a course can be offered in a term
  const isAvailableInTerm = (course, term) => {
    return availableCourses[course]?.includes(term);
  };
  
  // Generate years for dropdown selection
  const yearOptions = Array.from(
    { length: 10 }, 
    (_, i) => new Date().getFullYear() - 5 + i
  );
  
  // Calculate total courses and units
  const calculateStats = () => {
    let totalCourses = 0;
    
    Object.values(plan).forEach(courses => {
      totalCourses += courses.length;
    });
    
    // Assuming each course is typically 4 units
    const totalUnits = totalCourses * 4;
    
    return { totalCourses, totalUnits };
  };
  
  const { totalCourses, totalUnits } = calculateStats();
  
  // Create a function to generate a year of terms
  const renderYear = (yearOffset) => {
    const academicYear = currentYear + yearOffset;
    
    return (
      <div className="planner-year" key={yearOffset}>
        <h3 className="year-header">Year {yearOffset + 1} ({academicYear})</h3>
        <div className="terms-row">
          {terms.map(term => {
            const termId = `${term}${academicYear}`;
            return (
              <div 
                key={termId} 
                className="term-card"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, termId)}
              >
                <div className="term-header">
                  <h4>{term} {academicYear}</h4>
                </div>
                <div className="term-courses">
                  {plan[termId]?.map(course => (
                    <div 
                      key={`${termId}-${course}`} 
                      className={`course-card ${!isAvailableInTerm(course, term) ? 'course-warning' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, course)}
                    >
                      <span className="course-code">{course}</span>
                      <button 
                        className="remove-course" 
                        onClick={() => handleRemoveCourse(termId, course)}
                        title="Remove course"
                      >
                        ×
                      </button>
                      {!isAvailableInTerm(course, term) && (
                        <span className="availability-warning-icon" title={`${course} is typically not offered in ${term}`}>
                          ⚠️
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="planner-page">
      {/* Loading Overlay with Bokeh Effect */}
      {loading && (
        <div className="loading-overlay">
          <div className="bokeh-container">
            <div className="bokeh-circle bokeh-1"></div>
            <div className="bokeh-circle bokeh-2"></div>
            <div className="bokeh-circle bokeh-3"></div>
            <div className="bokeh-circle bokeh-4"></div>
            <div className="bokeh-circle bokeh-5"></div>
            <div className="bokeh-circle bokeh-6"></div>
            <div className="bokeh-circle bokeh-7"></div>
            <div className="bokeh-circle bokeh-8"></div>
          </div>
          <div className="loading-text">Loading courses...</div>
        </div>
      )}
      
      <div className="planner-header">
        <h2>{isEditing ? `Editing: ${editingPlan.name}` : 'Course Planner'}</h2>
        <p className="subtitle">Drag courses to build your personalized academic plan</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Save Dialog Modal */}
      {showSaveDialog && (
        <div className="modal-overlay" onClick={handleCloseSaveDialog}>
          <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{isEditing ? 'Update Plan' : 'Save Academic Plan'}</h3>
            
            <div className="form-group">
              <label htmlFor="plan-name">Plan Name:</label>
              <input
                id="plan-name"
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Enter plan name..."
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="plan-description">Description (optional):</label>
              <textarea
                id="plan-description"
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="Enter plan description..."
                rows="3"
              />
            </div>
            
            <div className="dialog-actions">
              <button 
                className="cancel-button" 
                onClick={handleCloseSaveDialog}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                className="save-button" 
                onClick={handleSavePlan}
                disabled={saving || !planName.trim()}
              >
                {saving ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="planner-controls">
        <div className="year-controls">
          <label htmlFor="start-year">Starting Year:</label>
          <select 
            id="start-year" 
            value={currentYear} 
            onChange={updateStartYear}
            className="year-select"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <button className="add-year-button" onClick={addYear}>
            Add Year
          </button>
          
          <button 
            className="remove-year-button" 
            onClick={removeYear}
            disabled={years.length <= 1}
          >
            Remove Year
          </button>
        </div>
        
        <div className="plan-stats">
          <button 
            className="save-plan-button" 
            onClick={handleShowSaveDialog}
            disabled={saving}
          >
            {saving ? 'Saving...' : (isEditing ? 'Update Plan' : 'Save Plan')}
          </button>
          
          {saveSuccess && (
            <div className="save-success-message">
              Plan saved successfully! ✅
            </div>
          )}
          
          <div className="stat-item">
            <span className="stat-label">Total Courses:</span>
            <span className="stat-value">{totalCourses}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Units:</span>
            <span className="stat-value">{totalUnits}</span>
          </div>
        </div>
      </div>
      
      <div className="planner-layout">
        {/* Course Selection Sidebar */}
        <div className="courses-sidebar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="course-search"
            />
          </div>
          
          <div className="courses-list-header">
            <h3>Available Courses</h3>
            <span className="courses-count">{filteredCourses.length} courses</span>
          </div>
          
          {loading ? (
            <div className="loading-indicator">Loading courses...</div>
          ) : (
            <div className="courses-list">
              {filteredCourses.map(course => (
                <div 
                  key={course} 
                  className="course-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, course)}
                >
                  <span className="course-code">{course}</span>
                  <div className="term-availability">
                    {availableCourses[course]?.map(term => (
                      <span 
                        key={`${course}-${term}`} 
                        className={`term-badge ${term.toLowerCase()}`}
                        title={`Offered in ${term}`}
                      >
                        {term.charAt(0)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              
              {filteredCourses.length === 0 && (
                <div className="no-courses-message">
                  No courses match your search.
                </div>
              )}
            </div>
          )}
          
          <div className="sidebar-instructions">
            <h4>Instructions</h4>
            <p>Drag courses from this list and drop them into the terms on the right to build your academic plan.</p>
            <p><strong>Term Availability</strong>:</p>
            <div className="term-legend">
              <div className="legend-item">
                <span className="term-badge fall">F</span>
                <span>Fall</span>
              </div>
              <div className="legend-item">
                <span className="term-badge winter">W</span>
                <span>Winter</span>
              </div>
              <div className="legend-item">
                <span className="term-badge spring">S</span>
                <span>Spring</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Calendar Plan View */}
        <div className="calendar-view">
          {years.map(yearOffset => renderYear(yearOffset))}
        </div>
      </div>
      
      {showWarning && (
        <div className="term-warning-popup">
          {showWarning.message}
        </div>
      )}
    </div>
  );
}

export default Planner;

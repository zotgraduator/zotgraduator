import React, { useState, useEffect, useRef } from 'react';
import '../styles/Optimizer.css';
import SearchableMultiSelect from '../components/SearchableMultiSelect';
import api from '../api/api';

function Optimizer() {
  const currentYear = new Date().getFullYear();
  const dropdownRef = useRef(null);
  const sidebarRef = useRef(null);
  
  // State for sidebar configurations
  const [majorOptions] = useState(['Software Engineering', 'Computer Science', 'Informatics', 'Data Science']);
  const [major, setMajor] = useState('Software Engineering');
  
  const [startYear, setStartYear] = useState(currentYear);
  const [plannedYears, setPlannedYears] = useState(4);
  const [maxUnitsPerSemester, setMaxUnitsPerSemester] = useState(16);
  
  // State for course options from backend
  const [electiveOptions, setElectiveOptions] = useState([]);
  const [electiveCourses, setElectiveCourses] = useState([]);
  
  const [completedOptions, setCompletedOptions] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  
  // State for sidebar visibility
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // State for loading status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for collapsible sections
  const [collapsedSections, setCollapsedSections] = useState({
    major: false,
    academicYears: false,
    plannedYears: false,
    maxUnits: false,
    electives: false,
    completed: false
  });

  // State for expandable rows in the table
  const [expandedRows, setExpandedRows] = useState({});

  // State for the generated plan
  const [plans, setPlans] = useState([]);

  // State for sessions/terms
  const [sessions] = useState(['Fall', 'Winter', 'Spring']);
  
  // Add state for course prerequisites
  const [coursePrereqs, setCoursePrereqs] = useState({});

  // Fetch course availability, prerequisites, and suggestions on component mount
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Get course availability
        const availabilityResponse = await api.planner.getCourseAvailability();
        const coursesList = Object.keys(availabilityResponse.data.courses);
        setElectiveOptions(coursesList);
        
        // Get course prerequisites
        const prereqsResponse = await api.planner.getCoursePrereqs();
        setCoursePrereqs(prereqsResponse.data.prerequisites);
        
        // Get completed course suggestions
        const suggestionsResponse = await api.planner.getCompletedSuggestions();
        setCompletedOptions(suggestionsResponse.data.suggestions);
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course data. Please try again later.');
      }
    };
    
    fetchCourseData();
  }, []);

  // Toggle section collapse state
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Toggle row expansion
  const toggleRow = (row) => {
    setExpandedRows(prev => ({
      ...prev,
      [row]: !prev[row]
    }));
  };

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // Handle major selection change
  const handleMajorChange = (e) => {
    setMajor(e.target.value);
  };

  // Handle start year change
  const handleStartYearChange = (e) => {
    const value = parseInt(e.target.value);
    setStartYear(value);
  };

  // Handle multi-select elective courses change
  const handleElectiveCoursesChange = (selectedOptions) => {
    setElectiveCourses(selectedOptions);
  };

  // Handle multi-select completed courses change
  const handleCompletedCoursesChange = (selectedOptions) => {
    setCompletedCourses(selectedOptions);
  };

  // Generate a plan based on current settings
  const generatePlan = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const planData = {
        major,
        startYear,
        plannedYears,
        maxUnitsPerSemester,
        completedCourses,
        electiveCourses,
        sessions
      };
      
      const response = await api.planner.generatePlan(planData);
      
      // Transform the plan data for the UI
      const planResult = response.data.plan;
      const formattedPlans = [];
      
      // Sort the terms to ensure proper ordering
      const sortedTerms = Object.keys(planResult).sort((a, b) => {
        const seasonA = a.replace(/\d+$/, '');
        const seasonB = b.replace(/\d+$/, '');
        const yearA = parseInt(a.match(/\d+$/)[0]);
        const yearB = parseInt(b.match(/\d+$/)[0]);
        
        if (yearA !== yearB) return yearA - yearB;
        
        const seasonOrder = { Fall: 0, Winter: 1, Spring: 2, Summer: 3 };
        return seasonOrder[seasonA] - seasonOrder[seasonB];
      });
      
      // Format each term for the UI
      sortedTerms.forEach(term => {
        const season = term.replace(/\d+$/, '');
        const year = parseInt(term.match(/\d+$/)[0]);
        const termLabel = `${season} ${startYear + year}`;
        
        formattedPlans.push({
          term: termLabel,
          termKey: term,
          classes: planResult[term]
        });
      });
      
      setPlans(formattedPlans);
    } catch (err) {
      console.error('Error generating plan:', err);
      setError('Failed to generate plan. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get prerequisites for a course
  const getPrerequisitesForCourse = (courseId) => {
    return coursePrereqs[courseId] || [];
  };

  // Calculate end year based on start year and planned years
  const endYear = startYear + plannedYears;

  return (
    <div className="optimizer-page">
      {/* Main Content with Sidebar and Results */}
      <div className="optimizer-content">
        {/* Left Sidebar for Configuration */}
        <div 
          ref={sidebarRef}
          className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        >
          {/* Major Section */}
          <div className="sidebar-section">
            <div 
              className="section-header" 
              onClick={() => toggleSection('major')}
            >
              <h3>Major</h3>
              <span className={`chevron ${collapsedSections.major ? 'down' : 'up'}`}>
                {collapsedSections.major ? '▼' : '▲'}
              </span>
            </div>
            {!collapsedSections.major && (
              <div className="section-content">
                <p className="section-instruction">Select your major</p>
                <div className="input-container">
                  <label className="input-label">Option</label>
                  <select 
                    className="select-input"
                    value={major}
                    onChange={handleMajorChange}
                  >
                    {majorOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Academic Years Section */}
          <div className="sidebar-section">
            <div 
              className="section-header" 
              onClick={() => toggleSection('academicYears')}
            >
              <h3>Academic Years</h3>
              <span className={`chevron ${collapsedSections.academicYears ? 'down' : 'up'}`}>
                {collapsedSections.academicYears ? '▼' : '▲'}
              </span>
            </div>
            {!collapsedSections.academicYears && (
              <div className="section-content">
                <p className="section-instruction">Select your start year</p>
                <div className="years-container">
                  <div className="input-container">
                    <label className="input-label">Start Year</label>
                    <select 
                      className="year-select"
                      value={startYear}
                      onChange={handleStartYearChange}
                    >
                      {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map((year) => (
                        <option key={`start-${year}`} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Planned Years Section */}
          <div className="sidebar-section">
            <div 
              className="section-header" 
              onClick={() => toggleSection('plannedYears')}
            >
              <h3>Planned Years</h3>
              <span className={`chevron ${collapsedSections.plannedYears ? 'down' : 'up'}`}>
                {collapsedSections.plannedYears ? '▼' : '▲'}
              </span>
            </div>
            {!collapsedSections.plannedYears && (
              <div className="section-content">
                <p className="section-instruction">How many years do you want to plan?</p>
                <div className="slider-container">
                  <div 
                    className="slider-value" 
                    style={{ left: `${(plannedYears / 8) * 100}%` }}
                  >
                    {plannedYears}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={plannedYears}
                    onChange={(e) => setPlannedYears(parseInt(e.target.value))}
                    className="range-slider"
                  />
                  <div className="range-labels">
                    <span>1</span>
                    <span>8</span>
                  </div>
                </div>
                <p className="calculated-years">Plan: {startYear} - {endYear}</p>
              </div>
            )}
          </div>

          {/* Max Units per Semester Section */}
          <div className="sidebar-section">
            <div 
              className="section-header" 
              onClick={() => toggleSection('maxUnits')}
            >
              <h3>Max Units per Semester</h3>
              <span className={`chevron ${collapsedSections.maxUnits ? 'down' : 'up'}`}>
                {collapsedSections.maxUnits ? '▼' : '▲'}
              </span>
            </div>
            {!collapsedSections.maxUnits && (
              <div className="section-content">
                <p className="section-instruction">How many units do you plan to take per semester?</p>
                <div className="slider-container">
                  <div className="slider-value" style={{ left: `${(maxUnitsPerSemester / 24) * 100}%` }}>
                    {maxUnitsPerSemester}
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="24"
                    value={maxUnitsPerSemester}
                    onChange={(e) => setMaxUnitsPerSemester(parseInt(e.target.value))}
                    className="range-slider"
                  />
                  <div className="range-labels">
                    <span>4</span>
                    <span>24</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Electives Courses Section */}
          <div className="sidebar-section">
            <div 
              className="section-header" 
              onClick={() => toggleSection('electives')}
            >
              <h3>Electives Courses</h3>
              <span className={`chevron ${collapsedSections.electives ? 'down' : 'up'}`}>
                {collapsedSections.electives ? '▼' : '▲'}
              </span>
            </div>
            {!collapsedSections.electives && (
              <div className="section-content">
                <p className="section-instruction">Select elective courses you're interested in taking</p>
                <div className="input-container">
                  <label className="input-label">Elective Courses</label>
                  <SearchableMultiSelect
                    options={electiveOptions}
                    selectedValues={electiveCourses}
                    onChange={handleElectiveCoursesChange}
                    placeholder="Search for electives..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Completed Courses Section */}
          <div className="sidebar-section">
            <div 
              className="section-header" 
              onClick={() => toggleSection('completed')}
            >
              <h3>Completed Courses</h3>
              <span className={`chevron ${collapsedSections.completed ? 'down' : 'up'}`}>
                {collapsedSections.completed ? '▼' : '▲'}
              </span>
            </div>
            {!collapsedSections.completed && (
              <div className="section-content">
                <p className="section-instruction">Select courses you have already completed</p>
                <div className="input-container">
                  <label className="input-label">Completed Courses</label>
                  <SearchableMultiSelect
                    options={completedOptions}
                    selectedValues={completedCourses}
                    onChange={handleCompletedCoursesChange}
                    placeholder="Search for completed courses..."
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Generate Plan Button */}
          <div className="sidebar-section">
            <button 
              className="generate-plan-button" 
              onClick={generatePlan}
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Plan'}
            </button>
          </div>
        </div>

        {/* Sidebar Toggle Button - now fixed to left edge */}
        <div 
          className={`sidebar-toggle ${sidebarCollapsed ? 'show' : ''}`}
          onClick={toggleSidebar}
          title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </div>

        {/* Main Content Area for displaying potential plans */}
        <div className="main-content" ref={dropdownRef}>
          <div className="main-header">
            <h2>Potential Plans</h2>
            <p className="subtitle">Your customized academic path</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="action-filter-bar">
            <div className="search-filters">
              <div className="search-container">
                <label>Search</label>
                <input type="text" placeholder="Course code or name..." />
              </div>
              <div className="attribute-dropdown">
                <label>Term</label>
                <select>
                  <option value="">All Terms</option>
                  <option>Fall</option>
                  <option>Winter</option>
                  <option>Spring</option>
                </select>
              </div>
              <button className="filter-button">
                <i className="fas fa-filter"></i>
              </button>
            </div>
            <div className="action-buttons">
              <button className="share-button">SHARE</button>
              <button className="settings-button">
                <i className="fas fa-cog"></i>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Generating your optimal course plan...</p>
            </div>
          ) : plans.length > 0 ? (
            <div className="plans-table">
              <div className="table-header">
                <div className="cell head-cell">Term</div>
                <div className="cell">Class 1</div>
                <div className="cell">Class 2</div>
                <div className="cell">Class 3</div>
                <div className="cell">Class 4</div>
              </div>

              <div className="table-body">
                {plans.map((plan) => (
                  <React.Fragment key={plan.term}>
                    <div className="table-row term-row">
                      <div 
                        className="cell head-cell clickable" 
                        onClick={() => toggleRow(plan.term)}
                      >
                        <span className={`row-chevron ${expandedRows[plan.term] ? 'up' : 'down'}`}>
                          {expandedRows[plan.term] ? '▲' : '▼'}
                        </span>
                        {plan.term}
                      </div>
                      {!expandedRows[plan.term] && plan.classes.map((cls, index) => (
                        <div key={index} className="cell">{cls}</div>
                      ))}
                      {!expandedRows[plan.term] && Array(4 - plan.classes.length).fill().map((_, index) => (
                        <div key={`empty-${index}`} className="cell">-</div>
                      ))}
                    </div>
                    
                    {expandedRows[plan.term] && (
                      <div className="expanded-content">
                        <div className="class-details-row">
                          {plan.classes.map((cls, index) => (
                            <div key={index} className="class-detail">
                              <h4>{cls}</h4>
                              <p>Units: 4</p>
                              <p>Term: {plan.term}</p>
                              {getPrerequisitesForCourse(cls).length > 0 && (
                                <div className="prerequisites">
                                  <p><strong>Prerequisites:</strong></p>
                                  <ul>
                                    {getPrerequisitesForCourse(cls).map((prereq, i) => (
                                      <li key={i}>{prereq}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="ai-summary-row">
                          <div className="ai-summary-header">
                            <span className="eye-icon"><i className="fas fa-eye"></i></span>
                            Term Summary
                          </div>
                          <div className="ai-summary-content">
                            This term includes {plan.classes.length} courses for a total of approximately 
                            {plan.classes.length * 4} units.
                            
                            {plan.classes.length > 3 && (
                              <div className="warning-alert">
                                <div className="alert-icon"><i className="fas fa-exclamation-triangle"></i></div>
                                <div className="alert-content">
                                  <strong>Heavy Course Load</strong>
                                  <p>This term has {plan.classes.length} courses which may be challenging.</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="table-footer">
                <div className="pagination">
                  <span>Total terms: {plans.length}</span>
                </div>
                <div className="footer-actions">
                  <button className="save-button">SAVE PLAN</button>
                  <button className="delete-button">RESET</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-plans-message">
              <p>Configure your preferences and click "Generate Plan" to see your optimal course schedule.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Optimizer;

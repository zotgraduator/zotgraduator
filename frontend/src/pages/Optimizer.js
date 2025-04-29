import React, { useState, useEffect, useRef } from 'react';
import '../styles/Optimizer.css';
import SearchableMultiSelect from '../components/SearchableMultiSelect';

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
  
  // Updated elective courses options
  const [electiveOptions] = useState([
    'CS 141', 'CS 142A', 'CS 142B', 'CS 143A', 'CS 161', 'CS 164', 
    'CS 165', 'CS 169', 'CS 171', 'CS 172B', 'CS 175', 'CS 178',
    'INF 121', 'INF 122', 'INF 124', 'INF 131', 'INF 133', 'INF 141',
    'INF 143', 'INF 151', 'INF 153'
  ]);
  const [electiveCourses, setElectiveCourses] = useState(['CS 165', 'CS 145', 'CS 141']);
  
  // Updated completed courses options
  const [completedOptions] = useState([
    'ICS 45C', 'ICS 45J', 'ICS 46', 'ICS 6B', 'ICS 6D', 'ICS 6N', 
    'ICS 33', 'ICS 32', 'ICS 31', 'STATS 67', 'MATH 2A', 'MATH 2B',
    'WRITING 39A', 'WRITING 39B', 'WRITING 39C'
  ]);
  const [completedCourses, setCompletedCourses] = useState(['ICS 6N', 'ICS 32', 'ICS 31']);
  
  // State for sidebar visibility
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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

  // Mock plans data for the table
  const plans = [
    {
      term: 'Fall 2024',
      classes: ['INF 43', 'STATS 67', 'ICS 6B', 'CS 122A']
    },
    {
      term: 'Winter 2025',
      classes: ['ICS 139W', 'ICS 6D', 'INF 101', 'INF 113']
    },
    {
      term: 'Spring 2025',
      classes: ['CS 142A', 'CS 145', 'CS 132', 'INF 115']
    },
    {
      term: 'Fall 2025',
      classes: ['INF 151', 'INF 121', 'INF 131', 'CS 143A']
    },
    {
      term: 'Winter 2026',
      classes: ['CS 161', 'INF 122', 'INF 124', 'INF 191A']
    }
  ];

  // Remove the effect for toggle button positioning since it will be fixed
  useEffect(() => {
    // No need to dynamically update position anymore
    // We'll just toggle the sidebar collapse state
  }, [sidebarCollapsed]);

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
            <p className="subtitle">Additional description if required</p>
          </div>

          <div className="action-filter-bar">
            <div className="search-filters">
              <div className="search-container">
                <label>Search</label>
                <input type="text" placeholder="Name, email, etc..." />
              </div>
              <div className="attribute-dropdown">
                <label>Attribute</label>
                <select>
                  <option>Property</option>
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

          <div className="plans-table">
            <div className="table-header">
              <div className="cell head-cell">Head</div>
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
                  </div>
                  
                  {expandedRows[plan.term] && (
                    <div className="expanded-content">
                      <div className="class-details-row">
                        {plan.classes.map((cls, index) => (
                          <div key={index} className="class-detail">
                            <h4>{cls}</h4>
                            <p>Units: 4</p>
                            <p>Professor: Example</p>
                            <p>Time: MWF 10:00-10:50AM</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="ai-summary-row">
                        <div className="ai-summary-header">
                          <span className="eye-icon"><i className="fas fa-eye"></i></span>
                          AI Generated Summary
                        </div>
                        <div className="ai-summary-content">
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eget felis vitae justo eleifend vulputate. 
                          Nulla facilisi. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; 
                          Cras vitae magna vel nisi gravida fringilla.
                          
                          <div className="warning-alert">
                            <div className="alert-icon"><i className="fas fa-exclamation-triangle"></i></div>
                            <div className="alert-content">
                              <strong>Rate My Professor</strong>
                              <p>Courses average to a professor rating below 2.5/5</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="table-footer">
              <div className="pagination">
                <span>Rows per page:</span>
                <select className="rows-select">
                  <option>5</option>
                  <option>10</option>
                  <option>20</option>
                </select>
                <span className="page-info">1-5 of 20</span>
                <div className="pagination-controls">
                  <button className="page-button prev">
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button className="page-button next">
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
              <div className="footer-actions">
                <button className="save-button">SAVE</button>
                <button className="delete-button">DELETE</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Optimizer;

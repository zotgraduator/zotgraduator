import React, { useState, useEffect, useRef } from 'react';
import '../styles/Optimizer.css';

function Optimizer() {
  const currentYear = new Date().getFullYear();
  const dropdownRef = useRef(null);
  const sidebarRef = useRef(null);
  
  // State for sidebar configurations
  const [majorOptions] = useState(['Software Engineering', 'Computer Science', 'Informatics', 'Data Science']);
  const [major, setMajor] = useState(['Software Engineering']);
  const [searchMajor, setSearchMajor] = useState('');
  const [showMajorOptions, setShowMajorOptions] = useState(false);
  
  const [startYear, setStartYear] = useState(currentYear);
  const [plannedYears, setPlannedYears] = useState(4);
  const [maxUnitsPerSemester, setMaxUnitsPerSemester] = useState(16);
  
  const [electiveCourses, setElectiveCourses] = useState(['CS 165', 'CS 145', 'CS 14']);
  const [searchElectives, setSearchElectives] = useState('');
  const [showElectiveOptions, setShowElectiveOptions] = useState(false);
  
  const [completedCourses, setCompletedCourses] = useState(['ICS 6N', 'ICS 32', 'ICS 4']);
  const [searchCompleted, setSearchCompleted] = useState('');
  const [showCompletedOptions, setShowCompletedOptions] = useState(false);
  
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

  // Mock data for suggested options
  const electiveOptions = ['CS 141', 'CS 142A', 'CS 142B', 'CS 143A', 'CS 161', 'CS 164', 'CS 165', 'CS 169', 'CS 171', 'CS 172B', 'CS 175', 'CS 178'];
  const completedOptions = ['ICS 45C', 'ICS 45J', 'ICS 46', 'ICS 6B', 'ICS 6D', 'ICS 6N', 'ICS 33', 'ICS 32', 'ICS 31', 'STATS 67'];

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

  // Add click outside listener to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMajorOptions(false);
        setShowElectiveOptions(false);
        setShowCompletedOptions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add effect for smooth transition of toggle button
  useEffect(() => {
    const updateToggleButton = () => {
      const sidebar = sidebarRef.current;
      const toggle = document.querySelector('.sidebar-toggle');
      
      if (sidebar && toggle) {
        if (!sidebarCollapsed) {
          // Position at the edge of the sidebar for expanded state
          const sidebarWidth = sidebar.getBoundingClientRect().width;
          toggle.style.left = `${sidebarWidth - 1}px`; // -1px to account for border
        } else {
          // Position at left edge for collapsed state
          toggle.style.left = '0px';
        }
      }
    };
    
    // Run once on mount and when sidebar collapses/expands
    updateToggleButton();
    
    // Also update on window resize for responsiveness
    window.addEventListener('resize', updateToggleButton);
    return () => window.removeEventListener('resize', updateToggleButton);
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

  // Filter options based on search input
  const getFilteredOptions = (options, searchTerm) => {
    if (!searchTerm) return options;
    return options.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  // Handle removing a selected item (tag)
  const removeItem = (array, setArray, item) => {
    setArray(array.filter(i => i !== item));
  };

  // Handle adding a new item to a selection
  const addItem = (array, setArray, item) => {
    if (!array.includes(item)) {
      setArray([...array, item]);
    }
  };

  // Handle start year change
  const handleStartYearChange = (e) => {
    const value = parseInt(e.target.value);
    setStartYear(value);
  };

  // Calculate end year based on start year and planned years
  const endYear = startYear + plannedYears;

  return (
    <div className="optimizer-page">
      {/* Top Navigation/Header */}
      <header className="optimizer-header">
        <div className="header-left">
          <div className="header-actions">
            <button className="icon-button create-button">
              <i className="fas fa-plus"></i> CREATE
            </button>
            <button className="icon-button sync-button">
              <i className="fas fa-users"></i> SYNC WITH FRIENDS
            </button>
          </div>
        </div>
        <div className="user-profile">
          <div className="avatar">
            <i className="fas fa-user"></i>
          </div>
        </div>
      </header>

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
                  <div className="multi-select">
                    <div className="selected-items">
                      {major.map((item) => (
                        <span key={item} className="tag">
                          {item}
                          <button 
                            className="remove-tag" 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(major, setMajor, item);
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input 
                        type="text" 
                        placeholder="Search majors..." 
                        value={searchMajor}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMajorOptions(true);
                        }}
                        onChange={(e) => {
                          setSearchMajor(e.target.value);
                          setShowMajorOptions(true);
                        }}
                        onFocus={() => setShowMajorOptions(true)}
                      />
                    </div>
                    {showMajorOptions && (
                      <div className="options-dropdown">
                        {getFilteredOptions(majorOptions, searchMajor)
                          .filter(option => !major.includes(option))
                          .map((option) => (
                            <div 
                              key={option} 
                              className="option-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                addItem(major, setMajor, option);
                                setSearchMajor('');
                                setShowMajorOptions(false);
                              }}
                            >
                              {option}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
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
                <p className="section-instruction">Enter the electives you are interested in taking</p>
                <div className="input-container">
                  <label className="input-label">Option</label>
                  <div className="multi-select">
                    <div className="selected-items">
                      {electiveCourses.map((item) => (
                        <span key={item} className="tag">
                          {item}
                          <button 
                            className="remove-tag" 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(electiveCourses, setElectiveCourses, item);
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input 
                        type="text" 
                        placeholder="Search courses..." 
                        value={searchElectives}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowElectiveOptions(true);
                        }}
                        onChange={(e) => {
                          setSearchElectives(e.target.value);
                          setShowElectiveOptions(true);
                        }}
                        onFocus={() => setShowElectiveOptions(true)}
                      />
                    </div>
                    {showElectiveOptions && (
                      <div className="options-dropdown">
                        {getFilteredOptions(electiveOptions, searchElectives)
                          .filter(option => !electiveCourses.includes(option))
                          .map((option) => (
                            <div 
                              key={option} 
                              className="option-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                addItem(electiveCourses, setElectiveCourses, option);
                                setSearchElectives('');
                              }}
                            >
                              {option}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
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
                <p className="section-instruction">Enter the courses you have already completed</p>
                <div className="input-container">
                  <label className="input-label">Option</label>
                  <div className="multi-select">
                    <div className="selected-items">
                      {completedCourses.map((item) => (
                        <span key={item} className="tag">
                          {item}
                          <button 
                            className="remove-tag" 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(completedCourses, setCompletedCourses, item);
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input 
                        type="text" 
                        placeholder="Search courses..." 
                        value={searchCompleted}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCompletedOptions(true);
                        }}
                        onChange={(e) => {
                          setSearchCompleted(e.target.value);
                          setShowCompletedOptions(true);
                        }}
                        onFocus={() => setShowCompletedOptions(true)}
                      />
                    </div>
                    {showCompletedOptions && (
                      <div className="options-dropdown">
                        {getFilteredOptions(completedOptions, searchCompleted)
                          .filter(option => !completedCourses.includes(option))
                          .map((option) => (
                            <div 
                              key={option} 
                              className="option-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                addItem(completedCourses, setCompletedCourses, option);
                                setSearchCompleted('');
                              }}
                            >
                              {option}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Toggle Button */}
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

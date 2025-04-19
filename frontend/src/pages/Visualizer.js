import React, { useState, useRef, useEffect } from 'react';
import Cytoscape from 'cytoscape';
import COSEBilkent from 'cytoscape-cose-bilkent';
import fcose from 'cytoscape-fcose';
import '../styles/Visualizer.css';
import courseData from '../data/course_data_with_logical_prereqs.json';

// Register the layouts with Cytoscape
Cytoscape.use(COSEBilkent);
Cytoscape.use(fcose);

// Define a set of distinct colors for core classes
const CORE_CLASS_COLORS = [
  '#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', 
  '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd',
  '#ccebc5', '#ffed6f', '#a6cee3', '#1f78b4', '#b2df8a'
];

function Visualizer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseNotFound, setCourseNotFound] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isHelpTooltipVisible, setIsHelpTooltipVisible] = useState(false);
  const [coreClasses, setCoreClasses] = useState({});
  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const cyInstance = useRef(null);

  // Function to convert parsed prereq data into Cytoscape elements
  const buildGraphElements = (courseName) => {
    if (!courseData[courseName]) {
      setCourseNotFound(true);
      return [];
    }

    setCourseNotFound(false);
    
    // First pass: count occurrences of each course in the prerequisite tree
    const classOccurrences = new Map();
    const visited = new Set();
    
    // Function to count course occurrences in the prerequisite tree
    const countCourseOccurrences = (course, visited = new Set()) => {
      if (visited.has(course)) return;
      visited.add(course);
      
      // Skip the course itself from being counted
      if (course !== courseName) {
        classOccurrences.set(course, (classOccurrences.get(course) || 0) + 1);
      }
      
      const courseInfo = courseData[course];
      if (!courseInfo || !courseInfo.parsed_prerequisites || courseInfo.parsed_prerequisites === 'N/A') return;
      
      const prereqs = courseInfo.parsed_prerequisites;
      traversePrereqs(prereqs, visited);
    };
    
    // Traverse the prerequisite structure recursively
    const traversePrereqs = (structure, visited) => {
      if (typeof structure === 'string') {
        countCourseOccurrences(structure, new Set([...visited]));
      } else if (structure.and) {
        structure.and.forEach(item => {
          traversePrereqs(item, new Set([...visited]));
        });
      } else if (structure.or) {
        structure.or.forEach(item => {
          traversePrereqs(item, new Set([...visited]));
        });
      }
    };
    
    // Start the counting process from the main course
    countCourseOccurrences(courseName);
    
    // Identify core classes (appearing 2 or more times)
    const coreClassesMap = {};
    let colorIndex = 0;
    
    classOccurrences.forEach((count, course) => {
      if (count >= 2) {
        coreClassesMap[course] = {
          color: CORE_CLASS_COLORS[colorIndex % CORE_CLASS_COLORS.length],
          count: count
        };
        colorIndex++;
      }
    });
    
    // Store the core classes for the legend display
    setCoreClasses(coreClassesMap);
    
    // Second pass: build the graph elements
    visited.clear();
    const elements = [];
    const compoundGroups = {};
    let groupCounter = 0;
    
    // Keep track of all dependencies for edge creation
    const dependencies = new Map();
    const orGroupDependencies = new Map();
    
    // Process prerequisites and build graph
    const processPrereqs = (course, targetId = null) => {
      // Add dependency for edge creation
      if (targetId) {
        if (!dependencies.has(course)) {
          dependencies.set(course, []);
        }
        dependencies.get(course).push(targetId);
      }
      
      // If we've visited this course, we still add edges but don't recreate nodes
      if (visited.has(course)) return;
      
      visited.add(course);
      
      // Add course node
      if (courseData[course]) {
        const courseInfo = courseData[course];
        const isCore = coreClassesMap[course];
        
        // Create node with core class styling if applicable
        elements.push({
          group: 'nodes',
          data: {
            id: course,
            label: isCore ? '' : course, // No label for core classes
            title: courseInfo.title || course,
            isCore: isCore ? true : false,
            coreColor: isCore ? coreClassesMap[course].color : null
          },
          classes: isCore ? 'core-class' : ''
        });
        
        // Process this course's prerequisites
        const prereqs = courseInfo.parsed_prerequisites;
        if (prereqs && prereqs !== 'N/A') {
          processLogicalStructure(prereqs, course);
        }
      } else if (course !== 'N/A') {
        // For external prerequisites
        elements.push({
          group: 'nodes',
          data: {
            id: course,
            label: course,
            title: "External Prerequisite"
          },
          classes: 'external-prereq'
        });
      }
    };

    // Process logical structures (AND/OR)
    const processLogicalStructure = (structure, targetId) => {
      if (typeof structure === 'string') {
        processPrereqs(structure, targetId);
      } else if (structure.and) {
        structure.and.forEach(item => {
          processLogicalStructure(item, targetId);
        });
      } else if (structure.or) {
        // Check for existing OR groups with same structure
        const orComponents = structure.or.map(item => 
          typeof item === 'string' ? item : JSON.stringify(item)).sort();
        const groupSignature = orComponents.join('|');
        let existingGroupId = null;
        
        // Find matching OR group
        for (const [id, signature] of Object.entries(compoundGroups)) {
          if (signature === groupSignature) {
            existingGroupId = id;
            break;
          }
        }
        
        if (existingGroupId) {
          // Use existing OR group
          if (!orGroupDependencies.has(existingGroupId)) {
            orGroupDependencies.set(existingGroupId, []);
          }
          orGroupDependencies.get(existingGroupId).push(targetId);
        } else {
          // Create new OR group
          const groupId = `or-group-${groupCounter++}`;
          compoundGroups[groupId] = groupSignature;
          
          elements.push({
            group: 'nodes',
            data: {
              id: groupId,
              label: 'OR',
              isOrGroup: true
            },
            classes: 'or-group'
          });
          
          if (!orGroupDependencies.has(groupId)) {
            orGroupDependencies.set(groupId, []);
          }
          orGroupDependencies.get(groupId).push(targetId);
          
          // Process OR options
          structure.or.forEach(item => {
            if (typeof item === 'string') {
              processPrereqs(item, null);
              
              // Add as child of OR group
              const existingNode = elements.find(ele => ele.data && ele.data.id === item);
              if (existingNode) {
                existingNode.data.parent = groupId;
              }
            } else {
              // Handle nested logical structures
              const subGroupId = `sub-${groupId}-${elements.length}`;
              processNestedLogical(item, subGroupId, groupId);
            }
          });
        }
      }
    };
    
    // Handle nested logical structures
    const processNestedLogical = (structure, nodeId, parentId) => {
      if (structure.and) {
        elements.push({
          group: 'nodes',
          data: {
            id: nodeId,
            label: 'AND',
            parent: parentId
          },
          classes: 'and-group'
        });
        
        structure.and.forEach(item => {
          if (typeof item === 'string') {
            processPrereqs(item, nodeId);
          } else {
            processNestedLogical(item, `nested-${elements.length}`, nodeId);
          }
        });
      } else if (structure.or) {
        elements.push({
          group: 'nodes',
          data: {
            id: nodeId,
            label: 'OR',
            parent: parentId
          },
          classes: 'or-group'
        });
        
        structure.or.forEach(item => {
          if (typeof item === 'string') {
            processPrereqs(item, nodeId);
          } else {
            processNestedLogical(item, `nested-${elements.length}`, nodeId);
          }
        });
      }
    };
    
    // Start building the graph from the searched course
    processPrereqs(courseName);
    
    // Add all edges
    dependencies.forEach((targets, source) => {
      targets.forEach(target => {
        elements.push({
          group: 'edges',
          data: {
            id: `edge-${source}-${target}`,
            source: source,
            target: target
          }
        });
      });
    });
    
    // Add OR group edges
    orGroupDependencies.forEach((targets, groupId) => {
      targets.forEach(target => {
        elements.push({
          group: 'edges',
          data: {
            id: `edge-${groupId}-${target}`,
            source: groupId,
            target: target
          }
        });
      });
    });
    
    return elements;
  };

  // Initialize or update the Cytoscape graph
  const renderGraph = (elements) => {
    if (elements.length === 0) return;
    
    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    cyInstance.current = Cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': '#1d2434',
            'color': 'white',
            'font-size': '12px',
            'width': '120px',
            'height': '40px',
            'shape': 'rectangle',
            'border-width': '1px',
            'border-color': '#666',
            'text-wrap': 'wrap',
            'text-max-width': '110px',
            'text-overflow-wrap': 'ellipsis',
            'padding': '5px'
          }
        },
        {
          selector: 'node.core-class',
          style: {
            'background-color': 'data(coreColor)',
            'width': '40px',
            'height': '40px',
            'shape': 'ellipse',
            'border-width': '2px',
            'border-color': '#444',
            'padding': '2px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        },
        {
          selector: '.or-group',
          style: {
            'background-color': '#f8f9fa',
            'background-opacity': 0.5,
            'border-width': 2,
            'border-style': 'dashed',
            'border-color': '#ffbf00',
            'font-weight': 'bold',
            'color': '#666',
            'text-valign': 'top',
            'text-halign': 'center',
            'text-margin-y': 10,
            'shape': 'round-rectangle',
            'padding': '15px',
            'text-wrap': 'wrap',
            'text-max-width': '80px'
          }
        },
        {
          selector: '.and-group',
          style: {
            'background-color': '#f8f9fa',
            'background-opacity': 0.5,
            'border-width': 2,
            'border-style': 'solid',
            'border-color': '#1d2434',
            'font-weight': 'bold',
            'color': '#666',
            'text-valign': 'top',
            'text-halign': 'center',
            'text-margin-y': 10,
            'shape': 'round-rectangle',
            'padding': '15px',
            'text-wrap': 'wrap',
            'text-max-width': '80px'
          }
        },
        {
          selector: '.external-prereq',
          style: {
            'background-color': '#767676',
            'border-width': 0
          }
        }
      ],
      layout: {
        name: 'fcose',
        animate: true,
        randomize: false,
        padding: 75,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: 100,
        nodeRepulsion: 8000,
        edgeElasticity: 0.45,
        nestingFactor: 0.1,
        gravity: 0.25,
        numIter: 2000,
        tile: true,
        tilingPaddingVertical: 10,
        tilingPaddingHorizontal: 10
      }
    });
    
    // Add tooltips for nodes
    cyInstance.current.on('mouseover', 'node', function(e) {
      const node = e.target;
      if (node.data('title')) {
        // Show additional info for core classes
        if (node.data('isCore')) {
          const courseId = node.id();
          const coreInfo = coreClasses[courseId];
          console.log(`${courseId}: ${node.data('title')} (Core prerequisite - appears ${coreInfo.count} times)`);
        } else {
          console.log(`${node.data('label')}: ${node.data('title')}`);
        }
      }
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const formattedQuery = searchQuery.trim().toUpperCase();
    setHasSearched(true);
    
    // Try to find the course in different case formats
    const matchingCourse = Object.keys(courseData).find(
      course => course.toUpperCase() === formattedQuery
    );
    
    if (matchingCourse) {
      setCourseNotFound(false);
      const elements = buildGraphElements(matchingCourse);
      renderGraph(elements);
    } else {
      setCourseNotFound(true);
      if (cyInstance.current) {
        cyInstance.current.destroy();
        cyInstance.current = null;
      }
    }
  };

  // New function to re-apply layout
  const reorganizeGraph = () => {
    if (!cyInstance.current) return;
    
    cyInstance.current.layout({
      name: 'fcose',
      animate: true,
      randomize: true, // Randomize positions to get a fresh layout
      padding: 75,
      nodeDimensionsIncludeLabels: true,
      idealEdgeLength: 100,
      nodeRepulsion: 8000,
      edgeElasticity: 0.45,
      nestingFactor: 0.1,
      gravity: 0.25,
      numIter: 2000,
      tile: true,
      tilingPaddingVertical: 10,
      tilingPaddingHorizontal: 10
    }).run();
  };

  const toggleHelpTooltip = () => {
    setIsHelpTooltipVisible(!isHelpTooltipVisible);
  };

  return (
    <div className="visualizer-page">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter course code (e.g., COMPSCI 161)"
            className="search-input"
            aria-label="Course search"
          />
          
          <button type="submit" className="search-button">
            Search
          </button>
          
          {hasSearched && !courseNotFound && (
            <button 
              type="button" 
              className="reorganize-button"
              onClick={reorganizeGraph}
              aria-label="Reorganize graph"
            >
              Reorganize
            </button>
          )}
          
          <div className="help-container">
            <button 
              type="button" 
              className="help-button" 
              onClick={toggleHelpTooltip}
              aria-label="Help"
            >
              ?
            </button>
            
            {isHelpTooltipVisible && (
              <div className="help-tooltip">
                <p>Enter a course code to view its prerequisite tree.</p>
                <p>The graph shows:</p>
                <ul>
                  <li>Direct prerequisites (AND relationships) with solid arrows</li>
                  <li>Alternative options (OR relationships) grouped in dashed boxes</li>
                </ul>
                <p>Use the "Reorganize" button to refresh the layout if nodes overlap.</p>
              </div>
            )}
          </div>
        </div>
      </form>
      
      {/* Add Core Classes Legend */}
      {hasSearched && !courseNotFound && Object.keys(coreClasses).length > 0 && (
        <div className="core-classes-legend">
          <h3>Core Prerequisites</h3>
          <div className="legend-items">
            {Object.entries(coreClasses).map(([courseId, info]) => (
              <div key={courseId} className="legend-item">
                <span className="color-dot" style={{ backgroundColor: info.color }}></span>
                <span className="legend-text">{courseId} ({info.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {hasSearched && courseNotFound && (
        <div className="not-found-message">
          <p>
            Course not found. Please check the course code and try again.
            <br />
            Example courses: COMPSCI 161, I&C SCI 46, MATH 2B
          </p>
        </div>
      )}

      <div 
        ref={containerRef} 
        className="graph-container"
      />
      
      {!hasSearched && (
        <div className="initial-state">
          <p>Search for a course above to visualize its prerequisite tree.</p>
          <p className="example-text">Try searching for "COMPSCI 161" to see an example visualization.</p>
        </div>
      )}
    </div>
  );
}

export default Visualizer;

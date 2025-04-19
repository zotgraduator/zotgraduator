import React, { useState, useRef, useEffect } from 'react';
import Cytoscape from 'cytoscape';
import COSEBilkent from 'cytoscape-cose-bilkent';
import fcose from 'cytoscape-fcose';
import '../styles/Visualizer.css';

// Register the layouts with Cytoscape
Cytoscape.use(COSEBilkent);
Cytoscape.use(fcose);

// Mock data structure - would be replaced with actual JSON import
const mockCourseData = {
  "COMPSCI 161": {
    "title": "Design and Analysis of Algorithms",
    "units": "4",
    "description": "Techniques for efficient algorithm design, including divide-and-conquer and dynamic programming, and time/space analysis. Fast algorithms for problems applicable to networks, computer games, and scientific computing, such as sorting, shortest paths, minimum spanning trees, network flow, and pattern matching.",
    "prerequisites": "I&C SCI 46 and I&C SCI 6D and (MATH 2B or AP Calculus BC)",
    "parsed_prerequisites": {
      "and": ["I&C SCI 46", "I&C SCI 6D", { "or": ["MATH 2B", "AP Calculus BC"] }]
    }
  },
  "I&C SCI 46": {
    "title": "Data Structure Implementation and Analysis",
    "units": "4",
    "description": "Focuses on implementation and mathematical analysis of fundamental data structures and algorithms. Covers storage allocation and memory management techniques.",
    "prerequisites": "I&C SCI 45C AND I&C SCI 6B",
    "parsed_prerequisites": {
      "and": ["I&C SCI 45C", "I&C SCI 6B"]
    }
  },
  "I&C SCI 45C": {
    "title": "Programming in C/C++ as a Second Language",
    "units": "4",
    "description": "An introduction to the lexical, syntactic, semantic, and pragmatic characteristics of the C/C++ languages for experienced programmers. Emphasis on object-oriented programming, using standard libraries, and programming with manual garbage collection.",
    "prerequisites": "(I&C SCI 33 or CSE 43) or AP Computer Science A",
    "parsed_prerequisites": {
      "or": ["I&C SCI 33", "CSE 43", "AP Computer Science A"]
    }
  },
  "I&C SCI 33": {
    "title": "Intermediate Programming",
    "units": "4",
    "description": "Intermediate-level language features and programming concepts for larger, more complex, higher-performance software. Topics include recursion, algorithmic analysis, data structures, and object-oriented programming.",
    "prerequisites": "I&C SCI 32 or CSE 42",
    "parsed_prerequisites": {
      "or": ["I&C SCI 32", "CSE 42"]
    }
  },
  "I&C SCI 32": {
    "title": "Programming with Software Libraries",
    "units": "4",
    "description": "Construction of programs for problems and computing environments more varied than in I&C SCI 31. Using library modules for applications such as graphics, sound, GUI, database, Web, and network programming. Language features beyond those in I&C SCI 31 are introduced as needed.",
    "prerequisites": "I&C SCI 31 or CSE 41",
    "parsed_prerequisites": {
      "or": ["I&C SCI 31", "CSE 41"]
    }
  },
  "I&C SCI 31": {
    "title": "Introduction to Programming",
    "units": "4",
    "description": "Introduction to fundamental concepts and techniques for writing software in a high-level programming language. Covers the syntax and semantics of data types, expressions, exceptions, control structures, input/output, methods, classes, and pragmatics of programming.",
    "prerequisites": "N/A",
    "parsed_prerequisites": "N/A"
  },
  "I&C SCI 6B": {
    "title": "Boolean Logic and Discrete Structures",
    "units": "4",
    "description": "Relations and their properties; Boolean algebras, formal languages; finite automata.",
    "prerequisites": "High school mathematics through trigonometry.",
    "parsed_prerequisites": "N/A"
  },
  "I&C SCI 6D": {
    "title": "Discrete Mathematics for Computer Science",
    "units": "4",
    "description": "Covers essential tools from discrete mathematics used in computer science with an emphasis on the process of abstracting computational problems and analyzing them mathematically.",
    "prerequisites": "High school mathematics through trigonometry.",
    "parsed_prerequisites": "N/A"
  },
  "MATH 2B": {
    "title": "Single-Variable Calculus II",
    "units": "4",
    "description": "Definite integrals; the fundamental theorem of calculus. Applications of integration including finding areas and volumes. Techniques of integration. Infinite sequences and series.",
    "prerequisites": "MATH 2A or AP Calculus AB",
    "parsed_prerequisites": {
      "or": ["MATH 2A", "AP Calculus AB"]
    }
  },
  "MATH 2A": {
    "title": "Single-Variable Calculus I",
    "units": "4",
    "description": "Introduction to derivatives, calculation of derivatives of algebraic and trigonometric functions; applications including curve sketching, related rates, and optimization. Exponential and logarithm functions.",
    "prerequisites": "N/A",
    "parsed_prerequisites": "N/A"
  }
};

function Visualizer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseNotFound, setCourseNotFound] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isHelpTooltipVisible, setIsHelpTooltipVisible] = useState(false);
  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const cyInstance = useRef(null);

  // Function to convert parsed prereq data into Cytoscape elements
  const buildGraphElements = (courseName) => {
    if (!mockCourseData[courseName]) {
      setCourseNotFound(true);
      return [];
    }

    setCourseNotFound(false);
    const visited = new Set();
    const elements = [];
    const compoundGroups = [];
    let groupCounter = 0;

    // Recursive function to process prerequisites
    const processPrereqs = (course, targetId = null) => {
      if (visited.has(course)) {
        // If we've already processed this course, just add the edge if needed
        if (targetId) {
          elements.push({ 
            group: 'edges', 
            data: { 
              id: `edge-${course}-${targetId}`, 
              source: course, 
              target: targetId 
            } 
          });
        }
        return;
      }

      visited.add(course);

      // Add course node if it exists in our data
      if (mockCourseData[course]) {
        const courseData = mockCourseData[course];
        elements.push({
          group: 'nodes',
          data: { 
            id: course, 
            label: course,
            title: courseData.title 
          }
        });

        // Add edge if this is called with a target
        if (targetId) {
          elements.push({ 
            group: 'edges', 
            data: { 
              id: `edge-${course}-${targetId}`, 
              source: course, 
              target: targetId 
            } 
          });
        }

        // Process prerequisites if they exist
        const prereqs = courseData.parsed_prerequisites;
        if (prereqs && prereqs !== 'N/A') {
          processLogicalStructure(prereqs, course);
        }
      } else if (course !== 'N/A') {
        // For courses not in our data but referenced as prereqs
        elements.push({
          group: 'nodes',
          data: { 
            id: course, 
            label: course,
            title: "External Prerequisite" 
          },
          classes: 'external-prereq'
        });

        // Add edge if needed
        if (targetId) {
          elements.push({ 
            group: 'edges', 
            data: { 
              id: `edge-${course}-${targetId}`, 
              source: course, 
              target: targetId 
            } 
          });
        }
      }
    };

    // Process AND/OR logical structures
    const processLogicalStructure = (structure, targetId) => {
      if (typeof structure === 'string') {
        // Base case - single course
        processPrereqs(structure, targetId);
      } else if (structure.and) {
        // AND relationship - direct edges to target
        structure.and.forEach(item => {
          processLogicalStructure(item, targetId);
        });
      } else if (structure.or) {
        // OR relationship - create compound node
        const groupId = `or-group-${groupCounter++}`;
        
        // Create compound parent for OR group
        elements.push({
          group: 'nodes',
          data: { 
            id: groupId, 
            label: 'OR',
            isOrGroup: true
          },
          classes: 'or-group'
        });
        
        // Connect the OR group to the target
        elements.push({ 
          group: 'edges', 
          data: { 
            id: `edge-${groupId}-${targetId}`, 
            source: groupId, 
            target: targetId 
          } 
        });

        // Add each OR option as a child of the compound node
        structure.or.forEach(item => {
          if (typeof item === 'string') {
            // Add the course node if needed
            if (!visited.has(item)) {
              if (mockCourseData[item]) {
                const courseData = mockCourseData[item];
                elements.push({
                  group: 'nodes',
                  data: { 
                    id: item, 
                    label: item,
                    title: courseData.title,
                    parent: groupId
                  }
                });
                visited.add(item);
                
                // Process this course's prerequisites
                const prereqs = courseData.parsed_prerequisites;
                if (prereqs && prereqs !== 'N/A') {
                  processLogicalStructure(prereqs, item);
                }
              } else if (item !== 'N/A') {
                elements.push({
                  group: 'nodes',
                  data: { 
                    id: item, 
                    label: item,
                    title: "External Prerequisite",
                    parent: groupId
                  },
                  classes: 'external-prereq'
                });
                visited.add(item);
              }
            } else {
              // If already visited, just update parent
              const existingNode = elements.find(ele => ele.data && ele.data.id === item);
              if (existingNode) {
                existingNode.data.parent = groupId;
              }
            }
          } else {
            // Handle nested logical structures
            const subGroupId = `sub-${groupId}-${elements.length}`;
            processNestedLogical(item, subGroupId, groupId);
          }
        });

        compoundGroups.push(groupId);
      }
    };

    // Handle nested logical structures within OR groups
    const processNestedLogical = (structure, nodeId, parentId) => {
      if (structure.and) {
        // Create an AND node inside the OR group
        elements.push({
          group: 'nodes',
          data: { 
            id: nodeId, 
            label: 'AND',
            parent: parentId
          },
          classes: 'and-group'
        });

        // Process AND items
        structure.and.forEach(item => {
          if (typeof item === 'string') {
            processPrereqs(item, nodeId);
          } else {
            processNestedLogical(item, `nested-${elements.length}`, nodeId);
          }
        });
      } else if (structure.or) {
        // Create an OR node inside the parent
        elements.push({
          group: 'nodes',
          data: { 
            id: nodeId, 
            label: 'OR',
            parent: parentId
          },
          classes: 'or-group'
        });

        // Process OR items
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
            'border-color': '#666'
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
            'padding': '15px'
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
            'padding': '15px'
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
    
    // Add tooltips (would be implemented with a tooltip library in a real app)
    cyInstance.current.on('mouseover', 'node', function(e) {
      const node = e.target;
      if (node.data('title')) {
        // This would show a tooltip in a real app
        console.log(`${node.data('label')}: ${node.data('title')}`);
      }
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const formattedQuery = searchQuery.trim().toUpperCase();
    setHasSearched(true);
    
    // Try to find the course in different case formats
    const matchingCourse = Object.keys(mockCourseData).find(
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
      <div className="search-header">
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
          </div>
        </form>
        
        {hasSearched && courseNotFound && (
          <div className="not-found-message">
            <p>
              Course not found. Please check the course code and try again.
              <br />
              Example courses: COMPSCI 161, I&C SCI 46, MATH 2B
            </p>
          </div>
        )}
      </div>

      <div 
        ref={containerRef} 
        className="graph-container"
        style={{ 
          display: 'block',
          height: hasSearched && !courseNotFound ? '100%' : '0' 
        }}
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

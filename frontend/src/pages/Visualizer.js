import React, { useState, useRef, useEffect } from 'react';
import Cytoscape from 'cytoscape';
import COSEBilkent from 'cytoscape-cose-bilkent';
import fcose from 'cytoscape-fcose';
import '../styles/Visualizer.css';
import courseData from '../data/course_data_with_logical_prereqs.json';

// Register the layouts with Cytoscape
Cytoscape.use(COSEBilkent);
Cytoscape.use(fcose);

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
    if (!courseData[courseName]) {
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
      if (courseData[course]) {
        const courseInfo = courseData[course];
        elements.push({
          group: 'nodes',
          data: { 
            id: course, 
            label: course,
            title: courseInfo.title 
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
        const prereqs = courseInfo.parsed_prerequisites;
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
              if (courseData[item]) {
                const courseInfo = courseData[item];
                elements.push({
                  group: 'nodes',
                  data: { 
                    id: item, 
                    label: item,
                    title: courseInfo.title,
                    parent: groupId
                  }
                });
                visited.add(item);
                
                // Process this course's prerequisites
                const prereqs = courseInfo.parsed_prerequisites;
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
            'border-color': '#666',
            'text-wrap': 'wrap',
            'text-max-width': '110px',
            'text-overflow-wrap': 'ellipsis',
            'padding': '5px'
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

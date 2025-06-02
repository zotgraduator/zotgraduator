import React, { useState, useRef, useEffect } from 'react';
import Cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import dagre from 'cytoscape-dagre';
import '../styles/Visualizer.css';
import courseData from '../data/course_data_with_logical_prereqs.json';

// Register the layouts with Cytoscape
Cytoscape.use(fcose);
Cytoscape.use(dagre);

// Define a set of distinct colors for core class trees (qualitative palette)
const CORE_TREE_BASE_COLORS = [
  '#1f78b4', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a',
  '#a6cee3', '#b2df8a', '#fb9a99', '#fdbf6f', '#cab2d6',
  '#8dd3c7', '#bebada', '#fb8072', '#80b1d3', '#fdb462'
];

function Visualizer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseNotFound, setCourseNotFound] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isHelpTooltipVisible, setIsHelpTooltipVisible] = useState(false);
  const [selectedCoreClass, setSelectedCoreClass] = useState(null);
  const mainContainerRef = useRef(null);
  const coreTreeContainerRef = useRef(null);
  const cyInstances = useRef({
    main: null,
    coreTree: null
  });

  // Function to convert parsed prereq data into Cytoscape elements
  const buildGraphElements = (courseName) => {
    if (!courseData[courseName]) {
      setCourseNotFound(true);
      return { main: [], coreTrees: [] };
    }

    setCourseNotFound(false);
    
    // First pass: Count occurrences and map prerequisite chains
    const classOccurrences = new Map();
    const dependencyMap = new Map(); // Maps course -> courses that depend on it
    const prereqMap = new Map();     // Maps course -> courses it depends on
    const visited = new Set();
    
    // Function to count occurrences and build dependency graphs
    const countAndMapDependencies = (course, parent = null, visited = new Set()) => {
      if (visited.has(course)) return;
      visited.add(course);
      
      // Add to dependency map (what courses depend on this one)
      if (parent) {
        if (!dependencyMap.has(course)) {
          dependencyMap.set(course, new Set());
        }
        dependencyMap.get(course).add(parent);
      }
      
      // Count occurrences (skip main course)
      if (course !== courseName) {
        classOccurrences.set(course, (classOccurrences.get(course) || 0) + 1);
      }
      
      // Process prerequisites
      const courseInfo = courseData[course];
      if (!courseInfo || !courseInfo.parsed_prerequisites || courseInfo.parsed_prerequisites === 'N/A') return;
      
      // Map this course's prerequisites and continue traversing
      traversePrereqs(courseInfo.parsed_prerequisites, course, visited);
    };
    
    // Recursively traverse prerequisites
    const traversePrereqs = (structure, parent, visited) => {
      if (typeof structure === 'string') {
        // Add to prerequisite map (what courses this one depends on)
        if (!prereqMap.has(parent)) {
          prereqMap.set(parent, new Set());
        }
        prereqMap.get(parent).add(structure);
        
        // Continue counting and mapping
        countAndMapDependencies(structure, parent, new Set([...visited]));
      } else if (structure.and) {
        structure.and.forEach(item => traversePrereqs(item, parent, new Set([...visited])));
      } else if (structure.or) {
        structure.or.forEach(item => traversePrereqs(item, parent, new Set([...visited])));
      }
    };
    
    // Start the counting and mapping process with the main course
    countAndMapDependencies(courseName);
    
    // Identify potential core classes (appearing >= 2 times)
    const potentialCoreCourses = Array.from(classOccurrences.entries())
      .filter(([course, count]) => count >= 2 && courseData[course])
      .map(([course]) => course);
    
    // Function to check if a course is an ancestor of another course
    const isAncestorOf = (ancestor, descendant) => {
      if (ancestor === descendant) return false;
      
      // Check if ancestor is a prerequisite of descendant (directly or indirectly)
      const visited = new Set();
      const queue = [descendant];
      
      while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);
        
        if (prereqMap.has(current)) {
          for (const prereq of prereqMap.get(current)) {
            if (prereq === ancestor) return true;
            queue.push(prereq);
          }
        }
      }
      
      return false;
    };
    
    // Determine highest-order core classes
    const highestOrderCoreCourses = new Map();
    
    // First pass: Add all potential core courses
    potentialCoreCourses.forEach(course => {
      highestOrderCoreCourses.set(course, true);
    });
    
    // Second pass: Remove courses that are prerequisites of other core courses
    potentialCoreCourses.forEach(courseA => {
      potentialCoreCourses.forEach(courseB => {
        if (courseA !== courseB && isAncestorOf(courseA, courseB) && highestOrderCoreCourses.has(courseA)) {
          highestOrderCoreCourses.delete(courseA);
        }
      });
    });
    
    // Map colors to the remaining highest-order core courses
    const coreCoursesWithColors = new Map();
    let colorIndex = 0;
    
    highestOrderCoreCourses.forEach((_, course) => {
      coreCoursesWithColors.set(course, {
        color: CORE_TREE_BASE_COLORS[colorIndex % CORE_TREE_BASE_COLORS.length],
        count: classOccurrences.get(course)
      });
      colorIndex++;
    });
    
    // Define core trees for popups
    const coreTreesData = Array.from(coreCoursesWithColors.entries())
      .map(([course, data]) => ({
        course,
        color: data.color,
        count: data.count
      }));
    
    // Second pass: Build the main graph with core class abstractions
    visited.clear();
    const elements = [];
    const compoundGroups = {};
    let groupCounter = 0;
    
    // Track dependencies for edge creation
    const dependencies = new Map();
    const orGroupDependencies = new Map();
    
    // NEW: Keep track of core class nodes to avoid duplicates
    const coreClassUsage = new Map(); // Maps a tuple of (core class, target class) to the node ID
    
    // Process prerequisites and build graph
    const processPrereqs = (course, targetId = null, isMainCourse = false) => {
      // Add dependency for edge creation
      if (targetId) {
        if (!dependencies.has(course)) {
          dependencies.set(course, []);
        }
        dependencies.get(course).push(targetId);
      }
      
      // For core classes, we need to check if we already have a node for this target
      const isCoreClass = coreCoursesWithColors.has(course) && !isMainCourse;
      
      let nodeId;
      if (isCoreClass) {
        // Create a key using the core course and the target it points to
        const usageKey = `${course}->${targetId}`;
        
        // Check if we already have this core class pointing to this target
        if (coreClassUsage.has(usageKey)) {
          // Reuse existing node
          nodeId = coreClassUsage.get(usageKey);
          return; // Skip creating a new node since we already have one
        } else {
          // Create new node with unique ID
          nodeId = `${course}-${Math.random().toString(36).substring(7)}`;
          // Store for future reference
          coreClassUsage.set(usageKey, nodeId);
        }
      } else {
        nodeId = course;
      }
      
      // Skip if we've already processed this non-core course
      if (!isCoreClass && visited.has(course)) return;
      if (!isCoreClass) visited.add(course);
      
      // Add course node
      if (courseData[course]) {
        const courseInfo = courseData[course];
        elements.push({
          group: 'nodes',
          data: {
            id: nodeId,
            originalId: course,
            label: isCoreClass ? '' : course, // No label for core classes
            title: courseInfo.title || course,
            isCore: isCoreClass,
            coreColor: isCoreClass ? coreCoursesWithColors.get(course).color : null,
            isMainCourse: isMainCourse
          },
          classes: isCoreClass ? 'core-class' : isMainCourse ? 'main-course' : ''
        });
        
        // For non-core classes or the main course, process their prerequisites
        if (!isCoreClass) {
          const prereqs = courseInfo.parsed_prerequisites;
          if (prereqs && prereqs !== 'N/A') {
            processLogicalStructure(prereqs, course);
          }
        }
      } else if (course !== 'N/A') {
        // External prerequisite
        elements.push({
          group: 'nodes',
          data: {
            id: nodeId,
            originalId: course,
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
              processPrereqs(item);
              
              // Find all nodes with this course ID
              const courseNodes = elements.filter(ele => 
                ele.data && ele.data.originalId === item && !ele.data.parent);
              
              // Use the last added node (or create one if needed)
              if (courseNodes.length > 0) {
                const lastNode = courseNodes[courseNodes.length - 1];
                lastNode.data.parent = groupId;
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
    
    // Start building the graph with the main course
    processPrereqs(courseName, null, true);
    
    // Add all edges
    dependencies.forEach((targets, source) => {
      targets.forEach(target => {
        // Find all nodes with this source ID
        const sourceNodes = elements.filter(ele => 
          ele.data && (ele.data.id === source || ele.data.originalId === source));
          
        // Create edges for each matching source node
        sourceNodes.forEach(sourceNode => {
          elements.push({
            group: 'edges',
            data: {
              id: `edge-${sourceNode.data.id}-${target}`,
              source: sourceNode.data.id,
              target: target
            }
          });
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
    
    return {
      main: elements,
      coreTrees: coreTreesData
    };
  };

  // Function to build a core class tree
  const buildCoreClassTree = (coreClass) => {
    if (!coreClass || !courseData[coreClass.course]) return [];
    
    const elements = [];
    const visited = new Set();
    const compoundGroups = {};
    let groupCounter = 0;
    
    // Track dependencies for edge creation
    const dependencies = new Map();
    const orGroupDependencies = new Map();
    
    // Create sequential color variations based on depth
    const generateSequentialColor = (baseColor, depth) => {
      // Convert hex to RGB
      const hex = baseColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      // Adjust brightness based on depth (deeper = darker)
      const factor = Math.max(0.6, 1.0 - (depth * 0.15));
      
      // Calculate new RGB values
      const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
      const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
      const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
      
      // Convert back to hex
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    };
    
    // Process a course node
    const processNode = (course, depth = 0, targetId = null) => {
      // Add dependency for edge creation
      if (targetId) {
        if (!dependencies.has(course)) {
          dependencies.set(course, []);
        }
        dependencies.get(course).push(targetId);
      }
      
      // Skip if already visited
      if (visited.has(course)) return;
      visited.add(course);
      
      // Generate color based on depth
      const nodeColor = generateSequentialColor(coreClass.color, depth);
      
      // Add course node
      if (courseData[course]) {
        const courseInfo = courseData[course];
        elements.push({
          group: 'nodes',
          data: {
            id: course,
            label: course,
            title: courseInfo.title || course,
            depth: depth,
            color: nodeColor,
            isRoot: course === coreClass.course
          },
          classes: course === coreClass.course ? 'core-root' : ''
        });
        
        // Process prerequisites
        const prereqs = courseInfo.parsed_prerequisites;
        if (prereqs && prereqs !== 'N/A') {
          processLogicalStructure(prereqs, course, depth + 1);
        }
      } else if (course !== 'N/A') {
        // External prerequisite
        elements.push({
          group: 'nodes',
          data: {
            id: course,
            label: course,
            title: "External Prerequisite",
            depth: depth,
            color: nodeColor
          },
          classes: 'external-prereq'
        });
      }
    };
    
    // Process logical structures in core tree
    const processLogicalStructure = (structure, targetId, depth) => {
      if (typeof structure === 'string') {
        processNode(structure, depth, targetId);
      } else if (structure.and) {
        structure.and.forEach(item => {
          processLogicalStructure(item, targetId, depth);
        });
      } else if (structure.or) {
        // Create OR group
        const groupId = `or-group-${groupCounter++}`;
        const groupColor = generateSequentialColor(coreClass.color, depth);
        
        elements.push({
          group: 'nodes',
          data: {
            id: groupId,
            label: 'OR',
            color: '#f8f9fa',
            borderColor: groupColor
          },
          classes: 'or-group'
        });
        
        // Add edge from OR group to target
        if (!orGroupDependencies.has(groupId)) {
          orGroupDependencies.set(groupId, []);
        }
        orGroupDependencies.get(groupId).push(targetId);
        
        // Process OR options
        structure.or.forEach(item => {
          if (typeof item === 'string') {
            processNode(item, depth, null);
            
            // Find the node and set its parent
            const courseNode = elements.find(ele => 
              ele.data && ele.data.id === item);
              
            if (courseNode) {
              courseNode.data.parent = groupId;
            }
          } else {
            // Handle nested structure
            const nestedId = `nested-${elements.length}`;
            processNestedLogical(item, nestedId, groupId, depth + 1);
          }
        });
      }
    };
    
    // Handle nested logical structures
    const processNestedLogical = (structure, nodeId, parentId, depth) => {
      const groupColor = generateSequentialColor(coreClass.color, depth);
      
      if (structure.and) {
        elements.push({
          group: 'nodes',
          data: {
            id: nodeId,
            label: 'AND',
            parent: parentId,
            color: '#f8f9fa',
            borderColor: groupColor
          },
          classes: 'and-group'
        });
        
        structure.and.forEach(item => {
          if (typeof item === 'string') {
            processNode(item, depth, nodeId);
          } else {
            const subId = `sub-${elements.length}`;
            processNestedLogical(item, subId, nodeId, depth + 1);
          }
        });
      } else if (structure.or) {
        elements.push({
          group: 'nodes',
          data: {
            id: nodeId,
            label: 'OR',
            parent: parentId,
            color: '#f8f9fa',
            borderColor: groupColor
          },
          classes: 'or-group'
        });
        
        structure.or.forEach(item => {
          if (typeof item === 'string') {
            processNode(item, depth, nodeId);
          } else {
            const subId = `sub-${elements.length}`;
            processNestedLogical(item, subId, nodeId, depth + 1);
          }
        });
      }
    };
    
    // Start building the core tree from the root core class
    processNode(coreClass.course);
    
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

  // Initialize or update the main Cytoscape graph
  const renderMainGraph = (elements) => {
    if (elements.length === 0) return;
    
    if (cyInstances.current.main) {
      cyInstances.current.main.destroy();
    }

    cyInstances.current.main = Cytoscape({
      container: mainContainerRef.current,
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
          selector: 'node.main-course',
          style: {
            'background-color': '#ffbf00', // UCI gold color
            'color': '#1d2434',            // Dark text for contrast
            'border-width': '3px',
            'border-color': '#e0a800',     // Darker gold for border
            'font-weight': 'bold',
            'font-size': '14px',           // Slightly larger font
            'z-index': 10                  // Ensure it's above other nodes
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
            'padding': '2px',
            'cursor': 'pointer'
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
    
    // Add click event for core class nodes
    cyInstances.current.main.on('tap', 'node.core-class', function(evt) {
      const node = evt.target;
      const courseId = node.data('originalId');
      
      // Find the corresponding core tree from the available core trees
      const coreTree = window.coreTrees?.find(tree => tree.course === courseId);
      if (coreTree) {
        setSelectedCoreClass(coreTree);
      }
    });
    
    // Add tooltips for nodes
    cyInstances.current.main.on('mouseover', 'node', function(e) {
      const node = e.target;
      if (node.data('title')) {
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'cy-tooltip';
        
        let tooltipContent = `<strong>${node.data('label') || node.data('originalId')}</strong>: ${node.data('title')}`;
        
        if (node.hasClass('core-class')) {
          tooltipContent += '<br><em>Click to view prerequisite tree</em>';
        }
        
        tooltip.innerHTML = tooltipContent;
        document.body.appendChild(tooltip);
        
        // Position tooltip near cursor
        const updatePosition = (e) => {
          tooltip.style.left = `${e.originalEvent.pageX + 15}px`;
          tooltip.style.top = `${e.originalEvent.pageY + 15}px`;
        };
        
        updatePosition(e);
        
        // Update position when cursor moves
        node.on('mousemove', updatePosition);
        
        // Remove tooltip on mouseout
        node.one('mouseout', () => {
          tooltip.remove();
          node.off('mousemove', updatePosition);
        });
      }
    });
  };

  // Render core class tree popup
  const renderCoreTree = (coreClass) => {
    if (!coreClass) return;
    
    const elements = buildCoreClassTree(coreClass);
    
    if (elements.length === 0) return;
    
    if (cyInstances.current.coreTree) {
      cyInstances.current.coreTree.destroy();
    }
    
    cyInstances.current.coreTree = Cytoscape({
      container: coreTreeContainerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': 'data(color)',
            'color': '#333',
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
          selector: 'node.core-root',
          style: {
            'border-width': '3px',
            'border-color': '#333',
            'font-weight': 'bold'
          }
        },
        {
          selector: '.or-group',
          style: {
            'background-color': 'data(color)',
            'background-opacity': 0.5,
            'border-width': 2,
            'border-style': 'dashed',
            'border-color': 'data(borderColor)',
            'font-weight': 'bold',
            'color': '#333',
            'text-valign': 'center',
            'text-halign': 'center',
            'shape': 'round-rectangle',
            'width': '60px',
            'height': '30px',
            'padding': '5px'
          }
        },
        {
          selector: '.and-group',
          style: {
            'background-color': 'data(color)',
            'background-opacity': 0.5,
            'border-width': 2,
            'border-style': 'solid',
            'border-color': 'data(borderColor)',
            'font-weight': 'bold',
            'color': '#333',
            'text-valign': 'center',
            'text-halign': 'center',
            'shape': 'round-rectangle',
            'width': '60px',
            'height': '30px',
            'padding': '5px'
          }
        },
        {
          selector: '.external-prereq',
          style: {
            'background-color': '#767676',
            'border-width': 0,
            'color': 'white'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#999',
            'target-arrow-color': '#999',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }
      ],
      layout: {
        name: 'dagre',
        rankDir: 'BT',
        nodeSep: 60,
        rankSep: 100,
        padding: 30
      }
    });
    
    // Add tooltips for nodes in core tree
    cyInstances.current.coreTree.on('mouseover', 'node', function(e) {
      const node = e.target;
      if (node.data('title')) {
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'cy-tooltip';
        tooltip.innerHTML = `<strong>${node.id()}</strong>: ${node.data('title')}`;
        document.body.appendChild(tooltip);
        
        // Position tooltip near cursor
        const updatePosition = (e) => {
          tooltip.style.left = `${e.originalEvent.pageX + 15}px`;
          tooltip.style.top = `${e.originalEvent.pageY + 15}px`;
        };
        
        updatePosition(e);
        
        // Update position when cursor moves
        node.on('mousemove', updatePosition);
        
        // Remove tooltip on mouseout
        node.one('mouseout', () => {
          tooltip.remove();
          node.off('mousemove', updatePosition);
        });
      }
    });
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const formattedQuery = searchQuery.trim().toUpperCase();
    setHasSearched(true);
    setSelectedCoreClass(null); // Reset selected core class
    
    // Try to find course
    const matchingCourse = Object.keys(courseData).find(
      course => course.toUpperCase() === formattedQuery
    );
    
    if (matchingCourse) {
      setCourseNotFound(false);
      const graphData = buildGraphElements(matchingCourse);
      renderMainGraph(graphData.main);
      // Store core trees in window for node click events
      window.coreTrees = graphData.coreTrees;
      
      // Center view on the main course node after the layout is done
      setTimeout(() => {
        if (cyInstances.current.main) {
          const mainNode = cyInstances.current.main.$('node.main-course');
          if (mainNode.length) {
            cyInstances.current.main.center(mainNode);
            cyInstances.current.main.zoom({
              level: 1.2,
              position: mainNode.position()
            });
          }
        }
      }, 500); // Give layout time to run
    } else {
      setCourseNotFound(true);
      window.coreTrees = [];
      
      if (cyInstances.current.main) {
        cyInstances.current.main.destroy();
        cyInstances.current.main = null;
      }
      
      if (cyInstances.current.coreTree) {
        cyInstances.current.coreTree.destroy();
        cyInstances.current.coreTree = null;
      }
    }
  };

  // Re-apply layout to improve visualization
  const reorganizeGraph = () => {
    if (cyInstances.current.main) {
      cyInstances.current.main.layout({
        name: 'fcose',
        animate: true,
        randomize: true,
        padding: 75,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: 100,
        nodeRepulsion: 8000,
        edgeElasticity: 0.45,
        nestingFactor: 0.1,
        gravity: 0.25,
        numIter: 2000,
        tile: true
      }).run();
    }
    
    if (cyInstances.current.coreTree) {
      cyInstances.current.coreTree.layout({
        name: 'dagre',
        rankDir: 'BT',
        nodeSep: 60,
        rankSep: 100,
        padding: 30,
        animate: true
      }).run();
    }
  };

  // Close core tree popup
  const closeCoreTreePopup = () => {
    setSelectedCoreClass(null);
    
    if (cyInstances.current.coreTree) {
      cyInstances.current.coreTree.destroy();
      cyInstances.current.coreTree = null;
    }
  };

  const toggleHelpTooltip = () => {
    setIsHelpTooltipVisible(!isHelpTooltipVisible);
  };

  // Effect to render core tree when selected
  useEffect(() => {
    if (selectedCoreClass) {
      renderCoreTree(selectedCoreClass);
    }
  }, [selectedCoreClass]);

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
            🔎
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
                  <li>Direct prerequisites with solid arrows</li>
                  <li>Alternative options (OR relationships) grouped in dashed boxes</li>
                  <li>Colored circles represent courses that appear frequently in prerequisites</li>
                  <li><strong>Click on a colored circle</strong> to view its complete prerequisite tree</li>
                </ul>
                <p>Use the "Reorganize" button to refresh the layout if nodes overlap.</p>
              </div>
            )}
          </div>
        </div>
      </form>
      
      {/* Core Tree Popup */}
      {selectedCoreClass && (
        <div className="core-tree-popup">
          <div className="core-tree-header" style={{ backgroundColor: selectedCoreClass.color }}>
            <h3>{selectedCoreClass.course} Prerequisites</h3>
            <button 
              className="close-button" 
              onClick={closeCoreTreePopup}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div 
            ref={coreTreeContainerRef} 
            className="core-tree-container"
          />
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
        ref={mainContainerRef} 
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

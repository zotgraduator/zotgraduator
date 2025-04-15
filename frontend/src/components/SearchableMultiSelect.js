import React, { useState, useRef, useEffect } from 'react';

function SearchableMultiSelect({ options, selectedValues, onChange, placeholder = "Search..." }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !selectedValues.includes(option)
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions]);

  // Handle option selection
  const handleSelectOption = (option) => {
    const newSelected = [...selectedValues, option];
    onChange(newSelected);
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Remove a selected item
  const handleRemoveItem = (item, e) => {
    e.stopPropagation(); // Prevent dropdown from opening
    const newSelected = selectedValues.filter(i => i !== item);
    onChange(newSelected);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && isOpen && filteredOptions.length > 0) {
      e.preventDefault();
      handleSelectOption(filteredOptions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="searchable-multi-select" ref={dropdownRef}>
      <div 
        className="multi-select"
        onClick={() => {
          setIsOpen(true);
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }}
      >
        <div className="selected-items">
          {selectedValues.map(item => (
            <div key={item} className="tag">
              {item}
              <button 
                type="button" 
                className="remove-tag" 
                onClick={(e) => handleRemoveItem(item, e)}
                aria-label={`Remove ${item}`}
              >
                ×
              </button>
            </div>
          ))}
          <div className="search-input-container">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={selectedValues.length === 0 ? placeholder : ""}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              aria-label="Search courses"
            />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="options-dropdown">
          {filteredOptions.length === 0 ? (
            <div className="no-options">
              {searchTerm ? "No matching options" : "No options available"}
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option}
                className={`option-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                onClick={() => handleSelectOption(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SearchableMultiSelect;

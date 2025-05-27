import pandas as pd
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Set, Optional


@dataclass
class CoursePlanner:
    data_path: str
    planned_years: int
    max_units_per_sem: int
    completed_courses: list = None
    sessions: list = None
    prereqs_dag: Dict[str, List[str]] = None
    forward_dag_input: Dict[str, List[str]] = None  # Renamed to avoid property conflict
    _cdict: dict = field(default=None, init=False)
    _pdag: dict = field(default=None, init=False)
    _fdag: dict = field(default=None, init=False)
    _session_val: dict = field(default=None, init=False)
    _schedule: dict = field(default=None, init=False)
    _visited: set = field(default=None, init=False)

    @property
    def course_dict(self) -> dict:
        return self._cdict
    
    @property
    def prereq_dag(self) -> dict:
        return self._pdag
    
    @property
    def forward_dag(self) -> dict:
        return self._fdag
    
    @property
    def schedule(self) -> dict:
        return self._schedule

    def __post_init__(self) -> None:
        self._cdict = self.__read_csv_to_dict()
        
        # Use provided prerequisite DAG if available, otherwise build from course dict
        self._pdag = self.prereqs_dag if self.prereqs_dag else self.__build_pdag(self._cdict)
        
        # Use provided forward DAG if available, otherwise build from prereq DAG
        self._fdag = self.forward_dag_input if self.forward_dag_input else self.__build_fdag(self._cdict)
        
        self._session_val = {
            f'{s}{i}': i*len(self.sessions) + idx 
                for i in range(self.planned_years)
                for idx, s in enumerate(self.sessions) 
            }
        self._schedule = {k: [] for k in self._session_val.keys()}

        self._visited = set()
        if self.completed_courses:
            for course in self.completed_courses:
                self._visited.add(course)


    def __read_csv_to_dict(self) -> dict:
        df = pd.read_csv(self.data_path)
        
        # Check if we're using the courses_availability.csv format
        if 'Course' in df.columns and 'Availability' in df.columns:
            # Initialize a basic course dictionary with default values
            course_dict = {}
            for _, row in df.iterrows():
                course_id = row['Course']
                # For each course, create a tuple of (title, prerequisites, units)
                # Using default values since we don't have detailed information
                course_dict[course_id] = (
                    course_id,  # Use course ID as title for now
                    [],  # Empty prerequisites since we don't have that info
                    4  # Default to 4 units per course
                )
            return course_dict
        elif 'CoursesID' in df.columns:
            # Original format
            return {
                row['CoursesID']: 
                    (row['Title'], 
                    [] if pd.isnull(row['Prerequisites']) else row['Prerequisites'].split('+'), 
                    row['Units']) 
                for _, row in df.iterrows()
                }
        else:
            raise ValueError("Unsupported CSV format. Expected columns not found.")


    def __build_pdag(self, course_dict: dict) -> dict:
        # For courses_availability.csv format, we don't have prerequisites
        # So we'll create an empty prerequisite list for each course
        return {k: v[1] for k, v in course_dict.items()}


    def __build_fdag(self, course_dict: dict) -> dict:
        dag = {} 
        for cid, (_, prereqs, _) in course_dict.items():
            dag.setdefault(cid, [])
            for p in prereqs:
                dag.setdefault(p, [])
                dag[p].append(cid)
        return dag
    
    
    def __build_plan_dfs(self, course: str, courses_avail: dict) -> None:
        # Base case
        if course in self._visited:
            return
        
        # Check prerequisites
        if course in self._pdag:
            prereqs = self._pdag[course]
            # First process all prerequisites
            for prereq in prereqs:
                if prereq not in self._visited and prereq in courses_avail:
                    self.__build_plan_dfs(prereq, courses_avail)
        
        # Mark course as visited
        self._visited.add(course)

        # Lambda functions
        def check_max_units(k: str) -> bool:
            total_units = sum([self._cdict[c][2] for c in self._schedule[k]])
            return total_units + self._cdict[course][2] <= self.max_units_per_sem
        
        def get_score(base: int, dag: dict, extrema: Callable[[int, int], int]) -> int:
            score = base
            for n in dag.get(course, []):
                for k, v in self._schedule.items():
                    if n in v:
                        score = extrema(score, self._session_val[k])
            return score

        # Add course to schedule logic
        min_window = get_score(-1, self._pdag, max)
        max_window = get_score(self.planned_years * len(self.sessions), self._fdag, min)

        # Check if all prerequisites are already in the schedule
        prereqs_met = True
        for prereq in self._pdag.get(course, []):
            if prereq not in self._visited:
                prereqs_met = False
                break
        
        if not prereqs_met:
            return  # Don't schedule this course if prerequisites aren't met
        
        # Try to schedule the course
        for i in range(self.planned_years):
            for session in courses_avail.get(course, []):
                k = f'{session}{i}'
                if k not in self._session_val:
                    continue  # Skip if term is not in planned sessions
                
                score = self._session_val[k]
                if check_max_units(k) and min_window < score < max_window:
                    self._schedule[k].append(course)
                    return
    
    
    def fixed_core_course(self, semester: str, courses: list) -> None:
        if semester not in self._schedule:
            return  # Skip if semester is not in planned sessions
        
        self._schedule[f'{semester}'] = courses
        for course in courses:
            self._visited.add(course)


    def build_plan(self, courses_avail: dict) -> None:
        # Process all courses that are available
        for k in courses_avail.keys():
            if k in self._cdict:  # Only process courses that exist in our dictionary
                self.__build_plan_dfs(k, courses_avail)

        # Print out self.prereq_dag
        print("Prerequisite DAG:")
        for course, prereqs in self._pdag.items():
            print(f"{course}: {prereqs}")
                
                
    def display_schedule(self) -> None:
        print('-'*50, '\n')
        for k, v in self._schedule.items():
            print(f'{k}: {v}')
        print()
        print('-'*50, '\n')
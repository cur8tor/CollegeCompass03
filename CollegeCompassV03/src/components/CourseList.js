import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const CourseList = () => {
  const [movies, setMovies] = useState([]);
  const [sortField, setSortField] = useState('IMDb Rating');  
  const [sortDirection, setSortDirection] = useState('desc');
  const [seenMovies, setSeenMovies] = useState(new Set());
  const [showSeen, setShowSeen] = useState(true);

  const { user, isAuthenticated } = useAuth0();

  const toggleSeen = async (id) => {
    if (isAuthenticated) {
      console.log("Auth0 User ID:", user.sub);
    }
  
    const newSeenMovies = new Set(seenMovies);
    if (newSeenMovies.has(id)) {
      newSeenMovies.delete(id);
      console.log(`Movie with ID ${id} is now unmarked as seen.`);
    } else {
      newSeenMovies.add(id);
      console.log(`Movie with ID ${id} is marked as seen.`);
    }
    setSeenMovies(newSeenMovies);
  
    try {
      const response = await fetch(`/api/user/seenMovies?userId=${user?.sub || ''}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log('List of seen movies:', data.seenMovies);
    } catch (error) {
      console.log('Error fetching seen movies:', error);
  
      if (error instanceof SyntaxError) {
        const rawText = await fetch(`/api/user/seenMovies?userId=${user?.sub || ''}`).then(res => res.text());
        console.error('Raw response from the server:', rawText);
      }
    }
  };
    
  const handleSort = (field) => {
    if (field === 'Seen') {
      setShowSeen(!showSeen);
      return;
    }

    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'IMDb Rating' || field === 'Year' ? 'desc' : 'asc');
    }
  };

  useEffect(() => {
    fetch('http://localhost:3001/api/movies')
      .then(response => response.json())
      .then(data => {
        setMovies(data);
      })
      .catch(error => console.log('Error fetching movies:', error));
  }, []);

  const sortedMovies = [...movies].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const displayedMovies = sortedMovies.filter(movie => showSeen || !seenMovies.has(movie._id));

  return (
    
    <div className="table-container">
        <h1>Course Overview</h1> 
    <div>
      <table>
        <thead>
          <tr>
            <th><button onClick={() => handleSort('Course')}>Course</button></th>
            <th><button onClick={() => handleSort('Title')}>Title</button></th>
            <th><button onClick={() => handleSort('Credits')}>Credits</button></th>
            <th><button onClick={() => handleSort('Term')}>Term</button></th>
          </tr>
        </thead>
        <tbody>
          {displayedMovies.map((movie, index) => (
            <tr key={index}>
              <td>{movie.Course}</td>
              <td>{movie.Title}</td>
              <td>{movie.Credits}</td>
              <td>{movie.Term}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
};

export default CourseList;

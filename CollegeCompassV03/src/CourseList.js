import React, { useState, useEffect } from 'react';

function CourseList() {
    const [movies, setMovies] = useState([]);

    // useEffect(() => {
    //     fetch('http://localhost:3001/api/movies') // adjust this if your server runs on a different port
    //         .then(response => response.json())
    //         .then(data => setMovies(data));
    // }, []);

    return (
        <div>
            <h1>Movies</h1>
            {movies.map(movie => (
                <div key={movie._id}>
                    <h2>{movie.title}</h2>
                    <p>{movie.description}</p>
                </div>
            ))}
        </div>
    );
}

export default CourseList;

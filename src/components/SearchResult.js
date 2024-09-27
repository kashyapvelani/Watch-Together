'use client'
import React, { useState,useEffect } from 'react'
import axios from "../../axios";
import Link from 'next/link';

function SearchResult({query}) {
    const [movies, setMovies] = useState([]);
    const base_url = 'https://image.tmdb.org/t/p/original/';

    const API_KEY = TMDB_API_KEY;

    useEffect(() => {
        async function fetchData() {
          const request = await axios.get(
            `/search/movie?query=${query}&api_key=${API_KEY}&include_adult=false&language=en-US&page=1`
          );
          // console.log(request.data.results);
          setMovies(request.data.results);
          return request;
        }
        fetchData();
      }, [query]);
    
    
  return (
    <div className='grid grid-cols-8'>
        {movies?.map(movie => (
            movie.poster_path &&
            <div key={movie.id} className='p-2 transform w-[185px] h-[285px] hover:-translate-y-1 hover:scale-110 transition ease-in-out delay-150 duration-300  '>
            <Link href={`/movie/${movie.id}`}>
            <img src={`${base_url}${movie.poster_path}`} height="190px" width="500px" className='rounded-lg ' key={movie.id}/>
            </Link>
        </div>
        ))}
    </div>
  )
}

export default SearchResult

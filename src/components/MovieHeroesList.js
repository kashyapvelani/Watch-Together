'use client'

import React, { useState,useEffect } from 'react';
import axios from '../../axios';
import requests from '../../Requests';
import Link from 'next/link';


function MovieHeroesList() {

  const [movie,setMovie] = useState([]);

  const base_url = 'https://image.tmdb.org/t/p/original/';

  useEffect(() => {
    async function fetchData() {
      const request = await axios.get(requests.fetchNetflixOriginals);
      setMovie(
        request.data.results[
          Math.floor(Math.random() * request.data.results.length - 1)
        ]
      );
      return request;
    }
    fetchData();
  }, []);

  
  const releaseDate = movie?.first_air_date || movie?.release_date;
  const language = movie?.original_language;

  return (
    <div className='px-2'>
        <img src={`${base_url}${movie?.backdrop_path}`} className='h-[190px] w-[500px] object-cover rounded-lg'/> 
        <div className='flex py-4'>
            <div className='bg-[#4977FF] w-[290px] py-2 rounded-lg'>
                <h1 className='font-bold text-lg px-2'>{movie?.title?.length<27?movie?.title:movie?.title?.substring(0,22)+"..."}</h1>
                <p className='font-extraligth text-xs px-2'>{releaseDate?.slice(0,4)}{language=="en"?" • English":""}</p>
            </div>
            <button className="bg-[#252525] pl-6 pr-8 py-2 rounded-lg font-semibold flex items-center ml-4 w-[190px]">
                <span>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.5825 12.3993L13.0324 6.88554C11.8097 6.1796 10.3035 6.17858 9.07983 6.88287C7.85616 7.58716 7.10042 8.89006 7.09662 10.3019V21.3557C7.10042 22.7676 7.85616 24.0705 9.07983 24.7748C10.3035 25.4791 11.8097 25.4781 13.0324 24.7721L22.5825 19.2584C23.8093 18.5522 24.5655 17.2444 24.5655 15.8288C24.5655 14.4132 23.8093 13.1055 22.5825 12.3993Z"
                      fill="white"
                    />
                  </svg>
                </span>
                <Link href={`/movie/${movie?.id}`}>
                Watch Now
                </Link>
              </button>
        </div>
    </div>
  )
}

export default MovieHeroesList
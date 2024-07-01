import Link from 'next/link';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

function MovieDetails({movie}) {
    const uuid = uuidv4();
    const base_url = 'https://image.tmdb.org/t/p/original/';
    const language = movie?.original_language;
    const duration = ~~(movie?.runtime/60)+"h "+movie?.runtime%60+" m"
  return (
    <div>
      <div className="bg-[#121212] w-full h-[430px]">
        <div className="flex p-4">
          <div className="w-1/3 py-12 px-8 m-auto">
            <h1 className="font-extrabold text-3xl">
              {movie?.title}
            </h1>
            <p className="text-base py-4 font-semibold text-gray-200">
            {movie?.release_date?.slice(0,4)} • {duration}{language=="en"?" • English":""}
            </p>
            <p className="text-sm py-2 font-extralight text-gray-400">
            {movie?.overview?.length<150?movie?.overview:movie?.overview?.substring(0,150)+"..."}
            </p>
            <p className="font-semibold py-4 text-sm text-gray-200">
              {movie?.genres?.map(genre => (
                <span key={genre.id}>{genre.name} | </span>
              ))}
            </p>

            <div className="py-2 flex">
              <Link href={{
                pathname:`/watch/movie/${movie.id}`,
                query: {room:`${uuid}`}}}>
              <button className="bg-[#4977FF] px-20 py-2 rounded-lg font-semibold flex items-center">
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
                Watch Now
              </button>
              </Link>
            </div>
          </div>
          <div className="w-2/3">
          <img src={`${base_url}${movie?.backdrop_path}`} className='h-[400px] w-full object-cover rounded-lg' key={movie.id}/>
            
          </div>
        </div>
      </div>
    </div>
  )
}

export default MovieDetails
'use client'

import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import axios from '../../axios';
import Link from 'next/link';
import Head from 'next/head';




function MovieList({fetchUrl}) {
  const base_url = 'https://image.tmdb.org/t/p/original/';

  const [movies, setMovies] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const request = await axios.get(fetchUrl);
      setMovies(request.data.results);
      return  request;
    }
    fetchData();
  }, [fetchUrl])
  

  return (
    <div className="py-4">
      <Head>
      <link rel="stylesheet" href="https://unpkg.com/swiper/swiper-bundle.min.css"></link>
      </Head>
      <div>
      <Swiper
      navigation={true}
      modules={[Navigation]}
      spaceBetween={50}
      slidesPerView={8}
      
    >
      {movies?.map(movie => (
        movie.poster_path && 
        <SwiperSlide key={movie?.id}>
        <div key={movie?.id} className='p-2 transform w-[185px] h-[285px] hover:-translate-y-1 hover:scale-110 transition ease-in-out delay-150 duration-300  '>
        <Link href={`/movie/${movie.id}`} key={movie?.id}>
        <img src={`${base_url}${movie.poster_path}`} height="190px" width="500px" className='rounded-lg ' key={movie?.id}/>
        </Link>
    </div></SwiperSlide>
      ))}
    </Swiper>
      </div>
      
    </div>
  )
}

export default MovieList
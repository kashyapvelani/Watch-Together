import Link from 'next/link';
import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import Head from 'next/head';


import 'swiper/css/navigation';

function SimilarMovieList({movies}) {
    const base_url = 'https://image.tmdb.org/t/p/original/';
    // console.log(movies.results);
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
      direction={'horizontal'}
    >
      {movies.results?.map(movie => (
        movie.poster_path &&
        <SwiperSlide key={movie?.id}>
        <div key={movie?.id} className='p-2 transform w-[185px] h-[285px] hover:-translate-y-1 hover:scale-110 transition ease-in-out delay-150 duration-300  '>
        <Link href={`/movie/${movie.id}`} key={movie?.id}>
        <img src={`${base_url}${movie.poster_path}`} height="190px" width="500px" className='rounded-lg ' key={movie?.id}/>
        </Link> 
    </div>
    </SwiperSlide>
      ))}
    </Swiper>
      </div>
      
    </div>
  )
}

export default SimilarMovieList
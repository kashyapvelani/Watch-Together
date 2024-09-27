"use client";
import React, { useState, useEffect } from "react";
import axios from "../../../../axios";
import MovieDetails from "@/components/MovieDetails";
import SimilarMovieList from "@/components/SimilarMovieList";
import SectionTitle from "@/components/SectionTitle";

function Details({ params }) {
  
  const [movies, setMovies] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const API_KEY = TMDB_API_KEY;
  useEffect(() => {
    async function fetchData() {
      const request = await axios.get(`/movie/${params.id}?api_key=${API_KEY}&language=en-US&append_to_response=videos`);
      setMovies(request.data);
      return  request;
    }
    fetchData();
  }, [params])

  useEffect(() => {
    async function fetchData() {
      const request = await axios.get(`/movie/${params.id}/recommendations?api_key=${API_KEY}&language=en-US&append_to_response=videos`);
      setSimilarMovies(request.data);
      return  request;
    }
    fetchData();
  }, [params])

  // console.log(similarMovies);

  return (
    <main className="p-4 pl-20">
      <MovieDetails movie={movies}/>
      <SectionTitle title="Recommended"/>
      <SimilarMovieList movies={similarMovies}/>
    </main>
  );
}

export default Details;

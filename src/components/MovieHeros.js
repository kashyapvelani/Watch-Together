import React from "react";
import MovieHeroesList from "./MovieHeroesList";



function MovieHeros() {
  return (
    <div className="py-4">
      <div className="flex px-2 overflow-x-scroll no-scrollbar">
        <MovieHeroesList />
        <MovieHeroesList />
        <MovieHeroesList />
      </div>
      
    </div>
  );
}

export default MovieHeros;

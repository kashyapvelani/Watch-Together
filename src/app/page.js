'use client'
import Hero from "@/components/Hero";
import MovieHeros from "@/components/MovieHeros";
import MovieList from "@/components/MovieList";
import SectionTitle from "@/components/SectionTitle";

import requests from '../../Requests';



export default function Home() {

  return (
    <main className="p-2 pl-20">
      <Hero fetchUrl={requests.fetchTrending}/>
      <SectionTitle title="Recommended"/>
      <MovieHeros/>
      <SectionTitle title="Action"/>
      <MovieList fetchUrl={requests.fetchActionMovies}/>
      <SectionTitle title="Bollywood"/>
      <MovieList fetchUrl={requests.fetchBollywoods}/>
      <SectionTitle title="Comedy"/>
      <MovieList fetchUrl={requests.fetchComedyMovies}/>
      <SectionTitle title="Documentaries"/>
      <MovieList fetchUrl={requests.fetchDocumentaries}/>

    </main>
  );
}

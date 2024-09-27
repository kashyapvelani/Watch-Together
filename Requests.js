const API_KEY = TMDB_API_ENV

const requests = {
  fetchTrending: `movie/upcoming?language=en-US&page=1&api_key=${API_KEY}`,
  fetchNetflixOriginals: `/discover/movie?api_key=${API_KEY}&with_networks=213&language=en-US`,
  fetchTopRated: `/movie/top_rated?api_key=${API_KEY}&language=en-US`,
  fetchActionMovies: `/discover/movie?api_key=${API_KEY}&with_genres=28&language=en-US`,
  fetchComedyMovies: `/discover/movie?api_key=${API_KEY}&with_genres=35&language=en-US`,
  fetchHorrorMovies: `/discover/movie?api_key=${API_KEY}&with_genres=27&language=en-US`,
  fetchRomanceMovies: `/discover/movie?api_key=${API_KEY}&with_genres=10749&language=en-US`,
  fetchDocumentaries: `/discover/movie?api_key=${API_KEY}&with_genres=99&language=en-US`,
  fetchBollywoods: `https://api.themoviedb.org/3/discover/movie?with_original_language=hi&sort_by=popularity.desc&page=1&api_key=${API_KEY}`,
};

export default requests;

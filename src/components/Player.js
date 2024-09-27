import React, { useState,useEffect,useRef } from 'react'
import { MediaPlayer, MediaProvider,useMediaRemote ,   } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import axios from "../../axios";


import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

function Player({ params,socket }) {
    const [movies, setMovies] = useState([]);
    const [key, setKey] = useState(null);
    const API_KEY = TMDB_API_KEY;


    function onPlayVideo() {
      // console.log("Player is Playing!");
      socket.emit("play",playerRef.current.currentTime);
    }

    function onPauseVideo() {
      // console.log("Player Paused");
      socket.emit("pause");
    }

    function onSeekVideo() {
      // console.log("Player Seeked", playerRef.current.currentTime);
      socket.emit("seek", playerRef.current.currentTime);
    }


    useEffect(() => {
        async function fetchData() {
          const request = await axios.get(`/movie/${params.id}/videos?api_key=${API_KEY}&language=en-US&append_to_response=videos`);
    
          if(request){
            const findIndexOfTrailer = request.data.results?.findIndex(item=>
              item.type==='Trailer'
              )
              const findIndexOfTeaser = request.data.results?.findIndex(item=>
                item.type==='Teaser'
                )
              // console.log("Index",request.data.results);
                setMovies(request.data.results);
                setKey(findIndexOfTrailer !== -1 ? request.data.results[findIndexOfTrailer]?.key : request.data.results[findIndexOfTeaser]?.key)
          }
    
          
          return  request;
        }
        fetchData();
      }, [params])
     
      const playerRef = useRef();
      const remote = useMediaRemote();
      remote.setPlayer(playerRef);
      
      
      useEffect(() => {
        
      const player = remote.getPlayer();
      // console.log("Player: ",player);
        

        socket.on('play', (time) => {
          // console.log("Socket is emitting on play");
          // console.log(time);
          playerRef.current.play();
          playerRef.current.currentTime = time;
        });

        socket.on('pause', () => {
          // console.log("Socket is emitting on pause");
          playerRef.current.pause();
        });

        socket.on('seek', ( time ) => {
          // console.log("Socket is emitting on seek", time);
          playerRef.current.currentTime = time;
        });

      })

  return (
    <div className="bg-[#121212] h-[660px] w-[1140px] rounded-lg">
        <MediaPlayer src={`youtube/${key}`} onPlay={onPlayVideo} onPause={onPauseVideo} onSeeked={onSeekVideo} ref={playerRef} >
          <MediaProvider />
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </div>
  )
}

export default Player

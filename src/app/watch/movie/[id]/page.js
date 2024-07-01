"use client";
import React, { useState, useEffect } from "react";

import socket from "@/lib/socket";
import Player from "@/components/Player";
import { useSearchParams } from "next/navigation";
import { Peer } from "peerjs";
import Agora from "@/components/Agora";

const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
});

const peers = {};

function reaction(emoji_name) {
  const react_emoji = document.getElementById(emoji_name);
  react_emoji.style.display= "flex";
  setTimeout(function(){
    react_emoji.style.display= "none";
  },5000)
}

function connectToNewUser(userId, stream) {
  if (peers[userId]) {
    // console.log("Already connected to this user: ", userId);
    return;
  }
  const call = myPeer.call(userId, stream);
 

  call.on("close", () => {
    audio.remove();
  });

  peers[userId] = call;
}


function watch({ params }) {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");
  

  useEffect(() => {

        let isCallAnswered = false;
        myPeer.on("call", (call) => {
          if (!isCallAnswered) {
            isCallAnswered = true;
            call.answer(stream);
            // console.log("Call Answered");
          } else {
            // console.log("Call already answered. Ignoring additional calls.");
            call.close();
          }
        });

        socket.on("user-connected", (userId) => {
          console.log("connected user" + userId);
          // setTimeout(connectToNewUser, 1000, userId, stream);
          // console.log("Peers: ", peers);
        });

        socket.on("user-disconnected", (userId) => {
          if (peers[userId]) {
            peers[userId].close();
          }
          // console.log("Peers: ", peers);
        });
      

    myPeer.on("open", (id) => {
      socket.emit("join-room", roomId, id);
      // console.log("user joined room");
    });

    return () => {};
  }, []);

  const roomid = searchParams.get('room');

  return (
    <main className="p-4 pl-20 flex space-x-4">
      
      <Player params={params} socket={socket} />
      <div>
          <Agora room={roomid} params={params}/>
      </div>
    </main>
  );
}

export default watch;

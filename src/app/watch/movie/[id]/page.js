"use client";
import React, { useState, useEffect } from "react";

import socket from "@/lib/socket";
import Player from "@/components/Player";
import Agora from "@/components/Agora";
import VideoChat from "@/components/VideoChat";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

function watch({ params }) {
  const searchParams  = useSearchParams();
  const roomId        = searchParams.get("room");
  const { user }      = useUser();

  // Lifted camera state — Agora.js toggles it, VideoChat.js reads it
  const [cameraOn, setCameraOn] = useState(false);

  useEffect(() => {
    socket.emit("join-room", roomId, socket.id);

    socket.on("user-connected", (userId) => {
      console.log("connected user: " + userId);
    });

    socket.on("user-disconnected", (userId) => {
      console.log("disconnected user: " + userId);
    });

    return () => {
      socket.off("user-connected");
      socket.off("user-disconnected");
    };
  }, [roomId]);

  return (
    <main className="p-4 pl-20 flex space-x-4">
      {/* ── Video player (unchanged) ─────────────────────────────────────── */}
      <Player params={params} socket={socket} />

      {/* ── Right sidebar ────────────────────────────────────────────────── */}
      <div className="flex flex-col space-y-4">

        {/* Video chat grid — shows camera feeds for all participants */}
        <VideoChat
          room={roomId}
          localUser={user}
          cameraOn={cameraOn}
        />

        {/* Voice chat — member avatars + mic / camera / share / leave controls */}
        <Agora
          room={roomId}
          params={params}
          onCameraToggle={(on) => setCameraOn(on)}
        />
      </div>
    </main>
  );
}

export default watch;

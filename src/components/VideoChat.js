'use client';
/**
 * VideoChat.js
 *
 * Renders a grid of video tiles for every participant in the Agora RTC channel.
 * Shares the singleton rtcClient from agoraClient.js — it does NOT join the
 * channel itself; that is handled by Agora.js when the user clicks "Join".
 *
 * Props
 * ─────
 *  room        {string}  – Agora channel / room id
 *  localUser   {object}  – Clerk user object { firstName, imageUrl }
 *  cameraOn    {boolean} – controlled by the parent (toggled via Agora.js button)
 */

import { useEffect, useRef, useState } from 'react';
import '@/styles/VideoChat.css';
import { rtcUid, videoTracks, callbacks } from '@/lib/agoraClient';

// ─── Helper: play a remote video track into a container div ──────────────────
function playRemoteVideo(track, containerId) {
  const container = document.getElementById(containerId);
  if (container) track.play(container);
}

// ─── Single video tile ────────────────────────────────────────────────────────
function VideoTile({ uid, name, dpUrl, isLocal, speaking, cameraEnabled }) {
  const videoContainerId = `video-container-${uid}`;

  return (
    <div className={`video-tile${speaking ? ' speaking' : ''}`}>
      {/* Container where Agora plays the video track */}
      <div id={videoContainerId} style={{ width: '100%', height: '100%' }} />

      {/* Camera-off placeholder */}
      {!cameraEnabled && (
        <div className="cam-off">
          {dpUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dpUrl} alt={name} />
          ) : (
            <div className="initials">
              {name ? name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <span className="cam-off-name">{name || `User ${uid}`}</span>
        </div>
      )}

      {/* Name label (always visible) */}
      <span className="name-label">{name || `User ${uid}`}</span>

      {/* "You" badge on self-view */}
      {isLocal && <span className="you-badge">You</span>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function VideoChat({ room, localUser, cameraOn }) {
  /**
   * participants: Map<uid (string), { uid, name, dpUrl, isLocal, cameraEnabled }>
   * We store it as an array in state so React re-renders on changes.
   */
  const [participants, setParticipants] = useState([]);
  const [speakingUids, setSpeakingUids] = useState(new Set());

  // ── Add / update a participant entry ────────────────────────────────────────
  const upsertParticipant = (uid, patch) => {
    setParticipants((prev) => {
      const idx = prev.findIndex((p) => p.uid === uid);
      if (idx === -1) return [...prev, { uid, cameraEnabled: false, ...patch }];
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...patch };
      return updated;
    });
  };

  const removeParticipant = (uid) => {
    setParticipants((prev) => prev.filter((p) => p.uid !== uid));
  };

  // ── Register callbacks from the shared agoraClient ──────────────────────────
  useEffect(() => {
    // When a remote user publishes their video track
    callbacks.onVideoPublished = (user) => {
      upsertParticipant(String(user.uid), { cameraEnabled: true });
      // Give React a tick to render the container div, then play into it
      setTimeout(() => {
        playRemoteVideo(user.videoTrack, `video-container-${user.uid}`);
      }, 100);
    };

    // When a remote user turns off their camera or leaves
    callbacks.onVideoUnpublished = (user) => {
      upsertParticipant(String(user.uid), { cameraEnabled: false });
    };

    // Volume changes → speaking indicator
    const prevVolumeCallback = callbacks.onVolumeChange;
    callbacks.onVolumeChange = (volumes) => {
      // Let Agora.js handle its own volume callback too
      if (prevVolumeCallback) prevVolumeCallback(volumes);

      setSpeakingUids(
        new Set(volumes.filter((v) => v.level >= 50).map((v) => String(v.uid)))
      );
    };

    return () => {
      callbacks.onVideoPublished   = null;
      callbacks.onVideoUnpublished = null;
      // Restore previous volume callback (Agora.js registers its own)
      callbacks.onVolumeChange = prevVolumeCallback ?? null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Add local user tile once localUser is available ─────────────────────────
  useEffect(() => {
    if (!localUser) return;
    upsertParticipant(String(rtcUid), {
      name:    localUser.firstName || localUser.username || 'You',
      dpUrl:   localUser.imageUrl,
      isLocal: true,
      cameraEnabled: cameraOn,
    });
  }, [localUser]);

  // ── Sync local camera state into the tile ───────────────────────────────────
  useEffect(() => {
    upsertParticipant(String(rtcUid), { cameraEnabled: cameraOn });

    // Play local video into its container when camera turns on
    if (cameraOn && videoTracks.localVideoTrack) {
      setTimeout(() => {
        videoTracks.localVideoTrack.play(`video-container-${rtcUid}`);
      }, 100);
    }
  }, [cameraOn]);

  // ── RTM member events → keep participant metadata in sync ───────────────────
  useEffect(() => {
    const prevMembersLoaded = callbacks.onMembersLoaded;
    const prevMemberJoined  = callbacks.onMemberJoined;
    const prevMemberLeft    = callbacks.onMemberLeft;

    callbacks.onMembersLoaded = (memberData) => {
      if (prevMembersLoaded) prevMembersLoaded(memberData);
      memberData.forEach((m) => {
        if (m.userRtcUid === String(rtcUid)) return; // skip self
        upsertParticipant(m.userRtcUid, {
          name:    m.name,
          dpUrl:   m.userDpUrl,
          isLocal: false,
        });
      });
    };

    callbacks.onMemberJoined = (memberId, attrs) => {
      if (prevMemberJoined) prevMemberJoined(memberId, attrs);
      if (attrs.userRtcUid === String(rtcUid)) return;
      upsertParticipant(attrs.userRtcUid, {
        name:    attrs.name,
        dpUrl:   attrs.userDpUrl,
        isLocal: false,
      });
    };

    callbacks.onMemberLeft = (memberId) => {
      if (prevMemberLeft) prevMemberLeft(memberId);
      // memberId is the RTM uid; we need to find the matching RTC uid
      setParticipants((prev) => prev.filter((p) => p.rtmId !== memberId));
    };

    return () => {
      callbacks.onMembersLoaded = prevMembersLoaded ?? null;
      callbacks.onMemberJoined  = prevMemberJoined  ?? null;
      callbacks.onMemberLeft    = prevMemberLeft    ?? null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Nothing to show until someone joins ─────────────────────────────────────
  if (participants.length === 0) {
    return (
      <div className="video-chat-panel flex items-center justify-center">
        <p className="text-[#a0a0b0] text-sm py-8">
          Join the chat to see video
        </p>
      </div>
    );
  }

  return (
    <div className="video-chat-panel">
      <div className="video-grid">
        {participants.map((p) => (
          <VideoTile
            key={p.uid}
            uid={p.uid}
            name={p.name}
            dpUrl={p.dpUrl}
            isLocal={p.isLocal}
            speaking={speakingUids.has(p.uid)}
            cameraEnabled={p.cameraEnabled}
          />
        ))}
      </div>
    </div>
  );
}

export default VideoChat;

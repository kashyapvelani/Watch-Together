/**
 * agoraClient.js — Shared Agora RTC + RTM singleton
 *
 * Both the voice (Agora.js) and video (VideoChat.js) components import from
 * here so they share ONE rtcClient instance and ONE channel session.
 * Joining the channel twice from two separate clients would cause echo,
 * double-subscriptions, and token errors.
 */

import AgoraRTC from 'agora-rtc-sdk-ng';
import AgoraRTM from 'agora-rtm-sdk';

// ─── App credentials (injected at build time via next.config.js env) ──────────
export const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
const TOKEN_SERVER = 'http://localhost:5001';

// ─── Stable UIDs (generated once per page load) ───────────────────────────────
export const rtcUid = Math.floor(Math.random() * 2032);
export const rtmUid = String(Math.floor(Math.random() * 2032));

// ─── Shared client handles ────────────────────────────────────────────────────
export let rtcClient = null;
export let rtmClient = null;
export let channel   = null;

// ─── Track stores ─────────────────────────────────────────────────────────────
export const audioTracks = {
  localAudioTrack:  null,
  remoteAudioTracks: {},
};

export const videoTracks = {
  localVideoTrack:  null,
  remoteVideoTracks: {},
};

// ─── Internal state ───────────────────────────────────────────────────────────
let _roomId        = null;
let _displayPicture = null;
let _rtcToken      = null;
let _rtmToken      = null;
let _rtcJoined     = false;
let _rtmJoined     = false;

// ─── Callbacks registered by UI components ────────────────────────────────────
// Components push handlers here; the client fires them on events.
export const callbacks = {
  onMemberJoined:  null,   // (memberId, attrs) => void
  onMemberLeft:    null,   // (memberId)        => void
  onMembersLoaded: null,   // (members[])       => void
  onVideoPublished: null,  // (user)            => void
  onVideoUnpublished: null,// (user)            => void
  onVolumeChange:  null,   // (volumes[])       => void
};

// ─── Token generators ─────────────────────────────────────────────────────────
export const fetchRtcToken = async (room) => {
  const res = await fetch(`${TOKEN_SERVER}/rtc-publisher/${room}/uid/${rtcUid}`);
  if (!res.ok) throw new Error('Failed to generate RTC token');
  const data = await res.json();
  return data.rtcToken;
};

export const fetchRtmToken = async () => {
  const res = await fetch(`${TOKEN_SERVER}/rtm/${rtmUid}`);
  if (!res.ok) throw new Error('Failed to generate RTM token');
  const data = await res.json();
  return data.rtmToken;
};

// ─── RTM initialisation ───────────────────────────────────────────────────────
export const initRtm = async (name, room, dpUrl) => {
  if (_rtmJoined) return;

  if (!_rtmToken) {
    _rtmToken = await fetchRtmToken();
  }

  rtmClient = AgoraRTM.createInstance(APP_ID);
  await rtmClient.login({ uid: rtmUid, token: _rtmToken });

  rtmClient.addOrUpdateLocalUserAttributes({
    name,
    userRtcUid: rtcUid.toString(),
    userDpUrl:  dpUrl,
  });

  channel = rtmClient.createChannel(room);
  await channel.join();
  _rtmJoined = true;

  // Fetch existing members
  const members = await channel.getMembers();
  const memberData = await Promise.all(
    members.map(async (id) => {
      const attrs = await rtmClient.getUserAttributesByKeys(id, ['name', 'userRtcUid', 'userDpUrl']);
      return { id, ...attrs };
    })
  );
  if (callbacks.onMembersLoaded) callbacks.onMembersLoaded(memberData);

  // Live member events
  channel.on('MemberJoined', async (memberId) => {
    const attrs = await rtmClient.getUserAttributesByKeys(memberId, ['name', 'userRtcUid', 'userDpUrl']);
    if (callbacks.onMemberJoined) callbacks.onMemberJoined(memberId, attrs);
  });

  channel.on('MemberLeft', (memberId) => {
    if (callbacks.onMemberLeft) callbacks.onMemberLeft(memberId);
  });

  window.addEventListener('beforeunload', leaveRtm);
};

// ─── RTC initialisation ───────────────────────────────────────────────────────
export const initRtc = async (room, dpUrl) => {
  if (_rtcJoined) return;

  _roomId         = room;
  _displayPicture = dpUrl;

  if (!_rtcToken) {
    _rtcToken = await fetchRtcToken(room);
  }

  rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

  rtcClient.on('user-published', handleUserPublished);
  rtcClient.on('user-unpublished', handleUserUnpublished);
  rtcClient.on('user-left', handleUserLeft);

  await rtcClient.join(APP_ID, room, _rtcToken, rtcUid);
  _rtcJoined = true;

  // Local audio — muted by default
  audioTracks.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  audioTracks.localAudioTrack.setMuted(true);
  await rtcClient.publish(audioTracks.localAudioTrack);

  // Local video — camera off by default
  videoTracks.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
  videoTracks.localVideoTrack.setEnabled(false);
  await rtcClient.publish(videoTracks.localVideoTrack);

  initVolumeIndicator();
};

// ─── RTC event handlers ───────────────────────────────────────────────────────
const handleUserPublished = async (user, mediaType) => {
  await rtcClient.subscribe(user, mediaType);

  if (mediaType === 'audio') {
    audioTracks.remoteAudioTracks[user.uid] = user.audioTrack;
    user.audioTrack.play();
  }

  if (mediaType === 'video') {
    videoTracks.remoteVideoTracks[user.uid] = user.videoTrack;
    if (callbacks.onVideoPublished) callbacks.onVideoPublished(user);
  }
};

const handleUserUnpublished = (user, mediaType) => {
  if (mediaType === 'video') {
    delete videoTracks.remoteVideoTracks[user.uid];
    if (callbacks.onVideoUnpublished) callbacks.onVideoUnpublished(user);
  }
};

const handleUserLeft = (user) => {
  delete audioTracks.remoteAudioTracks[user.uid];
  delete videoTracks.remoteVideoTracks[user.uid];
  if (callbacks.onVideoUnpublished) callbacks.onVideoUnpublished(user);
  if (callbacks.onMemberLeft) callbacks.onMemberLeft(String(user.uid));
};

// ─── Volume indicator ─────────────────────────────────────────────────────────
const initVolumeIndicator = () => {
  AgoraRTC.setParameter('AUDIO_VOLUME_INDICATION_INTERVAL', 200);
  rtcClient.enableAudioVolumeIndicator();
  rtcClient.on('volume-indicator', (volumes) => {
    if (callbacks.onVolumeChange) callbacks.onVolumeChange(volumes);
  });
};

// ─── Mic toggle ───────────────────────────────────────────────────────────────
export const toggleMic = (muted) => {
  if (audioTracks.localAudioTrack) {
    audioTracks.localAudioTrack.setMuted(muted);
  }
};

// ─── Camera toggle ────────────────────────────────────────────────────────────
export const toggleCamera = async (enabled) => {
  if (videoTracks.localVideoTrack) {
    await videoTracks.localVideoTrack.setEnabled(enabled);
  }
};

// ─── Leave helpers ────────────────────────────────────────────────────────────
export const leaveRtm = async () => {
  if (!_rtmJoined) return;
  try {
    await channel?.leave();
    await rtmClient?.logout();
  } catch (_) {}
  _rtmJoined = false;
};

export const leaveRoom = async (redirectUrl) => {
  // Stop local tracks
  if (audioTracks.localAudioTrack) {
    audioTracks.localAudioTrack.stop();
    audioTracks.localAudioTrack.close();
    audioTracks.localAudioTrack = null;
  }
  if (videoTracks.localVideoTrack) {
    videoTracks.localVideoTrack.stop();
    videoTracks.localVideoTrack.close();
    videoTracks.localVideoTrack = null;
  }

  // Leave RTC
  if (_rtcJoined && rtcClient) {
    try {
      await rtcClient.unpublish();
      await rtcClient.leave();
    } catch (_) {}
    _rtcJoined = false;
  }

  // Leave RTM
  await leaveRtm();

  if (redirectUrl) window.location.replace(redirectUrl);
};

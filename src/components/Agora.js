import { useEffect, useState } from 'react'
import AgoraRTC from "agora-rtc-sdk-ng";
import AgoraRTM from 'agora-rtm-sdk';
import '@/styles/Speaker.css'
import { data } from 'autoprefixer';
import { useUser } from '@clerk/nextjs';
import CopyToClipboard from 'react-copy-to-clipboard';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const appid = AGORA_APP_ID;
const rtcUid = Math.floor(Math.random() * 2032);
const rtmUid = String(Math.floor(Math.random() * 2032));


const rtcTokenGenerator = async (room) => {
  const rtc_response = await fetch(`http://localhost:5001/rtc/${room}/subscriber/uid/${rtcUid}`);

  if(!rtc_response.ok) throw new Error('unable to Generate Token');
  const data = await rtc_response.json();
  const tokenString = data.rtcToken;
  // console.log("tokenString", tokenString);

  return tokenString;
}

let rtcTokenGenerated = null;

const rtcGen = async (room) => {
  rtcTokenGenerated = await rtcTokenGenerator(room);
  // console.log("generated RTC token: ", rtcTokenGenerated);
}


const rtmTokenGenerator = async () => {
  const rtm_response = await fetch(`http://localhost:5001/rtm/${rtmUid}`);

  if(!rtm_response.ok) throw new Error('unable to Generate Token');
  const data = await rtm_response.json();
  const tokenString = data.rtmToken;

  return tokenString;
}

let rtmToken;

rtmTokenGenerator().then((tokenString) => {
  // console.log('Token:', tokenString);
  rtmToken = tokenString;
});



let roomId;

let audioTracks = {
    localAudioTrack: null,
    remoteAudioTracks: {}
}

let rtcClient;
let rtmClient;
let channel;


let micMuted = true;

let displayPicture = null;

let initRtm = async (name) => {
    rtmClient = AgoraRTM.createInstance(appid);
    console.log('rtmUid: ',rtmUid);
    await rtmClient.login({'uid':rtmUid,'token':rtmToken})

    rtmClient.addOrUpdateLocalUserAttributes({'name': name, 'userRtcUid':rtcUid.toString(), 'userDpUrl': displayPicture});

    channel = rtmClient.createChannel(roomId);
    await channel.join();

    getChannelMembers();

    channel.on('MemberJoined', handleMemberJoined);
    channel.on('MemberLeft', handleMemberLeft);
    

    window.addEventListener('beforeunload', leaveRtmChannel);

}

let initRtc = async () => {
    rtcClient = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'})

    // rtcClient.on('user-joined', handleUserJoined)
    rtcClient.on('user-published', handleUserPublished )
    rtcClient.on('user-left', handleUserLeft)

    await rtcClient.join(appid, roomId, rtcTokenGenerated, rtcUid)

    audioTracks.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    audioTracks.localAudioTrack.setMuted(micMuted);
    rtcClient.publish(audioTracks.localAudioTrack);

    initVolumeIndicator();
}

let handleUserPublished = async(user, mediaType) => {
    await rtcClient.subscribe(user, mediaType)

    if(mediaType === 'audio') {
        audioTracks.remoteAudioTracks[user.uid] = [user.audioTrack]
        user.audioTrack.play()
    }
}

let handleUserLeft = async(user) => {
    delete audioTracks.remoteAudioTracks[user.uid]
    // document.getElementById(user.uid).remove()
}

let handleMemberJoined = async (MemberId) => {

  let { name,userRtcUid, userDpUrl } = await rtmClient.getUserAttributesByKeys(MemberId, ['name', 'userRtcUid', 'userDpUrl']);

  let userwrapper = document.createElement('div');
  userwrapper.id = MemberId;
  userwrapper.className = `speaker user-rtc-${userRtcUid}`;
  let imgtag = document.createElement('img');
  imgtag.className = "rounded-lg";
  imgtag.src = userDpUrl;
  imgtag.width = '100';
  imgtag.height = '100';
  userwrapper.appendChild(imgtag);
  let para_id = document.createElement('p');  
  para_id.innerHTML = name;
  userwrapper.appendChild(para_id);

  //  `<div className="text-blue-500 user-rtc-${'---'}" id="${MemberId}">
  //                           <p>${MemberId}</p>
  //                       </div>`

    document.getElementById('members-agora').insertAdjacentElement('beforeend',userwrapper )
}

let handleMemberLeft = async (MemberId) => {
  document.getElementById(MemberId).remove();
}

let getChannelMembers = async () => {
   let members = await channel.getMembers();

   for(let i=0; members.length > i ; i++)
   {
        let { name,userRtcUid, userDpUrl } = await rtmClient.getUserAttributesByKeys(members[i], ['name','userRtcUid','userDpUrl']);

        let userwrapper = document.createElement('div');
        userwrapper.id = members[i];
        userwrapper.className = `speaker user-rtc-${userRtcUid}`;
        let imgtag = document.createElement('img');
        imgtag.className = "rounded-lg";
        imgtag.src = userDpUrl;
        imgtag.width = '100';
        imgtag.height = '100';
        userwrapper.appendChild(imgtag);
        let para_id = document.createElement('p');
        para_id.innerHTML = name;
        userwrapper.appendChild(para_id);

        document.getElementById('members-agora').insertAdjacentElement('beforeend',userwrapper);
   }
}

let initVolumeIndicator = () => {

    AgoraRTC.setParameter('AUDIO_VOLUME_INDICATION_INTERVAL', 200);

    rtcClient.enableAudioVolumeIndicator()

    rtcClient.on('volume-indicator', volumes => {
        // console.log('Volume: ',volumes);
        volumes.forEach((volume) => {
            // console.log('VOLUME: ', volume);
            let item = document.getElementsByClassName(`user-rtc-${volume.uid}`)[0];
            // console.log(item);
            if (volume.level >= 50){
                item.style.borderWidth = "3px";
                
            }
            else{
                item.style.borderWidth = "0px";
            }

        })
    })
}

const joinNow = async (name, room, dp_url) => {
    console.log("username: ",name, ' url: ', dp_url);
    await rtcGen(room);
    roomId = room;
    displayPicture = dp_url;
    // console.log("RTC TOken: ", rtcTokenGenerated);
    initRtc();
    initRtm(name);
    const btn = document.getElementById('join')
    btn.style.display = 'none'
}

let leaveRtmChannel = async () => {
  await channel.leave();
  await rtmClient.logout();
}

function leaveRoom(url) {
  if(!audioTracks.localAudioTrack){
    window.location.replace(url);
  }
  else{
    audioTracks.localAudioTrack.stop();
    audioTracks.localAudioTrack.close();
    rtcClient.unpublish();
    rtcClient.leave();
    leaveRtmChannel();
    window.location.replace(url);
  }
}

function Agora( {room, params} ) {

  const [isMuted, setIsMuted] = useState(true);

  const { user } = useUser();

  const copyUrl = `http://localhost:3000/watch/movie/${params.id}?room=${room}`;

  const joinVoiceRoomNow = ( ) => {
      let name = user.firstName; 
      let dp_url = user.imageUrl; 
      console.log("roomID: ",room.toString());
      joinNow(name, room.toString(), dp_url);
  }

  const voiceToggle = () => {
    if (isMuted) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
    micMuted = isMuted;
    if(!audioTracks.localAudioTrack)
    {
        toast.error("Join Voice Chat Now")
    }
    else{
      audioTracks.localAudioTrack.setMuted(isMuted)
    }
  };

  const leaveRoomNow = () => {
      const url = `http://localhost:3000/`;
      leaveRoom(url);
  }

  const notify = () => toast.success("Copied to Clipboard");

  return (
    <>
    <div className="bg-[#121212] h-[560px] w-[280px] rounded-lg">
    <div id="members-agora" className='content-center grid grid-cols-2 gap-4'>
        <button id="join" onClick={joinVoiceRoomNow} className='bg-[#4977FF] px-12 py-2 m-4 rounded-lg font-semibold items-center grid grid-cols-subgrid gap-4 col-span-2'>
            Join Voice Chat
        </button>
    </div>
    </div>
    <div className="bg-[#121212] rounded-lg w-[260px] h-[80px] mt-4 flex space-x-8 justify-center">
          <button onClick={voiceToggle}>
            {isMuted ? 
            (
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g filter="url(#filter0_b_16_89)">
                  <rect width="40" height="40" rx="15" fill="white" />
                </g>
                <path
                  d="M16.0127 19.5354C16.2887 21.3882 17.6914 22.8306 19.4618 23.0818L19.5732 23.0976C19.8593 23.1382 20.1492 23.1382 20.4353 23.0976L20.5318 23.0839C22.3104 22.8315 23.719 21.381 23.9934 19.5191C24.2329 17.8942 24.2328 16.2391 23.9932 14.6143C23.7189 12.7533 22.3126 11.3008 20.5353 11.0448L20.4417 11.0314C20.1514 10.9895 19.8571 10.9895 19.5668 11.0314L19.4583 11.047C17.6893 11.3018 16.2887 12.7461 16.0129 14.5979C15.7694 16.2334 15.7692 17.8999 16.0127 19.5354Z"
                  fill="#363853"
                />
                <path
                  d="M13.9516 19.0953C13.9516 18.6745 13.6267 18.3334 13.2258 18.3334C12.825 18.3334 12.5 18.6745 12.5 19.0953C12.5 23.1864 15.4726 26.5487 19.2742 26.9319V28.2381C19.2742 28.6589 19.5991 29 20 29C20.4009 29 20.7258 28.6589 20.7258 28.2381V26.9319C24.5274 26.5487 27.5 23.1864 27.5 19.0953C27.5 18.6745 27.175 18.3334 26.7742 18.3334C26.3733 18.3334 26.0484 18.6745 26.0484 19.0953C26.0484 22.6018 23.3404 25.4445 20 25.4445C16.6596 25.4445 13.9516 22.6018 13.9516 19.0953Z"
                  fill="#363853"
                />
                <defs>
                  <filter
                    id="filter0_b_16_89"
                    x="-50"
                    y="-50"
                    width="140"
                    height="140"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                  >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feGaussianBlur in="BackgroundImageFix" stdDeviation="25" />
                    <feComposite
                      in2="SourceAlpha"
                      operator="in"
                      result="effect1_backgroundBlur_16_89"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_backgroundBlur_16_89"
                      result="shape"
                    />
                  </filter>
                </defs>
              </svg>
            ) :
            (
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g filter="url(#filter0_b_16_89)">
                  <rect width="40" height="40" rx="15" fill="#FF4949" />
                </g>
                <path
                  d="M16.0127 19.5354C16.2887 21.3882 17.6914 22.8306 19.4618 23.0818L19.5732 23.0976C19.8593 23.1382 20.1492 23.1382 20.4353 23.0976L20.5318 23.0839C22.3104 22.8315 23.719 21.381 23.9934 19.5191C24.2329 17.8942 24.2328 16.2391 23.9932 14.6143C23.7189 12.7533 22.3126 11.3008 20.5353 11.0448L20.4417 11.0314C20.1514 10.9895 19.8571 10.9895 19.5668 11.0314L19.4583 11.047C17.6893 11.3018 16.2887 12.7461 16.0129 14.5979C15.7694 16.2334 15.7692 17.8999 16.0127 19.5354Z"
                  fill="white"
                />
                <path
                  d="M13.9516 19.0953C13.9516 18.6745 13.6267 18.3334 13.2258 18.3334C12.825 18.3334 12.5 18.6745 12.5 19.0953C12.5 23.1864 15.4726 26.5487 19.2742 26.9319V28.2381C19.2742 28.6589 19.5991 29 20 29C20.4009 29 20.7258 28.6589 20.7258 28.2381V26.9319C24.5274 26.5487 27.5 23.1864 27.5 19.0953C27.5 18.6745 27.175 18.3334 26.7742 18.3334C26.3733 18.3334 26.0484 18.6745 26.0484 19.0953C26.0484 22.6018 23.3404 25.4445 20 25.4445C16.6596 25.4445 13.9516 22.6018 13.9516 19.0953Z"
                  fill="white"
                />
                <rect
                  x="9.64645"
                  y="27.6777"
                  width="25.5"
                  height="2.5"
                  rx="1.25"
                  transform="rotate(-45 9.64645 27.6777)"
                  fill="white"
                  stroke="#FF4949"
                  strokeWidth="0.5"
                />
                <defs>
                  <filter
                    id="filter0_b_16_89"
                    x="-50"
                    y="-50"
                    width="140"
                    height="140"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                  >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feGaussianBlur in="BackgroundImageFix" stdDeviation="25" />
                    <feComposite
                      in2="SourceAlpha"
                      operator="in"
                      result="effect1_backgroundBlur_16_89"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_backgroundBlur_16_89"
                      result="shape"
                    />
                  </filter>
                </defs>
              </svg>
            )}
          </button>
          <CopyToClipboard text={copyUrl}>
          <button onClick={notify}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g filter="url(#filter0_b_17_96)">
                <rect width="40" height="40" rx="15" fill="white" />
              </g>
              <path
                d="M25.9999 17.6C27.9881 17.6 29.5999 15.9882 29.5999 14C29.5999 12.0118 27.9881 10.4 25.9999 10.4C24.0117 10.4 22.3999 12.0118 22.3999 14C22.3999 14.1506 22.4091 14.299 22.4271 14.4447L16.499 17.4088C15.8515 16.7842 14.9706 16.4 13.9999 16.4C12.0117 16.4 10.3999 18.0118 10.3999 20C10.3999 21.9882 12.0117 23.6 13.9999 23.6C14.9706 23.6 15.8516 23.2158 16.4991 22.5912L22.4271 25.5552C22.4092 25.701 22.3999 25.8494 22.3999 26C22.3999 27.9882 24.0117 29.6 25.9999 29.6C27.9881 29.6 29.5999 27.9882 29.5999 26C29.5999 24.0118 27.9881 22.4 25.9999 22.4C25.0292 22.4 24.1483 22.7842 23.5008 23.4088L17.5727 20.4447C17.5907 20.299 17.5999 20.1506 17.5999 20C17.5999 19.8494 17.5907 19.701 17.5727 19.5552L23.5007 16.5912C24.1482 17.2158 25.0292 17.6 25.9999 17.6Z"
                fill="#363853"
              />
              <defs>
                <filter
                  id="filter0_b_17_96"
                  x="-50"
                  y="-50"
                  width="140"
                  height="140"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feGaussianBlur in="BackgroundImageFix" stdDeviation="25" />
                  <feComposite
                    in2="SourceAlpha"
                    operator="in"
                    result="effect1_backgroundBlur_17_96"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_backgroundBlur_17_96"
                    result="shape"
                  />
                </filter>
              </defs>
            </svg>
          </button>
          </CopyToClipboard>
          <button onClick={leaveRoomNow}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g filter="url(#filter0_b_17_100)">
                <rect width="40" height="40" rx="15" fill="#FF4949" />
              </g>
              <path
                d="M14.1107 11.152C14.4332 11.0514 14.7677 11 15.1046 11C16.7236 11 17.9231 12.4257 17.9231 14.0379L17.9231 17.6544C17.9231 19.2667 16.7236 20.6923 15.1046 20.6923C14.7677 20.6923 14.4332 20.641 14.1107 20.5403L13.8642 20.4633C13.78 20.437 13.6972 20.4079 13.6158 20.376C14.9001 22.9841 17.0159 25.0999 19.624 26.3842C19.5921 26.3028 19.563 26.22 19.5367 26.1358L19.4597 25.8893C19.359 25.5668 19.3077 25.2323 19.3077 24.8954C19.3077 23.2764 20.7333 22.0769 22.3456 22.0769H25.9621C27.5743 22.0769 29 23.2764 29 24.8954C29 25.2323 28.9486 25.5668 28.8479 25.8893L28.771 26.1358C28.3226 27.5717 27.0401 28.6116 25.506 28.882C24.6128 29.0393 23.6949 29.0394 22.8017 28.882C22.7665 28.8758 22.7315 28.8692 22.6966 28.8622C16.8428 27.7359 12.264 23.1571 11.1378 17.3033C11.1308 17.2684 11.1242 17.2334 11.118 17.1983C10.9607 16.3051 10.9607 15.3872 11.118 14.494C11.3884 12.9599 12.4283 11.6774 13.8642 11.229L14.1107 11.152Z"
                fill="white"
              />
              <path
                d="M27.8741 13.1049C28.1445 12.8346 28.1445 12.3962 27.8742 12.1258C27.6038 11.8555 27.1654 11.8555 26.8951 12.1258L25.0769 13.944L23.2588 12.1259C22.9884 11.8555 22.5501 11.8555 22.2797 12.1259C22.0093 12.3962 22.0093 12.8346 22.2797 13.1049L24.0978 14.9231L22.2797 16.7412C22.0093 17.0116 22.0093 17.4499 22.2797 17.7203C22.5501 17.9907 22.9884 17.9907 23.2588 17.7203L25.0769 15.9021L26.8951 17.7203C27.1654 17.9907 27.6038 17.9907 27.8742 17.7203C28.1445 17.4499 28.1445 17.0116 27.8741 16.7412L26.056 14.9231L27.8741 13.1049Z"
                fill="white"
              />
              <defs>
                <filter
                  id="filter0_b_17_100"
                  x="-50"
                  y="-50"
                  width="140"
                  height="140"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feGaussianBlur in="BackgroundImageFix" stdDeviation="25" />
                  <feComposite
                    in2="SourceAlpha"
                    operator="in"
                    result="effect1_backgroundBlur_17_100"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_backgroundBlur_17_100"
                    result="shape"
                  />
                </filter>
              </defs>
            </svg>
          </button>
        </div>
        <ToastContainer theme='dark' position="bottom-left"/>
    </>
  )
}

export default Agora

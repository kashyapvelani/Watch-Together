import AgoraRTC from "agora-rtc-sdk-ng";

const appid = AGORA_APP_ID;
const token = AGORA_TOKEN;
const rtcUid = Math.floor(Math.random() * 2032);

let roomId = "main"

let audioTracks = {
    localAudioTrack: null,
    remoteAudioTracks: {}
}

let rtcClient;

let initRtc = async () => {
    rtcClient = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'})

    rtcClient.on('user-joined', handleUserJoined)
    rtcClient.on('user-published', handleUserPublished )
    rtcClient.on('user-left', handleUserLeft)

    await rtcClient.join(appid, roomId, token, rtcUid)

    audioTracks.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    rtcClient.publish(audioTracks.localAudioTrack)

    let userwrapper = `<div className="speaker user-${rtcUid}" id="${rtcUid}">
                            <p>${rtcUid}</p>
                        </div>`

    document.getElementById('members-agora').insertAdjacentElement('beforeend',userwrapper )

   

}

let handleUserJoined = async(user) => {
    console.log('A New User Joined: ', user)
    let userwrapper = `<div className="speaker user-${user.uid}" id="${user.uid}">
                            <p>${user.uid}</p>
                        </div>`

    document.getElementById('members-agora').insertAdjacentElement('beforeend',userwrapper )
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
    document.getElementById(user.uid).remove()
}

export default initRtc



const express = require("express");
const { RtcTokenBuilder, RtcRole, RtmTokenBuilder, RtmRole } = require("agora-access-token");

const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const httpServer = http.createServer(app);

const RTCTOKEN_APP_ID = 'RTCTOKEN_APP_ID'
const RTCTOKEN_APP_CERTIFICATE = 'RTCTOKEN_APP_CERTIFICATE'

const nocache = ( req, resp, next ) => {
  resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  resp.header('Expires', '-1');
  resp.header('Pragma', 'no-cache');
  next();
}

const generateAccessToken = ( req, resp ) => {
  resp.header('Access-Control-Allow-Origin', '*');
  // channel name
  const channelName = req.params.channel;
  if (!channelName) {
    return resp.status(500).json({ 'error': 'channel is required' });
  }
  //uid
  let uid = req.params.uid;
  if(!uid || uid === '') {
    return resp.status(500).json({ 'error': 'uid is required' });
  }
  // get role
  let role;
  if (req.params.role === 'publisher') {
    role = RtcRole.PUBLISHER;
  } else if (req.params.role === 'subscriber') {
    role = RtcRole.SUBSCRIBER
  } else {
    return resp.status(500).json({ 'error': 'uid is required' });
  }
  // expire time 
  let expireTime = req.query.expiry;
  if (!expireTime || expireTime === '') {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  let token;
  if (req.params.tokentype === 'userAccount') {
    token = RtcTokenBuilder.buildTokenWithAccount(RTCTOKEN_APP_ID, RTCTOKEN_APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
  } else {
    token = RtcTokenBuilder.buildTokenWithUid(RTCTOKEN_APP_ID, RTCTOKEN_APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
  } 

  return resp.json({ 'rtcToken': token });

}

const generateRTMToken = (req, resp) => {
  // set response header
  resp.header('Access-Control-Allow-Origin', '*');

  // get uid
  let uid = req.params.uid;
  if(!uid || uid === '') {
    return resp.status(400).json({ 'error': 'uid is required' });
  }
  // get role
  let role = RtmRole.Rtm_User;
   // get the expire time
  let expireTime = req.query.expiry;
  if (!expireTime || expireTime === '') {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  // calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;
  // build the token
  // console.log(RTCTOKEN_APP_ID, RTCTOKEN_APP_CERTIFICATE, uid, role, privilegeExpireTime)
  const token = RtmTokenBuilder.buildToken(RTCTOKEN_APP_ID, RTCTOKEN_APP_CERTIFICATE, uid, role, privilegeExpireTime);
  // return the token
  return resp.json({ 'rtmToken': token });
}

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000" || HOST,
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

app.use(cors());
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get('/rtc/:channel/:role/:tokentype/:uid', nocache , generateAccessToken);
app.get('/rtm/:uid/', nocache , generateRTMToken);

io.on("connection", socket => {
    // console.log("Someone Connected")
    socket.on("join-room",async ( roomId, userId )=>{
        socket.join(roomId)
        socket.broadcast.to(roomId).emit('user-connected', userId)
        // console.log("User join room, RoomId: "+ roomId + "userId: "+ userId);
        
        socket.on('disconnect', () => {
          socket.broadcast.to(roomId).emit('user-disconnected', userId)
        })

        socket.on('play',(time)=>{
          io.sockets.in(roomId).emit("play",time);
        })

        socket.on('pause',()=>{
          io.sockets.in(roomId).emit("pause");
        })

        socket.on('seek',( time )=>{
          io.sockets.in(roomId).emit("seek", time);
        })

    })
})

const PORT = 5001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server is running on port ${PORT}`);
});

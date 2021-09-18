import React, {useState, useRef} from 'react';
import InputRoomName from './components/InputRoomName';
import InputUserName from './components/InputUserName';
import Video from './components/Video';
import VideoRemote from './components/VideoRemote'
import WebRtc from './components/WebRtc';

const App = () => {
  // TODO WebRTC準備（移送予定）
  const config = {
    iceServers: [{ urls: "stun:stun4.l.google.com:19302" }]
  }

  const rtcPeerConnection = new RTCPeerConnection(config);

  const[roomName, setRoomName] = useState('');
  const[userName, setUserName] = useState('');

  // WebRtc設定を行うインスタンスを生成
  const remoteVideoRef = useRef(null);
  let webRtc = new WebRtc(remoteVideoRef);
  webRtc.setLocalMediaStream();

  return (
    <>
      <InputRoomName webRtc={webRtc} roomName={roomName} setRoomName={setRoomName} />
      <InputUserName webRtc={webRtc} roomName={roomName} userName={userName} setUserName={setUserName} />
      <Video rtcPeerConnection={rtcPeerConnection} />
      <VideoRemote webRtc={webRtc} />
    </>
  );
};

export default App;

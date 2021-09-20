import React, {useState, useRef} from 'react';
import InputRoomName from './components/InputRoomName';
import InputUserName from './components/InputUserName';
import Video from './components/Video';
import VideoRemote from './components/VideoRemote';
import VideoRemoteTwo from './components/VideoRemoteTwo';
import VideoRemoteThree from './components/VideoRemoteThree';
import PeerManage from './components/PeerManage';

const App = () => {
  // TODO WebRTC準備（移送予定）あくまでローカルでしか使っていないrtcPeerConnection
  const config = {
    iceServers: [{ urls: "stun:stun4.l.google.com:19302" }]
  }
  const rtcPeerConnection = new RTCPeerConnection(config);

  const[roomName, setRoomName] = useState('');
  const[userName, setUserName] = useState('');

  // WebRtc設定を行うインスタンスを生成
  const remoteVideoRef = useRef(null);
  const remoteVideoRefTwo = useRef(null);
  const remoteVideoRefThree = useRef(null);

  let peerManage = new PeerManage(remoteVideoRef, remoteVideoRefTwo, remoteVideoRefThree);

  return (
    <>
      <InputRoomName peerManage={peerManage} roomName={roomName} setRoomName={setRoomName} />
      <InputUserName peerManage={peerManage} roomName={roomName} userName={userName} setUserName={setUserName} />
      <Video rtcPeerConnection={rtcPeerConnection} />
      <VideoRemote peerManage={peerManage} />
      <VideoRemoteTwo peerManage={peerManage} />
      <VideoRemoteThree peerManage={peerManage} />
    </>
  );
};

export default App;

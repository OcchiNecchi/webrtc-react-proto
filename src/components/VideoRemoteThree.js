import React from 'react';

const VideoRemote = ({peerManage}) => {
  // TODO リファクタ対象
  const videoRef = peerManage.remoteVideoRefThree;

  return(
    <video autoPlay muted={false} ref={videoRef}/>
  );
};

export default VideoRemote;
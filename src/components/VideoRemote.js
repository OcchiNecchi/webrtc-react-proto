import React, {useEffect, useRef, useCallback, useReducer} from 'react';

const VideoRemote = ({webRtc}) => {
  // TODO リファクタ対象
  const videoRef = webRtc.remoteVideoRef;

  return(
    <video autoPlay muted={false} ref={videoRef}/>
  );
};

export default VideoRemote;
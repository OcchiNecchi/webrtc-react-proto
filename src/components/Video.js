import React, {useEffect, useRef, useCallback, useReducer} from 'react';

const Video = ({rtcPeerConnection}) => {
  // TODO リファクタ対象
  const videoRef = useRef(null);

  const [value, forceRender] = useReducer((boolean) => !boolean, false);

  useEffect(async () => {

    //if(currentVideoRef === null) return;
    let mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    // Trackを追加する
    rtcPeerConnection.addTrack(mediaStream.getAudioTracks()[0], mediaStream);
    rtcPeerConnection.addTrack(mediaStream.getVideoTracks()[0], mediaStream);

    // MDNから audioとカメラの使用許可をブラウザに与える
    if(videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }

  }, [videoRef]);

  return(
    <video autoPlay muted={true} ref={videoRef}/>
  );
};

export default Video;
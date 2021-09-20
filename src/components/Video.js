import React, {useEffect, useRef, useCallback, useReducer} from 'react';
import "@tensorflow/tfjs";
import * as bodyPix from "@tensorflow-models/body-pix";

const Video = ({rtcPeerConnection}) => {
  // TODO リファクタ対象
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  let contineuAnimation = false;
  let animationId = null;
  let bodyPixMaks = null;
  let canvasStream = null;
  let bodyPixNet = null;
  let segmentTimerId = null;
  // 何ミリ秒に一度canvasを書き換えるか
  const segmeteUpdateTime = 30; // ms

  // 追加コード
  function startCanvasVideo() {
    writeCanvasString('initalizing BodyPix');
    contineuAnimation = true;
    animationId = window.requestAnimationFrame(updateCanvas);
    canvasStream = canvasRef.current.captureStream();
    updateSegment();
  }

  function writeCanvasString(str) {
    const ctx = canvasRef.current.getContext('2d');
    ctx.font = "64px serif";
    ctx.fillText(str, 5, 100);
    console.log(str);
  }

  function updateCanvas() {
    drawCanvas(videoRef.current);
    if (contineuAnimation) {
      animationId = window.requestAnimationFrame(updateCanvas);
    }
  }

  function drawCanvas(srcElement) {
    const opacity = 1.0;
    const flipHorizontal = false;
    // const maskBlurAmount = 0;
    const maskBlurAmount = 0; // マスクの周囲にボケ効果を入れる

    bodyPix.drawMask(
      canvasRef.current, srcElement, bodyPixMaks, opacity, maskBlurAmount,
      flipHorizontal
    );
  }

  function updateSegment() {

    const option = {
      flipHorizontal: false,
      internalResolution: 'medium',
      segmentationThreshold: 0.7,
      maxDetections: 4,
      scoreThreshold: 0.5,
      nmsRadius: 20,
      minKeypointScore: 0.3,
      refineSteps: 10
    };
    bodyPixNet.segmentPerson(videoRef.current, option)
    .then(segmentation => {
      const fgColor = { r: 0, g: 0, b: 0, a: 0 };
      const bgColor = { r: 127, g: 127, b: 127, a: 255 };
      const roomPartImage = bodyPix.toMask(segmentation, fgColor, bgColor);
      bodyPixMaks = roomPartImage;

      if (contineuAnimation) {
        // 次の人体セグメンテーションの実行を予約する
        segmentTimerId = setTimeout(updateSegment, segmeteUpdateTime);
      }
    })
  }

  useEffect(async () => {

    // TODO 下記から既存コード
    //if(currentVideoRef === null) return;
    let mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    // Trackを追加する
    rtcPeerConnection.addTrack(mediaStream.getAudioTracks()[0], mediaStream);
    rtcPeerConnection.addTrack(mediaStream.getVideoTracks()[0], mediaStream);

    // MDNから audioとカメラの使用許可をブラウザに与える
    if(videoRef.current) {
      videoRef.current.srcObject = mediaStream;

        // TODO body-pit TEST
      async function loadModel() {
        const net = await bodyPix.load(/** optional arguments, see below **/);
        bodyPixNet = net;
      }
      await loadModel();

      // videoが読み込まれたらコールバックを実行する
      videoRef.current.onloadeddata = (e) => {
        startCanvasVideo();
      }
    }
    
  }, [videoRef]);

  return(
    <>
      <video autoPlay muted={true} ref={videoRef} width="640px" height="480px"/>
      <canvas ref={canvasRef} id="canvas" width="640px" height="480px" />
    </>
  );
};

export default Video;
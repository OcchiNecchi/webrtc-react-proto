import React, {useEffect, useRef, useCallback, useReducer} from 'react';
import "@tensorflow/tfjs";
import * as bodyPix from "@tensorflow-models/body-pix";
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { spacing } from '@material-ui/system';
import { ImportantDevices } from '@material-ui/icons';

const useStyles = makeStyles({
  root: {
    minWidth: 640,
    maxWidth: 640,
  },
});
const theme = {
  spacing: 8,
}

const Video = ({setMyVideoStream, roomName, userName}) => {
  const classes = useStyles();

  // TODO リファクタ対象
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  let contineuAnimation = true;
  let animationId = null;
  let bodyPixMaks = null;
  let canvasStream = null;
  let bodyPixNet = null;
  let segmentTimerId = null;
  // 何ミリ秒に一度canvasを書き換えるか
  const segmeteUpdateTime = 30; // ms

  // 追加コード
  const startCanvasVideo = async () => {
    // タグに直接autoplayだとvideoが止まってしまうため
    await videoRef.current.play().catch(err => console.error('local play ERROR:', err));

    animationId = window.requestAnimationFrame(updateCanvas);
    canvasStream = canvasRef.current.captureStream();
    setMyVideoStream(canvasStream);
    updateSegment();
  }

  const updateCanvas = () => {
    drawCanvas(videoRef.current);
    if (contineuAnimation) {
      animationId = window.requestAnimationFrame(updateCanvas);
    }
  }

  const drawCanvas = (srcElement) => {
    const opacity = 1.0;
    const flipHorizontal = false;
    // 下記、0じゃないとsafariでprivacy部分が透明になってしまう(body-pixのバグ？)
    const maskBlurAmount = 0; // マスクの周囲にボケ効果を入れる

    bodyPix.drawMask(
      canvasRef.current, srcElement, bodyPixMaks, opacity, maskBlurAmount,
      flipHorizontal
    );
  }

  const updateSegment = () => {
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
    console.log(roomName)
    let mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

    // MDNから audioとカメラの使用許可をブラウザに 与える
    if(videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      // body-pit 
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
  }, [roomName]);

  return(
    <>
      <video muted={true} ref={videoRef} width="640px" height="480px" id="local_video" hidden/>
      <Card className={classes.root} >
        <CardContent>
          <canvas ref={canvasRef} id="canvas" width="640px" height="480px" />
          <Typography className={classes.title} color="textSecondary" gutterBottom>
            My video
          </Typography>
          <Typography variant="body2" component="p">
            {userName}
          </Typography>
        </CardContent>
      </Card>
      
    </>
  );
};

export default Video;
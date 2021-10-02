import SignalingClient from "./SignalingClient";
import WebRtc from './WebRtc';

export default class PeerManage {
  constructor(remoteVideoRef, remoteVideoRefTwo, remoteVideoRefThree, myVideoStream) {
    this.roomName = '';
    this.myUserName = '';

    // 部屋に入っている人たち
    this.userInRoom = [];

    this.remoteVideoRef = remoteVideoRef;
    this.remoteVideoRefTwo = remoteVideoRefTwo;
    this.remoteVideoRefThree = remoteVideoRefThree;

    // TODO もっと上手く管理したい、、
    this.peerArray = [];
    this.peerArray[0] = new WebRtc(remoteVideoRef);
    this.peerArray[1] = new WebRtc(remoteVideoRefTwo);
    this.peerArray[2] = new WebRtc(remoteVideoRefThree);

    this.remoteUserArray = [];

    // シグナリングサーバーとやりとりするために必要
    this.signalingClient = new SignalingClient();

    this.myVideoStream = myVideoStream;
  }

  setRoomName(roomName) {
    this.roomName = roomName;
  }

  // 自分のmediaStreamを設定する
  async setPeerMediaStream(peerNum) {
    await this.peerArray[peerNum].setLocalMediaStream(this.myVideoStream);
  }

  // シグナリングを開始する
  async startSignal(roomName, myUserName) {
    this.roomName = roomName;
    this.myUserName = myUserName;

    // 自分以外のユーザーが部屋にいた場合、offerを送信する
    await this.signalingClient.database.ref(roomName + '/roomuser').once('value', async (snapshot) => {
      const userData = snapshot.val();
      if(userData === null) return;

      // 先に入室している人にofferを送る
      let nameArray = Object.keys(userData);
      for(let i = 0; i < nameArray.length; i++) {
        this.remoteUserArray.push(nameArray[i]);
        await this.setPeerMediaStream(i);
        await this.peerArray[i].offer(myUserName, nameArray[i], roomName);
      }

    })
    // 部屋のユーザー管理のところに自分のユーザー名を入れる
    this.signalingClient.registerUser(this.roomName, this.myUserName);

    // シグナルをリッスンする
    this.signalingClient.database.ref(roomName + '/' + this.myUserName).on('value', async (snapshot) => {
      const dbData = snapshot.val();
      // 部屋の一人目の時など、特にデータがない場合
      if(dbData === null) return;

      const {signal, sdp, from, candidate} = dbData;

      // offerを受け取った場合はAnswerを返す
      if(signal === 'offer') {
        // offerを送ってきた人を管理する
        this.remoteUserArray.push(from);

        // 対象WebRtcインスタンスを設定
        await this.setPeerMediaStream(this.remoteUserArray.length - 1);
        let tmpWebRtc = this.peerArray[this.remoteUserArray.length - 1];

        if(from === this.myUserName) return;
        await tmpWebRtc.answer(sdp, this.roomName, this.myUserName, from);
        return;

        // answerを受け取った場合はsdpを保存する   
      } else if(signal === 'answer') {
        // fromからどのpeerか探してそいつにsdpを設定するようにする
        // answerを受け取る = offerはこちらから出しているため、remoteUserArrayにfromは必ず存在する
        console.log(this.peerArray);
        console.log(this.remoteUserArray.indexOf(from))
        let tmpWebRtc = this.peerArray[this.remoteUserArray.indexOf(from)]

        // remote側のsdpを設定する
        await tmpWebRtc.rtcPeerConnection.setRemoteDescription(sdp);
        return;

        // candidateを受け取ったとき 
      } else if(signal === 'icecandidate') {
        // 対象のWebRtcを設定する
        let tmpWebRtc = this.peerArray[this.remoteUserArray.indexOf(from)]

        try {
          // candidateを設定する
          const iceCandidate = new RTCIceCandidate(candidate);
          await tmpWebRtc.rtcPeerConnection.addIceCandidate(iceCandidate);
        } catch (error) {
          console.error(error);
        }
        return;
      }
    })
  }
}
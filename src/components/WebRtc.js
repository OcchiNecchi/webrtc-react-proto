import SignalingClient from "./SignalingClient";

export default class WebRtc {
  constructor(remoteVideoRef) {
    // urlsには公開されているstunserverを設定する
    // stunserver：外部から見た自PCのIPアドレスを返してくれるもの
    const config = {
      iceServers: [{ urls: "stun:stun4.l.google.com:19302" }]
    }
    this.rtcPeerConnection = new RTCPeerConnection(config);

    // シグナリングサーバーとやりとりするために必要
    this.signalingClient = new SignalingClient();

    // 入室する部屋名
    this.roomName = '';
    // 自分の名前
    this.myUserName = '';
    // リモートの名前
    this.remoteUserName = '';

    // 部屋に入っている人たち
    this.userInRoom = [];

    // Localのメディアストリーム
    this.mediaStream = null;

    // remoteVideo用のRef
    this.remoteVideoRef = remoteVideoRef;
  }

  // 自分のmediaStreamとTrackを設定する
  async setLocalMediaStream() {
    // mediaStreamを取得する
    const constraints = { audio: true, video: true };
    this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

    // audioTrackを設定する
    // this.audioTrack.enabled = false;
    this.rtcPeerConnection.addTrack(this.mediaStream.getAudioTracks()[0], this.mediaStream);

    // videoTrackを設定する
    this.rtcPeerConnection.addTrack(this.mediaStream.getVideoTracks()[0], this.mediaStream);
  }

  setRoomName(roomName) {
    this.roomName = roomName;
  }
  
  // onicecandidateにコールバック関数を設定し、candidate設定時にRealtimeDatabaseに通知するようにする
  setOnicecandidateCallback() {
    // candidateには自分の通信経路が入ってくる
    this.rtcPeerConnection.onicecandidate = async ({candidate}) => {
      if(candidate) {
        // remoteへfirebaseを通してcandidateを通知する
        await this.signalingClient.signalCandidate(candidate.toJSON());
      }
    }
  }

  // onsettrackにtrack設定時のコールバック関数を設定する
  setOntrack() {
    // 相手のtrackが設定された際に動くコールバック関数
    this.rtcPeerConnection.ontrack = (rtcTrackEvent) => {
      if (rtcTrackEvent.track.kind !== 'video') return;
      // 相手のstreamを設定する
      const remoteMediaStream = rtcTrackEvent.streams[0];
      this.remoteVideoRef.current.srcObject = remoteMediaStream;
    };
  }

  // rtcPeerConnectionのcreateOfferにてSDPを取得する
  async createMySdp() {
    try {
      return await this.rtcPeerConnection.createOffer();
    } catch (e) {
      console.error(e)
    }
  }

  // rtcPeerConnectionのsetLocalDescriptionにて自分のSDPを設定する
  async setLocalSdp(sessionDescription) {
    try{
      await this.rtcPeerConnection.setLocalDescription(sessionDescription);
    }catch(e) {
      console.error(e);
    }
  }

  // rtcPeerConnectionのsetRemoteDescriptionにて相手のSDPを設定する
  async setRemoteSdp(remoteSdp) {
    try{
      console.log(remoteSdp)
      await this.rtcPeerConnection.setRemoteDescription(remoteSdp);
    } catch(e) {
      console.error(e);
    }
  }

  // offerシグナルを実際にRealtimeDatabaseに送る
  async sendOffer() {
    this.signalingClient.setLocalNames(this.roomName, this.myUserName);
    // offerをRealtimeDatabaseに送る。SDPはJSONにする
    await this.signalingClient.signalOffer(this.rtcPeerConnection.localDescription.toJSON(),
      this.roomName, this.remoteUserName);
  }

  // 自分の名前を入力した後、offerシグナルを送信する
  async offer(myUserName, remoteUserName, roomName) {
    this.myUserName = myUserName;
    this.remoteUserName = remoteUserName;
    this.roomName = roomName;

    // onicecandidateにコールバック関数を設定し、candidate設定時にRealtimeDatabaseに通知するようにする
    this.setOnicecandidateCallback();

    // onsettrackにtrack設定時のコールバック関数を設定する
    this.setOntrack();

    // SDPを取得、設定
    const sessionDescription = await this.createMySdp();
    await this.setLocalSdp(sessionDescription);

    // 実際にofferをRealtimeDatabaseに送る
    await this.sendOffer();

    // this.setRtcClient();
  }

  // offerを受け取った時、answerシグナルを送信する
  async answer(sdp, remoteUserName) {
    try {
      // answer受け取った人から見ればoffer送った人がremoteの人
      this.remoteUserName = remoteUserName;
      this.signalingClient.setRemoteUser(this.remoteUserName);

      // onicecandidateにコールバック関数を設定し、candidate設定時にRealtimeDatabaseに通知するようにする
      this.setOnicecandidateCallback();

      // onsettrackにtrack設定時のコールバック関数を設定する
      this.setOntrack();

      // offerを送ってきた相手(remoteUser)のsdpを設定する
      await this.rtcPeerConnection.setRemoteDescription(sdp);

      // rtcPeerConnectionからanswerを作成
      const answer = await this.rtcPeerConnection.createAnswer();

      // 自分のSDPをrtcPeerConnectionに設定する
      await this.rtcPeerConnection.setLocalDescription(answer);

      // answerを送信する
      this.signalingClient.setLocalNames(this.roomName,this.myUserName);
      await this.signalingClient.signalAnswer(this.rtcPeerConnection.localDescription.toJSON(),
        this.remoteUserName);

    } catch(e) {
      console.error(e);
    }
  }

  async listenSignal(myUserName, roomName) {
    this.myUserName = myUserName;
    this.roomName = roomName;

    // 自分以外のユーザーが部屋にいた場合、offerを送信する
    this.signalingClient.database.ref(roomName + '/roomuser').once('value', async (snapshot) => {
      const userData = snapshot.val();
      if(userData === null) return;
      let nameArray = Object.keys(userData);

      // 相手にofferを送る 今回は代表してarray[0]
      // TODO 複数いた場合、どういう処理の順にするかは考える 今は仮処理
      let remoteUserName = nameArray[0];
      if(remoteUserName === this.myUserName) return;
      await this.offer(myUserName, remoteUserName, roomName);
      
    })
    // TODO 上に持っていく
    // 部屋のユーザー管理のところに自分のユーザー名を入れる
    this.signalingClient.registerUser(this.roomName, this.myUserName);

    // roomNameの自分の名前のところを監視する
    // onは更新があった場合差分読み込みを実行してくれる
    // TODO　色々終わったら.off()メソッドで同期をoffにした方がいいかも
    this.signalingClient.database.ref(roomName + '/' + this.myUserName).on('value', async (snapshot) => {
      const dbData = snapshot.val();
      // 特に変更がなければ何もしない
      if(dbData === null) return;

      const {offer, answer, icecandidate} = dbData;

      // offerを受け取った場合はAnswerを返す
      if(offer !== undefined && icecandidate === undefined) {
        const {sdp, from} = offer;
        if(from === this.myUserName) return;
        console.log("offer:" + sdp)
        await this.answer(sdp, from);
        return;

      }

      // answerを受け取った場合はsdpを保存する
      else if(answer !== undefined && icecandidate === undefined) {
        const {sdp, from} = answer;
        if(from === this.myUserName) return;

        console.log("answer:" + sdp)
        // remote側のsdpを設定する
        await this.rtcPeerConnection.setRemoteDescription(sdp);
        return;
      }

      // candidateを受け取ったとき
      else if(icecandidate !== undefined) {
        const {candidate, from} = icecandidate;
        if(from === this.myUserName) return;

        try {
          const iceCandidate = new RTCIceCandidate(candidate);
          await this.rtcPeerConnection.addIceCandidate(iceCandidate);
        } catch (error) {
          console.error(error);
        }
        return;
      }
    })
  }
}
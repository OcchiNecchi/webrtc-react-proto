import firebase from 'firebase/app';
import 'firebase/database';

export default class SignalingClient {
  constructor() {
    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    };

    // Initialize Firebase
    if (firebase.apps.length === 0) firebase.initializeApp(firebaseConfig);

    // Get a reference to the database service
    this.database = firebase.database();

    // ビデオ通話用の部屋名
    this.roomName = '';
    // 自分のユーザー名
    this.myUserName = '';
    // 相手のユーザー名
    this.remoteUserName = '';

  }

  // TODO ここのset系はリファクタ対象
  setRoomName(roomName) {
    this.roomName = roomName;
  }

  setLocalNames(roomName, myUserName) {
    this.roomName = roomName;
    this.myUserName = myUserName;
  }

  setRemoteUser(remoteUserName) {
    this.remoteUserName = remoteUserName;
  }

  // 部屋名+ユーザー名のパスを返す
  get targetUserSchema() {
    return this.database.ref(this.roomName);
  }

  // offerをRealtimeDatabaseに送る。SDPはjson形式でくる
  async signalOffer(sdp, roomName, remoteUserName) {
    this.remoteUserName = remoteUserName;
    await this.database.ref(roomName + '/' + remoteUserName + '/offer').set({
      sdp,
      from: this.myUserName
    });
  }

  // answerをRealtimeDatabaseに送る
  async signalAnswer(sdp, remoteUserName) {
    await this.database.ref(this.roomName + '/' + remoteUserName + '/answer').set({
      sdp,
      from: this.myUserName
    });
  }
  
  // candidateをRealtimeDatabaseに送る
  async signalCandidate(candidate) {
    await this.database.ref(this.roomName + '/' + this.remoteUserName + '/icecandidate').set({
      candidate,
      from: this.myUserName
    });
  }

  // roomuserに自分のユーザー名を入れる
  // pushだと一意のIDが入るため、読み取り時は注意すること
  async registerUser(roomName, userName) {
    // TODO 流石にuserNameの中にuserNameはあれなので入れた日にちとかにしとく
    await this.database.ref(roomName + '/roomuser/' + userName).set({
      userName
    });
  }
}

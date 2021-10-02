import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles({
  root: {
    minWidth: 640,
    maxWidth: 640,
    padding: 0,
  },
});

const VideoRemote = ({peerManage}) => {
  // TODO リファクタ対象
  const videoRef = peerManage.remoteVideoRef;

  const classes = useStyles();

  return(
    <>
      <Card className={classes.root} >
        <CardContent className={classes.root} >
          <video autoPlay muted={false} ref={videoRef}/>
        </CardContent>
        <CardContent >
          <Typography className={classes.title} color="textSecondary" gutterBottom>
            Remote video
          </Typography>
          <Typography variant="body2" component="p">
            {"remote user 1"}
          </Typography>
        </CardContent>
      </Card>
    </>
  );
};

export default VideoRemote;
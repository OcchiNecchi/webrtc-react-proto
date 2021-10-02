import React, {useState, useCallback} from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import Box from '@material-ui/core/Box';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://material-ui.com/">
        Hisanobu Oda
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

export default function InputUserName({peerManage, roomName, userName, setUserName}) {
  const classes = useStyles();
  const [name, setName] = useState('');

  // ユーザー名入力後にコールバック関数が実行される
  const startListenSignal = useCallback(async (e) => {
    await peerManage.startSignal(roomName, name);
    // eには今回Enterが入っているが下記によりformが勝手に送信されないようにしている
    e.preventDefault();
  }, [name])

  const setInputUserName = () => {
    setUserName(name);
  }

  if(roomName === '' || userName !== '') return <></>;

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Enter your name
        </Typography>
        <form className={classes.form} noValidate>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="username"
            label="username"
            type="text"
            id="username"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={ async (e) => {
              if(e.target.value === '') return;
              if(e.key === 'Enter') {
                setInputUserName();
                await startListenSignal(e);
              }
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
            onChange={(e) => setName(e.target.value)}
            onClick={ async(e) => {
              setInputUserName();
              await startListenSignal(e);
            }}
          >
            Sign In
          </Button>
        </form>
      </div>
      <Box mt={8}>
        <Copyright />
      </Box>
    </Container>
  );
}
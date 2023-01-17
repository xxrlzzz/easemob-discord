import AgoraRTC from "agora-rtc-sdk-ng";
import React, { memo, useState, useEffect, useRef, useMemo } from "react";
import { CMD_START_STREAM } from "@/utils/stream";
import { Spin } from "antd";
import { connect } from "react-redux";
import RemoteStreamHandler from "./remote_stream";
import LocalStreamHandler from "./local_stream";
import mqtt from "./use_mqtt";

// https://console.agora.io/project/hhBXhrfod
const options = {
  appId:
    process.env.REACT_APP_AGORA_APPID || "4c61de5fd1b94e2baa5affde8aa50c9f",
  channel: process.env.REACT_APP_AGORA_CHANNEL || "test",
  token:
    process.env.REACT_APP_AGORA_TOKEN ||
    "007eJxTYLi6ZjvXmpITN0/Jfnr15uW123xnVlobRTJeDOO7wLHhhji7AoNJsplhSqppWophkqVJqlFSYqJpYlpaSqoFkGGQbJmWHHcouSGQkeGc12tWJgZGMATxWRhKUotLGBiY4CJsDIZGxhUVFQDFtCXM",
  uid: process.env.REACT_APP_AGORA_UID || "123xxx",
};

const StreamHandler = (props) => {
  const { userInfo, messageInfo, channelId, enableLocalVoice = false } = props;
  const localVideoEle = useRef(null);
  const canvasEle = useRef(null);
  const [rtcClient, setRtcClient] = useState(null);
  const [connectStatus, setConnectStatus] = useState(false);
  const [remoteUser, setRemoteUser] = useState(null);

  const [remoteVoices, setRemoteVoices] = useState([]);
  const [remoteVideo, setRemoteVideo] = useState(null);

  const [enableRemoteVoice, setEnableRemoteVoice] = useState(false);
  const [enableRemoteVideo, setEnableRemoteVideo] = useState(false);

  // 第一条 stream 消息, 用于判断直播状态
  const firstStreamMessage = useMemo(() => {
    return messageInfo?.list?.find(
      (item) => item.type === "custom" && item?.ext?.type === "stream"
    );
  }, [messageInfo]);
  // 第一条 co_play 消息, 用于判断协同游戏状态
  const firstCoPlayMessage = useMemo(() => {
    return messageInfo?.list?.find(
      (item) => item.type === "custom" && item?.ext?.type === "co_play"
    );
  }, [messageInfo]);

  // 是否有直播
  const hasRemoteStream =
    firstStreamMessage?.ext?.status === CMD_START_STREAM &&
    firstStreamMessage?.ext?.user !== userInfo?.username;
  // 本地直播状态
  const [localStreaming, setLocalStreaming] = useState(
    firstStreamMessage?.ext?.status === CMD_START_STREAM &&
      firstStreamMessage?.ext?.user === userInfo?.username
  );
  // 是否有协同游戏
  const hasCoPlay =
    hasRemoteStream &&
    firstCoPlayMessage?.ext?.status === CMD_START_STREAM &&
    firstCoPlayMessage?.ext?.user !== userInfo?.username;
  // 本地协同游戏状态
  const [coPlaying, setCoPlaying] = useState(
    hasRemoteStream &&
      firstCoPlayMessage?.ext?.status === CMD_START_STREAM &&
      firstCoPlayMessage?.ext?.user === userInfo?.username
  );

  // console.log("[Stream] localStreaming", localStreaming);
  // console.log("option is", options);
  // console.log("msg", messageInfo);
  // console.log("uinfo", userInfo);
  // console.log("first msg", firstMessage);
  // console.log("enable voice", enableLocalVoice);

  // 推流相关逻辑
  useEffect(() => {
    AgoraRTC.setLogLevel(3);
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    // TODO: use right channel
    // Use default uid.
    client
      .join(options.appId, options.channel, options.token, userInfo?.username)
      .then(() => {
        setConnectStatus(true);
        console.log("[Stream] join channel success");
      })
      .catch((e) => {
        console.log(e);
      });

    client.on("user-published", async (user, mediaType) => {
      // auto subscribe when users coming
      await client.subscribe(user, mediaType);
      console.log("[Stream] subscribe success on user ", user);
      if (mediaType === "video") {
        // 获取直播流
        if (remoteUser && remoteUser.uid !== user.uid) {
          console.error(
            "already in a call, can not subscribe another user ",
            user
          );
          return;
        }
        const remoteVideoTrack = user.videoTrack;
        remoteVideoTrack.play(localVideoEle.current);
        setRemoteVideo(remoteVideoTrack);
        // can only have one remote video user
        setRemoteUser(user);
      }
      if (mediaType === "audio") {
        // 获取音频流
        const remoteAudioTrack = user.audioTrack;
        if (remoteVoices.findIndex((item) => item.uid === user.uid) == -1) {
          if (enableRemoteVoice) {
            remoteAudioTrack.play();
          }
          setRemoteVoices([
            ...remoteVoices,
            { audio: remoteAudioTrack, uid: user.uid },
          ]);
        }
      }
    });

    client.on("user-unpublished", (user) => {
      // 用户离开, 去除流信息
      console.log("[Stream] user-unpublished", user);
      removeUserStream(user);
    });
    setRtcClient(client);
    return () => {
      client.leave();
      setRtcClient(null);
    };
  }, []);

  // Handle local voice stream.
  useEffect(() => {
    if (!enableLocalVoice || !rtcClient) {
      return;
    }
    let localAudioTrack = null;
    async function publishLocalStream() {
      localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      console.log("[Stream] publish local voice stream");
      await rtcClient.publish(localAudioTrack);
    }
    publishLocalStream();

    return () => {
      if (localAudioTrack) {
        console.log("[Stream] unpublish local voice stream");
        rtcClient.unpublish(localAudioTrack);
      }
    };
  }, [rtcClient, enableLocalVoice]);

  // coplay data channel
  const mqttClient = useMemo(() => {
    const topic = `/${channelId}/co_play`;
    mqtt.isClient = !localStreaming;
    mqtt.setTopic(topic);
    mqtt.setUname(userInfo?.username);
    return mqtt;
  }, [channelId, userInfo?.username]);

  useEffect(() => {
    return () => {
      mqttClient?.disconnect();
    };
  });

  const leaveChannel = () => {
    setLocalStreaming(false);
    setCoPlaying(false);
    rtcClient?.leave();
  };

  const toggleLocalGameStream = () => {
    if (hasRemoteStream) {
      return;
    }
    setLocalStreaming(!localStreaming);
  };

  const toggleCoPlay = () => {
    if (!hasRemoteStream) {
      return;
    }
    setCoPlaying(!coPlaying);
  };

  const removeUserStream = (user) => {
    if (remoteUser && remoteUser.uid === user.uid) {
      setRemoteUser(null);
      setRemoteVideo(null);
    }
    setRemoteVoices(remoteVoices.filter((voice) => voice.uid !== user.uid));
  };

  const toggleRemoteVoice = () => {
    // 当前是关闭状态，需要打开
    if (enableRemoteVoice) {
      remoteVoices.forEach((voice) => {
        if (voice.audio.isPlaying) {
          voice.audio.stop();
        }
        voice.audio.setVolume(0);
      });
    } else {
      remoteVoices.forEach((voice) => {
        if (!voice.audio.isPlaying) {
          voice.audio.play();
        }
        voice.audio.setVolume(100);
      });
    }
    setEnableRemoteVoice(!enableRemoteVoice);
  };

  const toggleRemoteVideo = () => {
    if (!hasRemoteStream) {
      return;
    }
    console.log("[Stream] set remote video to ", !enableRemoteVideo);
    // 当前是关闭状态，需要打开
    if (enableRemoteVideo) {
      remoteVideo?.stop();
    } else {
      remoteVideo?.play(localVideoEle.current);
    }
    setEnableRemoteVideo(!enableRemoteVideo);
  };

  useEffect(() => {
    return () => {
      leaveChannel();
    };
  }, []);

  return (
    <>
      {!connectStatus && <Spin tip="Loading" size="large" />}
      {hasRemoteStream ? (
        <RemoteStreamHandler
          remoteUser={firstStreamMessage?.ext?.user}
          localVideoRef={localVideoEle}
          toggleRemoteVideo={toggleRemoteVideo}
          toggleRemoteVoice={toggleRemoteVoice}
          channelId={channelId}
          userInfo={userInfo}
          rtcClient={rtcClient}
          coPlaying={coPlaying}
          toggleCoPlay={toggleCoPlay}
          mqttClient={mqttClient}
        />
      ) : (
        <LocalStreamHandler
          localStreaming={localStreaming}
          canvasRef={canvasEle}
          toggleRemoteVoice={toggleRemoteVoice}
          toggleLocalGameStream={toggleLocalGameStream}
          rtcClient={rtcClient}
          userInfo={userInfo}
          channelId={channelId}
          mqttClient={mqttClient}
        />
      )}
    </>
  );
};

const mapStateToProps = ({ app, thread }) => {
  return {
    userInfo: app.userInfo,
    currentThreadInfo: thread.currentThreadInfo,
  };
};
export default memo(connect(mapStateToProps)(StreamHandler));

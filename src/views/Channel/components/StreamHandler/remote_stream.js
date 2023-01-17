import { memo, forwardRef, useEffect, useRef, useCallback } from "react";
import {
  DesktopOutlined,
  CustomerServiceOutlined,
  VideoCameraAddOutlined,
  ControlOutlined,
  AudioMutedOutlined,
} from "@ant-design/icons";
import { FloatButton, message, Button } from "antd";
import {
  sendStreamMessage,
  sendCoPlayMessage,
  CMD_END_STREAM,
  CMD_START_STREAM,
} from "@/utils/stream";
import * as wasm_emulator from "@/pkg";
import RTCEngine from "./rtc_engine";

// for debug.
const enableForceStop = true;
const RemoteStreamHandler = (props) => {
  const {
    remoteUser,
    localVideoRef,
    toggleRemoteVoice,
    toggleRemoteVideo,
    channelId,
    userInfo,
    coPlaying,
    rtcClient,
    hasCoPlay,
    toggleCoPlay,
  } = props;

  const lastData = useRef(null);

  RTCEngine.instance.type = "receiver";

  const sendInput = useCallback(() => {
    const rawdata = wasm_emulator.keyboard_status();
    if (lastData.current === rawdata) {
      return;
    }
    lastData.current = rawdata;
    console.log("[coplay] send input", rawdata);
    RTCEngine.channel.send(rawdata);
  }, []);

  useEffect(() => {
    // 协同游戏, 2p
    if (!coPlaying || !rtcClient) {
      return;
    }
    sendCoPlayMessage(
      {
        user: userInfo?.username,
        status: CMD_START_STREAM,
      },
      channelId
    ).then(() => {
      message.success("start coplay");
    });
    const timerId = setInterval(sendInput, 16);
    return () => {
      sendCoPlayMessage(
        { user: userInfo?.username, status: CMD_END_STREAM },
        channelId
      ).then(() => message.info("stop coplay"));
      clearInterval(timerId);
    };
  }, [rtcClient, coPlaying, sendInput, userInfo, channelId]);

  const forceStopStream = () => {
    sendStreamMessage(
      {
        user: userInfo?.username,
        status: CMD_END_STREAM,
      },
      channelId
    );
  };

  const renderRemoteStream = () => {
    return (
      <div style={{ height: "100%" }}>
        <div
          id="remote-player"
          style={{
            width: "100%",
            height: "90%",
            border: "1px solid #fff",
          }}
          ref={localVideoRef}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "10px",
          }}
        >
          <span style={{ color: "#0ECD0A" }}>{remoteUser}</span>
          &nbsp; is playing{" "}
        </div>
        <Button
          icon={<AudioMutedOutlined />}
          onClick={() => {
            RTCEngine.channel.send([37, 65]);
          }}
        >
          send test msg left.
        </Button>
        <Button
          icon={<AudioMutedOutlined />}
          onClick={() => {
            RTCEngine.channel.send([39, 68]);
          }}
        >
          send test msg right.
        </Button>
      </div>
    );
  };
  const renderFloatButtons = () => {
    return (
      <FloatButton.Group
        icon={<DesktopOutlined />}
        trigger="click"
        style={{ left: "380px" }}
      >
        <FloatButton
          onClick={toggleRemoteVoice}
          icon={<CustomerServiceOutlined />}
          tooltip={<div>加入/退出语音频道</div>}
        />
        <FloatButton
          onClick={toggleRemoteVideo}
          icon={<VideoCameraAddOutlined />}
          tooltip={<div>观看/停止观看直播</div>}
        />
        {enableForceStop && (
          <FloatButton
            onClick={forceStopStream}
            icon={<VideoCameraAddOutlined />}
            tooltip={<div>强制停止直播</div>}
          />
        )}
        {(!hasCoPlay || coPlaying) && (
          <FloatButton
            onClick={toggleCoPlay}
            icon={<ControlOutlined />}
            tooltip={<div>开始/结束协同游戏</div>}
          />
        )}
      </FloatButton.Group>
    );
  };
  return (
    <>
      <div style={{ height: "100%" }}>
        {renderFloatButtons()}
        {renderRemoteStream()}
      </div>
    </>
  );
};

const ConnectedHandler = RemoteStreamHandler;

export default memo(
  forwardRef((props, ref) => <ConnectedHandler {...props} />)
);

// {/* <ConnectedHandler {...props} myForwardedRef={ref} /> */}

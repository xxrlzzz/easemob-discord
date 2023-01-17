import AgoraRTC from "agora-rtc-sdk-ng";
import { useEffect, memo, useRef } from "react";
import mario_url from "@/assets/mario.nes";
import * as wasm_emulator from "@/pkg";
import State from "./state";
import { FloatButton, message, Upload, Button } from "antd";
import {
  CustomerServiceOutlined,
  DesktopOutlined,
  VideoCameraOutlined,
  VideoCameraFilled,
  UploadOutlined,
  AudioMutedOutlined,
} from "@ant-design/icons";
import {
  sendStreamMessage,
  CMD_START_STREAM,
  CMD_END_STREAM,
} from "@/utils/stream";
import RTCEngine from "./rtc_engine";

const LocalStreamHandler = (props) => {
  const {
    toggleRemoteVoice,
    toggleLocalGameStream,
    canvasRef,
    localStreaming,
    rtcClient,
    userInfo,
    channelId,
  } = props;
  // 模拟器 state
  const stateRef = useRef(new State());

  RTCEngine.instance.type = "sender";

  RTCEngine.instance.onDataChannelMessage = (event) => {
    let keys = event.data.split(",").map((x) => parseInt(x));
    wasm_emulator.update_remote_keyboard_state(keys);
    console.log("recv", keys);
  };

  useEffect(() => {
    // 本地游戏
    if (!canvasRef) {
      return;
    }

    wasm_emulator.wasm_main();
    fetch(mario_url, {
      headers: { "Content-Type": "application/octet-stream" },
    })
      .then((response) => response.arrayBuffer())
      .then((data) => {
        let mario = new Uint8Array(data);
        stateRef.current.load_rom(mario);
      });
  }, [canvasRef]);

  useEffect(() => {
    // 发布直播推流
    if (!localStreaming || !rtcClient) {
      return;
    }
    let stream = canvasRef.current.captureStream(30);
    let localVideoStream = AgoraRTC.createCustomVideoTrack({
      mediaStreamTrack: stream.getVideoTracks()[0],
    });
    console.log("height", canvasRef.current.height);
    console.log("publishing local stream", localVideoStream);
    rtcClient.publish(localVideoStream).then(() => {
      sendStreamMessage(
        {
          user: userInfo?.username,
          status: CMD_START_STREAM,
        },
        channelId
      ).then(() => {
        message.success({
          content: "start streaming",
        });
      });
    });
    return () => {
      if (localVideoStream) {
        rtcClient.unpublish(localVideoStream);
        localVideoStream.stop();
        sendStreamMessage(
          {
            user: userInfo?.username,
            status: CMD_END_STREAM,
          },
          channelId
        );
        message.info({
          content: "stop streaming",
        });
      }
    };
  }, [rtcClient, localStreaming, canvasRef, userInfo, channelId]);

  const uploadRom = (file) => {
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = () => {
        let res = reader.result;
        let rom = new Uint8Array(res);
        stateRef.current.load_rom(rom, "canvas");
        message.success({
          content: "new game uploaded successfully",
        });
      };
      reader.onerror = console.error;
    });
  };

  const toggleMuteGame = () => {
    stateRef.current.toggleMute();
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
          onClick={toggleLocalGameStream}
          icon={
            localStreaming ? <VideoCameraFilled /> : <VideoCameraOutlined />
          }
          tooltip={<div>{localStreaming ? "停止直播" : "开始直播"}</div>}
        />
      </FloatButton.Group>
    );
  };

  const renderLocalStream = () => {
    return (
      <div style={{ height: "100%" }}>
        <canvas
          id="canvas"
          style={{ width: 600, height: 500 }}
          width="600"
          height="500"
          ref={canvasRef}
        />
        <div
          style={{
            display: "inline-flex",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <Upload beforeUpload={uploadRom} maxCount="1">
            <Button icon={<UploadOutlined />}>Click to choose rom</Button>
          </Upload>
          <Button icon={<AudioMutedOutlined />} onClick={toggleMuteGame}>
            Mute game.
          </Button>
          <Button
            icon={<AudioMutedOutlined />}
            onClick={() => {
              RTCEngine.channel.send("hello");
            }}
          >
            send test msg.
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ height: "100%" }}>
        {renderFloatButtons()}
        {renderLocalStream()}
      </div>
    </>
  );
};

export default memo(LocalStreamHandler);

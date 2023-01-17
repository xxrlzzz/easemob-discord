import { createMsg, deliverMsg } from "@/utils/common";
import { CHAT_TYPE } from "@/consts";

const CMD_START_STREAM = "start";
const CMD_END_STREAM = "end";

const sendStreamMessage = (content, channelId) => {
  let msg = createMsg({
    chatType: CHAT_TYPE.groupChat,
    type: "custom",
    to: channelId,
    ext: {
      type: "stream",
      ...content,
    },
  });
  return deliverMsg(msg)
    .then(() => {
      console.log("发送成功");
    })
    .catch(console.error);
};

const sendCoPlayMessage = (content, channelId) => {
  let msg = createMsg({
    chatType: CHAT_TYPE.groupChat,
    type: "custom",
    to: channelId,
    ext: {
      type: "co_play",
      ...content,
    },
  });
  return deliverMsg(msg)
    .then(() => {
      console.log("发送成功");
    })
    .catch(console.error);
};

export {
  sendCoPlayMessage,
  sendStreamMessage,
  CMD_START_STREAM,
  CMD_END_STREAM,
};

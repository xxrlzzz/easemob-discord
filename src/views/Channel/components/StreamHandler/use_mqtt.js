import http from "@/utils/axios";
import axios from "axios";
import { Client, Message } from "paho-mqtt";

const MqttConfig = {
  appId: process.env.REACT_APP_MQTT_APPID || "me8yj0",
  host: process.env.REACT_APP_MQTT_HOST || "me8yj0.cn1.mqtt.chat",
  port: 80,
  appClientId:
    process.env.REACT_APP_MQTT_APPCLIENTID || "YXA6jpCfcDgqSKOcdeqOTM8P8Q",
  appClientSecret:
    process.env.REACT_APP_MQTT_APPCLIENTSECRET ||
    "YXA6ojxxpKnV1quRQilb7XGQW64uiV4",
  apiUrl:
    process.env.REACT_APP_MQTT_APIURL || "https://api.cn1.mqtt.chat/app/me8yj0",
  reconnTimeout: 1000,
  cleanSession: true,
  useSSL: false,
};

let mqtt;

class MQTT {
  constructor() {
    this.client = null;
    this.host = MqttConfig.host;
    this.port = MqttConfig.port;
    this.appClientId = MqttConfig.appClientId;
    this.appClientSecret = MqttConfig.appClientSecret;
    this.appId = MqttConfig.appId;
    this.reconnTimeout = MqttConfig.reconnTimeout;
    this.cleanSession = MqttConfig.cleanSession;
    this.useSSL = MqttConfig.useSSL;
    this.apiUrl = MqttConfig.apiUrl;
    this.clientId = null;
    this.username = null;
    this.password = null;
    this.topic = null;
    this.onMessage = null;
    this.isClient = false;
    this.queueMes = [];
    this.connecting = false;
  }

  connect = () => {
    console.log("[MQTT] conn", this.clientId);
    this.connecting = false;
    this.client = new Client(this.host, this.port, this.clientId);
    const options = {
      timeout: 3,
      onSuccess: () => {
        // console.log("[MQTT] connected, go subscribe ", this.topic);
        if (!this.client || !this.client.isConnected()) {
          // console.log("mqttClient is not connected");
          return;
        }
        if (!this.isClient) {
          this.client.subscribe(this.topic, { qos: 0 });
        }
        if (this.queueMes.length > 0) {
          this.queueMes.forEach((mes) => {
            this.send(mes);
          });
          this.queueMes = [];
        }
      },
      mqttVersion: 4,
      useSSL: this.useSSL,
      cleanSession: this.cleanSession,
      onFailure: (res) => {
        if (!this.isClient && !this.connecting) {
          this.connecting = setTimeout(this.connect(), this.reconnTimeout);
          // console.log("[MQTT] connect failed", res);
        }
      },
      reconnect: true,
      keepAliveInterval: 60,
      userName: this.uname,
      password: this.password,
    };
    this.client.onConnectionLost = (res) => {
      if (!this.isClient && !this.connecting) {
        // console.log("[MQTT] connection lost", res);
        this.connecting = setTimeout(this.connect(), this.reconnTimeout);
      }
    };
    this.client.onMessageArrived = (message) => {
      if (!this.isClient && this.onMessage) {
        console.log("[MQTT] message arrived", message);
        this.onMessage(message.payloadString);
      }
    };
    this.client.connect(options);
  };

  disconnect = () => {
    if (this.connecting) {
      clearTimeout(this.connecting);
      this.connecting = false;
    }
    if (this.client && this.client.isConnected()) {
      try {
        // this.client.disconnect();
        // this.client.unsubscribe(this.topic);
      } catch (e) {
        console.log("mqttClient disconnect error", e);
      }
    }
  };

  send = (data) => {
    if (this.client && this.client.isConnected()) {
      const message = new Message(data);
      message.destinationName = this.topic;
      this.client.send(message);
    } else {
      this.queueMes.push(data);
      this.connect();
    }
  };

  isConnected = () => {
    return this.client && this.client.isConnected();
  };

  setUname = (uname) => {
    if (uname === this.uname) {
      return;
    }
    this.uname = uname;
    this.clientId = `${uname}@${this.appId}`;
    this.getUserToken();
  };
  setTopic = (topic) => {
    this.topic = topic;
    if (this.client && this.client.isConnected()) {
      this.client.subscribe(this.topic, { qos: 0 });
    }
  };

  getUserToken = async () => {
    axios
      .post(
        `${this.apiUrl}/openapi/rm/user/token`,
        {
          username: this.uname,
          expires_in: 86400,
          cid: this.clientId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: MQTT.app_token,
          },
        }
      )
      .then((res) => {
        console.log("[MQTT] user token ", res);
        const token = res.data.body.access_token;
        this.password = token;
        MQTT.token = token;
        this.connect();
      })
      .catch(console.error);
  };
}

const getAppToken = async () => {
  http("post", `${MqttConfig.apiUrl}/openapi/rm/app/token`, {
    appClientId: MqttConfig.appClientId,
    appClientSecret: MqttConfig.appClientSecret,
  })
    .then((res) => {
      const app_token = res.body.access_token;
      console.log("[MQTT] access token ", res);
      MQTT.app_token = app_token;
      // getUserToken(app_token);
    })
    .catch(console.error);
};

getAppToken();
mqtt = new MQTT();

export default mqtt;

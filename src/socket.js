import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5001";

export const socket = io(
  SOCKET_URL,
  {
    autoConnect: false,

    transports: [
      "websocket",
      "polling",
    ],

    auth: (cb) => {
      const token =
        localStorage.getItem(
          "token"
        );

      cb({
        token,
      });
    },
  }
);

export function connectSocket() {
  const token =
    localStorage.getItem(
      "token"
    );

  if (!token) {
    console.warn(
      "Socket: JWT token not found."
    );

    return;
  }

  if (!socket.connected) {
    socket.auth = {
      token,
    };

    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}
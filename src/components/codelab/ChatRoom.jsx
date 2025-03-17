import { Popover, Badge } from "antd";
import { IoSend } from "react-icons/io5";
import { useEffect, useRef, useState } from "react";
import {
  getDatabase,
  onValue,
  ref,
  serverTimestamp,
  push,
  off,
  set,
  onDisconnect,
  query,
  limitToLast,
} from "firebase/database";
import app from "../../firebase";
import { toast, Toaster } from "sonner";
import moment from "moment";
import config from "../../config";
import { FaUser } from "react-icons/fa";
import {Avatar} from "@chakra-ui/react";

export default function ChatRoom({ room, chap, user, users }) {
  const [messages, setMessages] = useState([]);
  const [chatRoom, setChatRoom] = useState("all");
  const [roomUsers, setRoomUsers] = useState([]);
  let refChat = useRef(null);
  let refNotifyAll = useRef(null);
  let refNotify = useRef(null);

  useEffect(() => {
    getRefChat();

    const messageQuery = query(refChat.current, limitToLast(50));

    const unsubscribe = onValue(messageQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object?.values(data));
      } else {
        setMessages([]);
      }
    });

    return () => {
      setMessages([]);
      unsubscribe();
    };
  }, [chatRoom, chap]);

  useEffect(() => {
    getRefNotifyAll();
    const unsubscribe = onValue(refNotifyAll.current, (snapshot) => {
      const data = snapshot.val();
      if (
        data &&
        data?.type === "TOAST_NEW_MESSAGE" &&
        data?.from !== user.uid
      ) {
        toast.info(data?.content, {
          duration: 5000,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [chap, room]);

  useEffect(() => {
    getRefNotify();
    const unsubscribe = onValue(refNotify.current, (snapshot) => {
      const data = snapshot.val();
      if (
        data &&
        data?.type === "TOAST_NEW_MESSAGE" &&
        data?.from !== user.uid
      ) {
        toast.info(data?.content, {
          duration: 5000,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [chap, room]);

  useEffect(() => {
    const db = getDatabase(app);
    const link = chap ? `/chap${chap}` : "";
    const userPath = `/labs/${room.docID.replace(/\./g, "")}/${
      room.roomID
    }${link}/users`;
    const userRef = ref(db, userPath);

    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const res = [];
        for (const [uid, info] of Object.entries(data)) {
          res.push({
            uid: uid,
            name: info.name,
            step: info.step,
            timestamp: info.timestamp,
            isRaise: info.isRaise,
          });
        }
        res.sort((a, b) => {
          if (a.uid === user.uid) return -1;
          if (b.uid === user.uid) return 1;
          if (a.isRaise && !b.isRaise) return -1;
          if (!a.isRaise && b.isRaise) return 1;
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });
        setRoomUsers(res);
      } else {
        setRoomUsers([]);
      }
    });

    return () => {
      setRoomUsers([]);
      unsubscribe();
    };
  }, [room, chap]);

  const getRefChat = () => {
    if (refChat.current) off(refChat.current);
    const db = getDatabase(app);
    const link = chap ? `/chap${chap}` : "";
    refChat.current = ref(
      db,
      `/labs/${room.docID.replace(/\./g, "")}/${
        room.roomID
      }${link}/chats/${chatRoom}`
    );
  };

  const getRefNotifyAll = () => {
    if (refNotifyAll.current) off(refNotifyAll.current);
    const db = getDatabase(app);
    const link = chap ? `/chap${chap}` : "";
    refNotifyAll.current = ref(
      db,
      `/labs/${room.docID.replace(/\./g, "")}/${
        room.roomID
      }${link}/notifies/all`
    );
    onDisconnect(refNotifyAll.current)
      .set(null)
      .catch((error) => console.log("Error setting onDisconnect: ", error));
  };

  const getRefNotify = () => {
    if (refNotify.current) off(refNotify.current);
    const db = getDatabase(app);
    const link = chap ? `/chap${chap}` : "";
    refNotify.current = ref(
      db,
      `/labs/${room.docID.replace(/\./g, "")}/${room.roomID}${link}/notifies/${
        user.uid
      }`
    );
    onDisconnect(refNotify.current)
      .set(null)
      .catch((error) => console.log("Error setting onDisconnect: ", error));
  };

  const sendNotify = (sendTo = "all", from = "") => {
    const db = getDatabase(app);
    const link = chap ? `/chap${chap}` : "";
    const refNotify = ref(
      db,
      `/labs/${room.docID.replace(/\./g, "")}/${
        room.roomID
      }${link}/notifies/${sendTo}`
    );
    set(refNotify, {
      type: "TOAST_NEW_MESSAGE",
      content: `Bạn có một tin nhắn mới ${
        !!from && sendTo !== "all" ? `từ ${from}` : ""
      }!`,
      from: user.uid,
      time: serverTimestamp(),
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const message = data.get("message");
    if (message.trim() === "") {
      return;
    }

    const newMessage = {
      userUID: user.uid,
      displayName: user.displayName,
      userEmail: user.email,
      message: message,
      timestamp: serverTimestamp(),
    };
    push(refChat.current, newMessage)
      .then(() => {
        e.target.reset();
      })
      .catch((error) => {
        console.error("Error sending message: ", error);
      });
    //log
     fetch(`${config.API_LOG_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        logType: "chat",
        chatType: chatRoom === "all" ? "public" : "private",
        roomID: room.roomID,
        userID: user.uid,
        timestamp: new Date().toISOString(), // ISO timestamp format
        userName: user.displayName,
        userEmail: user.email,
        log: {
          message: message,
        },
      }),
    });

    if (chatRoom === "all") {
      sendNotify("all", user.displayName);
    } else {
      const [user1, user2] = chatRoom.split("-");
      sendNotify(user1 === user.uid ? user2 : user1, user.displayName);
    }
  };

  return (
    <div>
      <Popover
        title={(
          <div className="fs-6">
            {chatRoom === "all" ? "Phòng chat chung" : `Chat với ${roomUsers.find(u => chatRoom.includes(u.uid))?.name}`}
          </div>
        )}
        style={{
          maxWidth: "100vw",
          maxHeight: "100vh",
        }}
        content={
          <div className="d-flex border-top">
            {/* Left sidebar with users list */}
            <div className="border-end" style={{width: 300}}>
              <div className="p-3 border-bottom">
                <button
                  className={`btn ${chatRoom === "all" ? "btn-primary" : "btn-outline-primary"} w-100`}
                  onClick={() => setChatRoom("all")}
                >
                  <div className="d-flex align-items-center gap-2">
                    <FaUser/>
                    <span>Tất cả mọi người ({roomUsers.length})</span>
                  </div>
                </button>
              </div>
              <div className="overflow-auto" style={{height: 450}}>
                {roomUsers
                  .map((u, index) => {
                    const chatId = user.uid > u.uid
                      ? `${u.uid}-${user.uid}`
                      : `${user.uid}-${u.uid}`;
                    return (
                      <div
                        key={index}
                        className={`p-3 border-bottom user-chat-item ${chatRoom === chatId ? 'bg-light' : ''}`}
                        role="button"
                        onClick={() => setChatRoom(chatId)}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <img src="/images/user.svg" width={32} height={32}/>
                          <div className="d-flex align-items-center gap-2">
                            <div className="fw-bold">{u.name} {u.uid === user.uid ? ' (Tôi)' : ''}</div>
                            {u.isRaise && (
                              <span className="hand-raise-badge" title="Đang giơ tay">
                                  ✋
                                </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Chat area */}
            <div className="d-flex flex-column" style={{width: 600}}>
              {/* Messages */}
              <div
                className="flex-grow-1 p-3 d-flex flex-column-reverse overflow-auto"
                style={{height: 450}}
              >
                {messages.length === 0 ? (
                  <p className="text-center text-muted">Không có tin nhắn nào</p>
                ) : (
                  <div className="d-flex flex-column gap-4">
                    {messages?.map((message, index) => (
                      <div
                        key={index}
                        className={`d-flex gap-2 align-items-start ${
                          message.userUID === user.uid ? "align-self-end" : ""
                        }`}
                      >
                        {message.userUID !== user.uid && (
                          <img src="/images/user.svg" width={32} height={32}/>
                        )}
                        <div className="d-flex flex-column gap-1">
                          <small className="text-muted">
                            {message.userUID === user.uid ? "Bạn" : message.displayName}
                          </small>
                          <div
                            className={`p-2 rounded-3 ${
                              message.userUID === user.uid
                                ? "bg-primary text-white"
                                : "bg-light"
                            }`}
                            style={{maxWidth: 400}}
                          >
                            {message.message}
                          </div>
                          <small className="text-muted">
                            {moment(message.timestamp).fromNow()}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message input */}
              <div className="border-top p-3">
                <form
                  className="d-flex gap-2 align-items-center"
                  onSubmit={sendMessage}
                >
                  <textarea
                    name="message"
                    rows={1}
                    className="form-control"
                    placeholder="Nhập tin nhắn..."
                    autoComplete="off"
                    style={{height: 40}}
                  />
                  <button className="btn btn-primary" type="submit" style={{height: 40, width: 40}}>
                    <IoSend size={20}/>
                  </button>
                </form>
              </div>
            </div>
          </div>
        }
        trigger={"click"}
      >
        <button className="btn btn-primary hide-expand p-3">
          <Badge
            count={roomUsers.length || 0}
            showZero
            status="processing"
            color="blue"
          >
            <FaUser size={24} style={{color: "white"}}/>
          </Badge>
        </button>
      </Popover>
    </div>
  );
}

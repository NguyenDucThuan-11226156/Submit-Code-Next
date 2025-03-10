"use client";

import React, { useEffect, useState } from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import { RxUpdate } from "react-icons/rx";
import { IoDocumentTextOutline, IoSettings } from "react-icons/io5";
import { RiSlideshow2Line } from "react-icons/ri";
import { HiQrCode, HiOutlineUserGroup } from "react-icons/hi2";
import RaiseHandButton from "./RaiseHandButton";
import ChatRoom from "./ChatRoom";
import SettingsModal from "../../modals/SettingsModal";
import { ArrowCircleUpRounded, FilePresentRounded, Download, CodeOutlined, StackedLineChart } from "@mui/icons-material";
import { getDatabase, ref, onValue, set, get } from "firebase/database";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import UploadedFilesModal from "./UploadedFilesModal";
import AttendeesModal from "./AttendeesModal";
import config from "../../config";

const DocControls = ({
  handleDownloadWordFile,
  isRaised,
  toggleRaiseHand,
  room,
  chap,
  uploadedFiles,
  users,
  setUsers,
  user,
  display,
  teacher,
  handlerUpdate,
  handleDocClick,
  handleSlideClick,
  handleQrCodeClick,
  handleSettingModal,
  showSettingsModal,
  template,
  handleTemplate,
  onSaveSettings,
  isRoomInPath,
  loadRooms,
  handleRedirectGoogle,
  slideTitle,
  onTitleChange,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const roomId = pathname.split("/")[2];
  const handleNavigate = () => {
    router.push(`/submit-code/${roomId}/onlineJudge`);
  };

  const handleNavigateStudent = () => {
    router.push(`/submit-code/${roomId}/editor`);

  };
  const handleStatistic = () => {
    router.push(`/room/${roomId}/statistic?docID=${encodeURIComponent(JSON.stringify(room.docID))}&chap=${chap}`);
  };
  const [roomUsers, setRoomUsers] = useState([]);
  const [showFileList, setShowFileList] = useState(false);

  useEffect(() => {
    if (room?.roomID) {
      const db = getDatabase();
      const link = chap ? `/chap${chap}` : "";
      const userPath = `/labs/${room.docID.replace(/\./g, "")}/${room.roomID}${link}/users`;
      const userRef = ref(db, userPath);

      const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        setRoomUsers(data ? Object.entries(data).map(([uid, info]) => ({ uid, ...info })) : []);
      });

      return () => unsubscribe();
    }
  }, [room, chap]);

  return (
    <>
      {isRoomInPath && (
        <button
          className={`btn btn-primary ${isRaised ? "btn-danger" : "btn-outline-light"} ms-2 hide-expand`}
          onClick={toggleRaiseHand}
          disabled={!room?.roomID}
        >
          <RaiseHandButton isRaised={isRaised} raisedHandsCount={roomUsers.filter(user => user.isRaise)?.length || 0} />
        </button>
      )}

      {teacher === user?.uid ? (
        <button className="btn btn-primary ms-2 me-2" onClick={handleNavigate}>
          <CodeOutlined size={24} />
        </button>
      ) : (
        <button className="btn btn-primary ms-2 me-2" onClick={handleNavigateStudent}>
          <CodeOutlined size={24} />
        </button>
      )}

      {room?.roomID && user && <ChatRoom chap={chap} room={room} user={user} users={users} />}
      {teacher !== user?.uid && (
        <button className="btn btn-primary ms-2 me-2 hide-expand">
          <RxUpdate size={24} onClick={handlerUpdate} />
        </button>
      )}
      {teacher === user?.uid && (
        <>
          <button className="btn btn-primary ms-2 me-2" onClick={() => setShowFileList(true)}>
            <FilePresentRounded size={24} />
          </button>
          <UploadedFilesModal show={showFileList} onClose={() => setShowFileList(false)} uploadedFiles={uploadedFiles} />
        </>
      )}

      {teacher === user?.uid && <AttendeesModal roomID={room?.roomID} roomUsers={roomUsers} />}

      {/* <ButtonGroup className="ms-2 me-2">
        {/* <Button variant="outline-primary" className={display === "doc" ? "active" : ""} onClick={handleDocClick}>
          <IoDocumentTextOutline size={24} />
        </Button> */}
        {/* <Button variant="outline-primary" className={display === "slide" ? "active" : ""} onClick={handleSlideClick}>
          <RiSlideshow2Line size={24} />
        </Button> */}
      {/* </ButtonGroup> */}

      <Button className="btn btn-primary ms-2 me-2 hide-expand" onClick={handleQrCodeClick}>
        <HiQrCode size={24} />
      </Button>

      {teacher === user?.uid && (
        room?.docID?.length !== 44 ? (
          <Button className="btn btn-primary ms-2 me-2 hide-expand" onClick={handleDownloadWordFile}>
            <Download size={24} />
          </Button>
        ) : (
          <Button className="btn btn-primary ms-2 me-2 hide-expand" onClick={handleRedirectGoogle}>
            <ArrowCircleUpRounded size={24} />
          </Button>
        )
      )}
      {teacher === user?.uid && (
        <>
          <Button
            className="btn btn-danger ms-2 me-2 hide-expand"
            onClick={async () => {
              if (window.confirm('Are you sure you want to clear all students\' presence and hand-raising states?')) {
                try {
                  const db = getDatabase();
                  const link = chap ? `/chap${chap}` : "";
                  const basePath = `/labs/${room.docID.replace(/\./g, "")}/${room.roomID}`;
                  
                  // Get current users before clearing them
                  const userRef = ref(db, `${basePath}${link}/users`);
                  const snapshot = await get(userRef);
                  const currentUsers = snapshot.val();
                  
                  if (currentUsers) {
                    // Set force logout flag for each user
                    const forceLogoutRef = ref(db, `${basePath}/forceLogout`);
                    await set(forceLogoutRef, {
                      timestamp: Date.now(),
                      users: Object.keys(currentUsers).filter(uid => uid !== user.uid) // Don't force logout the teacher
                    });
                  }

                  // Clear users in current chapter/room
                  await set(userRef, null);

                  // Clear chats
                  const chatPath = `${basePath}${link}/chats`;
                  const chatRef = ref(db, chatPath);
                  await set(chatRef, null);

                  // Clear notifications
                  const notifyPath = `${basePath}${link}/notifies`;
                  const notifyRef = ref(db, notifyPath);
                  await set(notifyRef, null);

                  // Log the action
                  await fetch(`${config.API_BASE_URL}/logs`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      logType: "clearRoom",
                      roomID: room.roomID,
                      userID: user.uid,
                      timestamp: new Date().toISOString(), // ISO timestamp format

                      userName: user.displayName,
                      action: "CLEAR_AND_FORCE_LOGOUT_STUDENTS"
                    }),
                  });

                } catch (error) {
                  console.error("Error clearing room:", error);
                  alert("Failed to clear room. Please try again.");
                }
              }
            }}
            title="Clear all students' presence"
          >
            <HiOutlineUserGroup size={24} />
          </Button>
        </>
      )}

      { teacher === user?.uid && (
        <Button className="btn btn-primary ms-2 me-2" onClick={() => handleSettingModal(true)}>
          <IoSettings size={24} />
        </Button>
      )}

      <Button className="btn btn-primary ms-2 me-2" onClick={handleStatistic}>
        <StackedLineChart size={24} />
      </Button>

      <SettingsModal
        show={showSettingsModal}
        handleClose={() => handleSettingModal(false)}
        template={template}
        handleTemplate={handleTemplate}
        onSaveSettings={onSaveSettings}
        roomID={room?.roomID}
        slideTitle={slideTitle}
        onTitleChange={onTitleChange}
      />
      {user && !isRoomInPath && (
        <div className="hide-expand btn-group teacher ms-2 me-2 room">
          <Button
            variant="primary"
            className="dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <HiOutlineUserGroup size={24} />
            <span className="d-none d-lg-inline ms-2">Phòng học </span>
          </Button>
          <ul className="dropdown-menu">
            <li>
              <button className="dropdown-item preview" onClick={loadRooms}>
                Danh sách phòng học
              </button>
            </li>
          </ul>
        </div>
      )}
    </>
  );
};

export default DocControls;

import { useEffect } from "react";
import firebase from "firebase/compat/app";
import config from "../config";
const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
export const useAutoLogout = (user,room) => {
  useEffect(() => {
    let timeoutId;

    const resetTimeout = () => {
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Set new timeout
      timeoutId = setTimeout(() => {
        fetch(`${config.API_LOG_URL}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            logType: "leaveRoom",
            userName: user.displayName,
            userID: user.uid,
            timestamp: new Date().toISOString(), // ISO timestamp format

            roomID: room.roomID,
            log: "Treo máy",
          }),
        });
        firebase.auth().signOut();
      }, TIMEOUT_DURATION);
    };

    // Initial timeout
    resetTimeout();

    // Add event listeners for user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) => {
      document.addEventListener(event, resetTimeout);
    });

    return () => {
      // Cleanup
      events.forEach((event) => {
        document.removeEventListener(event, resetTimeout);
      });
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user,room]);
};

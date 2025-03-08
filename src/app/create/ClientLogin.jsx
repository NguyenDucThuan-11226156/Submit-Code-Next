"use client"

import { useState, useEffect } from "react";
import { Modal, Button } from "antd";
import { onAuthStateChanged, signInWithPopup, OAuthProvider } from "firebase/auth";
import { auth } from "@/firebase";
import CreateExam from "@/components/codelab/CreateExam";

export default function ClientLogin() {
  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setModalVisible(false);
      } else {
        setUser(null);
        setModalVisible(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new OAuthProvider("microsoft.com");
    try {
      await signInWithPopup(auth, provider);
      // Sau khi đăng nhập thành công, onAuthStateChanged sẽ cập nhật user và ẩn modal
    } catch (error) {
      console.error("Lỗi đăng nhập với Microsoft:", error);
    }
  };

  return (
    <>
      {/* Nếu đã đăng nhập, hiển thị CreateExam */}
      {user ? <CreateExam /> : null}

      {/* Modal đăng nhập (Ant Design) */}
      <Modal
        title="Đăng nhập"
        open={modalVisible}
        closable={false}
        footer={[
          <Button key="login" type="primary" onClick={handleLogin}>
            Đăng nhập với Microsoft
          </Button>,
        ]}
      >
        <p>Vui lòng đăng nhập để tiếp tục truy cập trang này.</p>
      </Modal>
    </>
  );
}

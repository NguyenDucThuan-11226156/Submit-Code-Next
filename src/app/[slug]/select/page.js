"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc,
  getDoc 
} from "firebase/firestore";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  Layout, 
  Card, 
  Checkbox, 
  Button, 
  Spin, 
  message, 
  List, 
  Row, 
  Col, 
  Typography, 
  Tooltip 
} from "antd";
import app from "@/firebase";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;
function SelectQuestion() {
  const { slug } = useParams(); // Mã phòng từ URL
  const [questions, setQuestions] = useState([]);
  // Lưu trữ danh sách các question.id đã được lưu trong Firebase
  const [selectedQuestions, setSelectedQuestions] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const pathParts = pathname.split("/");
  const roomId = pathParts[1]; // Thay đổi logic này nếu cấu trúc URL khác

  // Lắng nghe trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Lấy danh sách bài tập của người dùng từ Firestore
  useEffect(() => {
    if (!slug || !user) return;
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const db = getFirestore(app);
        const userId = user.uid;
        const examsRef = collection(db, "users", userId, "exams");
        const querySnapshot = await getDocs(examsRef);
        const fetchedQuestions = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error("Lỗi lấy câu hỏi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [slug, user]);

  // Load danh sách các câu hỏi đã được tick từ Firebase
  useEffect(() => {
    if (!slug || !user) return;
    const fetchSelectedQuestions = async () => {
      try {
        const db = getFirestore(app);
        const questionsCollectionRef = collection(db, "rooms", slug, "onlineJudge", "contest", "questions");
        const querySnapshot = await getDocs(questionsCollectionRef);
        // Lấy ra sourceId của từng document lưu trong sub-collection
        const selected = querySnapshot.docs.map((docSnap) => docSnap.data().sourceId);
        setSelectedQuestions(selected);
      } catch (error) {
        console.error("Lỗi lấy các câu hỏi đã tick:", error);
      }
    };
    fetchSelectedQuestions();
  }, [slug, user]);

  // Xử lý khi chọn hoặc bỏ chọn một bài tập
  const handleSelect = (questionId) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Lưu danh sách câu hỏi đã chọn vào Firebase, đồng bộ hóa với sub-collection "questions"
  const handleSaveSelection = async () => {
    if (!user || !slug) return;
    try {
      const db = getFirestore(app);

      // 1. Đảm bảo document phòng ("rooms/{slug}") tồn tại
      const roomRef = doc(db, "rooms", slug);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        await setDoc(roomRef, { createdAt: Date.now() });
      }

      // 2. Đảm bảo collection "onlineJudge" và document "contest" tồn tại
      const contestDocRef = doc(db, "rooms", slug, "onlineJudge", "contest");
      const contestDocSnap = await getDoc(contestDocRef);
      if (!contestDocSnap.exists()) {
        await setDoc(contestDocRef, { createdAt: Date.now() });
      }

      // 3. Lấy reference đến sub-collection "questions"
      const questionsCollectionRef = collection(db, "rooms", slug, "onlineJudge", "contest", "questions");

      // Lấy tất cả các document hiện có trong sub-collection "questions"
      const querySnapshot = await getDocs(questionsCollectionRef);
      const existingDocs = {}; // key: sourceId, value: { id: docId, data: ... }
      querySnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.sourceId) {
          existingDocs[data.sourceId] = { id: docSnap.id, data };
        }
      });

      // Lấy danh sách câu hỏi được chọn (dựa trên selectedQuestions)
      const selectedQuestionsData = questions.filter(q => selectedQuestions.includes(q.id));

      // Thêm mới các câu hỏi được chọn mà chưa tồn tại trong Firebase
      await Promise.all(
        selectedQuestionsData.map(async (q) => {
          if (!existingDocs[q.id]) {
            await addDoc(questionsCollectionRef, {
              question: q?.question,
              testcase: q?.testCases,
              title: q?.title,
              language  : q?.language || "javascript",
              teacher: q?.teacher || user.displayName,
              timestamp: q?.timestamp || Date.now(),
              sourceId: q.id, // lưu lại id của câu hỏi gốc
            });
          }
        })
      );

      // Xóa các document trong Firebase mà không còn được chọn nữa
      await Promise.all(
        Object.keys(existingDocs).map(async (sourceId) => {
          if (!selectedQuestions.includes(sourceId)) {
            await deleteDoc(doc(db, "rooms", slug, "onlineJudge", "contest", "questions", existingDocs[sourceId].id));
          }
        })
      );

      message.success("Lưu danh sách bài tập thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu danh sách bài tập:", error);
      message.error("Lưu thất bại, vui lòng thử lại.");
    }
  };

  if (loading) return <Spin tip="Đang tải dữ liệu..." />;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ backgroundColor: "#1890ff", padding: "0 20px" }}>
        <Title level={2} style={{ color: "#fff", margin: 0 }}>
          Chọn câu hỏi cho phòng {slug}
        </Title>
      </Header>
      <div className="d-flex gap-2">
        <Button>
          <Link href={`/${roomId}/statistic`}>
            Statistic
          </Link>
        </Button>
        <Button>
          <Link href={`/${roomId}/editor`}>Editor</Link>
        </Button>
      </div>
      <Content style={{ padding: "20px" }}>
        <Card title="Danh sách câu hỏi" variant={false}>
          <List
            itemLayout="horizontal"
            dataSource={questions}
            renderItem={(question) => (
              <List.Item>
                <Tooltip
                  placement="right"
                  title={<div dangerouslySetInnerHTML={{ __html: question.question }} />}
                >
                  <Checkbox
                    checked={selectedQuestions.includes(question.id)}
                    onChange={() => handleSelect(question.id)}
                  >
                    {question.title}
                  </Checkbox>
                </Tooltip>
              </List.Item>
            )}
          />
        </Card>
        <Row justify="center" style={{ marginTop: "20px" }}>
          <Col>
            <Button
              type="primary"
              size="large"
              onClick={handleSaveSelection}
            >
              Lưu bài tập vào phòng
            </Button>
          </Col>
        </Row>
      </Content>
      <Footer style={{ textAlign: "center" }}>Teacher's Portal ©2025</Footer>
    </Layout>
  );
}

export default SelectQuestion;

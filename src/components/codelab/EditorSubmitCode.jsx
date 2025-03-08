"use client";

import {
  Box,
  HStack,
  VStack,
  Button,
  Text,
  Textarea,
  useColorMode,
  useColorModeValue,
  Avatar,
  Progress,
} from "@chakra-ui/react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { useRef, useState, useEffect } from "react";
import { getFirestore, collection, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore";
import { usePathname } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { CheckIcon } from "@chakra-ui/icons";
import ColorModeToggle from "./ColorModeToggle";
import dayjs from "dayjs";
import app from "../../firebase";
import { CODE_SNIPPETS } from "../../constants";

export default function CodeEditor() {
  const editorRef = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [value, setValue] = useState("");
  // State ngôn ngữ sẽ được lấy từ câu hỏi (được giáo viên tạo)
  const [language, setLanguage] = useState("javascript");
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null); // Câu hỏi đang được chọn
  const [input, setInput] = useState("");
  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);
  const roomId = pathParts[pathParts.length - 2];
  const [user, setUser] = useState(null);
  const [completedQuestions, setCompletedQuestions] = useState(0);
  const totalQuestions = questions.length;
  const { colorMode } = useColorMode();
  const editorTheme = colorMode === "dark" ? "vs-dark" : "light";
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const headerBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const accentColor = useColorModeValue("blue.600", "blue.200");
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const buttonBg = useColorModeValue("white", "gray.800");
  const placeholderColor = useColorModeValue("gray.500", "gray.400");

  // Khi selectedQuestion thay đổi, nếu có trường language thì cập nhật editor
  useEffect(() => {
    console.log("Selected question changed:", selectedQuestion
    );
    if (selectedQuestion && selectedQuestion.language) {
      setLanguage(selectedQuestion.language);
      setValue(CODE_SNIPPETS[selectedQuestion.language] || "");
    }
  }, [selectedQuestion]);

  const openCodePreview = (submission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  // Khi chọn câu hỏi từ sidebar, hiển thị thông tin câu hỏi
  const handleQuestionClick = (question) => {
    if (question && question.question) {
      setSelectedQuestion(question);
    }
  };

  // Lấy thông tin người dùng và danh sách câu hỏi từ Firestore
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const db = getFirestore(app);
        const questionsRef = collection(db, "rooms", roomId, "onlineJudge", "contest", "questions");

        // Lắng nghe thay đổi real-time trên Firestore
        const unsubscribeFirestore = onSnapshot(questionsRef, (snapshot) => {
          const updatedQuestions = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setQuestions(updatedQuestions);

          const completedCount = updatedQuestions.filter((q) =>
            q?.users?.some((userObj) => userObj.uid === currentUser.uid && userObj.status === true)
          ).length;
          setCompletedQuestions(completedCount);
        });

        return () => unsubscribeFirestore();
      }
    });

    return () => unsubscribeAuth();
  }, [roomId]);

  // Lấy danh sách câu hỏi ban đầu từ Firestore
  useEffect(() => {
    const fetchQuestions = async () => {
      const db = getFirestore(app);
      const contestCollectionRef = collection(db, "rooms", roomId, "onlineJudge", "contest", "questions");

      try {
        const querySnapshot = await getDocs(contestCollectionRef);
        const questionsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          question: doc.data().question,
          testCases: doc.data().testCases || [],
          users: doc.data().users || [],
          language: doc.data().language, // Ngôn ngữ được chỉ định bởi giáo viên
        }));
        setQuestions(questionsList);
      } catch (error) {
        console.error("Error fetching questions from Firestore:", error);
        setQuestions([]);
      }
    };

    if (roomId) {
      fetchQuestions();
    }
  }, [roomId]);

  // Lưu code vào localStorage theo câu hỏi
  useEffect(() => {
    if (selectedQuestion) {
      const savedCode = localStorage.getItem(`code_${selectedQuestion.id}_${language}`);
      setValue(savedCode || CODE_SNIPPETS[language] || "");
    }
  }, [selectedQuestion, language]);

  useEffect(() => {
    if (selectedQuestion) {
      localStorage.setItem(`code_${selectedQuestion.id}_${language}`, value);
    }
  }, [value, selectedQuestion, language]);

  return (
    <>
      <Box
        bg={headerBg}
        color={textColor}
        p={4}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        boxShadow="lg"
        borderBottomWidth="1px"
        borderColor={borderColor}
      >
        {/* User Info */}
        <HStack>
          <Avatar name={user?.displayName} size="md" bg={accentColor} />
          <VStack align="start">
            <Text fontSize="lg" fontWeight="bold" color={accentColor}>
              {user?.displayName || "Anonymous"}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {user?.email}
            </Text>
          </VStack>
        </HStack>
        {/* Progress */}
        <ColorModeToggle />
        <VStack align="start" spacing={1}>
          <Text fontSize="md" color={accentColor}>
            Progress: {completedQuestions}/{totalQuestions} completed
          </Text>
          <Progress
            value={(completedQuestions / (totalQuestions || 1)) * 100}
            size="sm"
            colorScheme={colorMode === "dark" ? "blue" : "pink"}
            w="200px"
          />
        </VStack>
      </Box>

      <Box display="flex" bg={bgColor} minHeight="100vh">
        {/* Sidebar */}
        <Box
          w="20%"
          borderRightWidth="1px"
          borderColor={borderColor}
          minHeight="100vh"
          bg={headerBg}
        >
          <Text
            fontSize="2.3rem"
            fontWeight="bold"
            mb={4}
            pb={2}
            borderBottomWidth="2px"
            borderColor={borderColor}
            textAlign="center"
            color={textColor}
          >
            Questions
          </Text>
          {questions && questions.length > 0 ? (
            questions.map((question) => {
              const isCompleted = question?.users?.some(
                (userObj) => userObj.uid === user?.uid && userObj.status === true
              );
              return (
                <Button
                  key={question.id}
                  variant="ghost"
                  w="100%"
                  onClick={() => handleQuestionClick(question)}
                  mb={2}
                  justifyContent="flex-start"
                  textAlign="left"
                  whiteSpace="normal"
                  _hover={{ bg: hoverBg }}
                  bg={buttonBg}
                  color={textColor}
                  rightIcon={isCompleted ? <CheckIcon color="green.500" /> : null}
                >
                  {question.title}
                </Button>
              );
            })
          ) : (
            <Text color="gray.500">No questions available</Text>
          )}
        </Box>

        {/* Editor Section */}
        <Box
          w="80%"
          p={4}
          bg={headerBg}
          borderRadius="md"
          boxShadow="xl"
          borderWidth="1px"
          borderColor={borderColor}
          m={4}
        >
          {selectedQuestion ? (
            <Box mb={4} borderBottomWidth="2px" borderColor={accentColor}>
              <Text fontSize="xl" fontWeight="bold" color={accentColor}>
                {selectedQuestion.title}
              </Text>
              <Text
                fontSize="md"
                mt={2}
                p="15px"
                color={textColor}
                dangerouslySetInnerHTML={{ __html: selectedQuestion.question }}
              />
              {/* Hiển thị ngôn ngữ hiện tại */}
              {language && (
                <Text fontSize="md" mt={2} color={accentColor}>
                  Currently coding in: {language}
                </Text>
              )}
            </Box>
          ) : (
            <Text color="gray.500">
              Select a question to view and edit the code
            </Text>
          )}

          <Editor
            options={{ minimap: { enabled: false } }}
            height="50vh"
            theme={editorTheme}
            language={language}
            value={value}
            onMount={onMount}
            onChange={(value) => setValue(value)}
          />

          {/* Input Field */}
          <Box mt={4} mb={2}>
            <Text fontSize="lg" mb={2} color={accentColor}>
              Input
            </Text>
            <Textarea
              placeholder="Enter input for your code..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              size="sm"
              bg={useColorModeValue("gray.100", "gray.700")}
              color={textColor}
              _placeholder={{ color: placeholderColor }}
            />
          </Box>

          {/* Output Component */}
          <Box mt={4}>
            <Text>Output will be displayed here.</Text>
          </Box>
        </Box>
      </Box>

      {/* Submissions & Code Preview Modal */}
      <Box mt={8}>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Lịch sử nộp bài
        </Text>
        {/* Giả sử submissions được xử lý ở đây */}
        <Text>Submission history here</Text>
      </Box>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Mã nguồn đã nộp</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box bg="gray.900" color="white" p={4} borderRadius="md" overflowX="auto">
              <pre>{submissions.code}</pre>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={() => setIsModalOpen(false)}>
              Đóng
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

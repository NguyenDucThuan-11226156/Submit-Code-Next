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
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  useDisclosure,
  Flex,
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
import { CheckIcon, HamburgerIcon } from "@chakra-ui/icons";
import ColorModeToggle from "./ColorModeToggle";
import dayjs from "dayjs";
import app from "../../firebase";
import { CODE_SNIPPETS } from "../../constants";
import Output from "./Output";

export default function CodeEditor() {
  const editorRef = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [value, setValue] = useState("");
  // Ngôn ngữ được lấy từ câu hỏi (do giáo viên tạo)
  const [language, setLanguage] = useState("java");
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
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

  // Disclosure cho Drawer (sidebar)
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();

  // Khi selectedQuestion thay đổi, cập nhật ngôn ngữ và code mẫu (nếu có)
  useEffect(() => {
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

  // Khi chọn câu hỏi từ sidebar
  const handleQuestionClick = (question) => {
    if (question && question.question) {
      setSelectedQuestion(question);
      onDrawerClose(); // Đóng Drawer khi chọn câu hỏi
    }
  };

  // Lấy thông tin người dùng và danh sách câu hỏi real-time
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const db = getFirestore(app);
        const questionsRef = collection(db, "rooms", roomId, "onlineJudge", "contest", "questions");
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

  // Lấy danh sách câu hỏi ban đầu
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
          language: doc.data().language,
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
console.log(selectedSubmission)
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
      {/* Header */}
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
        <HStack>
          <IconButton
            aria-label="Open Sidebar"
            icon={<HamburgerIcon />}
            onClick={onDrawerOpen}
            variant="ghost"
          />
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
        <HStack spacing={4}>
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
        </HStack>
      </Box>

      {/* Drawer Sidebar cho danh sách câu hỏi */}
      <Drawer placement="left" onClose={onDrawerClose} isOpen={isDrawerOpen}>
        <DrawerOverlay />
        <DrawerContent bg={headerBg}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" color={textColor}>
            Questions
          </DrawerHeader>
          <DrawerBody>
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
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <Box display="flex" bg={bgColor} minHeight="100vh" p={4}>
        {/* Phần hiển thị nội dung câu hỏi và Input (bên trái) */}
        <Box flex="1" mr={4}>
          {selectedQuestion ? (
            <Box mb={4} borderBottomWidth="2px" borderColor={accentColor} pb={4}>
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
              {language && (
                <Text fontSize="md" mt={2} color={accentColor}>
                  Currently coding in: {language}
                </Text>
              )}
              <Box mt={4}>
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
            </Box>
          ) : (
            <Text color="gray.500">Select a question to view its details</Text>
          )}
        </Box>

        {/* Phần Editor (bên phải) */}
        <Box flex="1" borderRadius="md" boxShadow="xl" borderWidth="1px" borderColor={borderColor}>
          <Editor
            options={{ minimap: { enabled: false } }}
            height="70vh"
            theme={editorTheme}
            language={language}
            value={value}
            onMount={onMount}
            onChange={(val) => setValue(val)}
          />
          <Box mt={4}>
            <Text>Output will be displayed here.</Text>
            <Output
              roomId={roomId}
              editorRef={editorRef}
              language={language}
              input={input}
              selectedQuestion={selectedQuestion}
            />
          </Box>
        </Box>
      </Box>

      {/* Submissions & Code Preview Modal */}
      <Box mt={8} p={4}>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Lịch sử nộp bài
        </Text>
        <Text>Submission history here</Text>
      </Box>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Mã nguồn đã nộp</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box bg="gray.900" color="white" p={4} borderRadius="md" overflowX="auto">
              <pre>{selectedSubmission?.code}</pre>
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

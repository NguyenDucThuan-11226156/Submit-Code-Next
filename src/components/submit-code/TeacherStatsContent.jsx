"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Spinner,
  Divider,
  Button,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  HStack,
  Center,
} from "@chakra-ui/react";
import { getFirestore, collection, getDocs, getDoc, doc } from "firebase/firestore";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import app from "../../firebase";
import { usePathname } from "next/navigation";
import dayjs from "dayjs";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaChartBar,
  FaInfoCircle,
  FaFileExcel,
  FaExclamation,
} from "react-icons/fa";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import CodePreviewModal from "./CodePreviewModal";
// Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

export default function TeacherStatsContent() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  // Hook cho Modal preview code
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCode, setSelectedCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [listStudents, setListStudents] = useState([]);
  const [language, setLanguage] = useState("java"); // Ngôn ngữ mặc định là Java
  const pathname = usePathname();
  const pathParts = pathname.split("/");
  const roomId = pathParts[1]; // Thay đổi logic này nếu cấu trúc URL khác

  useEffect(() => {
    const fetchQuestions = async () => {
      const db = getFirestore(app);
      const contestCollectionRef = collection(
        db,
        "rooms",
        roomId,
        "onlineJudge",
        "contest",
        "questions"
      );
      const roomDocRef = doc(db, "rooms", roomId);
      try {
        const [questionsSnapshot, roomSnap] = await Promise.all([
          getDocs(contestCollectionRef),
          getDoc(roomDocRef)
        ]);
        const questionsList = questionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          language: doc.data().language,
          users: doc.data().users || [],
        }));
        setQuestions(questionsList);
        if (roomSnap.exists()) {
          const roomData = roomSnap.data();
          console.log("Room data:", roomData);
          setListStudents(roomData.members || []);
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu câu hỏi:", error);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [roomId]);

  if (loading) {
    return <Spinner size="xl" />;
  }
  const exportToExcel = (question) => {
  const worksheet = XLSX.utils.json_to_sheet(
    question.users.map((user, idx) => ({
      "STT": idx + 1,
      "Tên User": user.displayName || "N/A",
      "Email": user.email || "N/A",
      "Số lượng testcases hoàn thành": user.passedTestCases || "N/A",
      "Trạng thái": user.status === "error"
    ? "Lỗi biên dịch"
    : user.status
      ? "Hoàn thành"
      : "Chưa hoàn thành",
      "Thời gian nộp": user.timestamp
        ? dayjs(user.timestamp.toDate()).format("DD/MM/YYYY HH:mm:ss")
        : "N/A",
      "Code": user.code || "N/A"
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Thống kê");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const data = new Blob([excelBuffer], { type: "application/octet-stream" });

  saveAs(data, `${question.title}_statistics.xlsx`);
};
  console.log(language)
  // Dữ liệu cho biểu đồ
  const chartData = {
    labels: questions.map((q) => q.title),
    datasets: [
      {
        label: "Số sinh viên hoàn thành",
        data: questions?.map(
          (q) => q?.users?.filter((user) => user.status === true).length
        ),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#000",
        bodyColor: "#000",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        suggestedMin: 1,
        suggestedMax: 50,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // Hàm mở Modal xem code của sinh viên
  const handlePreviewCode = (code, language) => {
    setLanguage(language);
    setSelectedCode(code);
    onOpen();
  };
 
  const checkCode = async (question) => {
    try {
      setIsChecking(true);
      const response = await fetch("https://fit.neu.edu.vn/codelab/api/save-user-codes", {
        // const response = await fetch("http://localhost:8015/api/save-user-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: roomId,
          questionId: question.id,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      setIsChecking(false);
      window.open(`https://fit.neu.edu.vn/codelab/results/${roomId}/${question.id}/index.html`, "_blank");
      // window.open(`http://localhost:8015/results/${roomId}/${question.id}/index.html`, "_blank");
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu kiểm tra mã:", error);
      alert("Kiểm tra thất bại: " + error.message);
    }
  };
  return (
    <Box
      p={6}
      bg="linear-gradient(to right, #6EE7B7, #3B82F6)"
      borderRadius="md"
      boxShadow="lg"
    >
      <Text fontSize="3xl" fontWeight="bold" mb={4} color="white">
        <Icon as={FaChartBar} mr={2} /> 📊 Thống kê số lượng sinh viên hoàn
        thành bài
      </Text>

      {/* Biểu đồ */}
      <Box
        p={4}
        bg="white"
        borderRadius="md"
        boxShadow="lg"
        maxW="700px"
        mx="auto"
        mb={6}
      >
        <Bar data={chartData} options={chartOptions} height={350} />
      </Box>

      {/* Bảng thống kê chi tiết */}
      {questions.length > 0 ? (
        questions.map((question, index) => {
          const missingStudents = listStudents.filter(
            (student) =>
              !question.users.some((user) => user.email === student.studentCode)
          );
          return (
            <Box
              key={question.id}
              mt={6}
              p={4}
              bg="white"
              borderRadius="md"
              boxShadow="lg"
              mb={6}
            >
              <Text fontSize="xl" fontWeight="bold" mb={2} color="blue.700">
                <Icon as={FaInfoCircle} mr={2} /> {question.title}
              </Text>
              <HStack justify="flex-end" mb={4} spacing={1}>
                <Button
                  leftIcon={<Icon as={FaFileExcel} />}
                  colorScheme="green"
                  size="md"
                  onClick={() => exportToExcel(question)}
                >
                  Xuất Excel
                </Button>
                <Button
                  leftIcon={<Icon as={FaCheckCircle} />}
                  colorScheme="blue"
                  size="md"
                  onClick={() => checkCode(question)}
                >
                  Kiểm tra
                </Button>
              </HStack>
        
              <Table
              color={"black"}
                colorScheme="gray"
                size="sm"
                borderWidth="1px"
                borderCollapse="collapse"
              >
                <Thead>
                  <Tr>
                    {[
                      "STT",
                      "Tên User",
                      "Email",
                      "Số lượng testcases hoàn thành",
                      "Trạng thái",
                      "Thời gian nộp",
                      "Preview Code",
                    ].map((header, idx) => (
                      <Th key={idx} border="1px solid gray" px={6} py={3} textAlign="center">
                        {header}
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {question.users.length > 0 ? (
                    question.users.map((user, idx) => (
                      <Tr
                        key={user.uid}
                        _hover={{ bg: "blue.50" }}
                        sx={{
                          "& td": {
                            border: "1px solid gray",
                            px: 6,
                            py: 3,
                            textAlign: "center",
                          },
                        }}
                      >
                        <Td>{idx + 1}</Td>
                        <Td>{user.displayName || "N/A"}</Td>
                        <Td>{user.email || "N/A"}</Td>
                        <Td>{user.passedTestCases || "N/A"}</Td>
                        <Td>
                        <Icon
                          as={
                            user.status === "error"
                              ? FaExclamation // Icon cảnh báo lỗi biên dịch
                              : user.status
                              ? FaCheckCircle // Icon hoàn thành
                              : FaTimesCircle // Icon chưa hoàn thành
                          }
                          color={
                            user.status === "error"
                              ? "yellow.400" // Màu vàng cho lỗi biên dịch
                              : user.status
                              ? "green.400" // Màu xanh cho hoàn thành
                              : "red.400" // Màu đỏ cho chưa hoàn thành
                          }
                          mr={2}
                        />

                                                  <span 
                          className={
                            user.status === "error"
                              ? "text-red-500"  // Màu đỏ cho lỗi biên dịch
                              : user.status
                              ? "text-green-500" // Màu xanh lá cho hoàn thành
                              : "text-yellow-500" // Màu vàng cho chưa hoàn thành
                          }
                        >
                          {user.status === "error"
                            ? "Lỗi biên dịch"
                            : user.status
                              ? "Hoàn thành"
                              : "Chưa hoàn thành"}
                        </span>
                        </Td>
                        <Td>
                          {user.timestamp
                            ? dayjs(user.timestamp.toDate()).format("DD/MM/YYYY HH:mm:ss")
                            : "N/A"}
                        </Td>
                        <Td>
                          {user.code ? (
                            <Button
                              size="sm"
                              colorScheme="teal"
                              onClick={() => handlePreviewCode(user.code, question.language)}
                            >
                              Preview Code
                            </Button>
                          ) : (
                            "N/A"
                          )}
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={7} textAlign="center" border="1px solid gray" px={6} py={3}>
                        Chưa có ai làm
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
        
              {/* Hiển thị danh sách sinh viên chưa làm bài */}
              {missingStudents.length > 0 ? (
                <Box mt={4} p={2} bg="red.50" borderRadius="md">
                  <Text fontSize="md" color="red.600">
                    Sinh viên chưa làm bài:{" "}
                    {missingStudents.map((student) => student.fullName).join(", ")}
                  </Text>
                </Box>
              ) : (
                <Box mt={4} p={2} bg="green.50" borderRadius="md">
                  <Text fontSize="md" color="green.600">
                    Tất cả sinh viên đều đã làm bài!
                  </Text>
                </Box>
              )}
        
              {index !== questions.length - 1 && <Divider my={6} />}
            </Box>
          );
      })
      ) : (
        <Text fontSize="lg" color="red.500" textAlign="center">
          Không có câu hỏi nào để hiển thị!
        </Text>
      )}

      {/* Modal xem code */}
      <CodePreviewModal
      language={language || "java"} // Ngôn ngữ mặc định là Java
        isOpen={isOpen}
        onClose={onClose}
        selectedCode={selectedCode}
      />
    </Box>
  );
}

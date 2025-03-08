"use client"
import { useState, useEffect } from "react";
import { Box, Button, Text, useToast, HStack, Spacer } from "@chakra-ui/react";
import { executeCode } from "../../api";
import { Flex } from "antd";
import app from "../../firebase";
import { getFirestore, doc, updateDoc, arrayUnion ,setDoc, getDoc, Timestamp} from "firebase/firestore";
import { getAuth } from "firebase/auth";
const db = getFirestore(app);
const auth = getAuth(app); // Lấy thông tin người dùng hiện tại
const Output = ({ editorRef, language, input = "", selectedQuestion,roomId }) => {
  const toast = useToast();
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [testResults, setTestResults] = useState([]); // Kết quả kiểm tra test case
  const [isChecking, setIsChecking] = useState(false); // Trạng thái kiểm tra test case

  // Reset output khi selectedQuestion thay đổi
  useEffect(() => {
    setOutput(null);
    setTestResults([]);
    setIsError(false);
  }, [selectedQuestion]);

  // Hàm để chạy code và hiển thị output
  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;
    try {
      setIsLoading(true);
      const { run: result } = await executeCode(language, sourceCode, input);
      setOutput(result.output.split("\n"));
      result.stderr ? setIsError(true) : setIsError(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "An error occurred.",
        description: error.message || "Unable to run code",
        status: "error",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm để kiểm tra test case của câu hỏi đang chọn
  // Hàm để kiểm tra test case của câu hỏi đang chọn
  const checkTestCases = async () => {
    const sourceCode = editorRef.current.getValue();
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "User not logged in",
        description: "Please log in before checking test cases.",
        status: "warning",
        duration: 4000,
      });
      return;
    }
  
    if (!sourceCode || !selectedQuestion || !selectedQuestion.testCases) {
      toast({
        title: "No question selected or no test cases available.",
        status: "warning",
        duration: 4000,
      });
      return;
    }
  
    setIsChecking(true);
    const results = [];
    let hasCompileError = false;
  
    for (const testCase of selectedQuestion.testCases) {
      try {
        const { run: result } = await executeCode(language, sourceCode, testCase.input);
        const programOutput = result.stdout.trim().split("\n").join("\n");
        const expectedOutput = testCase.expectedOutput.trim();
        const isPass = programOutput === expectedOutput;
        results.push({ input: testCase.input, expectedOutput, programOutput, isPass });
        console.log(result)
        // Kiểm tra xem có lỗi biên dịch không
        if (result.stderr) {
          hasCompileError = true;
        }
      } catch (error) {
        results.push({ input: testCase.input, expectedOutput: "N/A", programOutput: "Error", isPass: false });
        hasCompileError = true;
      }
    }
  
    setTestResults(results);
    setIsChecking(false);
  
    // Xác định `status`
    const passedCount = results.filter((testCase) => testCase.isPass).length;
    const status = hasCompileError
      ? "error"
      : passedCount === selectedQuestion.testCases.length
      ? true
      : false;
  
    // Cập nhật Firestore với `status` mới
    try {
      const questionRef = doc(db, "rooms", roomId, "onlineJudge", "contest", "questions", selectedQuestion.id);
      const questionSnap = await getDoc(questionRef);
      if (questionSnap.exists()) {
        const questionData = questionSnap.data();
        const users = questionData.users || [];
        const existingUserIndex = users.findIndex((u) => u.uid === user.uid);
  
        if (existingUserIndex === -1) {
          await updateDoc(questionRef, {
            users: arrayUnion({
              displayName: user.displayName || "Anonymous",
              uid: user.uid || "Unknown",
              status,
              email: user.email || "Anonymous",
              timestamp: Timestamp.now(),
              code: sourceCode,
              passedTestCases: `${passedCount}/${selectedQuestion.testCases.length}`,
            }),
          });
        } else {
          users[existingUserIndex] = {
            ...users[existingUserIndex],
            status,
            code: sourceCode,
            timestamp: Timestamp.now(),
            passedTestCases: `${passedCount}/${selectedQuestion.testCases.length}`,
          };
          await updateDoc(questionRef, { users });
        }
      } else {
        await setDoc(
          questionRef,
          {
            users: [
              {
                displayName: user.displayName || "Anonymous",
                uid: user.uid || "Unknown",
                status,
                email: user.email || "Anonymous",
                timestamp: Timestamp.now(),
                code: sourceCode,
                passedTestCases: `${passedCount}/${selectedQuestion.testCases.length}`,
              },
            ],
          },
          { merge: true }
        );
      }
  
      toast({
        title: "Success!",
        description: `Your progress has been recorded. Passed ${passedCount} out of ${selectedQuestion.testCases.length} test case(s).`,
        status: "success",
        duration: 4000,
      });
    } catch (error) {
      console.error("Failed to update Firestore:", error);
      toast({
        title: "Error updating progress",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    }
  };
  

  return (
    <Box w="100%">
      <Text mb={2} fontSize="lg">
        Output
      </Text>
      <HStack mb={4} width="100%">
        <Button variant="outline" colorScheme="green" isLoading={isLoading} onClick={runCode}>
          Run Code
        </Button>
        <Button variant="solid" colorScheme="blue" isLoading={isChecking} onClick={checkTestCases}>
          Check Test Cases
        </Button>
        <Spacer />
        <Text fontSize="lg" mb={2}>
          Test Case Results
        </Text>
      </HStack>

      <Flex direction="row" gap="20px">
        {/* Kết quả đầu ra */}
        <Box
          width="50%"
          height="50vh"
          p={2}
          color={isError ? "red.400" : ""}
          border="1px solid"
          borderRadius={4}
          borderColor={isError ? "red.500" : "#333"}
          mb={4}
          style={{ whiteSpace: "pre-wrap" }} // Thêm dòng này
        >
          <Text style={{ whiteSpace: "pre-wrap" }}>
  {output ? output.join("\n") : 'Click "Run Code" to see the output here'}
</Text>
        </Box>

        {/* Kết quả kiểm tra test case */}
        <Box width="50%">
  {testResults.length > 0 ? (
    <Box>
      <Text fontSize="lg" fontWeight="bold" mb={2}>
        Test Case Results
      </Text>
      {testResults.map((testCaseResult, i) => (
        <Box key={i} mb={2} p={2} borderRadius={6} bg={testCaseResult.isPass ? "green.100" : "red.100"}>
          <Text fontWeight="bold" color={testCaseResult.isPass ? "green.500" : "red.500"}>
            Test {i + 1}:{" "}
            <Text as="span" color={testCaseResult.isPass ? "green.500" : "red.500"}>
              {testCaseResult.isPass ? "✅ Pass" : "❌ Fail"}
            </Text>
          </Text>
          {/* <Text fontSize="sm">🔹 Input: {testCaseResult.input}</Text>
          <Text fontSize="sm">✅ Expected: {testCaseResult.expectedOutput}</Text> */}
          {/* <Box>
            <Text fontSize="sm" color={testCaseResult.isPass ? "green.500" : "red.500"}>📌 Output:</Text>
            {testCaseResult.programOutput.split("\n").map((line, index) => (
              <Text key={index} fontSize="sm" color={"black"}>
                {line}
              </Text>
            ))}
          </Box> */}
        </Box>
      ))}
    </Box>
  ) : (
    <Text>Click "Check Test Cases" to see the results</Text>
  )}
</Box>

      </Flex>
    </Box>
  );
};

export default Output;

// CodePreviewModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Box,
  Button,
  Text,
  Spinner,
  useToast,
  Textarea,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { executeCode } from "@/api"; // Điều chỉnh đường dẫn nếu cần

const CodePreviewModal = ({
  isOpen,
  onClose,
  selectedCode,
  language = "java",
  initialInput = "", // đặt tên là initialInput để khởi tạo trạng thái input
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [runOutput, setRunOutput] = useState([]);
  const [isError, setIsError] = useState(false);
  const [customInput, setCustomInput] = useState(initialInput);
  const toast = useToast();

  // Nếu initialInput thay đổi, cập nhật customInput
  useEffect(() => {
    setCustomInput(initialInput);
  }, [initialInput]);

  const handleRunCode = async () => {
    const sourceCode = selectedCode;
    if (!sourceCode) return;
    try {
      setIsRunning(true);
      // Gọi API executeCode sử dụng customInput từ ô nhập liệu
      const { run: result } = await executeCode(language, sourceCode, customInput);
      // Tách kết quả output thành các dòng
      setRunOutput(result.output.split("\n"));
      result.stderr ? setIsError(true) : setIsError(false);
      toast({
        title: "Code executed successfully",
        description: "Please see the output below.",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "An error occurred.",
        description: error.message || "Unable to run code",
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(selectedCode);
      toast({
        title: "Code copied",
        description: "The code has been copied to clipboard.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Copy failed",
        description: error.message || "Could not copy the code.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent
        borderRadius="lg"
        boxShadow="2xl"
        border="2px solid"
        borderColor="blue.200"
        overflow="hidden"
      >
        <ModalHeader
          bg="blue.500"
          color="white"
          fontSize="2xl"
          textAlign="center"
          py={4}
        >
          Code Preview
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody bg="gray.50" p={6}>
          {/* Hiển thị code */}
          <Box
            as="pre"
            p={4}
            bg="gray.200"  // Màu nền sáng hơn cho code
            borderRadius="md"
            border="1px solid"
            borderColor="gray.400"
            overflowX="auto"
            whiteSpace="pre-wrap"
            wordBreak="break-word"
            fontFamily="monospace"
            fontSize="md"
            color="black"   // Đặt màu chữ đậm
          >
            {selectedCode}
          </Box>

          {/* Ô nhập input cho code */}
          <FormControl mt={4}>
            <FormLabel fontWeight="bold" color="gray.700">
              Input cho code
            </FormLabel>
            <Textarea
              placeholder="Nhập input cho code..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              resize="vertical"
              bg="gray.200"
              borderColor="gray.400"
              color="black"
            />
          </FormControl>

          {isRunning && (
            <Box mt={4} display="flex" alignItems="center">
              <Spinner mr={2} />
              <Text>Running code...</Text>
            </Box>
          )}
          {/* Hiển thị output */}
          {runOutput.length > 0 && (
            <Box
              mt={4}
              p={4}
              bg="gray.200"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.400"
            >
              <Text fontWeight="bold" mb={2} color="gray.700">
                Output:
              </Text>
              <Box
                as="pre"
                whiteSpace="pre-wrap"
                fontFamily="monospace"
                color="black"
              >
                {runOutput.join("\n")}
              </Box>
            </Box>
          )}
          {isError && (
            <Text mt={2} color="red.500">
              There was an error during code execution.
            </Text>
          )}
        </ModalBody>
        <ModalFooter bg="gray.50" justifyContent="center" py={4}>
          <Button
            onClick={handleRunCode}
            colorScheme="blue"
            mr={3}
            isLoading={isRunning}
          >
            Run Code
          </Button>
          <Button onClick={handleCopyCode} colorScheme="teal" mr={3}>
            Copy Code
          </Button>
          <Button onClick={onClose} colorScheme="gray">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CodePreviewModal;

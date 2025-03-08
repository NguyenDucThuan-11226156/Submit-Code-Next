"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Input,
  Button,
  Text,
  VStack,
  ChakraProvider,
  theme,
} from "@chakra-ui/react";
import { FaLock } from "react-icons/fa";
import TeacherStatsContent from "./TeacherStatsContent";

export default function TeacherStats() {
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Delay render cho đến khi component được mount trên client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Kiểm tra trạng thái từ localStorage (chỉ chạy trên client)
  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      if (password === "@smartdoc") {
        setIsAuthenticated(true);
        localStorage.setItem("isAuthenticated", "true");
      } else {
        alert("Sai mật khẩu! Vui lòng thử lại.");
        setPassword("");
      }
      setLoading(false);
    }, 1000);
  };

  // Nếu component chưa được mount, trả về null để tránh hydration mismatch
  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.900"
      >
        <VStack
          p={6}
          bg="gray.800"
          borderRadius="lg"
          boxShadow="xl"
          spacing={4}
          maxW="400px"
          w="full"
        >
          <FaLock size={50} color="cyan" />
          <Text fontSize="xl" fontWeight="bold" color="white">
            Nhập mật khẩu để truy cập
          </Text>
          <Input
            type="password"
            placeholder="Nhập mật khẩu..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            textAlign="center"
            bg="gray.700"
            color="white"
            border="1px solid gray"
            _placeholder={{ color: "gray.400" }}
            _focus={{ borderColor: "cyan.400" }}
          />
          <Button
            colorScheme="cyan"
            onClick={handleLogin}
            isLoading={loading}
            isDisabled={!password}
            w="full"
          >
            Xác nhận
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
      <TeacherStatsContent />
  );
}

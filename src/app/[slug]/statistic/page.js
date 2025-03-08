'use client';
import { ChakraProvider } from "@chakra-ui/react";
import TeacherStats from "@/components/codelab/Statistic";
import theme from "@/theme";

export default function Page({}) {
  return <ChakraProvider theme={theme}><TeacherStats /></ChakraProvider>;
}

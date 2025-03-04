import axios from "axios";
import { LANGUAGE_VERSIONS } from "./constants";

const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
  headers: {
    "Content-Type": "application/json; charset=UTF-8",
  },
});

export const executeCode = async (language, sourceCode, input = "a") => {
  const response = await API.post("/execute", {
    language: language,
    version: LANGUAGE_VERSIONS[language],
    files: [
      {
        content: sourceCode,
        encoding: "utf8", // Đảm bảo file được xử lý bằng UTF-8
      },
    ],
    stdin: input,
  });
  return response.data;
};

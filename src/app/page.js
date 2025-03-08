"use client";
import React, { useEffect, useState } from "react";
import { Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";

const weeks = Array.from({ length: 15 }, (_, i) => `Tuần ${i + 1}`);

const HardworkingTable = () => {
  const [students, setStudents] = useState({});

  useEffect(() => {
    fetch("http://localhost:5000/api/hardworking")
      .then((res) => res.json())
      .then((apiData) => {
        const studentData = {};
  
        // Xử lý dữ liệu từ API
        Object.entries(apiData).forEach(([week, weekData], index) => {
          Object.entries(weekData).forEach(([name, details]) => {
            if (!studentData[name]) {
              studentData[name] = {};
            }
            studentData[name][`Tuần ${index + 1}`] = details.hardworking_score;
          });
        });

        // Đảm bảo mỗi sinh viên có đủ 15 tuần và tính tổng điểm
        // Đảm bảo mỗi sinh viên có đủ 15 tuần
        Object.keys(studentData).forEach((name) => {
          let totalScore = 0;

          weeks.forEach((week) => {
            if (studentData[name][week] === undefined) {
              studentData[name][week] = 0;  // Mặc định là 0 nếu chưa có dữ liệu
            }
            totalScore += studentData[name][week];  // Cộng dồn vào tổng
          });

          studentData[name]["score"] = totalScore;  // Lưu tổng vào dữ liệu
        });
        console.log(studentData)
        setStudents(studentData);
      });
  }, []);
  // console.log(students)
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol>
          <li>
            Get started by editing <code>src/app/page.js</code>.
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
};

// 🔹 Styles
const headerStyle = {
  color: "#fff",
  fontWeight: "bold",
  textAlign: "center",
  padding: "12px",
  border: "1px solid #ddd",
};

const cellStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "center",
};

const rowStyle = {
  even: { backgroundColor: "#f9f9f9", transition: "background 0.3s" },
  odd: { backgroundColor: "#ffffff", transition: "background 0.3s" },
};

// 🔥 Hàm đổi màu cột "Tổng" dựa trên điểm
const getColor = (score) => {
  if (score >= 80) return "#2E7D32"; // Xanh lá đậm
  if (score >= 50) return "#FBC02D"; // Vàng
  return "#D32F2F"; // Đỏ
};

export default HardworkingTable;

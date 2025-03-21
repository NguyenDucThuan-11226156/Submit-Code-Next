"use client";
import React, { useEffect, useState } from "react";
import { Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import { usePathname, useSearchParams } from "next/navigation";
import StatisticQuiz from "@/components/codelab/StatisticQuiz";
import { getDatabase, ref, get } from "firebase/database";
import app from "@/firebase";

const weeks = Array.from({ length: 15 }, (_, i) => `Tuần ${i + 1}`);

const HardworkingTable = () => {
    const [students, setStudents] = useState({});
    const [quizzes, setQuizzes] = useState([]);
    const searchParams = useSearchParams();
    const chap = searchParams.get("chap");

    const pathName = usePathname();
    const roomID = pathName.split("/")[2];
    const docID = searchParams.get("docID");
    // Parse dữ liệu room từ string JSON
    useEffect(() => {
      if (!docID || !roomID) {
        console.warn("docID hoặc roomID không hợp lệ:", { docID, roomID });
        return; 
      }
  
      const db = getDatabase(app);
      const link = chap ? `/chap${chap}` : "";
      const cleanDocID = docID?.replace(/['"]+/g, "").replace(/\./g, "");
      const quizPath = `/labs/${cleanDocID}/${roomID}${link}/quiz`;
      
      console.log("Đang fetch từ đường dẫn:", quizPath);
  
      const fetchQuizzes = async () => {
        try {
          const quizRef = ref(db, quizPath);
          const snapshot = await get(quizRef);
          if (snapshot.exists()) {
            console.log("Lấy quiz thành công:", snapshot.val());
            setQuizzes(Object.values(snapshot.val())); // Chuyển dữ liệu thành mảng
          } else {
            console.log("Không có quiz nào.");
          }
        } catch (error) {
          console.error("Lỗi khi lấy quiz:", error);
        }
      };
  
      fetchQuizzes();
    }, [docID, roomID, chap, app]); // Đảm bảo fetch lại khi docID hoặc roomID thay đổi
  useEffect(() => {
    fetch("https://fit.neu.edu.vn/codelab1/api/hardworking2?roomID=" + roomID)
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
        setStudents(studentData);
      });
  }, []);

  return (
    <div style={{ overflowX: "auto", padding: "20px" }}>
      <Table
        style={{
          backgroundColor: "#fff",
          borderRadius: "10px",
          borderCollapse: "collapse",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* HEADER */}
        <TableHead>
          <TableRow style={{ backgroundColor: "#1976D2" }}>
            <TableCell style={headerStyle}>Họ và tên</TableCell>
            {weeks.map((week) => (
              <TableCell key={week} align="center" style={headerStyle}>
                {week}
              </TableCell>
            ))}
            <TableCell align="center" style={headerStyle}>Tổng</TableCell>
          </TableRow>
        </TableHead>

        {/* BODY */}
        <TableBody>
          {Object.entries(students).map(([name, scores], index) => {
            // console.log(scores);
            return (
              <TableRow key={name} style={index % 2 === 0 ? rowStyle.even : rowStyle.odd}>
                <TableCell style={cellStyle}>{name}</TableCell>
                {weeks.map((week) => (
                  <TableCell key={week} align="center" style={cellStyle}>
                    {scores[week] ? (
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          backgroundColor: `rgba(25, 118, 210, ${scores[week] / 100})`, // Màu xanh MUI
                          display: "inline-block",
                          transition: "transform 0.2s ease-in-out",
                        }}
                        className="score-dot"
                      />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                ))}
                {/* Cột Tổng - Dùng màu gradient thể hiện điểm */}
                <TableCell align="center" style={{ ...cellStyle, fontWeight: "bold", color: getColor(scores["score"]) }}>
                  {scores["score"]}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* CSS cho hover */}
      <style jsx>{`
        .score-dot:hover {
          transform: scale(1.3);
        }
      `}</style>
      <hr />
      <StatisticQuiz quizzes={quizzes}></StatisticQuiz>
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

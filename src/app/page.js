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

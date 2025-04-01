import React from "react";
import { BarChart } from "@mui/x-charts";

const StatisticQuiz = ({ quizzes }) => {
  if (!quizzes || quizzes.length === 0) {
    return <p>Không có dữ liệu quiz.</p>;
  }

  const studentQuizCount = {};
  quizzes.forEach((quiz) => {
    Object.entries(quiz).forEach(([uid, data]) => {
      const studentName = data.name || `Sinh viên ${uid}`;
      studentQuizCount[studentName] = (studentQuizCount[studentName] || 0) + 1;
    });
  });

  const names = Object.keys(studentQuizCount);
  const quizCounts = Object.values(studentQuizCount);

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <h3 style={{ textAlign: "center" }}>Số lượng Quiz đã làm của Sinh viên</h3>
      <BarChart
        xAxis={[
          {
            scaleType: "band",
            data: names,
            tickLabelStyle: { fontSize: 10, angle: -45, textAnchor: "end" }, 
          },
        ]}
        series={[{ data: quizCounts, label: "Số Quiz" }]}
        width={Math.max(1000, names.length * 30)} 
        height={400}
        margin={{ top: 20, right: 30, bottom: 80, left: 40 }} 
      />
    </div>
  );
};

export default StatisticQuiz;

import { useState } from "react";
import { getPastPerformance } from "../api/api";

export default function PastPerformance() {
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [examType, setExamType] = useState("");
  const [result, setResult] = useState<any>(null);

  return (
    <div>
      <h2>Past Performance</h2>
      <input
        placeholder="Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
      />
      <input
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <input
        placeholder="Topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      <input
        placeholder="Exam Type"
        value={examType}
        onChange={(e) => setExamType(e.target.value)}
      />
      <button
        onClick={() =>
          getPastPerformance(studentId, subject, topic, examType).then(
            setResult
          )
        }
      >
        Fetch
      </button>
      {result && <div>Past Performance: {result.pastPerformance}</div>}
    </div>
  );
}

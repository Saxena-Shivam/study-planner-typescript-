import { useState } from "react";
import { getExams } from "../api/api";

export default function Exams() {
  const [classNum, setClassNum] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  return (
    <div>
      <h2>Exams</h2>
      <input
        placeholder="Class Number"
        value={classNum}
        onChange={(e) => setClassNum(e.target.value)}
      />
      <button onClick={() => getExams(Number(classNum)).then(setExams)}>
        Fetch Exams
      </button>
      <ul>
        {exams.map((e, i) => (
          <li key={i}>
            {e.exam_type} - {e.subject_code}
          </li>
        ))}
      </ul>
    </div>
  );
}

import { useState } from "react";
import { getChapters } from "../api/api";

export default function Chapters() {
  const [classNum, setClassNum] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [chapters, setChapters] = useState<any>({});
  return (
    <div>
      <h2>Chapters</h2>
      <input
        placeholder="Class"
        value={classNum}
        onChange={(e) => setClassNum(e.target.value)}
      />
      <input
        placeholder="Subject Code"
        value={subjectCode}
        onChange={(e) => setSubjectCode(e.target.value)}
      />
      <button
        onClick={() =>
          getChapters(Number(classNum), subjectCode).then(setChapters)
        }
      >
        Fetch Chapters
      </button>
      <ul>
        {Object.entries(chapters).map(([name, info]) => (
          <li key={name}>
            {name}: Weightage {info.weightage}, Difficulty {info.difficulty}
          </li>
        ))}
      </ul>
    </div>
  );
}

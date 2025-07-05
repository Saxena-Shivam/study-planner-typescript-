import { useState } from "react";
import { generateStudyPlan } from "../api/api";

export default function StudyPlan() {
  const [body, setBody] = useState(
    `{
  "subjectsInExam": [
    { "subject_code": "ma", "syllabus": ["Linear Equations", "Mensuration"] }
  ],
  "student": {
    "student_id": "S001",
    "name": "Alice",
    "roll_number": "12"
  },
  "classNum": 8,
  "totalHours": 20,
  "selectedExamType": "term2"
}`
  );
  const [result, setResult] = useState<any>(null);

  return (
    <div>
      <h2>Generate Study Plan</h2>
      <textarea
        rows={10}
        cols={50}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <br />
      <button
        onClick={() => generateStudyPlan(JSON.parse(body)).then(setResult)}
      >
        Generate
      </button>
      <pre>{result && JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

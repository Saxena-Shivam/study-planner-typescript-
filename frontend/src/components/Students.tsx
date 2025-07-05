import { useEffect, useState } from "react";
import { getStudents } from "../api/api";

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  useEffect(() => {
    getStudents().then(setStudents);
  }, []);
  return (
    <div>
      <h2>Students</h2>
      <ul>
        {students.map((s) => (
          <li key={s.student_id}>
            {s.name} (ID: {s.student_id}, Roll: {s.roll_number})
          </li>
        ))}
      </ul>
    </div>
  );
}

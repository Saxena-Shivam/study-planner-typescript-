import { useEffect, useState } from "react";
import { getStudents, getExams, generateStudyPlan } from "./api/api";
import { generateDaywiseSchedule } from "./utils/schedule";
import { downloadStudyPlanPDF, downloadDaywisePDF } from "./utils/pdf";

interface Student {
  student_id: string;
  name: string;
  class: number;
  roll_number: string;
}

interface Exam {
  exam_type: string;
  subject_code: string;
  syllabus: string[];
}

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamType, setSelectedExamType] = useState<string>("");
  const [daysLeft, setDaysLeft] = useState(10);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [daywise, setDaywise] = useState<any[]>([]);

  // Fetch students on mount
  useEffect(() => {
    getStudents().then(setStudents);
  }, []);

  // Fetch exams when student changes
  useEffect(() => {
    if (selectedStudent) {
      getExams(selectedStudent.class).then(setExams);
      setSelectedExamType("");
      setStudyPlan(null);
      setDaywise([]);
    }
  }, [selectedStudent]);

  // Group exams by exam_type
  const examTypeToSubjects: Record<
    string,
    { subject_code: string; syllabus: string[] }[]
  > = {};
  exams.forEach((e) => {
    if (!examTypeToSubjects[e.exam_type]) examTypeToSubjects[e.exam_type] = [];
    examTypeToSubjects[e.exam_type].push({
      subject_code: e.subject_code,
      syllabus: e.syllabus,
    });
  });
  const examTypeLabels = Object.keys(examTypeToSubjects).map((et) =>
    et.replace("_", " ").toUpperCase()
  );

  const examTypeKeys = Object.keys(examTypeToSubjects);
  const selectedExamTypeKey =
    examTypeKeys[examTypeLabels.indexOf(selectedExamType)] || examTypeKeys[0];
  const subjectsInExam = examTypeToSubjects[selectedExamTypeKey] || [];

  const handleGenerate = async () => {
    if (!selectedStudent || !selectedExamTypeKey) return;
    const totalHours = daysLeft * hoursPerDay;
    const data = {
      subjectsInExam,
      student: {
        student_id: selectedStudent.student_id,
        name: selectedStudent.name,
        roll_number: selectedStudent.roll_number,
      },
      classNum: selectedStudent.class,
      totalHours,
      selectedExamType: selectedExamTypeKey,
    };
    const result = await generateStudyPlan(data);
    setStudyPlan(result.allSubjectPlans || result);
    setDaywise(
      generateDaywiseSchedule(
        result.allSubjectPlans || result,
        daysLeft,
        hoursPerDay
      )
    );
  };

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
        color: "#fff",
        background: "#181824",
        padding: 32,
        borderRadius: 12,
      }}
    >
      <h1 style={{ textAlign: "center" }}>📚 Personalized Study Planner</h1>
      {/* Student selection */}
      <div style={{ margin: "16px 0" }}>
        <label>Select Student</label>
        <select
          style={{ width: "100%", padding: 8, marginTop: 4 }}
          value={selectedStudent?.student_id || ""}
          onChange={(e) => {
            const s = students.find((stu) => stu.student_id === e.target.value);
            setSelectedStudent(s || null);
          }}
        >
          <option value="">-- Select --</option>
          {students.map((s) => (
            <option key={s.student_id} value={s.student_id}>
              {s.name} (Class {s.class}, Roll {s.roll_number})
            </option>
          ))}
        </select>
      </div>
      {/* Exam selection */}
      {selectedStudent && (
        <div style={{ margin: "16px 0" }}>
          <label>Select Exam</label>
          <select
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value)}
          >
            <option value="">-- Select --</option>
            {examTypeLabels.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>
        </div>
      )}
      {/* Days and hours */}
      {selectedExamType && (
        <>
          <div style={{ margin: "16px 0" }}>
            <label>Days Left Until Exam</label>
            <input
              type="number"
              min={1}
              max={60}
              value={daysLeft}
              onChange={(e) => setDaysLeft(Number(e.target.value))}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </div>
          <div style={{ margin: "16px 0" }}>
            <label>Study Hours Per Day</label>
            <input
              type="number"
              min={1}
              max={12}
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </div>
          <button
            style={{
              width: "100%",
              padding: 12,
              background: "#4f8cff",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: "bold",
            }}
            onClick={handleGenerate}
          >
            Generate Study Plan
          </button>
        </>
      )}
      {/* Study Plan Display */}
      {studyPlan && (
        <div style={{ marginTop: 32 }}>
          <h2>Study Plan</h2>
          <button
            style={{
              marginBottom: 16,
              background: "#2ecc40",
              color: "#fff",
              padding: "8px 16px",
              border: "none",
              borderRadius: 4,
            }}
            onClick={() =>
              downloadStudyPlanPDF(
                selectedStudent,
                selectedExamType,
                daysLeft,
                hoursPerDay,
                daysLeft * hoursPerDay,
                studyPlan
              )
            }
          >
            Download Study Plan PDF
          </button>
          {studyPlan.map((subj: any) => (
            <div key={subj.subject} style={{ marginBottom: 24 }}>
              <h3>{subj.subject}</h3>
              <table
                style={{
                  width: "100%",
                  background: "#222",
                  color: "#fff",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th>Chapter</th>
                    <th>Weightage</th>
                    <th>Difficulty</th>
                    <th>Past Perf.</th>
                    <th>Learning</th>
                    <th>Rev1</th>
                    <th>Rev2</th>
                  </tr>
                </thead>
                <tbody>
                  {subj.plan.map((p: any) => (
                    <tr key={p.chapter}>
                      <td>{p.chapter}</td>
                      <td>{p.weightage}</td>
                      <td>{p.difficulty}</td>
                      <td>{p.past_performance}</td>
                      <td>{p.learning_hours}</td>
                      <td>{p.revision1_hours}</td>
                      <td>{p.revision2_hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      {/* Daywise Schedule */}
      {daywise.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2>Day-wise Study & Revision Schedule</h2>
          <button
            style={{
              marginBottom: 16,
              background: "#2ecc40",
              color: "#fff",
              padding: "8px 16px",
              border: "none",
              borderRadius: 4,
            }}
            onClick={() =>
              downloadDaywisePDF(
                selectedStudent,
                selectedExamType,
                daysLeft,
                hoursPerDay,
                daywise
              )
            }
          >
            Download Day-wise Schedule PDF
          </button>
          {daywise.map((day, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <strong>Day {day.day}</strong>
              <ul>
                {day.tasks.map((task: any, i: number) => (
                  <li key={i}>
                    {task.phase}: {task.subject} | {task.chapter} | {task.hours}{" "}
                    hrs
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

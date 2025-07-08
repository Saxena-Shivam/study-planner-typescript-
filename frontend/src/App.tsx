import { useEffect, useState } from "react";
import { getStudents, getExams, generateStudyPlan } from "./api/api";
import { generateDaywiseSchedule } from "./utils/schedule";
import { downloadStudyPlanPDF, downloadDaywisePDF } from "./utils/pdf";
import toast, { Toaster } from "react-hot-toast";

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

const SCHOOL_NAME = "Green Valley Public School";

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamType, setSelectedExamType] = useState<string>("");
  const [daysLeft, setDaysLeft] = useState(10);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [daywise, setDaywise] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getStudents().then(setStudents);
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      getExams(selectedStudent.class).then(setExams);
      setSelectedExamType("");
      setStudyPlan(null);
      setDaywise([]);
      setShowDetails(false);
    }
  }, [selectedStudent]);

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

  // Warn if hoursPerDay > 16
  const handleHoursChange = (val: number) => {
    if (val > 16) {
      toast.error("You cannot study more than 16 hours per day!");
      setHoursPerDay(16);
    } else {
      setHoursPerDay(val);
    }
  };
  const handleDaysChange = (val: number) => {
    if (val > 60) {
      toast.error("You cannot plan for more than 60 days!");
      setDaysLeft(60);
    } else {
      setDaysLeft(val);
    }
  };
  const handleGenerate = async () => {
    if (!selectedStudent || !selectedExamTypeKey) return;
    if (hoursPerDay > 16) {
      toast.error("You cannot study more than 16 hours per day!");
      return;
    }
    if (daysLeft > 60) {
      toast.error("You cannot plan for more than 60 days!");
      return;
    }
    setLoading(true);
    setShowDetails(false);
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
    try {
      const result = await generateStudyPlan(data);
      setStudyPlan(result.allSubjectPlans || result);
      setDaywise(
        generateDaywiseSchedule(
          result.allSubjectPlans || result,
          daysLeft,
          hoursPerDay
        )
      );
      toast.success("Study plan generated!");
    } catch (err) {
      toast.error("Failed to generate study plan.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-blue-300">
      <Toaster position="top-center" reverseOrder={false} />
      {/* Navbar */}
      <nav className="bg-blue-900 text-white px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 shadow">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <img
            src="https://img.icons8.com/color/48/000000/school-building.png"
            alt="School"
            className="h-10"
          />
          <span className="text-2xl font-bold tracking-wide">
            {SCHOOL_NAME}
          </span>
        </div>
        {selectedStudent && (
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6 w-full md:w-auto md:justify-end">
            <span className="font-semibold">{selectedStudent.name}</span>
            <span className="text-sm bg-blue-800 px-3 py-1 rounded">
              Class {selectedStudent.class}
            </span>
            <span className="text-sm bg-blue-800 px-3 py-1 rounded">
              Roll {selectedStudent.roll_number}
            </span>
            <span className="text-xs text-blue-200 ml-0 md:ml-2">
              ID: {selectedStudent.student_id}
            </span>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start py-8 px-2 w-full">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-8 text-center">
            Personalized Study Planner
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block font-semibold text-blue-700 mb-1">
                Select Student
              </label>
              <select
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={selectedStudent?.student_id || ""}
                onChange={(e) => {
                  const s = students.find(
                    (stu) => stu.student_id === e.target.value
                  );
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
            <div>
              <label className="block font-semibold text-blue-700 mb-1">
                Select Exam
              </label>
              <select
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                disabled={!selectedStudent}
              >
                <option value="">-- Select --</option>
                {examTypeLabels.map((et) => (
                  <option key={et} value={et}>
                    {et}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-blue-700 mb-1">
                Days Left Until Exam
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={daysLeft}
                onChange={(e) => handleDaysChange(Number(e.target.value))}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={!selectedExamType}
              />
            </div>
            <div>
              <label className="block font-semibold text-blue-700 mb-1">
                Study Hours Per Day
              </label>
              <input
                type="number"
                min={1}
                max={16}
                value={hoursPerDay}
                onChange={(e) => handleHoursChange(Number(e.target.value))}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={!selectedExamType}
              />
            </div>
          </div>
          <button
            className="w-full mt-4 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg transition"
            onClick={handleGenerate}
            disabled={!selectedExamType || loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
                Generating...
              </span>
            ) : (
              "Generate Study Plan"
            )}
          </button>

          {/* Daywise Schedule */}
          {daywise.length > 0 && (
            <div className="mt-10">
              <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-blue-800">
                  Day-wise Study & Revision Schedule
                </h2>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
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
                  Download PDF
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {daywise.map((day, idx) => (
                  <div key={idx} className="bg-blue-50 rounded p-3 shadow">
                    <strong className="text-blue-700">Day {day.day}</strong>
                    <ul className="list-disc ml-6">
                      {day.tasks.map((task: any, i: number) => (
                        <li key={i} className="text-blue-900">
                          {task.phase}: {task.subject} | {task.chapter} |{" "}
                          {task.hours} hrs
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {/* Show/Hide Details Button */}
              <div className="mt-8 text-center">
                <p className="text-blue-700 mb-2">
                  Want to see the detailed chapter-wise plan and stats? Click
                  below!
                </p>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow"
                  onClick={() => setShowDetails((prev) => !prev)}
                >
                  {showDetails ? "Hide Details" : "Show Details"}
                </button>
              </div>
            </div>
          )}

          {/* Study Plan Details (hidden by default) */}
          {showDetails && studyPlan && (
            <div className="mt-10">
              <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-blue-800">
                  Detailed Study Plan
                </h2>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
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
                  Download PDF
                </button>
              </div>
              {studyPlan.map((subj: any) => (
                <div key={subj.subject} className="mb-6">
                  <h3 className="font-semibold text-blue-700">
                    {subj.subject}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border rounded shadow">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="px-2 py-1">Chapter</th>
                          <th className="px-2 py-1">Weightage</th>
                          <th className="px-2 py-1">Difficulty</th>
                          <th className="px-2 py-1">Past Perf.</th>
                          <th className="px-2 py-1">Learning</th>
                          <th className="px-2 py-1">Rev1</th>
                          <th className="px-2 py-1">Rev2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subj.plan.map((p: any) => (
                          <tr key={p.chapter}>
                            <td className="border px-2 py-1">{p.chapter}</td>
                            <td className="border px-2 py-1">{p.weightage}</td>
                            <td className="border px-2 py-1">{p.difficulty}</td>
                            <td className="border px-2 py-1">
                              {p.past_performance}
                            </td>
                            <td className="border px-2 py-1">
                              {p.learning_hours}
                            </td>
                            <td className="border px-2 py-1">
                              {p.revision1_hours}
                            </td>
                            <td className="border px-2 py-1">
                              {p.revision2_hours}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {/* Footer */}
      <footer className="bg-blue-900 text-blue-100 text-center py-4 mt-8">
        © {new Date().getFullYear()} {SCHOOL_NAME} | Powered by Study Planner
        Portal
      </footer>
    </div>
  );
}

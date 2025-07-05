const BASE_URL = "https://study-planner-typescript.onrender.com/api";

export async function getStudents() {
  const res = await fetch(`${BASE_URL}/students`);
  return res.json();
}

export async function getExams(classNum: number) {
  const res = await fetch(`${BASE_URL}/exams/${classNum}`);
  return res.json();
}

export async function generateStudyPlan(data: any) {
  const res = await fetch(`${BASE_URL}/generate-study-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

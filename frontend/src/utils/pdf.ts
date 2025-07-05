import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadStudyPlanPDF(
  student: any,
  examType: string,
  daysLeft: number,
  hoursPerDay: number,
  totalHours: number,
  allSubjectPlans: any[]
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Personalized Study Plan", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.text(
    `Student: ${student.name} (Class ${student.class}, Roll ${student.roll_number})`,
    10,
    25
  );
  doc.text(`Exam: ${examType}`, 10, 32);
  doc.text(
    `Days Left: ${daysLeft} | Hours/Day: ${hoursPerDay} | Total Hours: ${totalHours}`,
    10,
    39
  );

  let y = 45;
  allSubjectPlans.forEach((subj: any) => {
    doc.setFontSize(13);
    doc.text(`Subject: ${subj.subject}`, 10, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [
        [
          "Chapter",
          "Weight",
          "Difficulty",
          "Past Perf.",
          "Learning",
          "Rev1",
          "Rev2",
        ],
      ],
      body: subj.plan.map((p: any) => [
        p.chapter,
        p.weightage,
        p.difficulty,
        p.past_performance,
        p.learning_hours,
        p.revision1_hours,
        p.revision2_hours,
      ]),
      theme: "grid",
      styles: { fontSize: 10 },
      margin: { left: 10, right: 10 },
    });
    y = doc.lastAutoTable.finalY + 8;
  });

  doc.save(`study_plan_${student.name}_${examType}.pdf`);
}

export function downloadDaywisePDF(
  student: any,
  examType: string,
  daysLeft: number,
  hoursPerDay: number,
  schedule: any[]
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Day-wise Study & Revision Schedule", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.text(
    `Student: ${student.name} (Class ${student.class}, Roll ${student.roll_number})`,
    10,
    25
  );
  doc.text(`Exam: ${examType}`, 10, 32);
  doc.text(`Days Left: ${daysLeft} | Hours/Day: ${hoursPerDay}`, 10, 39);

  let y = 45;
  schedule.forEach((day: any) => {
    doc.setFontSize(12);
    doc.text(`Day ${day.day}`, 10, y);
    y += 6;
    doc.setFontSize(10);
    day.tasks.forEach((task: any) => {
      if (task.hours > 0) {
        doc.text(
          `- ${task.phase}: ${task.subject} | ${task.chapter} | ${task.hours} hrs`,
          12,
          y
        );
        y += 5;
      }
    });
    y += 3;
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
  });

  doc.save(`daywise_schedule_${student.name}_${examType}.pdf`);
}

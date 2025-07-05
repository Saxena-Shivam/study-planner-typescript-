import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

const router: Router = Router();

// Helper to get a collection from a specific database
function getCollection(dbName: string, collectionName: string) {
  return mongoose.connection.useDb(dbName).collection(collectionName);
}

// Interface for chapter information
interface ChapterInfo {
  weightage: number;
  difficulty: number;
}

// Interface for exam data
interface ExamData {
  exam_type: string;
  subject: string;
  topic_scores?: Array<{
    topic: string;
    marks_obtained: number;
    max_marks: number;
  }>;
}

// Interface for student document
interface StudentDocument extends mongoose.Document {
  student_id: string;
  name: string;
  roll_number: string;
  exams?: ExamData[];
}

// Get all students
router.get(
  "/students",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const students = await getCollection("Students", "students")
        .find({}, { projection: { _id: 0 } })
        .toArray();
      res.json(students);
    } catch (error) {
      next(error);
    }
  }
);

// Get all exams for a class
router.get(
  "/exams/:classNum",
  async (
    req: Request<{ classNum: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const classNum = parseInt(req.params.classNum, 10);
      if (isNaN(classNum)) {
        return res.status(400).json({ error: "Invalid class number" });
      }

      const exams = await getCollection("Academic", "exams")
        .find(
          { class: classNum },
          { projection: { _id: 0, exam_type: 1, subject_code: 1, syllabus: 1 } }
        )
        .toArray();
      res.json(exams);
    } catch (error) {
      next(error);
    }
  }
);

// Get chapters info for a class and subject
router.get(
  "/chapters/:classNum/:subjectCode",
  async (
    req: Request<{ classNum: string; subjectCode: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { classNum, subjectCode } = req.params;
      const classNumber = parseInt(classNum, 10);
      if (isNaN(classNumber)) {
        return res.status(400).json({ error: "Invalid class number" });
      }

      const doc = await getCollection("Academic", "chapters").findOne({
        class: classNumber,
        subject_code: subjectCode,
      });

      if (!doc || !Array.isArray(doc.chapters)) {
        return res.json({});
      }

      const chapterInfo: Record<string, ChapterInfo> = {};
      for (const ch of doc.chapters) {
        chapterInfo[ch.chapter_name] = {
          weightage: ch.weightage ?? 1,
          difficulty: ch.difficulty ?? 0.5,
        };
      }
      res.json(chapterInfo);
    } catch (error) {
      next(error);
    }
  }
);

// Get a student's past performance for a subject/topic/exam_type
router.get(
  "/past-performance/:studentId/:subject/:topic/:examType",
  async (
    req: Request<{
      studentId: string;
      subject: string;
      topic: string;
      examType: string;
    }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { studentId, subject, topic, examType } = req.params;

      const examOrder = ["term1", "mid_term", "term2", "end_term"];
      if (!examOrder.includes(examType)) {
        return res.json({ pastPerformance: 0.5 });
      }

      const studentDoc = await getCollection("Students", "students").findOne({
        student_id: studentId,
      });

      if (!studentDoc || !studentDoc.exams) {
        return res.json({ pastPerformance: 0.5 });
      }

      const selectedIdx = examOrder.indexOf(examType);
      const pastExams = (studentDoc.exams as ExamData[])
        .filter(
          (exam) =>
            examOrder.indexOf(exam.exam_type) < selectedIdx &&
            exam.subject === subject
        )
        .sort(
          (a, b) =>
            examOrder.indexOf(a.exam_type) - examOrder.indexOf(b.exam_type)
        );

      const topicScores: number[] = [];
      for (const exam of pastExams) {
        for (const t of exam.topic_scores ?? []) {
          if (t.topic === topic && t.max_marks > 0) {
            topicScores.push(t.marks_obtained / t.max_marks);
          }
        }
      }

      const lastTwo = topicScores.slice(-2);
      const pastPerformance =
        lastTwo.length > 0
          ? Math.round(
              (lastTwo.reduce((a, b) => a + b, 0) / lastTwo.length) * 100
            ) / 100
          : 0.5;

      res.json({ pastPerformance });
    } catch (error) {
      next(error);
    }
  }
);

// Interface for study plan request body
interface StudyPlanRequest {
  subjectsInExam: Array<{
    subject_code: string;
    syllabus?: string[];
  }>;
  student: {
    student_id: string;
    name: string;
    roll_number: string;
  };
  classNum: number;
  totalHours: number;
  selectedExamType: string;
}

// Interface for chapter item in study plan
interface ChapterItem {
  subject: string;
  subject_code: string;
  chapter: string;
  weightage: number;
  difficulty: number;
  past_performance: number;
  score: number;
  learning_hours?: number;
  revision1_hours?: number;
  revision2_hours?: number;
}

// Generate study plan for all subjects (core logic)
router.post(
  "/generate-study-plan",
  async (
    req: Request<{}, {}, StudyPlanRequest>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        subjectsInExam,
        student,
        classNum,
        totalHours,
        selectedExamType,
      } = req.body;

      // Validate input
      if (
        !subjectsInExam ||
        !student ||
        !classNum ||
        !totalHours ||
        !selectedExamType
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (totalHours <= 0) {
        return res.status(400).json({ error: "Total hours must be positive" });
      }

      // Gather all chapters across all subjects for scoring
      const chapterItems: ChapterItem[] = [];

      for (const subjExam of subjectsInExam) {
        const subjectCode = subjExam.subject_code;
        const subjDoc = await getCollection("Academic", "chapters").findOne(
          { class: classNum, subject_code: subjectCode },
          { projection: { subject_name: 1, chapters: 1 } }
        );

        const subjectName = subjDoc?.subject_name || subjectCode;
        const syllabus = subjExam.syllabus || [];

        // Get chapter info
        const chapterInfo: Record<string, ChapterInfo> = {};
        for (const ch of subjDoc?.chapters || []) {
          chapterInfo[ch.chapter_name] = {
            weightage: ch.weightage ?? 1,
            difficulty: ch.difficulty ?? 0.5,
          };
        }

        for (const ch of syllabus) {
          const info = chapterInfo[ch] || { weightage: 1, difficulty: 0.5 };
          // Fetch past performance
          const pastPerf = await fetchPastPerformance(
            student.student_id,
            subjectName,
            ch,
            selectedExamType
          );

          const score =
            0.5 * info.weightage + 0.3 * info.difficulty + 0.2 * (1 - pastPerf);

          chapterItems.push({
            subject: subjectName,
            subject_code: subjectCode,
            chapter: ch,
            weightage: info.weightage,
            difficulty: info.difficulty,
            past_performance: pastPerf,
            score,
          });
        }
      }

      const totalScore = chapterItems.reduce((sum, c) => sum + c.score, 0) || 1;

      // Distribute hours
      const learningHours = totalHours * 0.7;
      const revision1Hours = totalHours * 0.2;
      const revision2Hours = totalHours * 0.1;

      for (const c of chapterItems) {
        c.learning_hours =
          Math.round(learningHours * (c.score / totalScore) * 10) / 10;
        c.revision1_hours =
          Math.round(revision1Hours * (c.score / totalScore) * 10) / 10;
        c.revision2_hours =
          Math.round(revision2Hours * (c.score / totalScore) * 10) / 10;
      }

      // Group by subject
      const subjectPlanMap: Record<string, ChapterItem[]> = {};
      for (const c of chapterItems) {
        if (!subjectPlanMap[c.subject]) {
          subjectPlanMap[c.subject] = [];
        }
        subjectPlanMap[c.subject].push(c);
      }

      const allSubjectPlans = Object.entries(subjectPlanMap).map(
        ([subject, plan]) => ({
          subject,
          plan,
        })
      );

      // Save to DB for each subject
      for (const subjPlan of allSubjectPlans) {
        await getCollection("Students", "study_plans").updateOne(
          {
            student_id: student.student_id,
            class: classNum,
            subject: subjPlan.subject,
            exam_type: selectedExamType,
          },
          {
            $set: {
              student_id: student.student_id,
              name: student.name,
              class: classNum,
              roll_number: student.roll_number,
              subject: subjPlan.subject,
              exam_type: selectedExamType,
              plan: subjPlan.plan,
            },
          },
          { upsert: true }
        );
      }

      res.json({ allSubjectPlans });
    } catch (error) {
      next(error);
    }
  }
);

// Helper function for past performance
async function fetchPastPerformance(
  studentId: string,
  subject: string,
  topic: string,
  selectedExamType: string
): Promise<number> {
  try {
    const studentDoc = await getCollection("Students", "students").findOne({
      student_id: studentId,
    });

    if (!studentDoc || !studentDoc.exams) {
      return 0.5;
    }

    const examOrder = ["term1", "mid_term", "term2", "end_term"];
    if (!examOrder.includes(selectedExamType)) {
      return 0.5;
    }

    const selectedIdx = examOrder.indexOf(selectedExamType);
    const pastExams = (studentDoc.exams as ExamData[])
      .filter(
        (exam) =>
          examOrder.indexOf(exam.exam_type) < selectedIdx &&
          exam.subject === subject
      )
      .sort(
        (a, b) =>
          examOrder.indexOf(a.exam_type) - examOrder.indexOf(b.exam_type)
      );

    const topicScores: number[] = [];
    for (const exam of pastExams) {
      for (const t of exam.topic_scores ?? []) {
        if (t.topic === topic && t.max_marks > 0) {
          topicScores.push(t.marks_obtained / t.max_marks);
        }
      }
    }

    const lastTwo = topicScores.slice(-2);
    return lastTwo.length > 0
      ? Math.round(
          (lastTwo.reduce((a, b) => a + b, 0) / lastTwo.length) * 100
        ) / 100
      : 0.5;
  } catch (error) {
    console.error("Error fetching past performance:", error);
    return 0.5;
  }
}

export default router;

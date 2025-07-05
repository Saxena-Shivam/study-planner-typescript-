export function generateDaywiseSchedule(
  allSubjectPlans: any[],
  daysLeft: number,
  hoursPerDay: number
) {
  const phases = [
    { name: "Learning", key: "learning_hours" },
    { name: "Revision 1", key: "revision1_hours" },
    { name: "Revision 2", key: "revision2_hours" },
  ];

  // Build subject queues
  const subjectQueues = allSubjectPlans.map((subjPlan) => {
    const queue: any[] = [];
    phases.forEach((phase) => {
      subjPlan.plan.forEach((p: any) => {
        const total = p[phase.key];
        if (total > 0) {
          queue.push({
            phase: phase.name,
            chapter: p.chapter,
            remaining_hours: total,
          });
        }
      });
    });
    return { subject: subjPlan.subject, queue };
  });

  const schedule: any[] = [];
  let subjectIdx = 0;
  for (let day = 1; day <= daysLeft; day++) {
    let hoursLeft = hoursPerDay;
    const today: any[] = [];
    if (!subjectQueues.length) break;
    while (hoursLeft > 0 && subjectQueues.length) {
      const subj = subjectQueues[subjectIdx % subjectQueues.length];
      const queue = subj.queue;
      while (queue.length && hoursLeft > 0) {
        const task = queue[0];
        const assign = Math.min(task.remaining_hours, hoursLeft);
        if (assign > 0) {
          today.push({
            phase: task.phase,
            subject: subj.subject,
            chapter: task.chapter,
            hours: Math.round(assign * 100) / 100,
          });
        }
        task.remaining_hours -= assign;
        hoursLeft -= assign;
        if (task.remaining_hours <= 0) queue.shift();
      }
      if (!queue.length) {
        subjectQueues.splice(subjectIdx % subjectQueues.length, 1);
        if (!subjectQueues.length) break;
      } else {
        subjectIdx = (subjectIdx + 1) % subjectQueues.length;
        break;
      }
    }
    schedule.push({ day, tasks: today });
    subjectIdx = subjectQueues.length
      ? (subjectIdx + 1) % subjectQueues.length
      : 0;
  }
  return schedule;
}

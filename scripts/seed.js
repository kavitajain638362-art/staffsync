import User from "../server/models/User.js";
import Employee from "../server/models/Employee.js";
import Attendance from "../server/models/Attendance.js";
import Leave from "../server/models/Leave.js";
import Announcement from "../server/models/Announcement.js";
import Training from "../server/models/Training.js";
import { hashPassword, dayInIndia } from "../server/lib.js";

export async function seedDemo() {
  if (await User.exists({})) return;
  const passwordHash = await hashPassword("StaffSyncDemo2026!");
  const people = [
    ["Nisha Shah", "hr", "People", "HR Administrator", "hr@example.test"],
    [
      "Arjun Rao",
      "manager",
      "Product",
      "Product Manager",
      "manager@example.test",
    ],
    [
      "Mira Patel",
      "employee",
      "Engineering",
      "Software Engineer",
      "employee@example.test",
    ],
    [
      "Rohan Mehta",
      "employee",
      "Engineering",
      "Frontend Engineer",
      "rohan@example.test",
    ],
    [
      "Ishita Sen",
      "employee",
      "Design",
      "Product Designer",
      "ishita@example.test",
    ],
    [
      "Kabir Singh",
      "employee",
      "Operations",
      "Operations Analyst",
      "kabir@example.test",
    ],
  ];
  const users = [];
  for (const [name, role, department, designation, email] of people)
    users.push(await User.create({ name, role, email, passwordHash }));
  for (let i = 0; i < users.length; i++)
    await Employee.create({
      user: users[i]._id,
      department: people[i][2],
      designation: people[i][3],
      manager: i > 1 ? users[1]._id : null,
    });
  await Attendance.init();
  const today = dayInIndia();
  for (let i = 0; i < 4; i++)
    await Attendance.create({
      employee: users[i]._id,
      date: today,
      checkedInAt: new Date(
        `${today}T09:${String(2 + i * 6).padStart(2, "0")}:00+05:30`,
      ),
    });
  const future = (n) => dayInIndia(new Date(Date.now() + n * 86400000));
  for (const [i, reason, n] of [
    [2, "Family commitment", 3],
    [3, "Personal appointment", 5],
  ])
    await Leave.create({
      employee: users[i]._id,
      startDate: future(n),
      endDate: future(n + 1),
      reason,
    });
  await Announcement.create([
    {
      title: "Welcome to StaffSync",
      body: "One place for your people, leave, attendance and team learning. This workspace contains fictional demo data.",
      author: users[0]._id,
    },
    {
      title: "New training modules available",
      body: "Explore your assigned courses in Training. Managers can create sessions and assign their team.",
      author: users[1]._id,
    },
    {
      title: "People team town hall",
      body: "Bring your ideas for a better workplace to our next team conversation.",
      author: users[0]._id,
    },
  ]);
  await Training.create({
    title: "Security and responsible data handling",
    description:
      "A practical introduction to protecting employee information and spotting common account risks.",
    date: future(7),
    assignedTo: users.slice(2).map((u) => u._id),
    createdBy: users[1]._id,
  });
}

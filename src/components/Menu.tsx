import { currentUser } from "@clerk/nextjs/server";
import MenuClient from "./MenuClient";

const menuItems = [
	{
		title: "SUPER ADMIN",
		items: [
			{
				icon: "/home.png",
				label: "Dashboard",
				href: "/super-admin",
				visible: ["super_admin"],
			},
			{
				icon: "/singleBranch.png",
				label: "Schools",
				href: "/list/schools",
				visible: ["super_admin"],
			},
			{
				icon: "/profile.png",
				label: "Admins",
				href: "/list/admins",
				visible: ["super_admin"],
			},
		],
	},
	{
		title: "MENU",
		items: [
			{
				icon: "/home.png",
				label: "Home",
				href: "/",
				visible: ["admin", "teacher", "student", "parent"],
			},
			{
				icon: "/finance.png",
				label: "My Payroll",
				href: "/teacher/payroll",
				visible: ["teacher"],
			},
			{
				icon: "/teacher.png",
				label: "Teachers",
				href: "/list/teachers",
				visible: ["admin", "teacher"],
			},
			{
				icon: "/student.png",
				label: "Students",
				href: "/list/students",
				visible: ["admin", "teacher"],
			},
			{
				icon: "/parent.png",
				label: "Parents",
				href: "/list/parents",
				visible: ["admin", "teacher"],
			},
			{
				icon: "/subject.png",
				label: "Subjects",
				href: "/list/subjects",
				visible: ["admin"],
			},
			{
				icon: "/class.png",
				label: "Classes",
				href: "/list/classes",
				visible: ["admin", "teacher"],
			},
			{
				icon: "/calendar.png",
				label: "Schedule",
				href: "/schedule",
				visible: ["admin"],
			},
			// {
			//   icon: "/lesson.png",
			//   label: "Lessons",
			//   href: "/list/lessons",
			//   visible: ["admin", "teacher"],
			// },
			{
				icon: "/exam.png",
				label: "Exams",
				href: "/list/exams",
				visible: ["admin", "teacher", "student"],
			},
			{
				icon: "/assignment.png",
				label: "Assignments",
				href: "/list/assignments",
				visible: ["admin", "teacher", "student"],
			},
			{
				icon: "/result.png",
				label: "Results",
				href: "/list/results",
				visible: ["admin", "teacher", "student", "parent"],
			},
			{
				icon: "/finance.png",
				label: "Fees",
				href: "/list/fees",
				visible: ["admin", "parent"],
			},
			{
				icon: "/finance.png",
				label: "Pay Fees",
				href: "/student/fees",
				visible: ["student"],
			},
			{
				icon: "/finance.png",
				label: "Pay Children's Fees",
				href: "/parent/fees",
				visible: ["parent"],
			},
			{
				icon: "/finance.png",
				label: "Payroll",
				href: "/list/payroll",
				visible: ["admin"],
			},
			{
				icon: "/result.png",
				label: "Accounting",
				href: "/accounting",
				visible: ["admin"],
			},
			{
				icon: "/finance.png",
				label: "Test Payment",
				href: "/test-payment",
				visible: ["admin"],
			},
			{
			  icon: "/attendance.png",
			  label: "Attendance",
			  href: "/list/attendance",
			  visible: ["admin", "teacher", "student", "parent"],
			},
			{
				icon: "/calendar.png",
				label: "Events",
				href: "/list/events",
				visible: ["admin", "teacher", "student", "parent"],
			},
			// {
			//   icon: "/message.png",
			//   label: "Messages",
			//   href: "/list/messages",
			//   visible: ["admin", "teacher", "student", "parent"],
			// },
			{
				icon: "/announcement.png",
				label: "Announcements",
				href: "/list/announcements",
				visible: ["admin", "teacher", "student", "parent"],
			},
		],
	},
];

const Menu = async () => {
	const user = await currentUser();
	const role = user?.publicMetadata.role as string;
	const adminRole = user?.publicMetadata.adminRole as string;
	
	// Determine the effective role for menu display
	let effectiveRole = role;
	if (role === "admin" && adminRole === "SUPER_ADMIN") {
		effectiveRole = "super_admin";
	}
	
	return <MenuClient role={effectiveRole} menuItems={menuItems} />;
};

export default Menu;

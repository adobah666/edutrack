'use client';

import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import ExamActions from "@/components/client/ExamActions";
import ExamFilters from "./ExamFilters";
import { Exam } from "@prisma/client";

type ExamListProps = {
  exams: any[];
  count: number;
  currentPage: number;
  isAdmin: boolean;
  termFilter: string | undefined;
};

export default function ExamList({ exams, count, currentPage, isAdmin, termFilter }: ExamListProps) {
  const columns = [
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Subject",
      accessor: "subjectName",
    },
    {
      header: "Class",
      accessor: "className",
    },
    {
      header: "Term",
      accessor: "term",
    },
    {
      header: "Date",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    ...(isAdmin
      ? [
          {
            header: "Actions",
            accessor: "actions",
          },
        ]
      : []),
  ];

  const getTermDisplay = (term: string) => {
    const termMap: Record<string, string> = {
      FIRST: "First Term",
      SECOND: "Second Term",
      THIRD: "Third Term",
      FINAL: "Final Term",
    };
    return termMap[term] || term;
  };

  const tableData = exams.map((exam) => ({
    id: exam.id,
    title: exam.title,
    subjectName: exam.subject?.name || "No Subject",
    className: exam.class?.name || "No Class",
    term: getTermDisplay(exam.term),
    date: new Intl.DateTimeFormat("en-US").format(exam.startTime),
    actions: isAdmin ? (
      <ExamActions examId={exam.id} examData={exam} />
    ) : null,
  }));

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <ExamFilters 
        currentTerm={termFilter || "ALL"} 
        isAdmin={isAdmin}
        onTermChange={(term) => {
          const url = new URL(window.location.href);
          if (term !== "ALL") {
            url.searchParams.set("term", term);
          } else {
            url.searchParams.delete("term");
          }
          window.location.href = url.toString();
        }}
      />
      <Table 
        columns={columns} 
        data={tableData} 
        emptyMessage="No exams found" 
      />
      <Pagination count={count} page={currentPage} />
    </div>
  );
}

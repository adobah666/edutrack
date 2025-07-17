'use client';

import { useEffect, useState } from 'react';
import FormModal from "../FormModal";

type ExamActionsProps = {
  examId: number;
  examData: any;
};

const ExamActions = ({ examId, examData }: ExamActionsProps) => {
  const [relatedData, setRelatedData] = useState<{
    subjects: { id: number; name: string }[];
    classes: { id: number; name: string }[];
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/exam-form-data');
      const data = await response.json();
      setRelatedData(data);
    };
    fetchData();
  }, []);
  if (!relatedData) return null;

  return (
    <div className="flex items-center gap-2">
      <FormModal table="exam" type="update" data={examData} relatedData={relatedData} />
      <FormModal table="exam" type="delete" id={examId} />
    </div>
  );
};

export default ExamActions;

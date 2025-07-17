'use client';

import FormContainer from "./FormContainer";

type ExamActionsProps = {
  examId: number;
  examData: any;
};

const ExamActions = ({ examId, examData }: ExamActionsProps) => {
  return (
    <div className="flex items-center gap-2">
      <FormContainer table="exam" type="update" data={examData} />
      <FormContainer table="exam" type="delete" id={examId} />
    </div>
  );
};

export default ExamActions;

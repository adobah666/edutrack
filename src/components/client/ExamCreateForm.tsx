'use client';

import { useEffect, useState } from 'react';
import FormModal from "../FormModal";

const ExamCreateButton = () => {
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

  return <FormModal table="exam" type="create" relatedData={relatedData} />;
};

export default ExamCreateButton;

"use client";

import { useState, useEffect } from 'react';
import { RubricBuilderBoard } from '@/components/organisms/RubricBuilderBoard';
import { getRubricsAction, createRubricAction, deleteRubricAction } from '@/server/actions/rubric.actions';

export default function RubricBuilderPage() {
  const [rubrics, setRubrics] = useState<any[]>([]);
  
  const fetchRubrics = async () => {
    const data = await getRubricsAction();
    if (data.success) {
      setRubrics(data.rubrics);
    }
  };

  useEffect(() => {
    fetchRubrics();
  }, []);

  const handleSaveRubric = async (activeRubric: any) => {
    const res = await createRubricAction(activeRubric);
    return res.success;
  };

  const handleDeleteRubric = async (id: string) => {
    const res = await deleteRubricAction(id);
    return res.success;
  };

  return (
    <RubricBuilderBoard 
      rubrics={rubrics}
      onRefresh={fetchRubrics}
      onSaveRubric={handleSaveRubric}
      onDeleteRubric={handleDeleteRubric}
    />
  );
}

"use client";

import { useState, useEffect } from 'react';
import { DeliverableList } from '@/components/organisms/DeliverableList';
import { getAllDeliverablesAction } from '@/server/actions/team.actions';

export default function DeliverablesPage() {
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliverables = async () => {
    setLoading(true);
    try {
      const data = await getAllDeliverablesAction();
      if (!data.success) return;
      setDeliverables((data as any).deliverables);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverables();
  }, []);

  return <DeliverableList deliverables={deliverables} loading={loading} onRefresh={fetchDeliverables} />;
}

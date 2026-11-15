import { findRubrics, createRubric, updateRubricById, deleteRubricById } from '../repositories/rubric.repository';

export async function getRubricsService() {
  const rubrics = await findRubrics();
  return { rubrics };
}

export async function createRubricService(body: any) {
  if (!body.criteria || body.criteria.length === 0) {
    throw new Error('Rubric must have at least one criterion');
  }
  const totalWeight = body.criteria.reduce((sum: number, c: any) => sum + Number(c.weight), 0);
  if (totalWeight === 0) {
    throw new Error('Total weight cannot be zero');
  }
  const normalizedCriteria = body.criteria.map((c: any) => ({
    name: c.name,
    weight: Math.round((Number(c.weight) / totalWeight) * 100),
    maxScore: c.maxScore || 10
  }));

  const rubric = await createRubric({
    name: body.name,
    isTemplate: body.isTemplate || false,
    criteria: normalizedCriteria
  });

  return { rubric };
}

export async function updateRubricService(id: string, body: any) {
  const updateData: any = {};
  if (body.name) updateData.name = body.name;
  if (body.criteria) {
    if (body.criteria.length === 0) throw new Error('Rubric must have at least one criterion');
    const totalWeight = body.criteria.reduce((sum: number, c: any) => sum + Number(c.weight), 0);
    if (totalWeight === 0) throw new Error('Total weight cannot be zero');
    updateData.criteria = body.criteria.map((c: any) => ({
      name: c.name,
      weight: Math.round((Number(c.weight) / totalWeight) * 100),
      maxScore: c.maxScore || 10
    }));
  }

  const rubric = await updateRubricById(id, updateData);
  if (!rubric) throw new Error('Rubric not found');
  
  return { rubric };
}

export async function deleteRubricService(id: string) {
  const rubric = await deleteRubricById(id);
  if (!rubric) throw new Error('Rubric not found');
  return true;
}

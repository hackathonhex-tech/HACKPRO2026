import Rubric from '@/server/models/Rubric';
import connectToDatabase from '@/server/config/db';

export async function findRubrics() {
  await connectToDatabase();
  const rubrics = await Rubric.find({}).lean();
  return JSON.parse(JSON.stringify(rubrics));
}

export async function createRubric(data: any) {
  await connectToDatabase();
  const rubric = new Rubric(data);
  await rubric.save();
  return JSON.parse(JSON.stringify(rubric));
}

export async function updateRubricById(id: string, updateData: any) {
  await connectToDatabase();
  const rubric = await Rubric.findByIdAndUpdate(id, updateData, { new: true }).lean();
  if (!rubric) return null;
  return JSON.parse(JSON.stringify(rubric));
}

export async function deleteRubricById(id: string) {
  await connectToDatabase();
  const rubric = await Rubric.findByIdAndDelete(id).lean();
  if (!rubric) return null;
  return JSON.parse(JSON.stringify(rubric));
}

import connectToDatabase from '@/server/config/db';
import ProblemStatement from '@/server/models/ProblemStatement';

export async function findProblemStatements(query: any) {
  await connectToDatabase();
  const ps = await ProblemStatement.find(query);
  return JSON.parse(JSON.stringify(ps));
}

export async function createProblemStatement(data: any) {
  await connectToDatabase();
  const ps = new ProblemStatement(data);
  await ps.save();
  return JSON.parse(JSON.stringify(ps));
}

export async function findProblemStatementById(id: string) {
  await connectToDatabase();
  const ps = await ProblemStatement.findById(id);
  return ps ? JSON.parse(JSON.stringify(ps)) : null;
}

export async function updateProblemStatementById(id: string, updateData: any) {
  await connectToDatabase();
  const ps = await ProblemStatement.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  return ps ? JSON.parse(JSON.stringify(ps)) : null;
}

export async function deleteProblemStatementById(id: string) {
  await connectToDatabase();
  return await ProblemStatement.findByIdAndDelete(id);
}

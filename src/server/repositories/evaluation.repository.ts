import Evaluation from '@/server/models/Evaluation';
import connectToDatabase from '@/server/config/db';

export async function findEvaluationByCriteria(teamId: string, judgeId: string, roundId: string) {
  await connectToDatabase();
  const evaluation = await Evaluation.findOne({ teamId, judgeId, roundId }).lean();
  return JSON.parse(JSON.stringify(evaluation));
}

export async function findLockedEvaluation(teamId: string, judgeId: string, roundId: string) {
  await connectToDatabase();
  const evaluation = await Evaluation.findOne({ teamId, judgeId, roundId, isLocked: true }).lean();
  return JSON.parse(JSON.stringify(evaluation));
}

export async function upsertEvaluation(filter: any, updateData: any) {
  await connectToDatabase();
  const evaluation = await Evaluation.findOneAndUpdate(
    filter,
    { $set: updateData },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  return JSON.parse(JSON.stringify(evaluation));
}

export async function findEvaluationsForJudges() {
  await connectToDatabase();
  const evaluations = await Evaluation.find({})
    .select('teamId roundId isLocked judgeId')
    .populate('judgeId', 'name')
    .lean();
  return JSON.parse(JSON.stringify(evaluations));
}

export async function findAllEvaluationsWithPopulate() {
  await connectToDatabase();
  const allEvaluations = await Evaluation.find({})
    .populate({
      path: 'teamId',
      select: 'name uniqueId problemStatementId collegeName members',
      populate: {
        path: 'problemStatementId',
        select: 'title track'
      }
    })
    .populate('judgeId', 'name email uniqueId')
    .populate({
      path: 'roundId',
      populate: { path: 'activeMemberRubricId' }
    })
    .populate('rubricId')
    .sort({ isLocked: -1, createdAt: -1 })
    .lean();
    
  return JSON.parse(JSON.stringify(allEvaluations));
}

export async function getPublicFeedbacksForTeam(teamId: string) {
  await connectToDatabase();
  const evaluations = await Evaluation.find({
    teamId,
    isLocked: true,
    publicFeedback: { $exists: true, $ne: '' }
  }).populate('judgeId', 'name').lean();
  
  return evaluations.map((e: any) => ({
    judgeName: e.judgeId?.name || 'Judge',
    feedback: e.publicFeedback
  }));
}

export async function deleteEvaluationById(id: string) {
  await connectToDatabase();
  return Evaluation.findByIdAndDelete(id);
}

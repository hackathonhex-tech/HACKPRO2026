import {
  findEvaluationByCriteria,
  findLockedEvaluation,
  upsertEvaluation,
  findEvaluationsForJudges,
  findAllEvaluationsWithPopulate,
  deleteEvaluationById
} from '../repositories/evaluation.repository';

export async function getEvaluationService(teamId: string, judgeId: string, roundId: string) {
  if (!teamId || !judgeId || !roundId) {
    throw new Error('Missing parameters');
  }

  const evaluation = await findEvaluationByCriteria(teamId, judgeId, roundId);
  return { evaluation };
}

export async function submitEvaluationService(body: any) {
  const existingLocked = await findLockedEvaluation(body.teamId, body.judgeId, body.roundId);

  if (existingLocked) {
    throw new Error('Evaluation is already locked.');
  }

  const filter = {
    teamId: body.teamId,
    judgeId: body.judgeId,
    roundId: body.roundId,
    $or: [{ isLocked: false }, { isLocked: { $exists: false } }]
  };

  const updateData = {
    rubricId: body.rubricId,
    scores: body.scores,
    memberScores: body.memberScores || [],
    totalScore: body.totalScore,
    comment: body.comment,
    publicFeedback: body.publicFeedback,
    isLocked: body.isLocked,
    isFlagged: body.isFlagged
  };

  const evaluation = await upsertEvaluation(filter, updateData);
  return { evaluation };
}

export async function getMyEvaluationsService() {
  const evaluations = await findEvaluationsForJudges();
  return { evaluations };
}

export async function getAllEvaluationsService() {
  const allEvaluations = await findAllEvaluationsWithPopulate();

  const uniqueEvaluations: any[] = [];
  const seen = new Set();

  for (const ev of allEvaluations) {
    const key = `${ev.teamId?._id}-${ev.judgeId?._id}-${ev.roundId?._id}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueEvaluations.push(ev);
    }
  }

  return { evaluations: uniqueEvaluations };
}

export async function resetEvaluationService(evaluationId: string) {
  const result = await deleteEvaluationById(evaluationId);
  if (!result) throw new Error('Evaluation not found');
  return { success: true };
}

import * as problemStatementRepository from '@/server/repositories/problem-statements.repository';

export async function getProblemStatements(userRole: string) {
  const query = userRole === 'team' ? { isVisible: true } : {};
  const ps = await problemStatementRepository.findProblemStatements(query);
  return ps;
}

export async function createProblemStatement(body: any) {
  let parsedStacks: string[] = [];
  if (typeof body.allowedStacks === 'string') {
    parsedStacks = body.allowedStacks.split(',').map((s: string) => s.trim()).filter(Boolean);
  } else if (Array.isArray(body.allowedStacks)) {
    parsedStacks = body.allowedStacks;
  }

  const data = {
    title: body.title,
    description: body.description,
    track: body.track,
    slotLimit: Number(body.slotLimit) || 0,
    isVisible: body.isVisible !== undefined ? body.isVisible : true,
    allowedStacks: parsedStacks,
    slotsFilled: 0
  };
  
  return await problemStatementRepository.createProblemStatement(data);
}

export async function getProblemStatement(id: string, userRole: string) {
  const ps = await problemStatementRepository.findProblemStatementById(id);
  if (!ps || (userRole === 'team' && !ps.isVisible)) {
    throw new Error('Not found or not available');
  }
  return ps;
}

export async function updateProblemStatement(id: string, body: any) {
  const updateData: any = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.track !== undefined) updateData.track = body.track;
  if (body.slotLimit !== undefined) updateData.slotLimit = Number(body.slotLimit) || 0;
  if (body.isVisible !== undefined) updateData.isVisible = Boolean(body.isVisible);
  
  if (body.allowedStacks !== undefined) {
    if (typeof body.allowedStacks === 'string') {
      updateData.allowedStacks = body.allowedStacks.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else if (Array.isArray(body.allowedStacks)) {
      updateData.allowedStacks = body.allowedStacks;
    }
  }

  const ps = await problemStatementRepository.updateProblemStatementById(id, updateData);
  if (!ps) {
    throw new Error('Not found');
  }
  return ps;
}

export async function deleteProblemStatement(id: string) {
  return await problemStatementRepository.deleteProblemStatementById(id);
}

import * as roundRepository from '@/server/repositories/round.repository';

export async function getActiveRound() {
  const round = await roundRepository.findActiveRound();
  if (!round) {
    throw new Error('No active round found');
  }
  return round;
}

export async function getRounds() {
  return await roundRepository.findAllRounds();
}

export async function createRound(body: any) {
  if (body.isActive) {
    await roundRepository.deactivateAllRounds();
  }
  return await roundRepository.createRound(body);
}

export async function updateRound(id: string, body: any) {
  if (body.isActive) {
    await roundRepository.deactivateOtherRounds(id);
  }
  const updatedRound = await roundRepository.updateRoundById(id, body);
  if (!updatedRound) {
    throw new Error('Round not found');
  }
  return updatedRound;
}

export async function deleteRound(id: string) {
  const deletedRound = await roundRepository.deleteRoundById(id);
  if (!deletedRound) {
    throw new Error('Round not found');
  }
  return deletedRound;
}

export async function updateRoundAllowedTeams(roundId: string, allowedTeamIds: string[]) {
  const round = await roundRepository.updateRoundAllowedTeams(roundId, allowedTeamIds);
  if (!round) throw new Error('Round not found');
  return round;
}

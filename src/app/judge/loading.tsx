import { LoadingScreen } from '@/components/molecules/LoadingScreen';

export default function JudgeLoading() {
  return <LoadingScreen message="Loading Evaluation Portal..." submessage="Syncing scoring rubrics & teams" />;
}

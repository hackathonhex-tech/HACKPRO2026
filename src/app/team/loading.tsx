import { LoadingScreen } from '@/components/molecules/LoadingScreen';

export default function TeamLoading() {
  return <LoadingScreen message="Loading Team Dashboard..." submessage="Fetching deliverables & timer status" />;
}

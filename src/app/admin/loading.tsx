import { LoadingScreen } from '@/components/molecules/LoadingScreen';

export default function AdminLoading() {
  return <LoadingScreen message="Loading Admin Portal..." submessage="Retrieving data from MongoDB Atlas" />;
}

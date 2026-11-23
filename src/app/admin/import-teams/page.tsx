import { TeamImportBoard } from '@/components/organisms/TeamImportBoard';

export const metadata = {
  title: 'Import Employee Teams | HACKPRO Admin',
  description: 'Bulk import employee rosters and detect cross-team duplicate members.',
};

export default function ImportTeamsPage() {
  return <TeamImportBoard />;
}

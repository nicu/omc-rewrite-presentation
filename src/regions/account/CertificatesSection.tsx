/* Only Meridian lists this section. No other brand loads certificates at all. */

import { Stack } from '../../components/primitives';
import { CertificateRow, FailurePanel, ResultListSkeleton } from '../../components/presenters';
import { certificatesQuery } from '../../data/queries';
import { useLoad } from '../../data/useLoad';

export const CertificatesSection = () => {
  const { data, status, retry } = useLoad(
    { certificates: certificatesQuery() },
    { pageView: 'ACCOUNT_SECTION_OPENED' },
  );

  if (status === 'loading') return <ResultListSkeleton count={2} />;
  if (status === 'error') return <FailurePanel message="We couldn't load your certificates." onRetry={retry} />;

  return (
    <Stack gap={3}>
      {data.certificates.map((certificate) => (
        <CertificateRow key={certificate.id} certificate={certificate} track={{ apply: 'CERTIFICATE_APPLIED' }} />
      ))}
    </Stack>
  );
};

import { type GetServerSideProps } from "next";

import { Layout } from "~/layouts/DefaultLayout";
import ProjectDetails from "~/features/projects/components/ProjectDetails";
import { useProjectById } from "~/features/projects/hooks/useProjects";
import { Button } from "~/components/ui/Button";
import { useApproveApplication } from "~/features/applications/hooks/useApproveApplication";

export default function ApplicationDetailsPage({ projectId = "" }) {
  const project = useProjectById(projectId);

  const approve = useApproveApplication();

  return (
    <Layout title={project.data?.name}>
      <ProjectDetails
        attestation={project.data}
        action={
          <Button
            variant="primary"
            disabled={approve.isLoading}
            onClick={() => approve.mutate([projectId])}
          >
            Approve project
          </Button>
        }
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  query: { projectId },
}) => ({ props: { projectId } });

import clsx from "clsx";
import Link from "next/link";
import { XIcon } from "lucide-react";

import { type Attestation } from "../types";
import { useProfile } from "~/hooks/useProfile";
import { ProjectAvatar } from "./ProjectAvatar";
import { ProjectBanner } from "./ProjectBanner";
import { Heading } from "~/components/ui/Heading";
import { Skeleton } from "~/components/ui/Skeleton";
import { InfiniteLoading } from "~/components/InfiniteLoading";
import { Button } from "~/components/ui/Button";
import { useProjectMetadata, useProjects } from "../hooks/useProjects";
import { useSelectProjects } from "../hooks/useSelectProjects";
import { ProjectSelectButton } from "./ProjectSelectButton";

export function Projects() {
  const select = useSelectProjects();

  return (
    <div>
      <div
        className={clsx(
          "sticky top-4 z-20 mb-4 mt-4 flex justify-end gap-4 lg:-mt-8",
          {
            ["invisible"]: !select.count,
          },
        )}
      >
        <Button
          variant="primary"
          onClick={select.add}
          disabled={!select.count}
          className="w-full lg:w-72"
        >
          Add {select.count} projects to ballot
        </Button>
        <Button size="icon" onClick={select.reset}>
          <XIcon />
        </Button>
      </div>
      <InfiniteLoading
        {...useProjects()}
        renderItem={(item, { isLoading }) => {
          return (
            <Link
              key={item.id}
              href={`/projects/${item.id}`}
              className={clsx("relative", { ["animate-pulse"]: isLoading })}
            >
              {!isLoading ? (
                <div className="absolute right-2 top-[100px] z-10 -mt-2">
                  <ProjectSelectButton
                    state={select.getState(item.id)}
                    onClick={(e) => {
                      e.preventDefault();
                      select.toggle(item.id);
                    }}
                  />
                </div>
              ) : null}
              <ProjectItem isLoading={isLoading} attestation={item} />
            </Link>
          );
        }}
      />
    </div>
  );
}

function ProjectItem({
  attestation,
  isLoading,
}: {
  attestation: Attestation;
  isLoading: boolean;
}) {
  const { data: profile } = useProfile(attestation?.attester);
  const metadata = useProjectMetadata(attestation?.metadataPtr);
  return (
    <div className="rounded-2xl border border-gray-200 p-2 hover:border-primary-500 dark:border-gray-700 dark:hover:border-primary-500">
      <ProjectBanner isLoading={isLoading} metadataPtr={profile?.metadataPtr} />
      <ProjectAvatar
        rounded="full"
        isLoading={isLoading}
        className="-mt-8 ml-4"
        metadataPtr={profile?.metadataPtr}
      />
      <Heading className="truncate" size="lg" as="h3">
        <Skeleton isLoading={isLoading}>{attestation?.name}</Skeleton>
      </Heading>
      <p className="line-clamp-2 h-12 dark:text-gray-300">
        <Skeleton isLoading={isLoading} className="w-full">
          {metadata.data?.bio}
        </Skeleton>
      </p>
    </div>
  );
}

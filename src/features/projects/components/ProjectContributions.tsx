import { Markdown } from "~/components/ui/Markdown";
import { Heading } from "~/components/ui/Heading";
import { type ProjectMetadata } from "../types";
import { LinkBox } from "./LinkBox";
import { FileCode, Github, Globe, type LucideIcon } from "lucide-react";
import { createElement } from "react";

type Props = { isLoading: boolean; project?: ProjectMetadata };

export default function ProjectContributions({ isLoading, project }: Props) {
  return (
    <>
      <Heading as="h3" size="2xl">
        Contributions
      </Heading>
      <div className="mb-4 gap-4 md:flex">
        <div className="md:w-2/3">
          <Markdown isLoading={isLoading}>
            {project?.contributionDescription}
          </Markdown>
        </div>
        <div className="md:w-1/3">
          <LinkBox
            label="Contribution Links"
            links={project?.contributionLinks}
            renderItem={(link) => {
              const icon: LucideIcon | undefined = {
                CONTRACT_ADDRESS: FileCode,
                GITHUB_REPO: Github,
                OTHER: Globe,
              }[link.type];
              return (
                <>
                  {createElement(icon ?? "div", {
                    className: "w-4 h-4 mt-1",
                  })}
                  <div className="flex-1 truncate" title={link.description}>
                    {link.description}
                  </div>
                </>
              );
            }}
          />
        </div>
      </div>
    </>
  );
}

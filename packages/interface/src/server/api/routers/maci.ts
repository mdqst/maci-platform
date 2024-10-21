import { PubKey } from "maci-domainobjs";
import { z, ZodType } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { fetchMetadata } from "~/utils/fetchMetadata";
import { fetchPolls } from "~/utils/fetchPoll";
import { fetchUser } from "~/utils/fetchUser";

import type { IPollData, IRoundMetadata, IRoundData } from "~/utils/types";

const PollSchema = z.object({
  id: z.union([z.string(), z.number(), z.bigint()]),
  mode: z.union([z.string(), z.number(), z.bigint()]),
  address: z.string(),
  isMerged: z.boolean(),
  duration: z.union([z.string(), z.number(), z.bigint()]),
  deployTime: z.union([z.string(), z.number(), z.bigint()]),
  numSignups: z.union([z.string(), z.number(), z.bigint()]),
  initTime: z.union([z.string(), z.number(), z.bigint()]).nullable(),
  registryAddress: z.string(),
  metadataUrl: z.string(),
}) satisfies ZodType<IPollData>;

export const maciRouter = createTRPCRouter({
  user: publicProcedure
    .input(z.object({ publicKey: z.string() }))
    .query(async ({ input }) => fetchUser(PubKey.deserialize(input.publicKey).rawPubKey)),
  poll: publicProcedure.query(async () => fetchPolls()),
  round: publicProcedure.input(z.object({ polls: z.array(PollSchema) })).query(async ({ input }) =>
    Promise.all(
      input.polls.map((poll) =>
        fetchMetadata<IRoundMetadata>(poll.metadataUrl).then((metadata) => {
          const data = metadata as unknown as IRoundMetadata;

          const votingStartsAt =
            poll.initTime === null ? new Date(data.votingStartsAt) : new Date(Number(poll.initTime) * 1000);
          const votingEndsAt =
            poll.initTime === null
              ? new Date(data.votingEndsAt)
              : new Date((Number(poll.initTime) + Number(poll.duration)) * 1000);

          return {
            isMerged: poll.isMerged,
            pollId: poll.id,
            numSignups: poll.numSignups,
            pollAddress: poll.address,
            mode: poll.mode,
            registryAddress: poll.registryAddress,
            roundId: data.roundId,
            description: data.description,
            startsAt: new Date(data.startsAt),
            registrationEndsAt: new Date(data.registrationEndsAt),
            votingStartsAt,
            votingEndsAt,
            tallyFile: data.tallyFile,
          } as IRoundData;
        }),
      ),
    ),
  ),
});

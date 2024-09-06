import { expect } from "chai";
import { encodeBytes32String, ZeroAddress, type Signer } from "ethers";
import hardhat from "hardhat";
import { deployContract, Deployment, deployPoseidonContracts, genEmptyBallotRoots, getSigners } from "maci-contracts";
import { Keypair, Message, PubKey } from "maci-domainobjs";

import { type Poll, Poll__factory as PollFactory, PollFactory as PollFactoryContract } from "../typechain-types";

import { DEFAULT_SR_QUEUE_OPS, STATE_TREE_DEPTH, treeDepths } from "./constants";
import { timeTravel } from "./utils";

describe("Poll", () => {
  let pollFactory: PollFactoryContract;
  let pollContract: Poll;
  let owner: Signer;
  let user: Signer;

  const { pubKey: coordinatorPubKey } = new Keypair();

  const deployment = Deployment.getInstance(hardhat);

  const emptyBallotRoots = genEmptyBallotRoots(STATE_TREE_DEPTH);
  const emptyBallotRoot = emptyBallotRoots[treeDepths.voteOptionTreeDepth];
  const duration = 100;
  const maxRecipients = 5;
  const metadataUrl = encodeBytes32String("url");
  const message = new Message([0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]);
  const key = new PubKey([
    10457101036533406547632367118273992217979173478358440826365724437999023779287n,
    19824078218392094440610104313265183977899662750282163392862422243483260492317n,
  ]);

  before(async () => {
    [owner, user] = await getSigners();
    const { PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract } =
      await deployPoseidonContracts(owner);

    const contractFactory = await hardhat.ethers.getContractFactory("contracts/maci/PollFactory.sol:PollFactory", {
      signer: owner,
      libraries: {
        PoseidonT3: PoseidonT3Contract,
        PoseidonT4: PoseidonT4Contract,
        PoseidonT5: PoseidonT5Contract,
        PoseidonT6: PoseidonT6Contract,
      },
    });

    pollFactory = await deployment.deployContractWithLinkedLibraries({ contractFactory, signer: owner });

    const pollAddress = await pollFactory.deploy.staticCall(
      duration,
      treeDepths,
      coordinatorPubKey.asContractParam(),
      await owner.getAddress(),
      emptyBallotRoot,
    );

    await pollFactory
      .deploy("100", treeDepths, coordinatorPubKey.asContractParam(), await owner.getAddress(), emptyBallotRoot)
      .then((tx) => tx.wait());

    pollContract = PollFactory.connect(pollAddress, owner);
  });

  it("should fail if unauthorized user tries to set the poll registry", async () => {
    const registry = await deployContract(
      "MockRegistry",
      owner,
      true,
      maxRecipients,
      metadataUrl,
      await owner.getAddress(),
    );

    await expect(pollContract.connect(user).setRegistry(await registry.getAddress())).to.be.revertedWithCustomError(
      pollContract,
      "OwnableUnauthorizedAccount",
    );
  });

  it("should fail if try to set the invalid poll registry", async () => {
    await expect(pollContract.connect(owner).setRegistry(ZeroAddress)).to.be.revertedWithCustomError(
      pollContract,
      "InvalidAddress",
    );
  });

  it("should fail if try to initialize the poll without the registry", async () => {
    await expect(pollContract.connect(owner).init()).to.be.revertedWithCustomError(
      pollContract,
      "RegistryNotInitialized",
    );
  });

  it("should fail if try to publish the message for the uninitialized poll", async () => {
    await expect(
      pollContract.connect(user).publishMessage(message.asContractParam(), key.asContractParam()),
    ).to.be.revertedWithCustomError(pollContract, "PollNotInitialized");
  });

  it("should fail if try to set the poll registry twice", async () => {
    const address = await user.getAddress();

    await expect(pollContract.connect(owner).setRegistry(address))
      .to.emit(pollContract, "SetRegistry")
      .withArgs(address);

    await expect(pollContract.connect(owner).setRegistry(address)).to.be.revertedWithCustomError(
      pollContract,
      "RegistryAlreadyInitialized",
    );
  });

  it("should fail if non-owner tries to init the poll", async () => {
    await expect(pollContract.connect(user).init()).to.be.revertedWithCustomError(
      pollContract,
      "OwnableUnauthorizedAccount",
    );
  });

  it("should fail if owner tries to init the poll twice", async () => {
    await expect(pollContract.connect(owner).init()).not.to.be.revertedWithCustomError(pollContract, "PollAlreadyInit");
    await expect(pollContract.connect(owner).init()).to.be.revertedWithCustomError(pollContract, "PollAlreadyInit");
  });

  it("should publish message properly", async () => {
    const receipt = await pollContract
      .connect(user)
      .publishMessage(message.asContractParam(), key.asContractParam())
      .then((tx) => tx.wait());

    expect(receipt?.status).to.equal(1);
  });

  it("should fail when trying to merge message queue subroots before poll is over", async () => {
    await expect(pollContract.mergeMessageAqSubRoots(DEFAULT_SR_QUEUE_OPS)).to.be.revertedWithCustomError(
      pollContract,
      "VotingPeriodNotOver",
    );
  });

  it("should fail to publish a message if poll is over", async () => {
    await timeTravel(duration, owner);
    await expect(
      pollContract.connect(user).publishMessage(message.asContractParam(), key.asContractParam()),
    ).to.be.revertedWithCustomError(pollContract, "VotingPeriodOver");
  });

  it("should merge message queue subroots properly", async () => {
    const receipt = await pollContract.mergeMessageAqSubRoots(DEFAULT_SR_QUEUE_OPS).then((tx) => tx.wait());

    expect(receipt?.status).to.equal(1);
  });
});
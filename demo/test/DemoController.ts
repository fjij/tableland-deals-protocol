import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("DemoController", () => {
  async function deploy() {
    const [signer] = await ethers.getSigners();

    const DemoController = await ethers.getContractFactory("DemoController");
    const PolicyGetter = await ethers.getContractFactory("PolicyGetter");

    const demoController = await DemoController.deploy();
    const getter = await PolicyGetter.deploy();

    return { demoController, getter, signer };
  }

  it("Should return the right policy", async () => {
    const { demoController, getter, signer } = await loadFixture(deploy);

    const tx = await getter.getPolicy(demoController.address, signer.address);
    const receipt = await tx.wait();
    const { policy } = receipt.events!.find(
      (event) => event.event === "GetPolicy"
    )!.args!;
    expect(policy.allowInsert).to.be.true;
    expect(policy.allowUpdate).to.be.true;
    expect(policy.allowDelete).to.be.true;
    expect(policy.whereClause).to.eql(
      "owner = " + signer.address.toLowerCase()
    );
    expect(policy.withCheck).to.eql("owner = " + signer.address.toLowerCase());
    expect(policy.updatableColumns).to.eql(["owner"]);
  });
});

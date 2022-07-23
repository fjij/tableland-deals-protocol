import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  MockController,
  MockTables,
  PolicyGetter,
  TablelandDeals,
} from "../typechain-types";

describe("TablelandDeals", () => {
  interface Policy {
    allowInsert: boolean;
    allowUpdate: boolean;
    allowDelete: boolean;
    whereClause: string;
    withCheck: string;
    updatableColumns: string[];
  }

  function createPolicy(
    allowInsert: boolean,
    allowUpdate: boolean,
    allowDelete: boolean,
    whereClause: string,
    withCheck: string,
    updatableColumns: string[]
  ): Policy {
    return {
      allowInsert,
      allowUpdate,
      allowDelete,
      whereClause,
      withCheck,
      updatableColumns,
    };
  }

  async function deploy() {
    const ProxyController = await ethers.getContractFactory("ProxyController");
    const TablelandDeals = await ethers.getContractFactory("TablelandDeals");
    const MockTables = await ethers.getContractFactory("MockTables");
    const MockController = await ethers.getContractFactory("MockController");
    const PolicyGetter = await ethers.getContractFactory("PolicyGetter");

    const implementation = await ProxyController.deploy();
    const tables = await MockTables.deploy();
    const tablelandDeals = await TablelandDeals.deploy(
      tables.address,
      implementation.address
    );
    const controller = await MockController.deploy();
    const getter = await PolicyGetter.deploy();

    const [signer, other] = await ethers.getSigners();

    return { tablelandDeals, tables, controller, getter, signer, other };
  }

  it("can create a proxy", async () => {
    const { tablelandDeals } = await loadFixture(deploy);
    const tableId = 100;

    await expect(tablelandDeals.createProxy(tableId))
      .to.emit(tablelandDeals, "CreateProxy")
      .withArgs(tableId);

    const proxyAddress = await tablelandDeals.getProxy(tableId);
    const ProxyController = await ethers.getContractFactory("ProxyController");
    const proxy = ProxyController.attach(proxyAddress);
    expect(await proxy.tablelandDeals()).to.equal(tablelandDeals.address);
  });

  it("lets owners set controllers", async () => {
    const { tablelandDeals, signer, tables, controller } = await loadFixture(
      deploy
    );
    const tableId = 100;

    await expect(
      tablelandDeals.setController(tableId, controller.address)
    ).to.be.revertedWith("not table owner");

    await tables.setOwner(signer.address);

    await expect(tablelandDeals.setController(tableId, controller.address))
      .to.emit(tablelandDeals, "SetController")
      .withArgs(tableId, controller.address);

    expect(await tablelandDeals.getController(tableId)).to.eql(
      controller.address
    );
  });

  describe("deal execution", () => {
    interface UnsignedDeal {
      tableIds: number[];
      statements: string[];
      policies: Policy[];
      accounts: string[];
      salt: string;
    }

    interface Deal extends UnsignedDeal {
      signatures: string[];
    }

    async function signDeal(
      unsignedDeal: UnsignedDeal,
      signer: SignerWithAddress,
      tablelandDeals: TablelandDeals
    ) {
      const message = await tablelandDeals.computeMessage(
        unsignedDeal.tableIds,
        unsignedDeal.statements,
        unsignedDeal.policies,
        unsignedDeal.accounts,
        unsignedDeal.salt
      );
      return await signer.signMessage(ethers.utils.arrayify(message));
    }

    async function createDeal(
      signers: SignerWithAddress[],
      tablelandDeals: TablelandDeals,
      unsignedDeal: Partial<UnsignedDeal> = {}
    ): Promise<Deal> {
      const myUnsignedDeal: UnsignedDeal = {
        tableIds: [100, 200],
        statements: ["one", "two"],
        policies: [
          createPolicy(true, true, false, "", "", []),
          createPolicy(true, false, true, "", "", []),
        ],
        accounts: [signers[0].address, signers[1].address],
        salt: ethers.utils.id("SALT"),
        ...unsignedDeal,
      };
      const signatures = await Promise.all(
        signers.map((signer) =>
          signDeal(myUnsignedDeal, signer, tablelandDeals)
        )
      );
      return { ...myUnsignedDeal, signatures };
    }

    async function createProxies(
      deal: Deal,
      tablelandDeals: TablelandDeals,
      tables: MockTables
    ) {
      for (const tableId of deal.tableIds) {
        await tablelandDeals.createProxy(tableId);
        const proxyAddress = await tablelandDeals.getProxy(tableId);
        await tables.setController(tableId, proxyAddress);
      }
    }

    async function setPolicies(
      deal: Deal,
      tablelandDeals: TablelandDeals,
      tables: MockTables,
      controller: MockController,
      signer: SignerWithAddress
    ) {
      await tables.setOwner(signer.address);
      for (let i = 0; i < deal.tableIds.length; i++) {
        const tableId = deal.tableIds[i];
        const policy = deal.policies[i];
        const account = deal.accounts[i];
        await tablelandDeals.setController(tableId, controller.address);
        await controller.setPolicy(account, policy);
      }
    }

    async function executeDeal(deal: Deal, tablelandDeals: TablelandDeals) {
      return await tablelandDeals.executeDeal(
        deal.tableIds,
        deal.statements,
        deal.policies,
        deal.accounts,
        deal.salt,
        deal.signatures
      );
    }

    it("can execute a signed deal", async () => {
      const { tablelandDeals, tables, controller, signer, other } =
        await loadFixture(deploy);
      const deal = await createDeal([signer, other], tablelandDeals);
      await createProxies(deal, tablelandDeals, tables);
      await setPolicies(deal, tablelandDeals, tables, controller, signer);
      await expect(executeDeal(deal, tablelandDeals))
        .to.emit(tables, "RunSQL")
        .withArgs(tablelandDeals.address, deal.tableIds[0], deal.statements[0])
        .to.emit(tables, "RunSQL")
        .withArgs(tablelandDeals.address, deal.tableIds[1], deal.statements[1])
        .to.emit(tablelandDeals, "ExecuteDeal")
        .withArgs(
          deal.tableIds,
          deal.statements,
          anyValue,
          deal.accounts,
          deal.salt,
          deal.signatures
        );
    });

    it("reverts if the proxies are not set up", async () => {
      const { tablelandDeals, tables, controller, signer, other } =
        await loadFixture(deploy);
      const deal = await createDeal([signer, other], tablelandDeals);
      await setPolicies(deal, tablelandDeals, tables, controller, signer);
      await expect(executeDeal(deal, tablelandDeals)).to.be.revertedWith(
        "missing proxy"
      );
    });

    it("reverts if the deal was already executed", async () => {
      const { tablelandDeals, tables, controller, signer, other } =
        await loadFixture(deploy);
      const deal = await createDeal([signer, other], tablelandDeals);
      await createProxies(deal, tablelandDeals, tables);
      await setPolicies(deal, tablelandDeals, tables, controller, signer);
      await executeDeal(deal, tablelandDeals);
      await expect(executeDeal(deal, tablelandDeals)).to.be.revertedWith(
        "already executed"
      );
    });

    it("reverts if a signature is invalid", async () => {
      const { tablelandDeals, tables, controller, signer, other } =
        await loadFixture(deploy);
      const deal = await createDeal([signer, other], tablelandDeals);
      deal.signatures[1] = await signDeal(deal, signer, tablelandDeals);
      await createProxies(deal, tablelandDeals, tables);
      await setPolicies(deal, tablelandDeals, tables, controller, signer);
      await expect(executeDeal(deal, tablelandDeals)).to.be.revertedWith(
        "invalid signature"
      );
    });

    it("reverts if a policy is invalid", async () => {
      const { tablelandDeals, tables, controller, signer, other } =
        await loadFixture(deploy);
      const deal = await createDeal([signer, other], tablelandDeals);
      await createProxies(deal, tablelandDeals, tables);
      await setPolicies(
        {
          ...deal,
          policies: [
            createPolicy(true, true, true, "?", "?", ["100"]),
            createPolicy(true, true, true, "?", "?", ["100"]),
          ],
        },
        tablelandDeals,
        tables,
        controller,
        signer
      );
      await expect(executeDeal(deal, tablelandDeals)).to.be.revertedWith(
        "invalid policy"
      );
    });
  });

  describe("policy rules", () => {
    async function checkPolicy(
      expectedPolicy: Policy,
      caller: string,
      tableId: number,
      tablelandDeals: TablelandDeals,
      getter: PolicyGetter
    ) {
      await tablelandDeals.createProxy(tableId);
      const proxyAddress = await tablelandDeals.getProxy(tableId);
      const tx = await getter.getPolicy(proxyAddress, caller);
      const receipt = await tx.wait();
      const { policy } = receipt.events!.find(
        (event) => event.event === "GetPolicy"
      )!.args!;
      Object.entries(expectedPolicy).forEach(([k, v]) => {
        expect(policy[k]).to.eql(v);
      });
    }

    it("returns the allow policy for itself", async () => {
      const { tablelandDeals, getter } = await loadFixture(deploy);
      const tableId = 100;
      await checkPolicy(
        createPolicy(true, true, true, "", "", []),
        tablelandDeals.address,
        tableId,
        tablelandDeals,
        getter
      );
    });

    it("returns the deny policy for others", async () => {
      const { tablelandDeals, getter, other } = await loadFixture(deploy);
      const tableId = 100;
      await checkPolicy(
        createPolicy(false, false, false, "", "", []),
        other.address,
        tableId,
        tablelandDeals,
        getter
      );
    });

    it("returns the allow policy for the owner", async () => {
      const { tablelandDeals, tables, getter, signer } = await loadFixture(
        deploy
      );
      const tableId = 100;
      await tables.setOwner(signer.address);
      await checkPolicy(
        createPolicy(true, true, true, "", "", []),
        signer.address,
        tableId,
        tablelandDeals,
        getter
      );
    });

    it("returns the custom policy if set", async () => {
      const { tablelandDeals, tables, controller, getter, signer, other } =
        await loadFixture(deploy);
      const tableId = 100;
      await tables.setOwner(signer.address);
      await tablelandDeals.setController(tableId, controller.address);
      const policy = createPolicy(true, false, true, "a", "b", ["c"]);
      await controller.setPolicy(other.address, policy);
      await checkPolicy(policy, other.address, tableId, tablelandDeals, getter);
    });
  });
});

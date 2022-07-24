import { ethers } from "ethers";

export interface Policy {
  allowInsert: boolean;
  allowUpdate: boolean;
  allowDelete: boolean;
  whereClause: string;
  withCheck: string;
  updatableColumns: string[];
}

export function defaultPolicy(): Policy {
  return {
    allowInsert: false,
    allowUpdate: false,
    allowDelete: false,
    whereClause: "",
    withCheck: "",
    updatableColumns: [],
  };
}

export interface Step {
  tableId: ethers.BigNumberish;
  statement: string;
  policy: Policy;
  account: string;
}

export function defaultStep(): Step {
  return {
    tableId: 0,
    statement: "",
    account: "",
    policy: defaultPolicy(),
  };
}

export interface Deal {
  tableIds: string[];
  statements: string[];
  policies: Policy[];
  accounts: string[];
  salt: string;
  signatures: Record<string, string>;
}

export function makeDeal(steps: Step[], salt: string, signatures: Record<string, string>): Deal {
  const tableIds = steps.map((step, index) => {
    try {
      return ethers.BigNumber.from(step.tableId).toString();
    } catch {
      throw new Error(`Step #${index + 1}: Bad Table ID`);
    }
  });
  const statements = steps.map((step) => step.statement);
  const policies = steps.map((step) => step.policy);
  const accounts = steps.map((step, index) => {
    if (!ethers.utils.isAddress(step.account)) {
      throw new Error(`Step #${index + 1}: Bad Account`);
    }
    return step.account;
  });
  if (!ethers.utils.isBytesLike(salt) || salt.length !== 66) {
    throw new Error("Bad salt");
  }
  return { tableIds, statements, policies, accounts, salt, signatures };
}

export function unmakeDeal(deal: Deal): [steps: Step[], salt: string, signatures: Record<string, string>] {
  const steps: Step[] = [];
  for (let i = 0; i < deal.tableIds.length; i ++) {
    steps.push({
      tableId: deal.tableIds[i],
      statement: deal.statements[i],
      policy: deal.policies[i],
      account: deal.accounts[i],
    });
  }
  return [steps, deal.salt, deal.signatures];
}

export function serializeDeal(deal: Deal): string {
  return JSON.stringify(deal);
}

export function deserializeDeal(serializedDeal: string): Deal {
  return JSON.parse(serializedDeal);
}

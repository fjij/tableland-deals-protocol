import hardhat from "hardhat";
import { ethers } from "hardhat";

async function main() {
  const { network } = hardhat;

  if (network.config.chainId !== 80001) {
    throw new Error("deploy script only supports mumbai");
  }

  const ProxyController = await ethers.getContractFactory("ProxyController");
  const TablelandDeals = await ethers.getContractFactory("TablelandDeals");

  // Mumbai deployment
  const tablelandTablesAddress = "0x4b48841d4b32C4650E4ABc117A03FE8B51f38F68";

  const implementation = await ProxyController.deploy();
  await implementation.deployed();
  const tablelandDeals = await TablelandDeals.deploy(
    tablelandTablesAddress,
    implementation.address
  );
  await tablelandDeals.deployed();

  console.log(
    "ProxyController implementation deployed to:",
    implementation.address
  );
  console.log("TablelandDeals deployed to:", tablelandDeals.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

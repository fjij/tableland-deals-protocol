import { ethers } from "hardhat";

async function main() {
  const DemoController = await ethers.getContractFactory("DemoController");
  const demoController = await DemoController.deploy();

  await demoController.deployed();

  console.log("DemoController deployed to:", demoController.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import hardhat from "hardhat";
import { ethers } from "hardhat";
import { connect } from "@tableland/sdk";
import "./utils/fetch-polyfill";

async function main() {
  const [signer] = await ethers.getSigners();
  if (hardhat.network.config.chainId !== 80001) {
    throw new Error("Must be on mumbai");
  }
  const tableland = await connect({
    network: "testnet",
    chain: "polygon-mumbai",
    signer,
  });
  const name = "demo_80001_625";
  const id = Math.floor(Math.random() * 10000);
  const owner = signer.address;
  await tableland.write(
    `INSERT INTO ${name} (id, owner) VALUES (${id}, '${owner}');`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

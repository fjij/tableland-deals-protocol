import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import StepInput from "./StepInput";
import {
  Deal,
  defaultStep,
  deserializeDeal,
  makeDeal,
  serializeDeal,
  unmakeDeal,
} from "./types";
import CodeInput from "./CodeInput";
import { upload, get } from "./ipfs";
import TablelandDeals from "./contracts/TablelandDeals.json";

function App() {
  const [steps, setSteps] = useState([defaultStep()]);
  const [salt, setSalt] = useState(
    ethers.utils.hexlify(ethers.utils.randomBytes(32))
  );
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const readMode = location.pathname !== "/";
  const navigate = useNavigate();
  const disabled = location.pathname !== "/" || loading;
  const dealError = (() => {
    try {
      makeDeal(steps, salt, signatures);
      return undefined;
    } catch (e) {
      return (e as Error).message;
    }
  })();

  useEffect(() => {
    if (readMode) {
      (async () => {
        const serializedDeal = await get(
          "https://ipfs.io/ipfs" + location.pathname
        );
        const deal = deserializeDeal(serializedDeal);
        const [steps, salt, signatures] = unmakeDeal(deal);
        setSteps(steps);
        setSalt(salt);
        setSignatures(signatures);
      })();
    }
  }, [location, readMode]);

  async function save(deal: Deal) {
    setLoading(true);
    const serializedDeal = serializeDeal(deal);
    const url = await upload(serializedDeal);
    const cid = url.substring("https://ipfs.io/ipfs/".length);
    console.log(cid);
    setLoading(false);
    navigate("/" + cid);
  }

  const allSignaturesPresent =
    steps.map((s) => s.account.toLowerCase()).filter((a) => !signatures[a]).length === 0;

  async function getEth() {
    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    );
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    return {
      contract: new ethers.Contract(
        TablelandDeals.address,
        TablelandDeals.abi,
        signer
      ),
      signer,
    };
  }

  async function sign(deal: Deal) {
    setLoading(true);
    const { contract, signer } = await getEth();
    const message = await contract.computeMessage(
      deal.tableIds,
      deal.statements,
      deal.policies,
      deal.accounts,
      deal.salt,
    );
    const signature = await signer.signMessage(ethers.utils.arrayify(message));
    const account = await signer.getAddress();
    deal.signatures = { ...deal.signatures, [account.toLowerCase()]: signature };
    setSignatures(deal.signatures);
    await save(deal);
  }

  async function submit(deal: Deal) {
    setLoading(true);
    const { contract } = await getEth();
    const sigs: string[] = [];
    for (const account of deal.accounts) {
      sigs.push(deal.signatures[account.toLowerCase()]);
    }
    console.log(sigs);
    await contract.executeDeal(
      deal.tableIds,
      deal.statements,
      deal.policies,
      deal.accounts,
      deal.salt,
      sigs,
    );
    setLoading(false);
  }

  return (
    <div className="App">
      <h1>Deal Writer</h1>
      <i>for Tableland Deals Protocol</i>
      <p>
        <b>Salt:</b>{" "}
        <CodeInput
          value={salt}
          disabled={disabled}
          onChange={setSalt}
          placeholder={ethers.utils.id("SALT")}
        />
      </p>
      <div className="vflex">
        {steps.map((step, index) => (
          <StepInput
            signed={readMode && !!signatures[step.account.toLowerCase()]}
            disabled={disabled}
            key={index}
            index={index}
            value={step}
            onChange={(v) =>
              setSteps((steps) => {
                steps[index] = v;
                return [...steps];
              })
            }
            onDelete={() =>
              setSteps((steps) => {
                return [...steps.filter((_, i) => i !== index)];
              })
            }
          />
        ))}
        <div className="hflex">
          <button
            disabled={disabled}
            style={{ flexGrow: 1 }}
            className="new-step"
            onClick={() => setSteps((steps) => [...steps, defaultStep()])}
          >
            +
          </button>
        </div>
      </div>
      <p>
        {dealError && <b className="error">{dealError}</b>}
        {!dealError && !readMode && (
          <button
            disabled={disabled}
            className="save"
            onClick={() => save(makeDeal(steps, salt, signatures))}
          >
            Save
          </button>
        )}
        {readMode && !allSignaturesPresent && (
          <button
            disabled={loading}
            className="save"
            onClick={() => sign(makeDeal(steps, salt, signatures))}
          >
            Sign
          </button>
        )}
        {readMode && allSignaturesPresent && (
          <button
            disabled={loading}
            className="save"
            onClick={() => submit(makeDeal(steps, salt, signatures))}
          >
            Submit
          </button>
        )}
      </p>
      <a href="https://github.com/fjij/hackfs2022">Github</a>
    </div>
  );
}

export default App;

import React from "react";
import { ethers } from "ethers";
import PolicyInput from "./PolicyInput";
import { defaultStep, Step } from "./types";
import CodeInput from "./CodeInput";

interface StepInputProps {
  disabled?: boolean;
  signed?: boolean;
  value?: Step;
  index: number;
  onChange?: (value: Step) => void;
  onDelete?: () => void;
}

export default function StepInput({
  index,
  value,
  onChange,
  onDelete,
  disabled,
  signed,
}: StepInputProps) {
  const step: Step = value || defaultStep();
  const update = onChange || (() => {});
  const del = onDelete || (() => {});
  return (
    <div className="StepInput">
      <div className="hflex">
        <h2 className="step-index">{signed ? "✅" :((index + 1).toString() + ".") }</h2>
        <table style={{ flexGrow: 1 }}>
          <tbody>
          <tr>
            <th>Table ID</th>
            <td>
              <CodeInput
                value={ethers.BigNumber.from(step.tableId).toString()}
                disabled={disabled}
                onChange={(v) => {
                  try {
                    update({ ...step, tableId: ethers.BigNumber.from(v) });
                  } catch {
                    update({ ...step, tableId: 0 });
                  }
                }}
              />
            </td>
          </tr>
          <tr>
            <th>SQL</th>
            <td>
              <CodeInput
                value={step.statement}
                disabled={disabled}
                placeholder="INSERT INTO quickstart_5_74 VALUES (0, 'Bobby Tables')"
                onChange={(v) => update({ ...step, statement: v })}
              />
            </td>
          </tr>
          <tr>
            <th>Account</th>
            <td>
              <CodeInput
                value={step.account}
                disabled={disabled}
                placeholder={ethers.constants.AddressZero}
                onChange={(v) => update({ ...step, account: v })}
              />
            </td>
          </tr>
          </tbody>
        </table>
        <div style={{ flexGrow: 1 }}>
          <PolicyInput
            value={step.policy}
            disabled={disabled}
            onChange={(policy) => update({ ...step, policy })}
          />
        </div>
        <button
          style={{ flexGrow: 0 }}
          className="delete-step"
          onClick={del}
          disabled={disabled}
        >
          ×
        </button>
      </div>
    </div>
  );
}

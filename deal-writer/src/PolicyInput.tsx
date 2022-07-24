import React from "react";
import CodeInput from "./CodeInput";
import { defaultPolicy, Policy } from "./types";

interface PolicyInputProps {
  disabled?: boolean;
  value?: Policy;
  onChange?: (value: Policy) => void;
}

export default function PolicyInput({
  disabled,
  value,
  onChange,
}: PolicyInputProps) {
  const policy: Policy = value || defaultPolicy();
  const update = onChange || (() => {});
  return (
    <div className="PolicyInput">
      <table>
        <tr>
          <th colSpan={2}>Policy</th>
        </tr>
        <tr>
          <td>
            <input
              type="checkbox"
              checked={policy.allowInsert}
              disabled={disabled}
              onChange={(e) =>
                update({ ...policy, allowInsert: e.target.checked })
              }
            />
            <code>insert</code>
          </td>
          <td>
            <CodeInput
              label="WHERE"
              disabled={disabled}
              placeholder="none"
              value={policy.whereClause}
              onChange={(v) => update({ ...policy, whereClause: v })}
            />
          </td>
        </tr>
        <tr>
          <td>
            <input
              type="checkbox"
              disabled={disabled}
              checked={policy.allowUpdate}
              onChange={(e) =>
                update({ ...policy, allowUpdate: e.target.checked })
              }
            />
            <code>update</code>
          </td>
          <td>
            <CodeInput
              label="CHECK"
              disabled={disabled}
              placeholder="none"
              value={policy.withCheck}
              onChange={(v) => update({ ...policy, withCheck: v })}
            />
          </td>
        </tr>
        <tr>
          <td>
            <input
              type="checkbox"
              disabled={disabled}
              checked={policy.allowDelete}
              onChange={(e) =>
                update({ ...policy, allowDelete: e.target.checked })
              }
            />
            <code>delete</code>
          </td>
          <td>
            <span>
              <code>ALLOW</code>{" "}
              {[...policy.updatableColumns, ""].map((value, index) => (
                <CodeInput
                  disabled={disabled}
                  key={index}
                  placeholder="none"
                  value={value}
                  onChange={(text) => {
                    const updatableColumns = [...policy.updatableColumns];
                    if (index >= updatableColumns.length) {
                      updatableColumns.push(text);
                    } else {
                      updatableColumns[index] = text;
                    }
                    update({
                      ...policy,
                      updatableColumns: updatableColumns.filter(
                        (v) => v !== ""
                      ),
                    });
                  }}
                />
              ))}
            </span>
          </td>
        </tr>
      </table>
    </div>
  );
}

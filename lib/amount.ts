export const shelbyUsdMicroUnits = BigInt(1_000_000);

export function amountToMicroUnits(amount: number | string) {
  const value = String(amount).trim();
  if (!/^\d+(\.\d{1,6})?$/.test(value)) {
    throw new Error("Invalid ShelbyUSD amount.");
  }
  const [whole, decimal = ""] = value.split(".");
  return BigInt(whole) * shelbyUsdMicroUnits + BigInt(decimal.padEnd(6, "0"));
}

export function microUnitsToAmount(value: bigint | number | string) {
  const units = BigInt(value);
  const whole = units / shelbyUsdMicroUnits;
  const decimal = String(units % shelbyUsdMicroUnits).padStart(6, "0").replace(/0+$/, "");
  return Number(decimal ? `${whole}.${decimal}` : whole.toString());
}

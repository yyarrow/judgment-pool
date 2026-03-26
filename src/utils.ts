export function cx(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}
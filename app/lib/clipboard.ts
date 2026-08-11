export async function copyText(value: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    await Promise.race([
      navigator.clipboard.writeText(value),
      new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("Clipboard timed out")), 800),
      ),
    ]);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  }
}

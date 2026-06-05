const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { execFile } = require("node:child_process");

async function loadConfig() {
  const configPath = path.join(__dirname, "config.json");
  try {
    return JSON.parse(await fs.readFile(configPath, "utf8"));
  } catch {
    return {};
  }
}

let CONFIG = {};
let API = "";
let TOKEN = "";
let AGENT_ID = "";
let POLL_MS = 5000;
let DEFAULT_PRINTER = "";

function runPowerShell(args) {
  return new Promise((resolve, reject) => {
    execFile("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", ...args], {
      windowsHide: true,
      timeout: 30000,
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout);
      }
    });
  });
}

async function listPrinters() {
  const script = "Get-Printer | Select-Object -ExpandProperty Name";
  const out = await runPowerShell(["-Command", script]);
  console.log(out.trim() || "Nenhuma impressora encontrada.");
}

async function claimJobs() {
  const res = await fetch(`${API}/print-agent/jobs/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: TOKEN, agent_id: AGENT_ID, limit: 3 }),
  });
  if (!res.ok) throw new Error(`claim failed: ${res.status} ${await res.text()}`);
  return (await res.json()).jobs || [];
}

async function completeJob(job, success, error = null) {
  const res = await fetch(`${API}/print-agent/jobs/${job.id}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: TOKEN, agent_id: AGENT_ID, success, error }),
  });
  if (!res.ok) throw new Error(`complete failed: ${res.status} ${await res.text()}`);
}

async function printText(text, printerName) {
  const file = path.join(os.tmpdir(), `eg-delivery-order-${Date.now()}.txt`);
  await fs.writeFile(file, text, "utf8");
  try {
    const script = [
      "& {",
      "param($File, $Printer)",
      "if ($Printer -and $Printer.Trim().Length -gt 0) {",
      "  Get-Content -LiteralPath $File | Out-Printer -Name $Printer",
      "} else {",
      "  Get-Content -LiteralPath $File | Out-Printer",
      "}",
      "}",
    ].join(" ");
    await runPowerShell(["-Command", script, file, printerName || ""]);
  } finally {
    await fs.rm(file, { force: true });
  }
}

async function processJob(job) {
  const payload = job.payload || {};
  const copies = Math.max(1, Math.min(Number(payload.copies || 1), 5));
  const printerName = DEFAULT_PRINTER || payload.printer_name || "";
  const text = payload.text || (payload.lines || []).join("\n");

  if (!text.trim()) throw new Error("job sem texto para imprimir");
  for (let i = 0; i < copies; i += 1) {
    await printText(text, printerName);
  }
}

async function tick() {
  const jobs = await claimJobs();
  for (const job of jobs) {
    try {
      console.log(`[EG Print] imprimindo pedido #${job.order_number} (${job.id})`);
      await processJob(job);
      await completeJob(job, true);
      console.log(`[EG Print] pedido #${job.order_number} impresso`);
    } catch (error) {
      await completeJob(job, false, error.message);
      console.error(`[EG Print] falha no pedido #${job.order_number}: ${error.message}`);
    }
  }
}

async function main() {
  CONFIG = await loadConfig();
  API = process.env.EG_PRINT_API || CONFIG.api || "http://localhost:8000/api";
  TOKEN = process.env.EG_PRINT_TOKEN || CONFIG.token || "";
  AGENT_ID = process.env.EG_PRINT_AGENT_ID || CONFIG.agent_id || `${os.hostname()}-eg-print-agent`;
  POLL_MS = Number(process.env.EG_PRINT_POLL_MS || CONFIG.poll_ms || 5000);
  DEFAULT_PRINTER = process.env.EG_PRINTER_NAME || CONFIG.printer_name || "";

  if (process.argv.includes("--list-printers")) {
    await listPrinters();
    return;
  }
  if (!TOKEN) {
    console.error("Defina EG_PRINT_TOKEN com o token exibido em Configuracoes > Impressao.");
    process.exit(1);
  }

  console.log(`[EG Print] agente iniciado: ${AGENT_ID}`);
  console.log(`[EG Print] API: ${API}`);
  console.log(`[EG Print] impressora: ${DEFAULT_PRINTER || "padrao do Windows"}`);

  await tick().catch((error) => console.error(`[EG Print] ${error.message}`));
  setInterval(() => tick().catch((error) => console.error(`[EG Print] ${error.message}`)), POLL_MS);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

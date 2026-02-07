const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // 1. Alamat kontrak yang sudah di-deploy (ambil dari log deploy sebelumnya)
  const controllerAddress = "0x..."; 
  const subscriptionId = "YOUR_SUBSCRIPTION_ID"; // ID dari functions.chain.link
  
  // 2. Load source code JavaScript AI yang akan dijalankan di node Chainlink
  const source = fs.readFileSync(
    path.join(__dirname, "../functions/ai_market_analyst.js"),
    "utf8"
  );

  // 3. Konfigurasi Gas dan DonID (tergantung network, misal Arbitrum Sepolia)
  const gasLimit = 300000;
  const donID = hre.ethers.encodeBytes32String("fun-arbitrum-sepolia-1");

  // 4. Inisialisasi Kontrak
  const AegisAIController = await hre.ethers.getContractAt("AegisAIController", controllerAddress);

  console.log("Mengirim permintaan analisis ke AI Agent Aegis...");

  // 5. Eksekusi Request
  // Parameter '0x' di bawah adalah tempat untuk Secrets (Confidential HTTP)
  const tx = await AegisAIController.requestMarketAnalysis(
    source,
    "0x", // Nanti diisi secrets terenkripsi per 14 Feb
    subscriptionId,
    gasLimit,
    donID
  );

  console.log("Transaksi dikirim! Hash:", tx.hash);
  
  // Tunggu konfirmasi
  const receipt = await tx.wait();
  console.log("Analisis AI telah dipicu. Menunggu callback dari node Chainlink...");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
             

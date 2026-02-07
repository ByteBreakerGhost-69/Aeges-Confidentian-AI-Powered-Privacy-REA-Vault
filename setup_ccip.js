const hre = require("hardhat");

async function main() {
  const controllerAddress = "0x..."; // Alamat AegisAIController kamu
  const targetChainSelector = "34784872381725123"; // ID khusus Chainlink untuk network tujuan (misal: Optimism Sepolia)
  
  // Inisialisasi kontrak
  const AegisAIController = await hre.ethers.getContractAt("AegisAIController", controllerAddress);

  console.log("Mengonfigurasi CCIP untuk koneksi antar-chain...");

  // 1. Izinkan Chain tujuan untuk mengirim/menerima pesan
  // Fungsi 'allowlistDestinationChain' harus ada di kontrakmu jika menggunakan CCIP
  const tx = await AegisAIController.allowlistDestinationChain(targetChainSelector, true);
  await tx.wait();

  console.log(`Chain ${targetChainSelector} sekarang telah diizinkan (Allowlisted).`);

  // 2. (Opsional) Set biaya gas untuk pengiriman pesan lintas chain
  console.log("Pengaturan CCIP selesai. Aegis sekarang siap beroperasi secara Omnichain!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

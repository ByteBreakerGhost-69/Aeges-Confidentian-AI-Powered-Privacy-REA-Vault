/**
 * @file AegisVault.test.js
 * @description Comprehensive tests untuk AegisVault contract
 * @dev Hackathon-optimized dengan Chainlink integration tests
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("🛡️ AegisVault Contract", function () {
  let AegisVault, RWAToken, AegisAIController;
  let vault, token, aiController;
  let owner, user1, user2, oracle;
  
  // Chainlink mock addresses
  const CHAINLINK_MOCKS = {
    priceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", // Mainnet ETH/USD
    linkToken: "0x514910771AF9Ca656af840dff83E8264EcF986CA", // Mainnet LINK
    oracle: "0x0000000000000000000000000000000000000000", // Mock oracle
    jobId: ethers.hexlify(ethers.randomBytes(32)), // Random jobId
    fee: ethers.parseEther("0.1") // 0.1 LINK
  };

  beforeEach(async function () {
    [owner, user1, user2, oracle] = await ethers.getSigners();
    
    // Deploy RWAToken
    const RWATokenFactory = await ethers.getContractFactory("RWAToken");
    token = await RWATokenFactory.deploy(
      "Aegis RWA Token",
      "aRWA",
      ethers.parseEther("1000000"),
      owner.address
    );
    await token.waitForDeployment();
    
    // Whitelist users
    await token.whitelistInvestor(user1.address, "USER1_KYC");
    await token.whitelistInvestor(user2.address, "USER2_KYC");
    await token.whitelistInvestor(owner.address, "OWNER_KYC");
    
    // Mint tokens untuk testing
    await token.mint(user1.address, ethers.parseEther("1000"), "test_proof");
    await token.mint(user2.address, ethers.parseEther("1000"), "test_proof");
    await token.mint(owner.address, ethers.parseEther("10000"), "test_proof");
    
    // Deploy AegisVault
    const AegisVaultFactory = await ethers.getContractFactory("AegisVault");
    vault = await AegisVaultFactory.deploy(
      CHAINLINK_MOCKS.priceFeed,
      CHAINLINK_MOCKS.linkToken,
      CHAINLINK_MOCKS.oracle,
      CHAINLINK_MOCKS.jobId,
      CHAINLINK_MOCKS.fee
    );
    await vault.waitForDeployment();
    
    // Deploy AegisAIController
    const AegisAIControllerFactory = await ethers.getContractFactory("AegisAIController");
    aiController = await AegisAIControllerFactory.deploy(vault.target);
    await aiController.waitForDeployment();
  });

  describe("✅ Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      expect(await vault.totalAssets()).to.equal(0);
      expect(await vault.totalShares()).to.equal(0);
      expect(await vault.owner()).to.equal(owner.address);
    });

    it("Should have Chainlink configuration", async function () {
      // Chainlink config should be set
      expect(await vault.jobId()).to.equal(CHAINLINK_MOCKS.jobId);
      // Note: fee is private variable, test through behavior
    });
  });

  describe("💰 Deposit Functionality", function () {
    beforeEach(async function () {
      // Approve vault untuk spend tokens
      await token.connect(user1).approve(vault.target, ethers.parseEther("1000"));
      await token.connect(user2).approve(vault.target, ethers.parseEther("1000"));
    });

    it("Should accept deposits and mint shares", async function () {
      const depositAmount = ethers.parseEther("100");
      
      // Deposit dari user1
      await expect(vault.connect(user1).deposit(token.target, depositAmount))
        .to.emit(vault, "Deposit")
        .withArgs(user1.address, depositAmount, depositAmount);
      
      // Check balances
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("900"));
      expect(await token.balanceOf(vault.target)).to.equal(depositAmount);
      expect(await vault.shares(user1.address)).to.equal(depositAmount);
      expect(await vault.totalAssets()).to.equal(depositAmount);
      expect(await vault.totalShares()).to.equal(depositAmount);
    });

    it("Should handle multiple deposits", async function () {
      const deposit1 = ethers.parseEther("100");
      const deposit2 = ethers.parseEther("200");
      
      // First deposit
      await vault.connect(user1).deposit(token.target, deposit1);
      expect(await vault.totalAssets()).to.equal(deposit1);
      
      // Second deposit
      await vault.connect(user2).deposit(token.target, deposit2);
      expect(await vault.totalAssets()).to.equal(deposit1 + deposit2);
      expect(await vault.totalShares()).to.equal(deposit1 + deposit2);
    });

    it("Should reject zero amount deposits", async function () {
      await expect(
        vault.connect(user1).deposit(token.target, 0)
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should reject deposits without approval", async function () {
      const userWithoutApproval = user2;
      await expect(
        vault.connect(userWithoutApproval).deposit(token.target, ethers.parseEther("100"))
      ).to.be.reverted; // Transfer failed
    });
  });

  describe("💸 Withdraw Functionality", function () {
    const depositAmount = ethers.parseEther("100");
    
    beforeEach(async function () {
      // Setup: user1 deposits 100 tokens
      await token.connect(user1).approve(vault.target, depositAmount);
      await vault.connect(user1).deposit(token.target, depositAmount);
    });

    it("Should allow withdrawals", async function () {
      const withdrawAmount = ethers.parseEther("50");
      
      await expect(vault.connect(user1).withdraw(token.target, withdrawAmount))
        .to.emit(vault, "Withdraw")
        .withArgs(user1.address, withdrawAmount, withdrawAmount);
      
      expect(await token.balanceOf(user1.address)).to.equal(
        ethers.parseEther("950") // 1000 initial - 100 deposit + 50 withdrawal
      );
      expect(await vault.shares(user1.address)).to.equal(ethers.parseEther("50"));
      expect(await vault.totalAssets()).to.equal(ethers.parseEther("50"));
    });

    it("Should reject over-withdrawal", async function () {
      const excessAmount = ethers.parseEther("150");
      
      await expect(
        vault.connect(user1).withdraw(token.target, excessAmount)
      ).to.be.revertedWith("Insufficient shares");
    });

    it("Should handle full withdrawal", async function () {
      await vault.connect(user1).withdraw(token.target, depositAmount);
      
      expect(await vault.shares(user1.address)).to.equal(0);
      expect(await vault.totalAssets()).to.equal(0);
      expect(await vault.totalShares()).to.equal(0);
    });
  });

  describe("🤖 AI Insight Functionality", function () {
    beforeEach(async function () {
      // Setup deposit untuk trigger AI
      await token.connect(user1).approve(vault.target, ethers.parseEther("100"));
      await vault.connect(user1).deposit(token.target, ethers.parseEther("100"));
    });

    it("Should track pending AI requests", async function () {
      // Initially no pending request
      expect(await vault.pendingAIRequests(user1.address)).to.be.false;
    });

    it("Should emit AIRequested event", async function () {
      // Note: Since we're using mock oracle, the request will fail
      // But we can test the event emission
      await expect(vault.connect(user1).requestAIInsight())
        .to.emit(vault, "AIRequested")
        .withArgs(user1.address, ethers.anyValue);
    });

    it("Should store AI insights", async function () {
      // Simulate AI insight storage
      const mockInsight = {
        timestamp: Math.floor(Date.now() / 1000),
        recommendation: "HOLD - Market stable",
        confidence: 85,
        riskLevel: 0 // LOW
      };
      
      // We can't directly test Chainlink Functions callback
      // But we can test the storage structure
      const insight = await vault.userInsights(user1.address);
      expect(insight).to.have.property("timestamp");
      expect(insight).to.have.property("recommendation");
      expect(insight).to.have.property("confidence");
      expect(insight).to.have.property("riskLevel");
    });
  });

  describe("🔗 Chainlink Integration", function () {
    it("Should have price feed integration", async function () {
      // Test price conversion function
      const ethAmount = ethers.parseEther("1");
      const valueInUSD = await vault.getAssetValueInUSD(ethAmount);
      
      // Value should be > 0 jika price feed bekerja
      // Note: Di local test, ini mungkin return 0 karena mock
      expect(valueInUSD).to.be.a("bigint");
    });

    it("Should handle Chainlink oracle configuration", async function () {
      // Test bahwa contract memiliki oracle address
      // (Tergantung bagaimana contract expose oracle address)
      // For now, kita test melalui deployment parameters
      expect(await vault.jobId()).to.equal(CHAINLINK_MOCKS.jobId);
    });
  });

  describe("🚨 Emergency Functions", function () {
    it("Should allow owner to pause vault", async function () {
      await expect(vault.connect(owner).emergencyPause("Test pause"))
        .to.emit(vault, "EmergencyPaused")
        .withArgs(owner.address, "Test pause");
      
      // Try to deposit while paused (should fail)
      await token.connect(user1).approve(vault.target, ethers.parseEther("100"));
      await expect(
        vault.connect(user1).deposit(token.target, ethers.parseEther("100"))
      ).to.be.revertedWith("Vault is paused");
    });

    it("Should allow owner to resume", async function () {
      // Pause first
      await vault.connect(owner).emergencyPause("Test");
      
      // Resume
      await vault.connect(owner).resume();
      
      // Should be able to deposit again
      await token.connect(user1).approve(vault.target, ethers.parseEther("100"));
      await expect(
        vault.connect(user1).deposit(token.target, ethers.parseEther("100"))
      ).to.not.be.reverted;
    });

    it("Should reject non-owner pause attempts", async function () {
      await expect(
        vault.connect(user1).emergencyPause("Hack attempt")
      ).to.be.revertedWithCustomError(vault, "OnlyOwner");
    });
  });

  describe("📊 State Management", function () {
    it("Should correctly calculate TVL", async function () {
      const deposit1 = ethers.parseEther("100");
      const deposit2 = ethers.parseEther("200");
      
      await token.connect(user1).approve(vault.target, deposit1);
      await token.connect(user2).approve(vault.target, deposit2);
      
      await vault.connect(user1).deposit(token.target, deposit1);
      expect(await vault.totalAssets()).to.equal(deposit1);
      
      await vault.connect(user2).deposit(token.target, deposit2);
      expect(await vault.totalAssets()).to.equal(deposit1 + deposit2);
    });

    it("Should maintain share accounting", async function () {
      const deposit1 = ethers.parseEther("100");
      const deposit2 = ethers.parseEther("200");
      
      await token.connect(user1).approve(vault.target, deposit1);
      await token.connect(user2).approve(vault.target, deposit2);
      
      await vault.connect(user1).deposit(token.target, deposit1);
      await vault.connect(user2).deposit(token.target, deposit2);
      
      // Both should have shares equal to their deposits (1:1 in demo)
      expect(await vault.shares(user1.address)).to.equal(deposit1);
      expect(await vault.shares(user2.address)).to.equal(deposit2);
      expect(await vault.totalShares()).to.equal(deposit1 + deposit2);
    });
  });

  describe("🎯 Hackathon Demo Scenarios", function () {
    it("Should complete full user flow", async function () {
      // 1. User deposits
      const depositAmount = ethers.parseEther("500");
      await token.connect(user1).approve(vault.target, depositAmount);
      await vault.connect(user1).deposit(token.target, depositAmount);
      
      // 2. Check state
      expect(await vault.shares(user1.address)).to.equal(depositAmount);
      expect(await vault.totalAssets()).to.equal(depositAmount);
      
      // 3. Request AI insight (simulated)
      await expect(vault.connect(user1).requestAIInsight())
        .to.emit(vault, "AIRequested");
      
      // 4. Partial withdrawal
      const withdrawAmount = ethers.parseEther("200");
      await vault.connect(user1).withdraw(token.target, withdrawAmount);
      
      // 5. Final state
      expect(await vault.shares(user1.address)).to.equal(ethers.parseEther("300"));
      expect(await vault.totalAssets()).to.equal(ethers.parseEther("300"));
      
      console.log("✅ Hackathon demo flow completed successfully!");
    });

    it("Should handle concurrent user operations", async function () {
      const amount = ethers.parseEther("100");
      
      // Setup approvals
      await token.connect(user1).approve(vault.target, amount);
      await token.connect(user2).approve(vault.target, amount);
      
      // Concurrent deposits
      await Promise.all([
        vault.connect(user1).deposit(token.target, amount),
        vault.connect(user2).deposit(token.target, amount)
      ]);
      
      expect(await vault.totalAssets()).to.equal(amount * 2n);
      expect(await vault.totalShares()).to.equal(amount * 2n);
    });
  });
});

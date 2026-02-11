/**
 * @file AegisAI.test.js
 * @description Tests untuk AegisAIController dengan Chainlink Automation
 * @dev Tests automation, AI models, dan scheduled analysis
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("🤖 AegisAIController Contract", function () {
  let AegisVault, RWAToken, AegisAIController;
  let vault, token, aiController;
  let owner, user1, automationRegistry;
  
  // Mock Chainlink Automation
  const MOCK_UPKEEP_ID = 12345;

  beforeEach(async function () {
    [owner, user1, automationRegistry] = await ethers.getSigners();
    
    // Deploy RWAToken
    const RWATokenFactory = await ethers.getContractFactory("RWAToken");
    token = await RWATokenFactory.deploy(
      "Aegis RWA Token",
      "aRWA",
      ethers.parseEther("1000000"),
      owner.address
    );
    await token.waitForDeployment();
    
    // Deploy AegisVault (simplified tanpa Chainlink untuk testing)
    const AegisVaultFactory = await ethers.getContractFactory("AegisVault");
    vault = await AegisVaultFactory.deploy(
      ethers.ZeroAddress, // priceFeed
      ethers.ZeroAddress, // linkToken
      ethers.ZeroAddress, // oracle
      "0x", // jobId
      0 // fee
    );
    await vault.waitForDeployment();
    
    // Setup mock vault state
    await vault.setTotalAssets(ethers.parseEther("10000")); // Mock function
    
    // Deploy AegisAIController
    const AegisAIControllerFactory = await ethers.getContractFactory("AegisAIController");
    aiController = await AegisAIControllerFactory.deploy(vault.target);
    await aiController.waitForDeployment();
  });

  describe("✅ Deployment", function () {
    it("Should deploy with correct vault reference", async function () {
      expect(await aiController.vault()).to.equal(vault.target);
    });

    it("Should have default AI model", async function () {
      const model = await aiController.getActiveModel();
      expect(model.version).to.equal("v1.0");
      expect(model.accuracy).to.equal(85);
      expect(model.active).to.be.true;
    });

    it("Should have default intervals", async function () {
      expect(await aiController.analysisInterval()).to.equal(24 * 60 * 60); // 1 day
      expect(await aiController.minTVLToAnalyze()).to.equal(ethers.parseEther("10"));
    });
  });

  describe("⏰ Chainlink Automation Integration", function () {
    beforeEach(async function () {
      // Set lastAnalysisTime ke 2 hari yang lalu
      const twoDaysAgo = (await time.latest()) - (2 * 24 * 60 * 60);
      await aiController.setLastAnalysisTime(twoDaysAgo);
    });

    it("Should detect when upkeep is needed", async function () {
      // Setup: TVL cukup tinggi, sudah lewat interval
      await vault.setTotalAssets(ethers.parseEther("10000"));
      
      const [upkeepNeeded, performData] = await aiController.checkUpkeep("0x");
      
      expect(upkeepNeeded).to.be.true;
      expect(performData).to.not.equal("0x");
    });

    it("Should not need upkeep if TVL too low", async function () {
      // Setup: TVL terlalu rendah
      await vault.setTotalAssets(ethers.parseEther("5"));
      
      const [upkeepNeeded] = await aiController.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.false;
    });

    it("Should not need upkeep if not enough time passed", async function () {
      // Setup: baru saja analyze
      await aiController.setLastAnalysisTime(await time.latest());
      await vault.setTotalAssets(ethers.parseEther("10000"));
      
      const [upkeepNeeded] = await aiController.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.false;
    });

    it("Should perform upkeep when called", async function () {
      // Setup kondisi untuk upkeep
      await vault.setTotalAssets(ethers.parseEther("15000"));
      const currentTVL = await vault.totalAssets();
      const analysisTime = await time.latest();
      
      const performData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"],
        [currentTVL, analysisTime]
      );
      
      await expect(aiController.performUpkeep(performData))
        .to.emit(aiController, "AnalysisTriggered")
        .withArgs(ethers.anyValue, currentTVL);
      
      // Last analysis time should be updated
      expect(await aiController.lastAnalysisTime()).to.be.closeTo(
        await time.latest(),
        5 // Allow 5 second variance
      );
    });

    it("Should reject invalid performUpkeep", async function () {
      // Try to perform upkeep dengan kondisi tidak terpenuhi
      await expect(
        aiController.performUpkeep("0x")
      ).to.be.revertedWith("Not enough time passed");
    });
  });

  describe("🧠 AI Model Management", function () {
    it("Should allow adding new AI models", async function () {
      const newVersion = "v2.0-advanced";
      const newAccuracy = 92;
      
      await expect(aiController.connect(owner).addAIModel(newVersion, newAccuracy))
        .to.emit(aiController, "ModelUpdated")
        .withArgs(1, newVersion); // modelId 1 (0-based + 1 untuk event?)
      
      const newModel = await aiController.getActiveModel();
      expect(newModel.version).to.equal(newVersion);
      expect(newModel.accuracy).to.equal(newAccuracy);
      expect(newModel.active).to.be.true;
    });

    it("Should deactivate old models when adding new one", async function () {
      // Add first model
      await aiController.connect(owner).addAIModel("v1.5", 88);
      const model1 = await aiController.aiModels(1);
      expect(model1.active).to.be.true;
      
      // Add second model - should deactivate first
      await aiController.connect(owner).addAIModel("v2.0", 92);
      const model1Updated = await aiController.aiModels(1);
      const model2 = await aiController.aiModels(2);
      
      expect(model1Updated.active).to.be.false;
      expect(model2.active).to.be.true;
      expect(await aiController.activeModelId()).to.equal(2);
    });

    it("Should reject non-admin model additions", async function () {
      await expect(
        aiController.connect(user1).addAIModel("hacked-model", 99)
      ).to.be.reverted; // Access control
    });
  });

  describe("⚙️ Configuration Management", function () {
    it("Should allow owner to update analysis interval", async function () {
      const newInterval = 12 * 60 * 60; // 12 hours
      
      await aiController.connect(owner).setAnalysisInterval(newInterval);
      expect(await aiController.analysisInterval()).to.equal(newInterval);
    });

    it("Should reject too short interval", async function () {
      const tooShort = 30 * 60; // 30 minutes
      
      await expect(
        aiController.connect(owner).setAnalysisInterval(tooShort)
      ).to.be.revertedWith("Interval too short");
    });

    it("Should reject too long interval", async function () {
      const tooLong = 8 * 24 * 60 * 60; // 8 days
      
      await expect(
        aiController.connect(owner).setAnalysisInterval(tooLong)
      ).to.be.revertedWith("Interval too long");
    });

    it("Should reject non-admin configuration changes", async function () {
      await expect(
        aiController.connect(user1).setAnalysisInterval(24 * 60 * 60)
      ).to.be.reverted; // Access control
    });
  });

  describe("📊 Model Performance Tracking", function () {
    it("Should track multiple AI models", async function () {
      // Add multiple models
      await aiController.connect(owner).addAIModel("v1.5-beta", 87);
      await aiController.connect(owner).addAIModel("v2.0-stable", 91);
      await aiController.connect(owner).addAIModel("v2.1-advanced", 94);
      
      // Check model count
      const modelCount = await aiController.getModelCount();
      expect(modelCount).to.equal(4); // Default + 3 added
    });

    it("Should provide active model info", async function () {
      const activeModel = await aiController.getActiveModel();
      
      expect(activeModel).to.have.property("version");
      expect(activeModel).to.have.property("accuracy");
      expect(activeModel).to.have.property("active");
      expect(activeModel.active).to.be.true;
    });
  });

  describe("🎯 Hackathon Demo Integration", function () {
    it("Should simulate complete AI automation flow", async function () {
      console.log("🚀 Starting hackathon AI automation demo...");
      
      // 1. Initial state
      const initialModel = await aiController.getActiveModel();
      console.log(`🤖 Initial AI Model: ${initialModel.version} (${initialModel.accuracy}% accuracy)`);
      
      // 2. Update to better model
      await aiController.connect(owner).addAIModel("v2.0-hackathon", 95);
      const updatedModel = await aiController.getActiveModel();
      console.log(`🔧 Upgraded to: ${updatedModel.version} (${updatedModel.accuracy}% accuracy)`);
      
      // 3. Configure for more frequent analysis
      await aiController.connect(owner).setAnalysisInterval(2 * 60 * 60); // 2 hours
      console.log("⚙️ Analysis interval set to 2 hours");
      
      // 4. Simulate Chainlink Automation check
      const [upkeepNeeded] = await aiController.checkUpkeep("0x");
      console.log(`⏰ Upkeep needed: ${upkeepNeeded}`);
      
      // 5. If upkeep needed, perform it
      if (upkeepNeeded) {
        const currentTVL = await vault.totalAssets();
        const analysisTime = await time.latest();
        const performData = ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint256", "uint256"],
          [currentTVL, analysisTime]
        );
        
        await aiController.performUpkeep(performData);
        console.log(`✅ AI Analysis performed for TVL: ${ethers.formatEther(currentTVL)} aRWA`);
      }
      
      console.log("🎉 AI Automation demo completed!");
    });

    it("Should handle edge cases gracefully", async function () {
      // Test with minimal TVL
      await vault.setTotalAssets(ethers.parseEther("1"));
      
      const [upkeepNeeded] = await aiController.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.false; // Should not trigger for low TVL
      
      // Test immediately after analysis
      await aiController.setLastAnalysisTime(await time.latest());
      await vault.setTotalAssets(ethers.parseEther("10000"));
      
      const [upkeepNeeded2] = await aiController.checkUpkeep("0x");
      expect(upkeepNeeded2).to.be.false; // Should not trigger too soon
    });
  });
});

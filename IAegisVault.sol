//// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IAegisVault
 * @dev Interface for AegisVault contract with AI-powered RWA vault
 */
interface IAegisVault {
    // ========== ENUMS ==========
    enum RiskLevel { LOW, MEDIUM, HIGH }
    
    // ========== STRUCTS ==========
    struct AIInsight {
        uint256 timestamp;        // When insight was generated
        string recommendation;    // BUY/HOLD/SELL
        uint256 confidence;       // 0-100
        RiskLevel riskLevel;      // Calculated risk
    }
    
    // ========== CORE FUNCTIONS ==========
    
    /**
     * @dev Deposit RWA tokens into vault
     * @param rwaToken Address of RWA token contract
     * @param amount Amount of tokens to deposit
     * @return shares Amount of vault shares minted
     */
    function deposit(address rwaToken, uint256 amount) external returns (uint256);
    
    /**
     * @dev Withdraw RWA tokens from vault
     * @param rwaToken Address of RWA token contract
     * @param shareAmount Amount of shares to burn
     * @return assets Amount of tokens withdrawn
     */
    function withdraw(address rwaToken, uint256 shareAmount) external returns (uint256);
    
    // ========== AI FUNCTIONS ==========
    
    /**
     * @dev Store AI insight from Chainlink Functions
     * @param user Address of user
     * @param recommendation AI recommendation (BUY/HOLD/SELL)
     * @param confidence Confidence score 0-100
     */
    function storeAIInsight(
        address user,
        string calldata recommendation,
        uint256 confidence
    ) external;
    
    // ========== VIEW FUNCTIONS ==========
    
    /**
     * @dev Get total assets under management
     */
    function totalAssets() external view returns (uint256);
    
    /**
     * @dev Get total shares outstanding
     */
    function totalShares() external view returns (uint256);
    
    /**
     * @dev Get share balance of user
     * @param user Address of user
     */
    function shares(address user) external view returns (uint256);
    
    /**
     * @dev Get AI insight for user
     * @param user Address of user
     * @return AIInsight struct with recommendation
     */
    function userInsights(address user) external view returns (AIInsight memory);
    
    /**
     * @dev Get asset value in USD
     * @param ethAmount Amount of ETH (or RWA in ETH equivalent)
     * @return valueUSD Value in USD
     */
    function getAssetValueInUSD(uint256 ethAmount) external view returns (uint256);
    
    /**
     * @dev Check if user has active subscription
     * @param user Address of user
     */
    function hasActiveSubscription(address user) external view returns (bool);
    
    // ========== EVENTS ==========
    
    /**
     * @dev Emitted when user deposits assets
     */
    event Deposit(address indexed user, uint256 assets, uint256 shares);
    
    /**
     * @dev Emitted when user withdraws assets
     */
    event Withdraw(address indexed user, uint256 assets, uint256 shares);
    
    /**
     * @dev Emitted when AI insight is received
     */
    event AIReceived(address indexed user, string recommendation, uint256 confidence);
    
    /**
     * @dev Emitted when emergency pause is triggered
     */
    event EmergencyPaused(address indexed admin, string reason);
}

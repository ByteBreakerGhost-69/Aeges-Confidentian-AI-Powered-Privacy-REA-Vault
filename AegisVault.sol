// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
import "PriceConverter.sol";
import "AegisAccessControl.sol";
import "IAegisVault.sol";
import "IRWAToken.sol";

/**
 * @title AegisVault - AI-Powered Privacy RWA Vault
 * @dev Integrates Chainlink Functions for AI insights, Data Feeds for pricing
 */
contract AegisVault is ChainlinkClient, ConfirmedOwner, IAegisVault {
    using Chainlink for Chainlink.Request;
    using PriceConverter for uint256;
    
    // Chainlink Data Feed for ETH/USD
    AggregatorV3Interface private s_priceFeed;
    
    // Chainlink Functions
    bytes32 private s_jobId;
    uint256 private s_fee;
    
    // Vault State
    uint256 public totalAssets;
    uint256 public totalShares;
    mapping(address => uint256) public shares;
    mapping(bytes32 => address) private s_requestIdToUser;
    
    // AI Insights
    struct AIInsight {
        uint256 timestamp;
        string recommendation;
        uint256 confidence;
        RiskLevel riskLevel;
    }
    
    enum RiskLevel { LOW, MEDIUM, HIGH }
    
    mapping(address => AIInsight) public userInsights;
    mapping(address => bool) public pendingAIRequests;
    
    // Events
    event Deposit(address indexed user, uint256 assets, uint256 shares);
    event Withdraw(address indexed user, uint256 assets, uint256 shares);
    event AIRequested(address indexed user, bytes32 requestId);
    event AIReceived(address indexed user, string recommendation, uint256 confidence);
    event EmergencyPaused(address indexed admin, string reason);
    
    // Modifiers
    modifier onlyWhenNotPaused() {
        require(!AegisAccessControl.isPaused(), "Vault is paused");
        _;
    }
    
    // ✅ Implementasi sederhana dulu
    mapping(address => bool) public hasActiveSubscription;

     modifier onlyWithSubscription() {
        require(hasActiveSubscription[msg.sender], "No active subscription");
        _;
    }

    // Fungsi untuk admin grant subscription
    function grantSubscription(address user) external onlyOwner {
        hasActiveSubscription[user] = true;
    }
    
    constructor(
        address priceFeed,
        address chainlinkToken,
        address oracle,
        bytes32 jobId,
        uint256 fee
    ) ConfirmedOwner(msg.sender) {
        setChainlinkToken(chainlinkToken);
        setChainlinkOracle(oracle);
        s_priceFeed = AggregatorV3Interface(priceFeed);
        s_jobId = jobId;
        s_fee = fee;
    }
    
    /**
     * @dev Deposit assets into vault, receive shares
     * @param rwaToken Address of RWA token to deposit
     */
    function deposit(address rwaToken, uint256 amount) 
        external 
        onlyWhenNotPaused 
        onlyWithSubscription 
        returns (uint256) 
    {
        require(amount > 0, "Amount must be > 0");
        require(IRWAToken(rwaToken).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Calculate shares (simplified 1:1 for demo)
        uint256 shareAmount = amount;
        
        shares[msg.sender] += shareAmount;
        totalShares += shareAmount;
        totalAssets += amount;
        
        // Trigger AI analysis on deposit
        _requestAIInsight(msg.sender);
        
        emit Deposit(msg.sender, amount, shareAmount);
        return shareAmount;
    }
    
    /**
     * @dev Withdraw assets from vault
     */
    function withdraw(address rwaToken, uint256 shareAmount) 
        external 
        onlyWhenNotPaused 
        returns (uint256) 
    {
        require(shareAmount > 0, "Shares must be > 0");
        require(shares[msg.sender] >= shareAmount, "Insufficient shares");
        
        uint256 assetAmount = shareAmount; // 1:1 for demo
        
        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        totalAssets -= assetAmount;
        
        require(IRWAToken(rwaToken).transfer(msg.sender, assetAmount), "Transfer failed");
        
        emit Withdraw(msg.sender, assetAmount, shareAmount);
        return assetAmount;
    }
    
    /**
     * @dev Request AI insight via Chainlink Functions
     */
    function requestAIInsight() external onlyWithSubscription returns (bytes32 requestId) {
        require(!pendingAIRequests[msg.sender], "Request already pending");
        
        Chainlink.Request memory req = buildChainlinkRequest(
            s_jobId,
            address(this),
            this.fulfillAIInsight.selector
        );
        
        // Encode user data for AI analysis
        string memory userData = string(abi.encodePacked(
            "{\"user\":\"",
            _addressToString(msg.sender),
            "\",\"balance\":\"",
            _uintToString(shares[msg.sender]),
            "\",\"timestamp\":\"",
            _uintToString(block.timestamp),
            "\"}"
        ));
        
        req.add("data", userData);
        req.add("path", "recommendation,confidence");
        
        // Send request
        requestId = sendChainlinkRequest(req, s_fee);
        s_requestIdToUser[requestId] = msg.sender;
        pendingAIRequests[msg.sender] = true;
        
        emit AIRequested(msg.sender, requestId);
    }
    
    /**
     * @dev Chainlink Functions callback
     */
    // ✅ Yang BENAR untuk Functions
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        address user = s_requestIdToUser[requestId];
    
        if (err.length > 0) {
            // Handle error
            emit AIRequestFailed(user, string(err));
            return;
        }
    
    // Parse response
    (string memory recommendation, uint256 confidence) = 
        abi.decode(response, (string, uint256));
        
        // Store insight
        userInsights[user] = AIInsight({
            timestamp: block.timestamp,
            recommendation: recommendation,
            confidence: confidence,
            riskLevel: _calculateRiskLevel(confidence)
        });
        
        pendingAIRequests[user] = false;
        
        emit AIReceived(user, recommendation, confidence);
    }
    
    /**
     * @dev Get current ETH value in USD using Chainlink Data Feed
     */
    // ✅ TAMBAHKAN validasi lengkap
    function getAssetValueInUSD(uint256 ethAmount) public view returns (uint256) {
        require(address(s_priceFeed) != address(0), "Price feed not set");
    
        (
            uint80 roundId,
            int256 price,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = s_priceFeed.latestRoundData();
    
        require(price > 0, "Invalid price");
        require(updatedAt >= block.timestamp - 2 hours, "Stale price");
        require(answeredInRound >= roundId, "Round incomplete");
    
        return (ethAmount * uint256(price)) / 1e18;
}
    
    /**
     * @dev Emergency pause function
     */
    function emergencyPause(string memory reason) external onlyOwner {
        AegisAccessControl.pause();
        emit EmergencyPaused(msg.sender, reason);
    }
    
    /**
     * @dev Resume operations
     */
    function resume() external onlyOwner {
        AegisAccessControl.resume();
    }
    
    // ========== INTERNAL FUNCTIONS ==========
    
    function _calculateRiskLevel(uint256 confidence) internal pure returns (RiskLevel) {
        if (confidence >= 80) return RiskLevel.LOW;
        if (confidence >= 50) return RiskLevel.MEDIUM;
        return RiskLevel.HIGH;
    }
    
    function _addressToString(address addr) internal pure returns (string memory) {
        return Strings.toHexString(uint256(uint160(addr)), 20);
    }
    
    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}

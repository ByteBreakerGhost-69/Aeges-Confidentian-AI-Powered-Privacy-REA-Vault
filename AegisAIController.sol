// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {Functions} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/Functions.sol";

interface IAegisVault {
    function storeAIInsight(address user, string calldata recommendation, uint256 confidence) external;
    function totalAssets() external view returns (uint256);
    function shares(address user) external view returns (uint256);
}

/**
 * @title AegisAIController - REAL AI Integration dengan OpenAI/Gemini
 * @dev Menggunakan Chainlink Functions untuk memanggil AI API eksternal
 */
contract AegisAIController is FunctionsClient, ConfirmedOwner {
    using Functions for Functions.Request;
    
    // ========== CHAINLINK FUNCTIONS CONFIG ==========
    uint64 public subscriptionId;
    bytes32 public donId;
    uint32 public gasLimit = 300000;
    
    // ========== CONTRACT REFERENCES ==========
    address public vault;
    
    // ========== REQUEST TRACKING ==========
    mapping(bytes32 => address) public requestToUser;
    mapping(bytes32 => uint256) public requestTimestamps;
    
    // ========== AI MODEL CONFIG ==========
    struct AIModel {
        string version;
        string provider; // "openai", "gemini", "custom"
        uint256 accuracy;
        bool active;
        string sourceCode; // JavaScript source untuk API call
        string apiEndpoint; // URL endpoint
    }
    
    AIModel[] public aiModels;
    uint256 public activeModelId;
    
    // ========== EVENTS ==========
    event AIRequested(address indexed user, bytes32 indexed requestId);
    event AIResponseReceived(address indexed user, string recommendation, uint256 confidence);
    event AIRequestFailed(bytes32 indexed requestId, string error);
    event ModelUpdated(uint256 modelId, string version, string provider);
    event VaultUpdated(address indexed newVault);
    
    // ========== CONSTRUCTOR ==========
    constructor(
        address router,
        uint64 _subscriptionId,
        bytes32 _donId,
        address _vault
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        subscriptionId = _subscriptionId;
        donId = _donId;
        vault = _vault;
        
        // Initialize dengan REAL OpenAI model
        _addOpenAIModel();
        // Initialize dengan REAL Gemini model sebagai backup
        _addGeminiModel();
        
        activeModelId = 0; // Default ke OpenAI
    }
    
    // ========== REAL AI - OPENAI INTEGRATION ==========
    
    function _addOpenAIModel() internal {
        string memory openAISource = 
            // REAL OpenAI API call via Chainlink Functions
            "// OpenAI GPT-4 Integration untuk AegisVault\n"
            "const userAddress = args[0];\n"
            "const assetType = args[1];\n"
            "const riskProfile = args[2];\n"
            "const userBalance = args[3];\n"
            "const modelVersion = args[4];\n"
            "\n"
            "// Konfigurasi OpenAI API\n"
            "const apiKey = secrets.apiKey;\n"
            "const endpoint = 'https://api.openai.com/v1/chat/completions';\n"
            "\n"
            "// System prompt untuk RWA investment advisor\n"
            "const systemPrompt = `\n"
            "You are an AI investment advisor for Real World Assets (RWA).\n"
            "Analyze the following investment scenario and provide:\n"
            "1. Recommendation: BUY, HOLD, or SELL\n"
            "2. Confidence score: 0-100\n"
            "3. Brief reasoning (max 50 chars)\n"
            "\n"
            "Format response strictly as JSON:\n"
            "{\n"
            "  \"recommendation\": \"BUY|HOLD|SELL\",\n"
            "  \"confidence\": 85,\n"
            "  \"reasoning\": \"string\"\n"
            "}\n"
            "`;\n"
            "\n"
            "// User prompt dengan data spesifik\n"
            "const userPrompt = `\n"
            "Asset Type: ${assetType}\n"
            "Risk Profile: ${riskProfile}\n"
            "Investment Amount: ${userBalance}\n"
            "Timestamp: ${Date.now()}\n"
            "`;\n"
            "\n"
            "// Request ke OpenAI\n"
            "const request = {\n"
            "  model: 'gpt-4-turbo-preview',\n"
            "  messages: [\n"
            "    { role: 'system', content: systemPrompt },\n"
            "    { role: 'user', content: userPrompt }\n"
            "  ],\n"
            "  temperature: 0.3,\n"
            "  max_tokens: 150\n"
            "};\n"
            "\n"
            "// Eksekusi HTTP request\n"
            "const response = await Functions.makeHttpRequest({\n"
            "  url: endpoint,\n"
            "  method: 'POST',\n"
            "  headers: {\n"
            "    'Authorization': `Bearer ${apiKey}`,\n"
            "    'Content-Type': 'application/json'\n"
            "  },\n"
            "  data: request,\n"
            "  timeout: 10000\n"
            "});\n"
            "\n"
            "if (response.error) {\n"
            "  throw new Error(`OpenAI API error: ${response.error}`);\n"
            "}\n"
            "\n"
            "// Parse OpenAI response\n"
            "const aiResponse = JSON.parse(response.data.choices[0].message.content);\n"
            "\n"
            "// Return ke smart contract\n"
            "return Functions.encodeString(\n"
            "  JSON.stringify({\n"
            "    recommendation: aiResponse.recommendation,\n"
            "    confidence: aiResponse.confidence,\n"
            "    reasoning: aiResponse.reasoning,\n"
            "    model: 'gpt-4-turbo',\n"
            "    provider: 'openai',\n"
            "    timestamp: Date.now()\n"
            "  })\n"
            ");";
        
        aiModels.push(AIModel({
            version: "gpt-4-turbo-2024",
            provider: "openai",
            accuracy: 95,
            active: true,
            sourceCode: openAISource,
            apiEndpoint: "https://api.openai.com/v1/chat/completions"
        }));
    }
    
    // ========== REAL AI - GOOGLE GEMINI INTEGRATION ==========
    
    function _addGeminiModel() internal {
        string memory geminiSource = 
            "// Google Gemini AI Integration\n"
            "const userAddress = args[0];\n"
            "const assetType = args[1];\n"
            "const riskProfile = args[2];\n"
            "const userBalance = args[3];\n"
            "\n"
            "const apiKey = secrets.geminiApiKey;\n"
            "const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;\n"
            "\n"
            "const prompt = `\n"
            "As an RWA investment advisor, analyze this scenario:\n"
            "- Asset: ${assetType}\n"
            "- Risk profile: ${riskProfile}\n"
            "- Investment amount: ${userBalance}\n"
            "\n"
            "Return ONLY a JSON object with:\n"
            "- recommendation: BUY/HOLD/SELL\n"
            "- confidence: 0-100\n"
            "- reasoning: one sentence\n"
            "`;\n"
            "\n"
            "const request = {\n"
            "  contents: [{\n"
            "    parts: [{ text: prompt }]\n"
            "  }]\n"
            "};\n"
            "\n"
            "const response = await Functions.makeHttpRequest({\n"
            "  url: endpoint,\n"
            "  method: 'POST',\n"
            "  headers: { 'Content-Type': 'application/json' },\n"
            "  data: request,\n"
            "  timeout: 10000\n"
            "});\n"
            "\n"
            "if (response.error) {\n"
            "  throw new Error(`Gemini API error: ${response.error}`);\n"
            "}\n"
            "\n"
            "const text = response.data.candidates[0].content.parts[0].text;\n"
            "const aiResponse = JSON.parse(text);\n"
            "\n"
            "return Functions.encodeString(\n"
            "  JSON.stringify({\n"
            "    recommendation: aiResponse.recommendation,\n"
            "    confidence: aiResponse.confidence,\n"
            "    reasoning: aiResponse.reasoning,\n"
            "    model: 'gemini-pro',\n"
            "    provider: 'google',\n"
            "    timestamp: Date.now()\n"
            "  })\n"
            ");";
        
        aiModels.push(AIModel({
            version: "gemini-pro-1.0",
            provider: "google",
            accuracy: 92,
            active: false,
            sourceCode: geminiSource,
            apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        }));
    }
    
    // ========== REQUEST AI ANALYSIS ==========
    
    /**
     * @dev Request REAL AI analysis via OpenAI/Gemini
     */
    function requestAIAnalysis(
        address user,
        string calldata assetType,
        string calldata riskProfile
    ) external onlyOwner returns (bytes32 requestId) {
        require(vault != address(0), "Vault not set");
        require(aiModels.length > 0, "No AI model available");
        require(aiModels[activeModelId].active, "Active model not active");
        
        // Get user balance from vault
        uint256 userBalance = IAegisVault(vault).shares(user);
        
        // Prepare arguments
        string[] memory args = new string[](5);
        args[0] = _addressToString(user);
        args[1] = assetType;
        args[2] = riskProfile;
        args[3] = _uintToString(userBalance);
        args[4] = aiModels[activeModelId].version;
        
        // Create Functions request with REAL source code
        Functions.Request memory req;
        req.initializeRequestForInlineJavaScript(aiModels[activeModelId].sourceCode);
        req.setArgs(args);
        
        // Send request
        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );
        
        // Track request
        requestToUser[requestId] = user;
        requestTimestamps[requestId] = block.timestamp;
        
        emit AIRequested(user, requestId);
        
        return requestId;
    }
    
    // ========== CHAINLINK FUNCTIONS CALLBACK ==========
    
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        address user = requestToUser[requestId];
        
        if (user == address(0)) {
            return;
        }
        
        if (err.length > 0) {
            // Auto-fallback ke model lain jika error
            _handleAIError(requestId, string(err));
            return;
        }
        
        try this.decodeAIResponse(response) returns (
            string memory recommendation,
            uint256 confidence,
            string memory reasoning
        ) {
            // Validasi REAL AI response
            require(
                keccak256(bytes(recommendation)) == keccak256("BUY") ||
                keccak256(bytes(recommendation)) == keccak256("HOLD") ||
                keccak256(bytes(recommendation)) == keccak256("SELL"),
                "Invalid recommendation"
            );
            require(confidence >= 0 && confidence <= 100, "Invalid confidence");
            
            // Store di vault
            if (vault != address(0)) {
                IAegisVault(vault).storeAIInsight(user, recommendation, confidence);
            }
            
            emit AIResponseReceived(user, recommendation, confidence);
            
        } catch {
            emit AIRequestFailed(requestId, "Failed to decode AI response");
        }
        
        // Cleanup
        delete requestToUser[requestId];
        delete requestTimestamps[requestId];
    }
    
    /**
     * @dev Handle AI error dengan fallback mechanism
     */
    function _handleAIError(bytes32 requestId, string memory errorMsg) internal {
        address user = requestToUser[requestId];
        
        // Try fallback ke model lain
        if (aiModels[activeModelId].provider == "openai") {
            // Coba pake Gemini
            _switchToFallbackModel();
        }
        
        emit AIRequestFailed(requestId, errorMsg);
    }
    
    /**
     * @dev Switch ke fallback AI model
     */
    function _switchToFallbackModel() internal {
        for (uint256 i = 0; i < aiModels.length; i++) {
            if (i != activeModelId && aiModels[i].active) {
                activeModelId = i;
                break;
            }
        }
    }
    
    /**
     * @dev Decode AI response (external untuk try-catch)
     */
    function decodeAIResponse(bytes memory response) 
        external 
        pure 
        returns (string memory, uint256, string memory) 
    {
        string memory json = string(response);
        
        // Parse JSON (simplified - production pakai library)
        // Format: {"recommendation":"BUY","confidence":85,"reasoning":"string"}
        
        // Extract recommendation
        uint256 recStart = _indexOf(json, "recommendation") + 18;
        uint256 recEnd = _indexOf(json, "\"", recStart);
        string memory recommendation = _substring(json, recStart, recEnd);
        
        // Extract confidence
        uint256 confStart = _indexOf(json, "confidence") + 13;
        uint256 confEnd = _indexOf(json, ",", confStart);
        if (confEnd == 0) confEnd = _indexOf(json, "}", confStart);
        uint256 confidence = _parseUint(_substring(json, confStart, confEnd));
        
        // Extract reasoning
        uint256 reasonStart = _indexOf(json, "reasoning") + 12;
        uint256 reasonEnd = _indexOf(json, "\"", reasonStart);
        string memory reasoning = _substring(json, reasonStart, reasonEnd);
        
        return (recommendation, confidence, reasoning);
    }
    
    // ========== AI MODEL MANAGEMENT ==========
    
    /**
     * @dev Add custom AI model
     */
    function addCustomAIModel(
        string memory version,
        string memory provider,
        uint256 accuracy,
        string memory sourceCode,
        string memory apiEndpoint
    ) external onlyOwner {
        require(bytes(version).length > 0, "Version required");
        require(bytes(sourceCode).length > 0, "Source code required");
        
        // Deactivate old models
        for (uint256 i = 0; i < aiModels.length; i++) {
            aiModels[i].active = false;
        }
        
        aiModels.push(AIModel({
            version: version,
            provider: provider,
            accuracy: accuracy,
            active: true,
            sourceCode: sourceCode,
            apiEndpoint: apiEndpoint
        }));
        
        activeModelId = aiModels.length - 1;
        
        emit ModelUpdated(activeModelId, version, provider);
    }
    
    /**
     * @dev Switch AI provider (OpenAI <-> Gemini)
     */
    function switchProvider(string memory provider) external onlyOwner {
        for (uint256 i = 0; i < aiModels.length; i++) {
            if (keccak256(bytes(aiModels[i].provider)) == keccak256(bytes(provider))) {
                activeModelId = i;
                emit ModelUpdated(i, aiModels[i].version, aiModels[i].provider);
                return;
            }
        }
        revert("Provider not found");
    }
    
    // ========== UTILITY FUNCTIONS ==========
    
    function _addressToString(address addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
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
    
    function _indexOf(string memory str, string memory search) internal pure returns (uint256) {
        bytes memory strBytes = bytes(str);
        bytes memory searchBytes = bytes(search);
        
        for (uint256 i = 0; i < strBytes.length - searchBytes.length + 1; i++) {
            bool found = true;
            for (uint256 j = 0; j < searchBytes.length; j++) {
                if (strBytes[i + j] != searchBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return i + searchBytes.length;
            }
        }
        return 0;
    }
    
    function _substring(string memory str, uint256 start, uint256 end) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = strBytes[i];
        }
        return string(result);
    }
    
    function _parseUint(string memory str) internal pure returns (uint256) {
        bytes memory strBytes = bytes(str);
        uint256 value = 0;
        for (uint256 i = 0; i < strBytes.length; i++) {
            require(strBytes[i] >= 0x30 && strBytes[i] <= 0x39, "Invalid number");
            value = value * 10 + (uint8(strBytes[i]) - 48);
        }
        return value;
    }
    
    // ========== CONFIGURATION ==========
    
    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "Invalid vault");
        vault = _vault;
        emit VaultUpdated(_vault);
    }
    
    function setSubscriptionId(uint64 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }
    
    function setDonId(bytes32 _donId) external onlyOwner {
        donId = _donId;
    }
    
    function setGasLimit(uint32 _gasLimit) external onlyOwner {
        gasLimit = _gasLimit;
    }
    
    // Receive function untuk LINK
    receive() external payable {}
}

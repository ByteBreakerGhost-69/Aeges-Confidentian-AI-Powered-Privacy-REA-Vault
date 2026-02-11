// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IRWAToken.sol";

/**
 * @title RWAToken - Real World Asset Token
 * @dev ERC20 token representing real-world assets with compliance features
 */
contract RWAToken is ERC20, AccessControl, IRWAToken {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    
    // Compliance tracking
    mapping(address => bool) public whitelist;
    mapping(address => string) public investorIds;
    uint256 public maxSupply;
    
    // Chainlink integration for real-world data verification
    address public verifierOracle;
    
    event Whitelisted(address indexed investor, string investorId);
    event Blacklisted(address indexed investor, string reason);
    event AssetBacked(uint256 amount, string proofHash);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply,
        address admin
    ) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(COMPLIANCE_ROLE, admin);
        
        maxSupply = _maxSupply;
    }
    
    /**
     * @dev Mint new tokens (only by minter)
     */
    function mint(address to, uint256 amount, string memory proofHash) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        require(whitelist[to], "Recipient not whitelisted");
        
        _mint(to, amount);
        emit AssetBacked(amount, proofHash);
    }
    
    /**
     * @dev Whitelist investor (KYC/AML compliant)
     */
    function whitelistInvestor(address investor, string memory investorId) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        whitelist[investor] = true;
        investorIds[investor] = investorId;
        
        emit Whitelisted(investor, investorId);
    }
    
    /**
     * @dev Blacklist investor
     */
    function blacklistInvestor(address investor, string memory reason) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        whitelist[investor] = false;
        emit Blacklisted(investor, reason);
    }
    
    /**
     * @dev Set Chainlink oracle for data verification
     */
    function setVerifierOracle(address oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        verifierOracle = oracle;
    }
    
    /**
     * @dev Override transfer with compliance checks
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        returns (bool) 
    {
        require(whitelist[msg.sender], "Sender not whitelisted");
        require(whitelist[to], "Recipient not whitelisted");
        
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override transferFrom with compliance checks
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        returns (bool) 
    {
        require(whitelist[from], "Sender not whitelisted");
        require(whitelist[to], "Recipient not whitelisted");
        
        return super.transferFrom(from, to, amount);
    }
    
    /**
     * @dev Get investor compliance status
     */
    function isCompliant(address investor) external view returns (bool) {
        return whitelist[investor];
    }
}

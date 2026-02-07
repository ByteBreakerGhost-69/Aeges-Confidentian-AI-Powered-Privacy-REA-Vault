// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AegisVault
 * @dev Vault untuk menyimpan dana user dan mengalokasikannya ke aset RWA berdasarkan instruksi AI.
 */
contract AegisVault is ERC4626, Ownable {
    
    // Alamat kontrak AI Controller yang diizinkan memindahkan dana
    address public aiController;

    event AIControllerUpdated(address indexed newController);
    event FundsAllocated(address indexed rwaAsset, uint256 amount);

    constructor(
        IERC20 _asset, 
        string memory _name, 
        string memory _symbol
    ) ERC4626(_asset) ERC20(_name, _symbol) Ownable(msg.sender) {}

    /**
     * @notice Membatasi akses hanya untuk AI Controller.
     */
    modifier onlyAI() {
        require(msg.sender == aiController, "AegisVault: Only AI can trigger this");
        _;
    }

    /**
     * @dev Update alamat AI Controller.
     */
    function setAIController(address _aiController) external onlyOwner {
        require(_aiController != address(0), "Invalid address");
        aiController = _aiController;
        emit AIControllerUpdated(_aiController);
    }

    /**
     * @dev Fungsi utama bagi AI untuk mengalokasikan dana ke aset RWA.
     * @param _rwaToken Alamat token RWA yang akan dibeli.
     * @param _amount Jumlah dana yang dialokasikan.
     */
    function allocateToRWA(address _rwaToken, uint256 _amount) external onlyAI {
        require(asset().balanceOf(address(this)) >= _amount, "Insufficient vault balance");
        
        // Logika sederhana: AI memindahkan dana ke kontrak RWA untuk ditukar dengan token RWA
        asset().transfer(_rwaToken, _amount);
        
        emit FundsAllocated(_rwaToken, _amount);
    }

    // Fungsi tambahan untuk menghitung total aset termasuk yang ada di RWA (untuk juri)
    function totalAssets() public view override returns (uint256) {
        // Di sini nantinya ditambahkan logika untuk menghitung nilai RWA yang sedang di-hold
        return super.totalAssets();
    }
}

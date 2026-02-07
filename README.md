# Aeges-Confidentian-AI-Powered-Privacy-REA-Vault

Aegis-Confidential/
├── contracts/                # Smart Contracts (Solidity)
│   ├── AegisVault.sol        # Kontrak Utama (Deposit/Withdraw)
│   ├── RWAToken.sol          # Tokenisasi Aset Riil (ERC20/ERC1155)
│   ├── AegisAIController.sol # Integrasi Chainlink Functions & Automation
│   └── libraries/            # Helper untuk CCIP & Privacy Logic
├── scripts/                  # Script Deployment & Testing
│   ├── deploy_vault.js
│   ├── request_ai_insight.js # Simulasi pemanggilan Chainlink Functions
│   └── setup_ccip.js
├── functions/                # Chainlink Functions (JavaScript)
│   ├── ai_market_analyst.js  # Script AI untuk analisis data RWA off-chain
│   └── secrets-config.js     # Konfigurasi Confidential HTTP (Secrets)
├── frontend/                 # Dashboard User (Next.js / React)
│   ├── components/           # Privacy Dashboard & Charts
│   └── hooks/                # Wallet connection (Wagmi/RainbowKit)
├── docs/                     # Dokumentasi Teknikal
│   ├── architecture.md
│   └── chainlink_integration.md
├── .env.example              # Template Environment Variables
├── hardhat.config.js         # Konfigurasi Development Framework
└── README.md                 # Pitch, Cara Install, dan Demo Video

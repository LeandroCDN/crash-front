import React from "react";

interface ModalProps {
  title: string;
  bet: string;
  multiplier: string;
  rocketScore: string;
  resultMessage: string;
  result: boolean;
  onClose: () => void; // Cambiado el nombre a `onClose` para mayor claridad
}

const Modal: React.FC<ModalProps> = ({
  title,
  bet,
  multiplier,
  rocketScore,
  resultMessage,
  result,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      {/* Caja principal con borde dinámico */}
      <div
        className={`bg-[#111111] text-white rounded-lg p-6 max-w-md w-full border-2 ${
          result ? "border-[#00ff00]" : "border-white"
        }`}
      >
        {/* Título con color dinámico */}
        <h2
          className={`text-center text-2xl font-bold ${
            result ? "text-[#00ff00]" : "text-[#ff0000]"
          }`}
        >
          {title}
        </h2>

        <div className="mt-4 space-y-2 text-center">
          <p className="text-lg">
            Your bet amount: <span className="font-bold">{bet}</span>
          </p>
          <p className="text-lg">
            Your multiplier: <span className="font-bold">{multiplier}%</span>
          </p>
          {/* Rocket score con color dinámico */}
          <p className="text-lg">
            Rocket result:{" "}
            <span
              className={`font-bold ${
                result ? "text-[#00ff00]" : "text-[#ff0000]"
              }`}
            >
              {rocketScore}%
            </span>
          </p>
          {/* Mensaje final con color dinámico */}
          <p className={`text-lg ${result ? "text-[#ffe500]" : "text-white"}`}>
            {resultMessage}
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="py-2 px-6 bg-transparent text-[#00ff00] font-bold rounded-md border border-[#00ff00] hover:bg-[#00ff00] hover:text-black transition"
          >
            PLAY AGAIN!
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;

"use client";

import React from "react";

const StarryBackgroundFast: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-black overflow-hidden -z-10">
      {[...Array(100)].map((_, i) => {
        // Lista de colores para las estrellas
        const colors = ["white", "red", "yellow", "lightblue"];
        // Seleccionar un color aleatorio
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              backgroundColor: randomColor, // Color aleatorio
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationName: "fallingStar",
              animationDuration: `${Math.random() * 1 + 2}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              animationDelay: `${Math.random() * 0}s`,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes fallingStar {
          0% {
            transform: translateY(-10vh) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) translateX(20vw);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default StarryBackgroundFast;

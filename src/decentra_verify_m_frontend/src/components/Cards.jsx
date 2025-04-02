import React from "react";
import "./card.css";

const Card = ({ name, ecdsa_sign, schnorr_sign, onDownload, onDelete }) => {
  const max_e_length = ecdsa_sign.length;
  const max_s_length = schnorr_sign.length;
  console.log(max_e_length);
  return (
    <div className="cards-container">
      <div className="card_border">
        <div className="bg-white rounded-2xl shadow-md p-4 w-72 hover:shadow-lg transition-all">
          <h2 className="text-xl font-semibold mt-2">{name.slice(0, 15)}</h2>
          <p className="text-gray-600 mt-1">
            File ECDSA Signing:{" "}
            {ecdsa_sign.slice(0, 20) +
              "...." +
              ecdsa_sign.slice(max_e_length - 4, max_e_length)}
          </p>
          <p className="text-gray-600 mt-1">
            File Schnorr Sign:{" "}
            {schnorr_sign.slice(0, 20) +
              "...." +
              schnorr_sign.slice(max_s_length - 4, max_s_length)}
          </p>
          <div className="flex space-x-2">
            <button onClick={() => onDownload(name)} className="btn">
              Download
            </button>
            <button onClick={() => onDelete(name)} className="btn">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;

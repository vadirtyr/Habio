import React from "react";
import { Coins, Gift, Pencil, Trash2 } from "lucide-react";

function getRedeemContent(afford, deficit) {
  if (afford) return <>Redeem <Gift className="w-4 h-4" strokeWidth={3} /></>;
  return `Need ${deficit} more`;
}

export default function RewardCard({ reward, balance, onEdit, onDelete, onRedeem }) {
  const { id, name, description, cost, times_redeemed } = reward;
  const afford = balance >= cost;
  const deficit = cost - balance;
  const buttonClass = afford ? "nb-btn-secondary" : "nb-btn-outline";

  return (
    <div className="nb-card nb-card-hover p-5 flex flex-col" data-testid={`reward-card-${id}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="w-12 h-12 rounded-xl bg-[#0EA5E9] border-2 border-[#1E1E24] flex items-center justify-center" style={{ boxShadow: "2px 2px 0 0 #1E1E24" }}>
          <Gift className="w-6 h-6 text-white" strokeWidth={3} />
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(reward)} className="w-8 h-8 rounded-lg border-2 border-[#1E1E24] bg-white flex items-center justify-center hover:bg-[#F3F0EA]" data-testid={`reward-edit-${id}`} aria-label="Edit reward">
            <Pencil className="w-3.5 h-3.5" strokeWidth={2.75} />
          </button>
          <button onClick={() => onDelete(id)} className="w-8 h-8 rounded-lg border-2 border-[#1E1E24] bg-white flex items-center justify-center hover:bg-[#F43F5E] hover:text-white" data-testid={`reward-delete-${id}`} aria-label="Delete reward">
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2.75} />
          </button>
        </div>
      </div>
      <h3 className="font-heading font-extrabold text-xl" data-testid={`reward-name-${id}`}>{name}</h3>
      {description && <p className="text-sm text-[#5C5C68] mt-0.5 mb-3">{description}</p>}
      <div className="flex items-center justify-between mt-auto pt-3">
        <span className="nb-badge-coin !text-base !px-3"><Coins className="w-4 h-4" strokeWidth={3} />{cost}</span>
        <span className="text-xs font-bold text-[#5C5C68]">Redeemed {times_redeemed || 0}x</span>
      </div>
      <button
        onClick={() => onRedeem(id)}
        disabled={!afford}
        className={`nb-btn w-full mt-4 ${buttonClass}`}
        data-testid={`reward-redeem-${id}`}
      >
        {getRedeemContent(afford, deficit)}
      </button>
    </div>
  );
}

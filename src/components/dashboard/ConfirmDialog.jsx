import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#EDE2CD] rounded-2xl shadow-2xl w-full max-w-sm border border-[#133951]/10"
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#AD2B10]/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#AD2B10]" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#133951]">
              {title}
            </h3>
          </div>
          <p className="text-sm text-[#133951]/70 mb-5 leading-relaxed">
            {message}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl bg-white/50 text-[#133951]/70 text-sm font-medium hover:bg-white/70 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-[#AD2B10] text-[#EDE2CD] text-sm font-semibold shadow-md hover:bg-[#8f2409] transition-colors"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

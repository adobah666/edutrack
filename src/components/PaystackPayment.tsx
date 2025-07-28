'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

// Dynamically import PaystackButton to avoid SSR issues
const PaystackButton = dynamic(() => import('react-paystack').then(mod => ({ default: mod.PaystackButton })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
});

interface PaystackPaymentProps {
  maxAmount: number;
  email: string;
  studentId: string;
  classFeeId: number;
  studentName: string;
  feeTypeName: string;
  className: string;
  onSuccess?: () => void;
  disabled?: boolean;
  allowPartialPayment?: boolean;
}

const PaystackPayment = ({
  maxAmount,
  email,
  studentId,
  classFeeId,
  studentName,
  feeTypeName,
  className,
  onSuccess,
  disabled = false,
  allowPartialPayment = true
}: PaystackPaymentProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(maxAmount);
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;

  const config = {
    reference: `fee_${classFeeId}_${studentId}_${new Date().getTime()}`,
    email: email,
    amount: Math.round(paymentAmount * 100), // Paystack expects amount in kobo (multiply by 100)
    publicKey: publicKey,
    currency: 'GHS', // Ghana Cedis
    metadata: {
      studentId,
      classFeeId,
      studentName,
      feeTypeName,
      className,
      custom_fields: [
        {
          display_name: "Student Name",
          variable_name: "student_name",
          value: studentName
        },
        {
          display_name: "Fee Type",
          variable_name: "fee_type",
          value: feeTypeName
        },
        {
          display_name: "Class",
          variable_name: "class_name",
          value: className
        }
      ]
    }
  };

  const handlePaystackSuccessAction = async (reference: any) => {
    setIsProcessing(true);
    try {
      // Verify payment on backend
      const response = await fetch('/api/paystack/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference: reference.reference,
          studentId,
          classFeeId,
          amount: paymentAmount
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Payment successful! Fee has been recorded.');
        onSuccess?.();
      } else {
        toast.error(result.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Error verifying payment. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaystackCloseAction = () => {
    toast.info('Payment cancelled');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    if (value <= maxAmount && value > 0) {
      setPaymentAmount(value);
    }
  };

  // Don't render anything until we're on the client side
  if (!isClient) {
    return (
      <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
    );
  }

  if (isProcessing) {
    return (
      <button
        disabled
        className="flex items-center gap-2 bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        Processing...
      </button>
    );
  }

  if (showAmountInput && allowPartialPayment) {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Amount (Max: GH₵{maxAmount.toFixed(2)})
          </label>
          <input
            type="number"
            min="0.01"
            max={maxAmount}
            step="0.01"
            value={paymentAmount}
            onChange={handleAmountChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Enter amount"
          />
        </div>
        <div className="flex gap-2">
          <PaystackButton
            {...config}
            text={`Pay GH₵${paymentAmount.toFixed(2)}`}
            onSuccess={handlePaystackSuccessAction}
            onClose={handlePaystackCloseAction}
            disabled={disabled || paymentAmount <= 0 || paymentAmount > maxAmount}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              disabled || paymentAmount <= 0 || paymentAmount > maxAmount
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-sm hover:shadow-md'
            }`}
          />
          <button
            onClick={() => setShowAmountInput(false)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPaymentAmount(maxAmount)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Pay Full Amount
          </button>
          <button
            onClick={() => setPaymentAmount(maxAmount / 2)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Pay Half
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <PaystackButton
          {...config}
          text={`Pay GH₵${paymentAmount.toFixed(2)}`}
          onSuccess={handlePaystackSuccessAction}
          onClose={handlePaystackCloseAction}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            disabled
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-sm hover:shadow-md'
          }`}
        />
        {allowPartialPayment && maxAmount > 0 && (
          <button
            onClick={() => setShowAmountInput(true)}
            className="px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Custom Amount
          </button>
        )}
      </div>
      {allowPartialPayment && (
        <div className="text-xs text-gray-500 text-center">
          Click &quot;Custom Amount&quot; to pay a different amount
        </div>
      )}
    </div>
  );
};

export default PaystackPayment;
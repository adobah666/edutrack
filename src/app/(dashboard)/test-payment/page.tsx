import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PaystackPayment from "@/components/PaystackPayment";

const TestPaymentPage = async () => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Paystack Payment</h1>
          <p className="text-gray-600 mb-6">
            This is a test page to verify Paystack integration. Only admins can access this page.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-yellow-800 mb-2">Test Payment Details</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Amount: GH₵50.00</li>
              <li>• Student: Test Student</li>
              <li>• Fee Type: Tuition Fee</li>
              <li>• Class: Test Class</li>
            </ul>
          </div>

          <div className="flex justify-center">
            <PaystackPayment
              maxAmount={50.00}
              email="test@example.com"
              studentId="test-student-id"
              classFeeId={1}
              studentName="Test Student"
              feeTypeName="Tuition Fee"
              className="Test Class"
              onSuccess={() => {
                alert('Test payment successful!');
              }}
              allowPartialPayment={true}
            />
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p className="font-medium mb-2">Test Card Details (for testing):</p>
            <ul className="space-y-1">
              <li>• Card Number: 4084084084084081</li>
              <li>• Expiry: Any future date</li>
              <li>• CVV: Any 3 digits</li>
              <li>• PIN: 0000</li>
              <li>• OTP: 123456</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPaymentPage;
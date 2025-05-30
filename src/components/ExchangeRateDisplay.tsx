
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { USD_TO_CAD_RATE } from "@/utils/currencyUtils";

const ExchangeRateDisplay = () => {
  return (
    <Card className="border-green-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-green-700">Exchange Rate</CardTitle>
        <DollarSign className="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold text-green-900">
          1 USD = ${USD_TO_CAD_RATE} CAD
        </div>
        <p className="text-xs text-green-600 mt-1">Current rate applied</p>
      </CardContent>
    </Card>
  );
};

export default ExchangeRateDisplay;

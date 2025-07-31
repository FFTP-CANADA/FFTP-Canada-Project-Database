
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DollarSign, Edit2, Check, X } from "lucide-react";
import { getExchangeRate, setExchangeRate } from "@/utils/currencyUtils";

const ExchangeRateDisplay = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(getExchangeRate().toString());
  const [currentRate, setCurrentRate] = useState(getExchangeRate());

  const handleEdit = () => {
    setEditValue(currentRate.toString());
    setIsEditing(true);
  };

  const handleSave = () => {
    const newRate = parseFloat(editValue);
    if (!isNaN(newRate) && newRate > 0) {
      setExchangeRate(newRate);
      setCurrentRate(newRate);
      setIsEditing(false);
      // No need to reload - the rate is now persisted and will update reactively
    }
  };

  const handleCancel = () => {
    setEditValue(currentRate.toString());
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Card className="border-green-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-green-700">Exchange Rate</CardTitle>
        <DollarSign className="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1 w-full">
              <span className="text-sm text-green-900">1 USD = $</span>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyPress}
                className="h-6 w-16 text-sm p-1"
                type="number"
                step="0.01"
                min="0"
                autoFocus
              />
              <span className="text-sm text-green-900">CAD</span>
              <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0">
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0">
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <div className="text-lg font-bold text-green-900 flex-1">
                1 USD = ${currentRate} CAD
              </div>
              <Button size="sm" variant="ghost" onClick={handleEdit} className="h-6 w-6 p-0">
                <Edit2 className="h-3 w-3 text-green-600" />
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-green-600 mt-1">
          {isEditing ? "Press Enter to save, Esc to cancel" : "Click edit to change rate"}
        </p>
      </CardContent>
    </Card>
  );
};

export default ExchangeRateDisplay;

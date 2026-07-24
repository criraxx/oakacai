import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

interface PaymentMethodModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCard: () => void;
}

const PaymentMethodModal = ({ open, onClose, onSelectCard }: PaymentMethodModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Elige la forma de pago</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button
            onClick={onSelectCard}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
          >
            <CreditCard className="w-8 h-8 text-blue-500" />
            <div className="text-center">
              <p className="font-bold">Tarjeta de crédito</p>
              <p className="text-xs text-muted-foreground">Paga con Visa, Mastercard, Maestro y más</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodModal;

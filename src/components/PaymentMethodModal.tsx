import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, QrCode } from "lucide-react";

interface PaymentMethodModalProps {
  open: boolean;
  onClose: () => void;
  onSelectPix: () => void;
  onSelectCard: () => void;
}

const PaymentMethodModal = ({ open, onClose, onSelectPix, onSelectCard }: PaymentMethodModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Escolha a forma de pagamento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button
            onClick={onSelectPix}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
          >
            <QrCode className="w-8 h-8 text-accent" />
            <div className="text-center">
              <p className="font-bold">PIX</p>
              <p className="text-xs text-muted-foreground">Pagamento instantâneo com 6% de desconto</p>
            </div>
          </Button>
          <Button
            onClick={onSelectCard}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
          >
            <CreditCard className="w-8 h-8 text-blue-500" />
            <div className="text-center">
              <p className="font-bold">Cartão de crédito</p>
              <p className="text-xs text-muted-foreground">Pague com Visa, Master, Elo e mais</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodModal;
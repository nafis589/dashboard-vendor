'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRefuseOrder } from '@/hooks/useOrders';

interface RefuseOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  onSuccess: () => void;
}

export default function RefuseOrderModal({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  onSuccess,
}: RefuseOrderModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutation = useRefuseOrder(orderId);

  const handleClose = (nextOpen: boolean) => {
    if (mutation.isPending) return;
    if (!nextOpen) {
      setReason('');
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    setError(null);
    try {
      await mutation.mutateAsync({ reason: reason.trim() || undefined });
      setReason('');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de refuser la commande');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center sm:text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="size-6 text-red-600" />
          </div>
          <DialogTitle>Refuser la commande</DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de refuser la commande{' '}
            <span className="font-medium text-foreground">{orderNumber}</span>. Cette action est
            irréversible. Le stock sera automatiquement restauré.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="refuse-reason">Raison du refus (optionnelle)</Label>
          <Textarea
            id="refuse-reason"
            rows={3}
            maxLength={300}
            placeholder="Ex : article endommagé, rupture de stock imprévue..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={mutation.isPending}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={mutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Refus en cours…' : 'Confirmer le refus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

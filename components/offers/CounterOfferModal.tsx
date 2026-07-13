'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { VendorOffer } from '@/lib/types';

interface CounterOfferModalProps {
  offer: VendorOffer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onSubmit: (counterAmount: number) => void;
}

export default function CounterOfferModal({
  offer,
  open,
  onOpenChange,
  loading = false,
  onSubmit,
}: CounterOfferModalProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && offer) {
      setAmount('');
      setError(null);
    }
  }, [open, offer]);

  if (!offer) return null;

  const initialPrice = offer.product.price;
  const buyerAmount = offer.amount;
  const minAmount = buyerAmount + 1;
  const maxAmount = initialPrice - 1;

  const handleSubmit = () => {
    const parsed = Number.parseInt(amount, 10);
    if (!Number.isInteger(parsed)) {
      setError('Saisissez un montant entier en FCFA.');
      return;
    }
    if (parsed <= buyerAmount) {
      setError(`La contre-offre doit être supérieure à ${buyerAmount.toLocaleString('fr-FR')} FCFA.`);
      return;
    }
    if (parsed >= initialPrice) {
      setError(`La contre-offre doit être inférieure à ${initialPrice.toLocaleString('fr-FR')} FCFA.`);
      return;
    }
    setError(null);
    onSubmit(parsed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Proposer un nouveau prix</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="initial-price">Prix initial</Label>
              <Input
                id="initial-price"
                readOnly
                tabIndex={-1}
                value={`${initialPrice.toLocaleString('fr-FR')} FCFA`}
                className="bg-muted/50 tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyer-amount">Montant proposé</Label>
              <Input
                id="buyer-amount"
                readOnly
                tabIndex={-1}
                value={`${buyerAmount.toLocaleString('fr-FR')} FCFA`}
                className="bg-muted/50 tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="counter-amount">Votre contre-offre (FCFA)</Label>
            <Input
              id="counter-amount"
              type="number"
              inputMode="numeric"
              min={minAmount}
              max={maxAmount}
              step={1}
              placeholder="Montant de la contre-offre"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !amount.trim()}>
            {loading ? 'Envoi…' : 'Envoyer la contre-offre'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

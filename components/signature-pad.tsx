'use client';

import { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RotateCcw, Check, X } from 'lucide-react';

interface SignaturePadComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  participantName: string;
}

export function SignaturePadComponent({ isOpen, onClose, onSave, participantName }: SignaturePadComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 3,
        throttle: 16, // Smooth drawing for mouse
        minDistance: 5, // Minimum distance between points
      });

      signaturePadRef.current = signaturePad;

      // Resize canvas
      const resizeCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        canvas.getContext('2d')!.scale(ratio, ratio);
        signaturePad.clear();
        setIsEmpty(true);
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      signaturePad.addEventListener('beginStroke', () => setIsEmpty(false));

      // Prevent scrolling when drawing on touch devices
      const preventScroll = (e: TouchEvent) => {
        e.preventDefault();
      };
      
      canvas.addEventListener('touchstart', preventScroll, { passive: false });
      canvas.addEventListener('touchmove', preventScroll, { passive: false });
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        canvas.removeEventListener('touchstart', preventScroll);
        canvas.removeEventListener('touchmove', preventScroll);
        signaturePad.off();
      };
    }
  }, [isOpen]);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleSave = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataURL = signaturePadRef.current.toDataURL();
      onSave(dataURL);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Unterschrift erfassen</DialogTitle>
          <DialogDescription>
            Bitte unterschreiben Sie für: <strong>{participantName}</strong>
            <br />
            <span className="text-sm text-muted-foreground">
              Verwenden Sie die Maus (PC) oder den Finger/Stift (Touch-Gerät) zum Unterschreiben
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unterschriftenfeld</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                className="w-full h-48 border border-gray-200 rounded cursor-crosshair select-none"
                style={{ 
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              />
              <div className="mt-2 text-xs text-muted-foreground text-center">
                💡 Tipp: Halten Sie die Maustaste gedrückt und ziehen Sie, um zu unterschreiben
              </div>
            </div>
            
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={handleClear}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Löschen
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  <X className="mr-2 h-4 w-4" />
                  Abbrechen
                </Button>
                <Button onClick={handleSave} disabled={isEmpty}>
                  <Check className="mr-2 h-4 w-4" />
                  Unterschrift speichern
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
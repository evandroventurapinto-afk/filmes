import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionAPI, paymentAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, CreditCard, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: select method, 2: payment
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [mpInitPoint, setMpInitPoint] = useState('');

  const handleSelectMethod = (method) => {
    setPaymentMethod(method);
    setStep(2);
  };

  const handleCreateSubscription = async () => {
    setLoading(true);
    try {
      const res = await subscriptionAPI.create(paymentMethod);
      
      if (paymentMethod === 'card' && res.data.init_point) {
        // Redirect to Mercado Pago
        window.location.href = res.data.init_point;
      } else if (paymentMethod === 'pix') {
        // Create Pix payment
        const pixRes = await paymentAPI.createPixPayment(res.data.subscription_id);
        setPixData(pixRes.data);
        toast.success('QR Code Pix gerado!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar assinatura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white py-8 px-4" data-testid="checkout-page">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => step === 1 ? navigate(-1) : setStep(1)}
          className="mb-8"
          data-testid="checkout-back-btn"
        >
          <ArrowLeft className="mr-2" /> Voltar
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Assinar CINEMA7</h1>
          <p className="text-xl text-gray-400">Apenas R$7/mês - Acesso ilimitado</p>
        </div>

        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card 
              className="bg-gray-900 border-gray-800 p-8 cursor-pointer hover:border-brand-yellow transition"
              onClick={() => handleSelectMethod('pix')}
              data-testid="payment-method-pix"
            >
              <div className="text-center">
                <QrCode className="h-16 w-16 mx-auto mb-4 text-brand-yellow" />
                <h3 className="text-2xl font-bold mb-2">Pix</h3>
                <p className="text-gray-400 mb-4">Pagamento instantâneo via QR Code</p>
                <p className="text-sm text-gray-500">Aprovação imediata</p>
              </div>
            </Card>

            <Card 
              className="bg-gray-900 border-gray-800 p-8 cursor-pointer hover:border-brand-red transition"
              onClick={() => handleSelectMethod('card')}
              data-testid="payment-method-card"
            >
              <div className="text-center">
                <CreditCard className="h-16 w-16 mx-auto mb-4 text-brand-red" />
                <h3 className="text-2xl font-bold mb-2">Cartão de Crédito</h3>
                <p className="text-gray-400 mb-4">Renovação automática mensal</p>
                <p className="text-sm text-gray-500">Cobrança recorrente</p>
              </div>
            </Card>
          </div>
        )}

        {step === 2 && !pixData && (
          <Card className="bg-gray-900 border-gray-800 p-8">
            <h2 className="text-2xl font-bold mb-6">Confirmar Pagamento</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span>Método de Pagamento:</span>
                <span className="font-bold">{paymentMethod === 'pix' ? 'Pix' : 'Cartão de Crédito'}</span>
              </div>
              <div className="flex justify-between">
                <span>Plano:</span>
                <span className="font-bold">Mensal</span>
              </div>
              <div className="flex justify-between text-2xl">
                <span>Total:</span>
                <span className="font-bold text-brand-yellow">R$ 7,00</span>
              </div>
            </div>
            
            <Button 
              onClick={handleCreateSubscription}
              className="w-full bg-brand-red hover:bg-brand-red/90 text-lg py-6"
              disabled={loading}
              data-testid="confirm-payment-btn"
            >
              {loading ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </Card>
        )}

        {pixData && (
          <Card className="bg-gray-900 border-gray-800 p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Pague com Pix</h2>
            
            {pixData.qr_code_base64 && (
              <div className="flex justify-center mb-6">
                <img 
                  src={`data:image/png;base64,${pixData.qr_code_base64}`}
                  alt="QR Code Pix"
                  className="w-64 h-64"
                  data-testid="pix-qr-code"
                />
              </div>
            )}
            
            {pixData.qr_code && (
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">Código Pix (Copiar e Colar):</p>
                <div className="bg-gray-800 p-4 rounded break-all text-sm">
                  {pixData.qr_code}
                </div>
                <Button 
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    navigator.clipboard.writeText(pixData.qr_code);
                    toast.success('Código copiado!');
                  }}
                  data-testid="copy-pix-code-btn"
                >
                  Copiar Código
                </Button>
              </div>
            )}
            
            <div className="text-center text-sm text-gray-400">
              <p>Após o pagamento, sua assinatura será ativada automaticamente.</p>
              <p className="mt-2">Pode levar alguns minutos para processar.</p>
            </div>
            
            <Button 
              variant="outline"
              className="w-full mt-6"
              onClick={() => navigate('/home')}
              data-testid="back-to-home-btn"
            >
              Voltar para Início
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (req, res) => {
  try {
    const { reservationId } = req.body;
    
    // Vérifier la réservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { offre: true }
    });

    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    if (reservation.studentId !== req.user.id) {
      return res.status(403).json({ error: "Not your reservation" });
    }

    // Créer un PaymentIntent avec Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(reservation.offre.price * 100), // Stripe utilise des centimes
      currency: 'mad',
      metadata: { reservationId }
    });

    // Enregistrer le paiement en base de données
    await prisma.payment.create({
      data: {
        userId: req.user.id,
        reservationId,
        amount: reservation.offre.price,
        stripePaymentId: paymentIntent.id,
        status: 'pending'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ error: "Payment processing failed" });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer les événements Stripe
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // Mettre à jour le statut du paiement
      await prisma.payment.updateMany({
        where: { stripePaymentId: paymentIntent.id },
        data: { status: 'succeeded' }
      });

      // Mettre à jour le statut de la réservation
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentId: paymentIntent.id }
      });

      if (payment) {
        await prisma.reservation.update({
          where: { id: payment.reservationId },
          data: { paymentStatus: 'paid' }
        });
      }
      break;
    
    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      await prisma.payment.updateMany({
        where: { stripePaymentId: failedIntent.id },
        data: { status: 'failed' }
      });
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: {
        reservation: {
          include: {
            offre: true,
            school: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(payments);
  } catch (error) {
    console.error("Payment history error:", error);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
};
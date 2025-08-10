module Api::V1
  class WebhooksController < ApplicationController
    skip_before_action :verify_authenticity_token

    def stripe
      payload = request.body.read
      sig_header = request.env['HTTP_STRIPE_SIGNATURE']
      endpoint_secret = Rails.application.credentials.stripe[:webhook_secret]

      begin
        event = Stripe::Webhook.construct_event(
          payload, sig_header, endpoint_secret
        )
      rescue JSON::ParserError => e
        render json: { error: 'Invalid payload' }, status: 400
        return
      rescue Stripe::SignatureVerificationError => e
        render json: { error: 'Invalid signature' }, status: 400
        return
      end

      case event.type
      when 'checkout.session.completed'
        checkout_session = event.data.object
        fulfill_order(checkout_session)
      when 'payment_intent.succeeded'
        payment_intent = event.data.object
        # Handle successful payment intent
      else
        puts "Unhandled event type: #{event.type}"
      end

      render json: { received: true }
    end

    private

    def fulfill_order(checkout_session)
      order_id = checkout_session.metadata.order_id
      order = Order.find(order_id)
      order.update(status: 'paid')

      # Additional fulfillment logic (send email, update inventory, etc.)
    end
  end
end
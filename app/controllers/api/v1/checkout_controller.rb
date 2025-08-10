module Api::V1
  class CheckoutController < ApplicationController
    before_action :authenticate_user!

    def create
      Stripe.api_key = Rails.application.credentials.stripe[:secret_key]

      order = current_user.orders.create!(
        status: 'pending',
        total: calculate_total
      )

      create_order_items(order)

      # Create Stripe checkout session
      session = Stripe::Checkout::Session.create({
        payment_method_types: ['card'],
        line_items: stripe_line_items,
        mode: 'payment',
        success_url: "#{request.base_url}/order_success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "#{request.base_url}/cart",
        metadata: {
          order_id: order.id
        }
      })

      render json: { url: session.url }
    end

    private

    def calculate_total
      params[:order][:items].sum { |item| item[:unit_price] * item[:quantity] }
    end

    def create_order_items(order)
      params[:order][:items].each do |item|
        order.order_items.create!(
          product_id: item[:product_id],
          quantity: item[:quantity],
          unit_price: item[:unit_price]
        )
      end
    end

    def stripe_line_items
      params[:order][:items].map do |item|
        product = Product.find(item[:product_id])
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
            },
            unit_amount: (item[:unit_price] * 100).to_i, # Convert to cents
          },
          quantity: item[:quantity],
        }
      end
    end
  end
end
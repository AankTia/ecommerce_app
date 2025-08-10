# Advanced E-commerce with Rails 7, SQLite, React, and Tailwind CSS

This guide will walk you through creating a sophisticated e-commerce application using Ruby on Rails 7 with React for frontend components and Tailwind CSS for styling.

## Prerequisites

- Ruby 3.x
- Rails 7.x
- Node.js (for JavaScript dependencies)
- Yarn or npm

## Step 1: Create a New Rails Application with React

```bash
rails new ecommerce_app -j esbuild --css tailwind -d sqlite3
cd ecommerce_app
```

This command creates a new Rails app with:

- ESBuild for JavaScript bundling
- Tailwind CSS for styling
- SQLite3 as the database (good for development)

## Step 2: Set Up Additional Gems

Add these gems to your Gemfile:

```ruby
# Authentication
gem 'devise'
gem 'devise-jwt'

# Authorization
gem 'pundit'

# Money handling
gem 'money-rails'

# Product images
gem 'image_processing', '~> 1.2'
gem 'active_storage_validations'

# Pagination
gem 'pagy'

# API versioning
gem 'versionist'

# Background jobs
gem 'sidekiq'
```

Run `bundle install`

## Step 3: Database Setup

Generate models for your e-commerce platform:

```bash
# User model (will be extended by Devise)
rails generate model User name:string

# Product models
rails generate model Category name:string description:text
rails generate model Product name:string description:text price:decimal stock:integer category:references

# Order models
rails generate model Order user:references status:string total:decimal
rails generate model OrderItem order:references product:references quantity:integer unit_price:decimal

# Payment model
rails generate model Payment order:references amount:decimal payment_method:string transaction_id:string status:string

# Review model
rails generate model Review product:references user:references rating:integer comment:text
```

Run migrations:

```bash
rails db:migrate
```

## Step 4: Set Up Devise for Authentication

```bash
rails generate devise:install
rails generate devise User
rails db:migrate
```

Configure Devise in `config/initializers/devise.rb`:

```ruby
config.jwt do |jwt|
  jwt.secret = Rails.application.credentials.secret_key_base
  jwt.dispatch_requests = [
    ['POST', %r{^/api/v1/login$}]
  ]
  jwt.revocation_requests = [
    ['DELETE', %r{^/api/v1/logout$}]
  ]
  jwt.expiration_time = 1.day.to_i
end
```

## Step 5: Create React Components

Create a components directory:

```bash
mkdir app/javascript/components
```

Example Product component (`app/javascript/components/ProductCard.jsx`):

```jsx
import React from "react";

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg m-4">
      <img className="w-full" src={product.image_url} alt={product.name} />
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">{product.name}</div>
        <p className="text-gray-700 text-base">{product.description}</p>
      </div>
      <div className="px-6 pt-4 pb-2 flex justify-between items-center">
        <span className="text-2xl font-bold">${product.price}</span>
        <button
          onClick={() => onAddToCart(product)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
```

## Step 6: Set Up API Controllers

Create an API namespace:

```bash
mkdir -p app/controllers/api/v1
```

Example products controller (`app/controllers/api/v1/products_controller.rb`):

```ruby
module Api::V1
  class ProductsController < ApplicationController
    before_action :authenticate_user!, except: [:index, :show]
    before_action :set_product, only: [:show, :update, :destroy]

    def index
      @products = Product.all
      render json: @products
    end

    def show
      render json: @product
    end

    def create
      @product = Product.new(product_params)
      if @product.save
        render json: @product, status: :created
      else
        render json: @product.errors, status: :unprocessable_entity
      end
    end

    private

    def set_product
      @product = Product.find(params[:id])
    end

    def product_params
      params.require(:product).permit(:name, :description, :price, :stock, :category_id, images: [])
    end
  end
end
```

## Step 7: Configure Routes

In `config/routes.rb`:

```ruby
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      post 'login', to: 'authentication#login'
      delete 'logout', to: 'authentication#logout'

      resources :products
      resources :categories
      resources :orders
      resources :payments
      post 'checkout', to: 'checkout#create'
    end
  end

  # Frontend route - will be handled by React Router
  get '*path', to: 'home#index', constraints: ->(req) { !req.xhr? && req.format.html? }
  root 'home#index'
end
```

## Step 8: Create a Home Controller for React

```bash
rails generate controller home index
```

In `app/controllers/home_controller.rb`:

```ruby
class HomeController < ApplicationController
  def index
  end
end
```

## Step 9: Set Up React Router

Create `app/javascript/routes.jsx`:

```jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import ProductPage from "./components/ProductPage";
import CartPage from "./components/CartPage";
import CheckoutPage from "./components/CheckoutPage";
import LoginPage from "./components/LoginPage";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
```

## Step 10: Create a Cart Context for State Management

Create `app/javascript/contexts/CartContext.jsx`:

```jsx
import React, { createContext, useState, useContext } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};
```

## Step 11: Create Main Application Entry Point

Update `app/javascript/application.js`:

```javascript
import "@hotwired/turbo-rails";
import "./controllers";
import * as bootstrap from "bootstrap";

import React from "react";
import { createRoot } from "react-dom/client";
import AppRoutes from "./routes";
import { CartProvider } from "./contexts/CartContext";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("root");
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </React.StrictMode>
  );
});
```

## Step 12: Set Up Tailwind Configuration

Update `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./app/views/**/*.html.erb",
    "./app/helpers/**/*.rb",
    "./app/javascript/**/*.js",
    "./app/javascript/**/*.jsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#5eead4",
          DEFAULT: "#14b8a6",
          dark: "#0f766e",
        },
        secondary: {
          light: "#bae6fd",
          DEFAULT: "#0ea5e9",
          dark: "#0369a1",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
```

## Step 13: Create Product Listing Page

Create `app/javascript/components/ProductList.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { useCart } from "../contexts/CartContext";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/v1/products");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error)
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Our Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={addToCart}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
```

## Step 14: Implement Checkout Process

Create `app/javascript/components/CheckoutPage.jsx`:

```jsx
import React, { useState } from "react";
import { useCart } from "../contexts/CartContext";

const CheckoutPage = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    paymentMethod: "credit_card",
  });
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/v1/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          order: {
            items: cart.map((item) => ({
              product_id: item.id,
              quantity: item.quantity,
              unit_price: item.price,
            })),
            shipping_address: formData.address,
            payment_method: formData.paymentMethod,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Checkout failed");
      }

      const data = await response.json();
      clearCart();
      setOrderSuccess(true);
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Order Placed Successfully!</h1>
        <p className="text-xl">Thank you for your purchase.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Shipping Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <option value="credit_card">Credit Card</option>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50">
              {loading ? "Processing..." : `Pay $${totalPrice.toFixed(2)}`}
            </button>
          </form>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between py-4 border-b">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
            <div className="flex justify-between py-4 border-t border-b font-bold">
              <div>Subtotal</div>
              <div>${totalPrice.toFixed(2)}</div>
            </div>
            <div className="flex justify-between py-4 font-bold text-lg">
              <div>Total</div>
              <div>${totalPrice.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
```

## Step 15: Implement Stripe Payment Integration

Add the Stripe gem to your Gemfile:

```ruby
gem 'stripe'
```

Create a checkout controller (`app/controllers/api/v1/checkout_controller.rb`):

```ruby
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
```

## Step 16: Set Up Webhooks for Payment Processing

Create a webhooks controller (`app/controllers/api/v1/webhooks_controller.rb`):

```ruby
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
```

## Step 17: Add Admin Dashboard

Generate an admin controller:

```bash
rails generate controller admin/dashboard index
```

Set up admin authentication with Pundit:

```ruby
# app/policies/admin_policy.rb
class AdminPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def index?
    user.admin?
  end
end
```

Create admin dashboard components:

```jsx
// app/javascript/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/v1/admin/stats", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Total Products</h3>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Total Orders</h3>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Total Revenue</h3>
          <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.user_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        order.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : order.status === "shipped"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="text-primary-600 hover:text-primary-900">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
```

## Step 18: Implement Product Search

Add search functionality to your products controller:

```ruby
# app/controllers/api/v1/products_controller.rb
def index
  @products = Product.all

  if params[:search].present?
    @products = @products.where("name LIKE ? OR description LIKE ?",
                               "%#{params[:search]}%",
                               "%#{params[:search]}%")
  end

  if params[:category_id].present?
    @products = @products.where(category_id: params[:category_id])
  end

  if params[:min_price].present?
    @products = @products.where("price >= ?", params[:min_price])
  end

  if params[:max_price].present?
    @products = @products.where("price <= ?", params[:max_price])
  end

  render json: @products
end
```

Create a search component:

```jsx
// app/javascript/components/SearchBar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-4 pr-10 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
```

## Step 19: Add Product Filtering Sidebar

```jsx
// app/javascript/components/ProductFilters.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const ProductFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [priceRange, setPriceRange] = useState({
    min: "",
    max: "",
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/v1/categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryChange = (categoryId) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (categoryId) {
      newSearchParams.set("category_id", categoryId);
    } else {
      newSearchParams.delete("category_id");
    }
    setSearchParams(newSearchParams);
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPriceRange((prev) => ({ ...prev, [name]: value }));
  };

  const applyPriceFilter = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (priceRange.min) {
      newSearchParams.set("min_price", priceRange.min);
    } else {
      newSearchParams.delete("min_price");
    }
    if (priceRange.max) {
      newSearchParams.set("max_price", priceRange.max);
    } else {
      newSearchParams.delete("max_price");
    }
    setSearchParams(newSearchParams);
  };

  const clearFilters = () => {
    setPriceRange({ min: "", max: "" });
    setSearchParams({});
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold text-lg mb-4">Filters</h3>

      <div className="mb-6">
        <h4 className="font-medium mb-2">Categories</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="category"
              checked={!searchParams.get("category_id")}
              onChange={() => handleCategoryChange("")}
              className="mr-2"
            />
            <span>All Categories</span>
          </label>
          {categories.map((category) => (
            <label key={category.id} className="flex items-center">
              <input
                type="radio"
                name="category"
                checked={searchParams.get("category_id") === category.id.to_s()}
                onChange={() => handleCategoryChange(category.id)}
                className="mr-2"
              />
              <span>{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium mb-2">Price Range</h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Min</label>
            <input
              type="number"
              name="min"
              value={priceRange.min}
              onChange={handlePriceChange}
              placeholder="$0"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Max</label>
            <input
              type="number"
              name="max"
              value={priceRange.max}
              onChange={handlePriceChange}
              placeholder="$1000"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <button
          onClick={applyPriceFilter}
          className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700">
          Apply Price Filter
        </button>
      </div>

      <button
        onClick={clearFilters}
        className="w-full py-2 border rounded hover:bg-gray-50">
        Clear All Filters
      </button>
    </div>
  );
};

export default ProductFilters;
```

## Step 20: Implement User Reviews

Update your products controller to include reviews:

```ruby
# app/controllers/api/v1/products_controller.rb
def show
  @product = Product.includes(:reviews).find(params[:id])
  render json: @product, include: [:reviews]
end
```

Create a review component:

```jsx
// app/javascript/components/ProductReviews.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";

const ProductReviews = ({ reviews, onReviewSubmit }) => {
  const { id } = useParams();
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onReviewSubmit(id, newReview);
    setNewReview({
      rating: 5,
      comment: "",
    });
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>

      {reviews.length === 0 ? (
        <p className="text-gray-500">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4">
              <div className="flex items-center mb-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < review.rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-500">
                  by {review.user_name} on{" "}
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700">{review.comment}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <h4 className="text-lg font-medium mb-2">Write a Review</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="focus:outline-none">
                  <svg
                    className={`w-8 h-8 ${
                      star <= newReview.rating
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment
            </label>
            <textarea
              value={newReview.comment}
              onChange={(e) =>
                setNewReview({ ...newReview, comment: e.target.value })
              }
              rows={4}
              className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700">
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductReviews;
```

## Final Steps

1. Set up environment variables for sensitive data (Stripe keys, etc.)
2. Configure Sidekiq for background jobs
3. Set up Action Mailer for order confirmations and notifications
4. Implement proper error handling and logging
5. Write tests for your models, controllers, and React components
6. Set up deployment (consider Heroku, Render, or AWS)

This advanced e-commerce platform includes:

- User authentication with JWT
- Product catalog with search and filtering
- Shopping cart functionality
- Checkout process with Stripe integration
- Order management
- Product reviews
- Admin dashboard
- Responsive design with Tailwind CSS

You can extend this further by adding:

- Wishlists
- Coupon/discount system
- Shipping options
- Inventory management
- Advanced analytics
- Recommendation engine


===
rails  css:install:css
Unrecognized command "css:install:css"
Did you mean?  css:install:sass
               css:install
               css:install:postcss
===               
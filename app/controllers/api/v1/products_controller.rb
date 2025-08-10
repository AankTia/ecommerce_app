module Api::V1
  class ProductsController < ApplicationController
    before_action :authenticate_user!, except: [:index, :show]
    before_action :set_product, only: [:show, :update, :destroy]

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

    def show
      @product = Product.includes(:reviews).find(params[:id])
      render json: @product, include: [:reviews]
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
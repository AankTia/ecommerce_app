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
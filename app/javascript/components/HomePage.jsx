import React from 'react';
import ProductList from './ProductList';
import SearchBar from './SearchBar';

const HomePage = () => {
  return (
    <div className="container mx-auto px-4">
      <SearchBar />
      <ProductList />
    </div>
  );
};

export default HomePage;
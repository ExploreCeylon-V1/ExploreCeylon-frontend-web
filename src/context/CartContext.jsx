// CartContext.jsx — Global cart state for vehicles + guides
import { useState, useEffect } from "react";
import { CartContext } from "../hooks/useCart";

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("ec_cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("ec_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  function addToCart(item) {
    // item: { type:'vehicle'|'guide', id, name, price, image, meta:{} }
    setCartItems(prev => {
      const exists = prev.find(i => i.type === item.type && i.id === item.id);
      if (exists) return prev;
      return [...prev, {
        ...item,
        cartId: `${item.type}-${item.id}`,
        startDate: "",
        endDate: "",
        addedAt: new Date().toISOString(),
      }];
    });
  }

  function removeFromCart(cartId) {
    setCartItems(prev => prev.filter(i => i.cartId !== cartId));
  }

  function updateDates(cartId, startDate, endDate) {
    setCartItems(prev => prev.map(i =>
      i.cartId === cartId ? { ...i, startDate, endDate } : i
    ));
  }

  function clearCart() {
    setCartItems([]);
  }

  function isInCart(type, id) {
    return cartItems.some(i => i.type === type && i.id === id);
  }

  const cartCount = cartItems.length;

  return (
    <CartContext.Provider value={{
      cartItems, cartCount,
      addToCart, removeFromCart, updateDates, clearCart, isInCart
    }}>
      {children}
    </CartContext.Provider>
  );
}
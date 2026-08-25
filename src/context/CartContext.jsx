// CartContext.jsx — Global cart state for vehicles + guides
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { CartContext } from "../hooks/useCart";

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("ec_cart");
      const token = localStorage.getItem("ec_traveler_token") || localStorage.getItem("token");
      return (token && saved) ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem("ec_cart");
      if (cartItems.length > 0) {
        setCartItems([]);
      }
    } else {
      localStorage.setItem("ec_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  function addToCart(item) {
    if (!isAuthenticated) return;
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
    localStorage.removeItem("ec_cart");
  }

  function isInCart(type, id) {
    if (!isAuthenticated) return false;
    return cartItems.some(i => i.type === type && i.id === id);
  }

  const activeCartItems = isAuthenticated ? cartItems : [];
  const cartCount = activeCartItems.length;

  return (
    <CartContext.Provider value={{
      cartItems: activeCartItems,
      cartCount,
      addToCart, removeFromCart, updateDates, clearCart, isInCart
    }}>
      {children}
    </CartContext.Provider>
  );
}
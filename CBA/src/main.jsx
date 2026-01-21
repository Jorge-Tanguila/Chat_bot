
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'; 
import './index.css';
import Bot from './pages/Bot.jsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';


const rotas = createBrowserRouter([
  {
    path: "/",
    element: <Bot />,
  },
]);


const root = createRoot(document.getElementById('root')); // ← importante!

root.render(
  <StrictMode>
    <RouterProvider router={rotas} />
  </StrictMode>
);
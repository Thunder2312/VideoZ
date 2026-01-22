import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import { AuthProvider } from "./context/authContext";
import VideoCapture from "./pages/VideoCapture";
import Profile from "./pages/Profile"; 

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/feed" element={<Feed />} />
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create" element={<VideoCapture />} />
          <Route path="/profile/:id" element={<Profile />} /> 
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

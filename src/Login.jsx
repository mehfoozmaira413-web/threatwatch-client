import { useState } from 'react';
import axios from 'axios';

export default function Login({ setLoggedIn, setUser, setPage }) { // 🔥 3 prop add kiye
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5001/api/auth/login", {email, password});
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      import { connectSocket } from "./socket";
      
      setUser(res.data.user); // 🔥 App ko user do
      setLoggedIn(true); // 🔥 App ko batao login ho gaya
      setPage("dashboard"); // 🔥 Dashboard pe bhej do bina refresh ke
      
    } catch {
      alert("Login Failed");
    }
  }

  return (
    <div style={{padding:"50px", color:"white", background:"#000", height:"100vh"}}>
      <h1>Login</h1>
      <input placeholder="Email" onChange={e=>setEmail(e.target.value)}/><br/><br/>
      <input type="password" placeholder="Password" onChange={e=>setPassword(e.target.value)}/><br/><br/>
      <button onClick={handleLogin}>LOGIN</button>
      <p>Account nahi? <span onClick={()=>setPage("register")} style={{color:"cyan", cursor:"pointer"}}>Signup karo</span></p>
    </div>
  )
}
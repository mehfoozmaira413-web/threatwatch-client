import { useState } from 'react';
import axios from 'axios';

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      await axios.post("https://threatwatch-server-production.up.railway.app/api/auth/register", {name, email, password});
      alert("Signup Success! Ab Login karo");
      window.location.href = "/login";
    } catch {
      alert("Signup Failed");
    }
  }

  return (
    <div style={{padding:"50px", color:"white", background:"#000", height:"100vh"}}>
      <h1>Signup</h1>
      <input placeholder="Name" onChange={e=>setName(e.target.value)}/><br/><br/>
      <input placeholder="Email" onChange={e=>setEmail(e.target.value)}/><br/><br/>
      <input type="password" placeholder="Password" onChange={e=>setPassword(e.target.value)}/><br/><br/>
      <button onClick={handleSignup}>SIGNUP</button>
    </div>
  )
}
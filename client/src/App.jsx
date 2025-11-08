import { Routes, Route } from "react-router-dom";
// import LoginForm from "./Auth/loginPage.jsx";
// import SignupForm from "./Auth/signupPage.jsx";
import LocationTracker from "./LocationTracker.jsx"
import './app.css'

function App() {

  return (
    <>
      <div>
         <Routes>
            <Route path="/" element={<LocationTracker />} />
            {/* <Route path="/signup" element={<SignupForm />} />
            <Route path="/login" element={<LoginForm />} /> */}
         </Routes>
      </div>
    
    </>
  );
}

export default App;

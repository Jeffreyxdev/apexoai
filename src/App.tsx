import { Route , Routes} from "react-router-dom"
import Home from "./Pages/Home"
import NotFound from "./Pages/NotFound"
import { ToastContainer } from "react-toastify"
import Login from "./Pages/Login"
import Signup from "./Pages/Signup"
import Waitlist from "./Pages/Waitlist"
const App = () => {
  return (
    <div>
      <ToastContainer position="top-right" theme="colored"/>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/waitlist" element={<Waitlist/>}/>
          <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
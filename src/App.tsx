import { Route , Routes} from "react-router-dom"
import Home from "./Pages/Home"
import NotFound from "./Pages/NotFound"
import { ToastContainer } from "react-toastify"
import Login from "./Pages/Login"
import Signup from "./Pages/Signup"
import Waitlist from "./Pages/Waitlist"

import ResumeForm from "./InnerPage/ResumeForem"
import JobScraperDashboard from "./Pages/JobScrapper"
import ChatbotApp from "./Pages/Chatbot"

const App = () => {
  return (
    <div>
      <ToastContainer position="top-right" theme="colored"/>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/waitlist" element={<Waitlist/>}/>
         <Route path="/resume" element={<ResumeForm/>}/>
         <Route path="/scrapper" element={<JobScraperDashboard/>}/>
         <Route path="/your-personal-ai" element={<ChatbotApp/>}/>

          <Route path="*" element={<NotFound />} />

      </Routes>
    </div>
  )
}

export default App
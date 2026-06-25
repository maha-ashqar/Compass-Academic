
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import LoginPage from './LoginPage'; // صفحة دخول الطلاب أو العامة
import TrainerLogin from './TrainerLogin'; // استيراد صفحة المدرب الجديدة

function App() {
  return (
    <Router>
      <Routes>
        {/* المسار الرئيسي للموقع */}
        <Route path="/" element={<HomePage />} />
        
        {/* مسار تسجيل دخول الطالب/المستخدم العادي */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* مسار تسجيل دخول المدرب (الذي سنعمل عليه) */}
        <Route path="/trainer-login" element={<TrainerLogin />} />
      </Routes>
    </Router>
  );
}

export default App;